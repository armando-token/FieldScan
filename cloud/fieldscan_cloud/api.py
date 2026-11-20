"""FieldScan Cloud FastAPI HTTP service (Megaplan §6 & §11.3)."""

from __future__ import annotations

from contextlib import asynccontextmanager
import hashlib
import hmac
import json
import logging
from pathlib import Path
import re
import sqlite3
from typing import Any
import uuid

from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from fieldscan_cloud import get_release_revision
from fieldscan_cloud.config import ApiConfig, load_api_config
from fieldscan_cloud.db import (
    connect_sqlite,
    enqueue_or_get_active_job,
    ensure_default_tenant_and_credential,
    find_matching_variants,
    get_authorized_blob,
    get_current_publication,
    lookup_active_credential,
    verify_schema,
)
from fieldscan_cloud.models import (
    CachedPublicationRef,
    CandidateVariant,
    CapabilitiesStatus,
    HealthResponse,
    IdentityInfo,
    JobStatusResponse,
    ResolveAcceptedResponse,
    ResolveRequest,
)
from fieldscan_cloud.publication.storage import resolve_object_path

logger = logging.getLogger("fieldscan_cloud.api")
_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_RANGE_RE = re.compile(r"^bytes=(\d*)-(\d*)$")


class ApiAppError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def _request_id(request: Request) -> str:
    rid = getattr(request.state, "request_id", None)
    if not rid:
        rid = f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = rid
    return rid


def _error_response(request: Request, status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": _request_id(request),
        },
        headers={"X-Request-Id": _request_id(request)},
    )


def _format_pub_status(pub_row: sqlite3.Row) -> JobStatusResponse:
    product_id = str(pub_row["product_id"])
    variant_id = str(pub_row["variant_id"])
    return JobStatusResponse(
        job_id=None,
        job_state="completed",
        phase="cached",
        availability=str(pub_row["availability"]),  # type: ignore[arg-type]
        identity=IdentityInfo(product_id=product_id, variant_id=variant_id, resolution="exact"),
        capabilities=CapabilitiesStatus(
            documentation="available" if pub_row["cap_documentation"] else "unavailable",
            interactive_twin="available" if pub_row["cap_interactive_twin"] else "unavailable",
            procedures="available" if pub_row["cap_procedures"] else "unavailable",
        ),
        reason_codes=json.loads(pub_row["reason_codes_json"]),
        candidates=[],
        publication_seq=int(pub_row["publication_seq"]),
        manifest_url=f"/v1/catalog/products/{product_id}/variants/{variant_id}/manifest",
    )


def _parse_single_byte_range(range_header: str, total_size: int) -> tuple[int, int]:
    """Parse RFC 9110 single byte range; raise ValueError for invalid or unsatisfiable ranges."""
    m = _RANGE_RE.match(range_header.strip())
    if not m or total_size <= 0:
        raise ValueError("Invalid byte range")
    start_s, end_s = m.group(1), m.group(2)
    if not start_s and not end_s:
        raise ValueError("Empty byte range")
    if not start_s:
        suffix = int(end_s)
        if suffix <= 0:
            raise ValueError("Zero suffix length")
        start = max(0, total_size - suffix)
        end = total_size - 1
    else:
        start = int(start_s)
        end = int(end_s) if end_s else total_size - 1
        if start >= total_size or end < start:
            raise ValueError("Unsatisfiable byte range")
        end = min(end, total_size - 1)
    return start, end


def create_app(config: ApiConfig | None = None) -> FastAPI:
    state: dict[str, Any] = {"config": config}

    def _get_config() -> ApiConfig:
        if state["config"] is None:
            state["config"] = load_api_config()
        return state["config"]

    def _open_db() -> sqlite3.Connection:
        cfg = _get_config()
        return connect_sqlite(cfg.db_path, expected_journal_mode=cfg.sqlite_journal_mode)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        cfg = _get_config()
        logging.basicConfig(
            level=getattr(logging, cfg.log_level, logging.INFO),
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )
        conn = _open_db()
        try:
            schema_ver, mode = verify_schema(conn, expected_journal_mode=cfg.sqlite_journal_mode)
            ensure_default_tenant_and_credential(
                conn,
                tenant_id=cfg.default_tenant_id,
                channel=cfg.channel,
                token_sha256=cfg.api_token_sha256,
            )
            logger.info(
                "API started env=%s channel=%s schema=%s journal=%s",
                cfg.env,
                cfg.channel,
                schema_ver,
                mode,
            )
        finally:
            conn.close()
        yield

    app = FastAPI(title="FieldScan Cloud API", version="0.1.0", lifespan=lifespan)

    @app.middleware("http")
    async def request_guard_middleware(request: Request, call_next):
        rid = f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = rid
        cfg = _get_config()
        cl = request.headers.get("content-length")
        if cl and cl.isdigit() and int(cl) > cfg.max_body_bytes:
            return _error_response(request, 413, "PAYLOAD_TOO_LARGE", "Request body exceeds allowed limit")
        if request.method in {"POST", "PUT", "PATCH"}:
            total_read = 0
            chunks: list[bytes] = []
            async for chunk in request.stream():
                total_read += len(chunk)
                if total_read > cfg.max_body_bytes:
                    return _error_response(request, 413, "PAYLOAD_TOO_LARGE", "Request body exceeds allowed limit")
                chunks.append(chunk)
            request._body = b"".join(chunks)
        resp = await call_next(request)
        resp.headers["X-Request-Id"] = rid
        return resp

    @app.exception_handler(ApiAppError)
    async def handle_api_error(request: Request, exc: ApiAppError):
        return _error_response(request, exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, _exc: RequestValidationError):
        return _error_response(request, 422, "VALIDATION_ERROR", "Invalid request payload or parameters")

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException):
        return _error_response(request, exc.status_code, "HTTP_ERROR", str(exc.detail))

    def require_auth(authorization: str | None = Header(default=None)) -> dict[str, Any]:
        if not authorization or not authorization.startswith("Bearer "):
            raise ApiAppError(401, "UNAUTHORIZED", "Missing or malformed Bearer token")
        raw_token = authorization[7:].strip()
        if not raw_token:
            raise ApiAppError(401, "UNAUTHORIZED", "Empty Bearer token")
        digest = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        conn = _open_db()
        try:
            row = lookup_active_credential(conn, digest)
            if row is None or not hmac.compare_digest(str(row["token_sha256"]), digest):
                raise ApiAppError(401, "UNAUTHORIZED", "Invalid API credential")
            return {
                "credential_id": str(row["id"]),
                "tenant_id": str(row["tenant_id"]),
                "channel": str(row["channel"]),
                "max_active_jobs": int(row["max_active_jobs"]),
            }
        finally:
            conn.close()

    @app.get("/healthz", response_model=HealthResponse)
    def healthz(request: Request):
        cfg = _get_config()
        try:
            conn = _open_db()
            try:
                schema_ver, mode = verify_schema(conn, expected_journal_mode=cfg.sqlite_journal_mode)
            finally:
                conn.close()
        except Exception:
            return _error_response(request, 503, "SERVICE_UNAVAILABLE", "Catalog database unavailable")
        return HealthResponse(
            status="ok",
            revision=get_release_revision(),
            schema_version=schema_ver,
            journal_mode=mode,
        )

    @app.post("/v1/catalog/resolve")
    def resolve_catalog(
        req: ResolveRequest,
        auth: dict[str, Any] = Depends(require_auth),
    ):
        cfg = _get_config()
        tenant_id = auth["tenant_id"]
        channel = auth["channel"]
        conn = _open_db()
        try:
            matches = find_matching_variants(
                conn,
                manufacturer=req.manufacturer,
                model=req.model,
                variant=req.variant,
                hardware_revision=req.hardware_revision,
            )

            # Case 1: Multiple plausible variants in catalog -> needs_identification (§6.2)
            if len(matches) > 1:
                candidates = [
                    CandidateVariant(
                        product_id=str(r["product_id"]),
                        variant_id=str(r["id"]),
                        variant_code=str(r["variant_code"]),
                        hardware_revision=r["hardware_revision"],
                        display_name=str(r["display_name"]),
                        discriminant_hint=str(r["discriminant_hint"] or ""),
                    )
                    for r in matches
                ]
                return JobStatusResponse(
                    job_id=None,
                    job_state="completed",
                    phase="needs_identification",
                    availability="needs_identification",
                    identity=IdentityInfo(
                        product_id=str(matches[0]["product_id"]),
                        variant_id=None,
                        resolution="ambiguous",
                    ),
                    capabilities=CapabilitiesStatus(
                        documentation="unavailable",
                        interactive_twin="unavailable",
                        procedures="unavailable",
                    ),
                    reason_codes=["DOCUMENT_VARIANT_AMBIGUOUS"],
                    candidates=candidates,
                    publication_seq=None,
                )

            cached_pub_ref: CachedPublicationRef | None = None
            # Case 2: Exact single variant match -> return cached publication if available and not force_refresh
            if len(matches) == 1:
                var_row = matches[0]
                pub_row = get_current_publication(
                    conn,
                    tenant_id=tenant_id,
                    channel=channel,
                    product_id=str(var_row["product_id"]),
                    variant_id=str(var_row["id"]),
                )
                if pub_row is not None:
                    if not req.force_refresh:
                        return _format_pub_status(pub_row)
                    cached_pub_ref = CachedPublicationRef(
                        product_id=str(pub_row["product_id"]),
                        variant_id=str(pub_row["variant_id"]),
                        publication_seq=int(pub_row["publication_seq"]),
                        availability=str(pub_row["availability"]),  # type: ignore[arg-type]
                        manifest_url=f"/v1/catalog/products/{pub_row['product_id']}/variants/{pub_row['variant_id']}/manifest",
                    )

            # Case 3: Unknown model or refresh requested -> deduplicated async worker job (202 Accepted)
            purpose = "refresh" if req.force_refresh else "resolve"
            max_jobs = min(cfg.max_active_jobs_per_tenant, auth["max_active_jobs"])
            try:
                job_row, _created = enqueue_or_get_active_job(
                    conn,
                    tenant_id=tenant_id,
                    channel=channel,
                    request_payload=req.model_dump(),
                    purpose=purpose,
                    max_active_jobs=max_jobs,
                )
            except PermissionError:
                raise ApiAppError(429, "RATE_LIMITED", "Too many concurrent catalog jobs for this credential")

            accepted = ResolveAcceptedResponse(
                job_id=str(job_row["id"]),
                job_state=str(job_row["state"]),  # type: ignore[arg-type]
                availability=cached_pub_ref.availability if cached_pub_ref else None,
                retry_after_seconds=2,
                cached_publication=cached_pub_ref,
            )
            payload_202: dict[str, Any] = {
                "job_id": accepted.job_id,
                "job_state": accepted.job_state,
                "availability": accepted.availability,
                "retry_after_seconds": accepted.retry_after_seconds,
            }
            if accepted.cached_publication is not None:
                payload_202["cached_publication"] = accepted.cached_publication.model_dump()
            return JSONResponse(status_code=202, content=payload_202)
        finally:
            conn.close()

    @app.get("/v1/jobs/{job_id}", response_model=JobStatusResponse)
    def get_job_status(job_id: str, auth: dict[str, Any] = Depends(require_auth)):
        conn = _open_db()
        try:
            row = conn.execute(
                "SELECT * FROM jobs WHERE id = ? AND tenant_id = ?;",
                (job_id, auth["tenant_id"]),
            ).fetchone()
            if row is None:
                raise ApiAppError(404, "JOB_NOT_FOUND", "Job not found")

            state_str = str(row["state"])
            if state_str in {"queued", "running"}:
                return JobStatusResponse(
                    job_id=str(row["id"]),
                    job_state=state_str,  # type: ignore[arg-type]
                    phase=str(row["phase"]),
                    availability=None,
                    retry_after_seconds=2,
                )

            if state_str == "failed":
                return JobStatusResponse(
                    job_id=str(row["id"]),
                    job_state="failed",
                    phase=str(row["phase"]),
                    availability=None,
                    reason_codes=[str(row["error_code"] or "JOB_FAILED")],
                )

            result = json.loads(row["result_json"] or "{}")
            return JobStatusResponse(
                job_id=str(row["id"]),
                job_state="completed",
                phase=str(row["phase"]),
                availability=result.get("availability"),
                identity=IdentityInfo(**result["identity"]) if result.get("identity") else None,
                capabilities=CapabilitiesStatus(**result["capabilities"]) if result.get("capabilities") else None,
                reason_codes=list(result.get("reason_codes", [])),
                candidates=[CandidateVariant(**c) for c in result.get("candidates", [])],
                publication_seq=result.get("publication_seq"),
                manifest_url=result.get("manifest_url"),
            )
        finally:
            conn.close()

    @app.get("/v1/catalog/products/{product_id}/variants/{variant_id}/manifest")
    def get_manifest(
        product_id: str,
        variant_id: str,
        if_none_match: str | None = Header(default=None),
        auth: dict[str, Any] = Depends(require_auth),
    ):
        # Authorization is already enforced by Depends(require_auth) BEFORE 304 check (§6.1)
        conn = _open_db()
        try:
            pub_row = get_current_publication(
                conn,
                tenant_id=auth["tenant_id"],
                channel=auth["channel"],
                product_id=product_id,
                variant_id=variant_id,
            )
            if pub_row is None:
                raise ApiAppError(404, "PUBLICATION_NOT_FOUND", "No active publication for this product variant")

            etag = str(pub_row["envelope_etag"])
            if if_none_match and if_none_match.strip() == etag:
                return Response(
                    status_code=304,
                    headers={"ETag": etag, "Cache-Control": "private, must-revalidate"},
                )

            envelope_bytes = bytes(pub_row["envelope_bytes"])
            return Response(
                content=envelope_bytes,
                status_code=200,
                media_type="application/json",
                headers={
                    "ETag": etag,
                    "Content-Length": str(len(envelope_bytes)),
                    "Cache-Control": "private, must-revalidate",
                },
            )
        finally:
            conn.close()

    def _serve_blob(
        sha256: str,
        *,
        auth: dict[str, Any],
        range_header: str | None,
        head_only: bool,
    ) -> Response:
        digest = sha256.lower()
        if not _SHA256_RE.match(digest):
            raise ApiAppError(400, "INVALID_SHA256", "Blob identifier must be a 64-character hex SHA-256")

        cfg = _get_config()
        conn = _open_db()
        try:
            obj = get_authorized_blob(conn, tenant_id=auth["tenant_id"], sha256=digest)
        finally:
            conn.close()

        if obj is None:
            raise ApiAppError(404, "BLOB_NOT_FOUND", "Object not found or not authorized for this scope")

        file_path = resolve_object_path(cfg.data_dir, str(obj["storage_relpath"]))
        if not file_path.is_file():
            raise ApiAppError(503, "BLOB_STORAGE_MISSING", "Object temporarily unavailable")

        total_size = file_path.stat().st_size
        media_type = str(obj["media_type"])
        base_headers = {
            "ETag": f'"{digest}"',
            "Accept-Ranges": "bytes" if cfg.enable_range_requests else "none",
            "Cache-Control": "private, immutable",
        }

        if head_only:
            base_headers["Content-Length"] = str(total_size)
            return Response(status_code=200, media_type=media_type, headers=base_headers)

        if range_header and cfg.enable_range_requests:
            try:
                start, end = _parse_single_byte_range(range_header, total_size)
            except ValueError:
                return Response(
                    status_code=416,
                    headers={"Content-Range": f"bytes */{total_size}", **base_headers},
                )
            length = end - start + 1
            with file_path.open("rb") as handle:
                handle.seek(start)
                chunk = handle.read(length)
            return Response(
                content=chunk,
                status_code=206,
                media_type=media_type,
                headers={
                    **base_headers,
                    "Content-Range": f"bytes {start}-{end}/{total_size}",
                    "Content-Length": str(len(chunk)),
                },
            )

        data = file_path.read_bytes()
        return Response(
            content=data,
            status_code=200,
            media_type=media_type,
            headers={**base_headers, "Content-Length": str(len(data))},
        )

    @app.get("/v1/catalog/blobs/{sha256}")
    def get_blob(
        sha256: str,
        range_header: str | None = Header(default=None, alias="Range"),
        auth: dict[str, Any] = Depends(require_auth),
    ):
        return _serve_blob(sha256, auth=auth, range_header=range_header, head_only=False)

    @app.head("/v1/catalog/blobs/{sha256}")
    def head_blob(
        sha256: str,
        auth: dict[str, Any] = Depends(require_auth),
    ):
        return _serve_blob(sha256, auth=auth, range_header=None, head_only=True)

    return app


app = create_app()
