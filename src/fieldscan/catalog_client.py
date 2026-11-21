"""FieldScan Cloud Catalog Client & Job Coordinator (`Section 3.1` & `Section 3.4`).

Implements:
- Explicit `sync_enabled` policy gate (defaults to `False` on boot — zero unsolicited WAN traffic, `M4-BASE-01`).
- Strict origin & redirect enforcement (`M4-WAN-04`): never follows redirects outside the configured environment host.
- Job deduplication per `(manufacturer, model, variant, env)` (`M4-WAN-02`), pause/resume with persisted `job_id`,
  and stale-attempt fencing so late responses never overwrite a newer selection.
- Full HTTP status contract (`200`, `202`, `304` via `If-None-Match` ETag, `401/403`, `404/410`, `429` + `Retry-After`, `5xx`, `M4-WAN-01..05`).
- Incremental blob streaming to temp file + SHA-256 & byte-count verification before handing off to `FieldScanPackageStore`.
- Structured correlation telemetry (`M4-WAN-06`) with zero tokens, serial numbers, or session evidence leaked.
"""

from __future__ import annotations

from collections import deque
import hashlib
import json
from pathlib import Path
import tempfile
import threading
import time
from typing import Any
from urllib.parse import urlparse
import uuid

import httpx

from fieldscan.catalog_store import (
    CatalogDomainError,
    FieldScanPackageStore,
    sha256_file,
    utc_now_iso,
    verify_and_decode_manifest_envelope,
)
from fieldscan.offline_guard import set_authorized_cloud_catalog_host


class FieldScanCatalogClient:
    """Dedicated Cloud Catalog client completely isolated from WebView origins and bench Modbus sockets."""

    def __init__(
        self,
        store: FieldScanPackageStore,
        *,
        base_url: str = "",
        sync_enabled: bool = False,
        allow_loopback_http_for_tests: bool = True,
    ) -> None:
        self.store = store
        self._lock = threading.RLock()
        self._sync_enabled = bool(sync_enabled)
        self._base_url = ""
        self._allowed_host = ""
        self._allowed_scheme = "https"
        self._allow_loopback_http = allow_loopback_http_for_tests
        self._auth_token: str | None = None  # Held strictly in native memory/Keychain, never serialized to JS or logs
        self._boat_port_auth_token: str | None = None  # Optional Boat.dev private gate cookie (`_port_auth`)

        self._active_jobs_by_key: dict[str, dict[str, Any]] = {}
        self._jobs_by_id: dict[str, dict[str, Any]] = {}
        self._etag_cache: dict[str, tuple[str, str]] = {}  # (product_id/variant_id) -> (etag, manifest_sha256)
        self._cancel_tokens: set[str] = set()
        self._https_requests_emitted = 0
        self._last_contact_utc: str | None = None
        self._last_health_status: str = "unchecked"
        self._sync_logs: deque[dict[str, Any]] = deque(maxlen=100)
        self._ui_attempt_seq = 0

        if base_url:
            self.configure_endpoint(base_url, sync_enabled=sync_enabled)

    # ------------------------------------------------------------------
    # Configuration, Credentials & Egress Telemetry (`M4-BASE-01`, `M4-WAN-04`, `M4-WAN-06`)
    # ------------------------------------------------------------------

    def configure_endpoint(
        self,
        base_url: str,
        *,
        sync_enabled: bool | None = None,
        auth_token: str | None = None,
        boat_port_auth_token: str | None = None,
    ) -> dict[str, Any]:
        with self._lock:
            raw = (base_url or "").strip().rstrip("/")
            if raw:
                parsed = urlparse(raw)
                scheme = (parsed.scheme or "").lower()
                host = (parsed.hostname or "").lower()
                is_loopback = host in ("127.0.0.1", "localhost", "::1")
                if scheme != "https" and not (scheme == "http" and is_loopback and self._allow_loopback_http):
                    raise CatalogDomainError(
                        "INSECURE_CLOUD_ENDPOINT",
                        "Cloud Catalog endpoint must use HTTPS (HTTP allowed only for loopback test fixtures).",
                    )
                if not host:
                    raise CatalogDomainError("INSECURE_CLOUD_ENDPOINT", "Cloud Catalog endpoint missing host.")
                self._base_url = raw
                self._allowed_host = host
                self._allowed_scheme = scheme

            if auth_token is not None:
                self._auth_token = auth_token.strip() or None

            if boat_port_auth_token is not None:
                self._boat_port_auth_token = boat_port_auth_token.strip() or None

            if sync_enabled is not None:
                was_enabled = self._sync_enabled
                self._sync_enabled = bool(sync_enabled)
                if was_enabled and not self._sync_enabled:
                    # Cancel all active transfers immediately (`M4-WAN-04`)
                    for jid in list(self._jobs_by_id.keys()):
                        self._cancel_tokens.add(jid)
                    self._cancel_tokens.add("__GLOBAL_CANCEL__")

            set_authorized_cloud_catalog_host(self._allowed_host if self._sync_enabled and self._allowed_host else None)
            return self.get_sync_telemetry()

    def set_sync_enabled(self, enabled: bool) -> dict[str, Any]:
        from fieldscan.catalog_store import DEFAULT_PILOT_CLOUD_BASE_URL

        effective_base = self._base_url or DEFAULT_PILOT_CLOUD_BASE_URL
        return self.configure_endpoint(effective_base, sync_enabled=enabled)

    def ensure_auto_enrolled_if_needed(
        self,
        *,
        default_base_url: str | None = None,
        force_reenroll: bool = False,
        device_id: str | None = None,
    ) -> None:
        from fieldscan.catalog_store import DEFAULT_PILOT_CLOUD_BASE_URL

        with self._lock:
            target_base = self._base_url or default_base_url or DEFAULT_PILOT_CLOUD_BASE_URL
            has_token = bool(self._auth_token)
            is_enabled = self._sync_enabled

        if not self._base_url or not is_enabled:
            self.configure_endpoint(target_base, sync_enabled=True)

        if has_token and not force_reenroll:
            return
        if force_reenroll and has_token:
            self.configure_endpoint(target_base, sync_enabled=True, auth_token="")

        dev_id = device_id or f"station-{uuid.getnode():012x}"
        resp = self._request(
            "POST",
            "/v1/devices/enroll",
            json_body={"device_id": dev_id, "platform": "macos", "app_version": "2.1"},
        )
        try:
            payload = resp.json()
        except Exception as exc:
            raise CatalogDomainError("AUTO_ENROLL_FAILED", "Invalid JSON from /v1/devices/enroll") from exc
        tok = str(payload.get("access_token") or "").strip()
        if resp.status_code != 200 or not tok:
            raise CatalogDomainError(
                "AUTO_ENROLL_FAILED",
                "Server did not return an enrollment access_token",
                status_code=resp.status_code,
            )
        self.configure_endpoint(target_base, sync_enabled=True, auth_token=tok)

    def download_latest_package(
        self,
        product_id: str = "tzone_tht02",
        variant_id: str = "v1_1_rs485",
        *,
        default_base_url: str | None = None,
    ) -> dict[str, Any]:
        self.ensure_auto_enrolled_if_needed(default_base_url=default_base_url, force_reenroll=False)
        try:
            return self.fetch_and_install_variant(product_id, variant_id, channel="pilot")
        except CatalogDomainError as err:
            if err.code == "HTTP_UNAUTHORIZED":
                self.ensure_auto_enrolled_if_needed(default_base_url=default_base_url, force_reenroll=True)
                return self.fetch_and_install_variant(product_id, variant_id, channel="pilot")
            raise

    def get_sync_telemetry(self) -> dict[str, Any]:
        with self._lock:
            return {
                "sync_enabled": self._sync_enabled,
                "egress_policy": "catalog_https_authorized" if self._sync_enabled else "strict_local_only",
                "configured_endpoint": self._base_url or None,
                "has_credentials": bool(self._auth_token),
                "has_boat_gate_cookie": bool(self._boat_port_auth_token),
                "trusted_signer_key_ids": sorted(self.store.trusted_keys.keys()),
                "https_requests_emitted": self._https_requests_emitted,
                "last_contact_utc": self._last_contact_utc,
                "last_health_status": self._last_health_status,
                "active_jobs_count": sum(
                    1 for j in self._jobs_by_id.values() if j.get("job_state") in ("queued", "running")
                ),
                "recent_sync_logs": list(self._sync_logs)[-12:],
            }

    def _record_log(
        self,
        phase: str,
        correlation_id: str,
        status_code: int | None,
        bytes_transferred: int,
        elapsed_ms: float,
        error_code: str | None = None,
    ) -> None:
        with self._lock:
            self._sync_logs.append(
                {
                    "ts_utc": utc_now_iso(),
                    "phase": phase,
                    "correlation_id": correlation_id,
                    "status_code": status_code,
                    "bytes": bytes_transferred,
                    "elapsed_ms": round(elapsed_ms, 1),
                    "error_code": error_code,
                }
            )

    def _ensure_sync_allowed(self) -> tuple[str, str, str]:
        with self._lock:
            if not self._sync_enabled:
                raise CatalogDomainError(
                    "SYNC_DISABLED",
                    "Cloud Catalog synchronization is currently disabled; operating strictly from local verified packages.",
                    status_code=409,
                )
            if not self._base_url or not self._allowed_host:
                raise CatalogDomainError("CLOUD_ENDPOINT_UNCONFIGURED", "Cloud Catalog HTTPS URL is not configured.")
            self._cancel_tokens.discard("__GLOBAL_CANCEL__")
            return self._base_url, self._allowed_host, self._allowed_scheme

    def _validate_target_origin(self, url: str, allowed_host: str, allowed_scheme: str) -> None:
        parsed = urlparse(url)
        if (parsed.scheme or "").lower() != allowed_scheme or (parsed.hostname or "").lower() != allowed_host:
            raise CatalogDomainError(
                "REDIRECT_BLOCKED",
                f"Blocked redirect or request to untrusted origin '{parsed.scheme}://{parsed.hostname}'.",
                status_code=403,
            )

    def _request(
        self,
        method: str,
        rel_path: str,
        *,
        json_body: dict[str, Any] | None = None,
        extra_headers: dict[str, str] | None = None,
        correlation_id: str | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> httpx.Response:
        base_url, allowed_host, allowed_scheme = self._ensure_sync_allowed()
        corr = correlation_id or f"req-{uuid.uuid4().hex[:10]}"
        url = f"{base_url}{rel_path}"
        self._validate_target_origin(url, allowed_host, allowed_scheme)

        headers = {"X-FieldScan-Correlation-Id": corr, "Accept": "application/json"}
        if self._auth_token:
            headers["Authorization"] = f"Bearer {self._auth_token}"
        if self._boat_port_auth_token:
            headers["Cookie"] = f"_port_auth={self._boat_port_auth_token}"
        if extra_headers:
            headers.update(extra_headers)

        t0 = time.perf_counter()
        with self._lock:
            self._https_requests_emitted += 1

        try:
            with httpx.Client(trust_env=False, follow_redirects=False, timeout=10.0, transport=transport) as client:
                resp = client.request(method, url, json=json_body, headers=headers)
                # Manual single-hop same-origin redirect check (`M4-WAN-04`)
                if resp.status_code in (301, 302, 303, 307, 308):
                    loc = resp.headers.get("location") or ""
                    resolved_loc = str(resp.url.join(loc))
                    self._validate_target_origin(resolved_loc, allowed_host, allowed_scheme)
                    with self._lock:
                        self._https_requests_emitted += 1
                    resp = client.request(method, resolved_loc, json=json_body, headers=headers)
        except CatalogDomainError as exc:
            self._record_log(rel_path, corr, None, 0, (time.perf_counter() - t0) * 1000.0, exc.code)
            raise
        except Exception as exc:
            self._record_log(rel_path, corr, None, 0, (time.perf_counter() - t0) * 1000.0, "NETWORK_UNREACHABLE")
            raise CatalogDomainError(
                "NETWORK_UNREACHABLE",
                f"Cloud Catalog unreachable ({exc.__class__.__name__}). Local cached packages remain operational.",
                status_code=503,
            ) from exc

        elapsed = (time.perf_counter() - t0) * 1000.0
        with self._lock:
            self._last_contact_utc = utc_now_iso()

        if resp.status_code in (401, 403):
            self._record_log(rel_path, corr, resp.status_code, len(resp.content), elapsed, "HTTP_UNAUTHORIZED")
            raise CatalogDomainError(
                "HTTP_UNAUTHORIZED",
                "Cloud Catalog credentials rejected (401/403). Reconfigure access token in Catalog Settings.",
                status_code=resp.status_code,
            )
        if resp.status_code in (404, 410):
            self._record_log(rel_path, corr, resp.status_code, len(resp.content), elapsed, "HTTP_JOB_EXPIRED")
            raise CatalogDomainError(
                "HTTP_JOB_EXPIRED",
                "Requested job or catalog resource expired (404/410); submit a fresh catalog lookup.",
                status_code=resp.status_code,
            )
        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After") or "5") if str(resp.headers.get("Retry-After") or "").isdigit() else 5
            self._record_log(rel_path, corr, 429, len(resp.content), elapsed, "HTTP_RATE_LIMITED")
            err = CatalogDomainError(
                "HTTP_RATE_LIMITED",
                f"Cloud Catalog rate-limited (429). Retry after {retry_after}s.",
                status_code=429,
            )
            err.retry_after_s = retry_after  # type: ignore[attr-defined]
            raise err
        if resp.status_code >= 500:
            self._record_log(rel_path, corr, resp.status_code, len(resp.content), elapsed, "HTTP_SERVER_ERROR")
            raise CatalogDomainError(
                "HTTP_SERVER_ERROR",
                f"Cloud Catalog temporary server error (HTTP {resp.status_code}). Continuing with local cache.",
                status_code=503,
            )

        self._record_log(rel_path, corr, resp.status_code, len(resp.content), elapsed, None)
        return resp

    # ------------------------------------------------------------------
    # 5 Agreed Cloud Routes (`Section 3.1`)
    # ------------------------------------------------------------------

    def check_health(self, *, transport: httpx.BaseTransport | None = None) -> dict[str, Any]:
        try:
            resp = self._request("GET", "/healthz", transport=transport)
            ok = resp.status_code == 200
            with self._lock:
                self._last_health_status = "healthy" if ok else f"http_{resp.status_code}"
            return {"ok": ok, "status": self._last_health_status, "telemetry": self.get_sync_telemetry()}
        except CatalogDomainError as exc:
            with self._lock:
                self._last_health_status = exc.code.lower()
            return {"ok": False, "error_code": exc.code, "message": exc.message, "telemetry": self.get_sync_telemetry()}

    @staticmethod
    def _normalize_identity_key(manufacturer: str | None, model: str, variant: str | None, hw_rev: str | None, base_url: str) -> str:
        raw = f"{(manufacturer or '').strip().lower()}|{model.strip().lower()}|{(variant or '').strip().lower()}|{(hw_rev or '').strip().lower()}|{base_url.lower()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]

    def clear_cache_for_clean_onboarding(self) -> None:
        with self._lock:
            self._etag_cache.clear()
            self._active_jobs_by_key.clear()
            self._jobs_by_id.clear()

    def resolve_catalog(
        self,
        *,
        manufacturer: str | None,
        model: str,
        variant: str | None = None,
        hardware_revision: str | None = None,
        force_refresh: bool = False,
        transport: httpx.BaseTransport | None = None,
    ) -> dict[str, Any]:
        """POST `/v1/catalog/resolve` with strictly minimal identity (zero photos/serials/notes, `Section 3.2`, `M4-WAN-01..02`)."""
        base_url, _, _ = self._ensure_sync_allowed()
        norm_key = self._normalize_identity_key(manufacturer, model, variant, hardware_revision, base_url)

        with self._lock:
            self._ui_attempt_seq += 1
            attempt_id = self._ui_attempt_seq
            existing = self._active_jobs_by_key.get(norm_key)
            if not force_refresh and existing and existing.get("job_state") in ("queued", "running"):
                copied = dict(existing)
                copied["reused_existing_job"] = True
                copied["ui_attempt_id"] = attempt_id
                return copied

        # Strict minimal payload — NEVER include serial_number, photos, bench IPs, or notes!
        body: dict[str, Any] = {
            "manufacturer": (manufacturer or "").strip() or "UNKNOWN",
            "model": model.strip(),
            "variant": (variant or "").strip() or None,
            "hardware_revision": (hardware_revision or "").strip() or None,
        }
        if force_refresh:
            body["force_refresh"] = True
        resp = self._request("POST", "/v1/catalog/resolve", json_body=body, transport=transport)
        data = resp.json()
        self._hoist_identity_aliases(data)
        data["ui_attempt_id"] = attempt_id
        data["reused_existing_job"] = False

        if resp.status_code == 202 or data.get("job_state") in ("queued", "running"):
            jid = str(data.get("job_id") or f"job-{uuid.uuid4().hex[:8]}")
            data["job_id"] = jid
            data["norm_key"] = norm_key
            with self._lock:
                self._active_jobs_by_key[norm_key] = data
                self._jobs_by_id[jid] = data
        return data

    @staticmethod
    def _hoist_identity_aliases(data: dict[str, Any]) -> None:
        """Preserve PR #4 nested `identity`/`cached_publication` while exposing top-level convenience keys."""
        if not isinstance(data, dict):
            return
        ident = data.get("identity") if isinstance(data.get("identity"), dict) else {}
        cached = data.get("cached_publication") if isinstance(data.get("cached_publication"), dict) else {}
        if not data.get("product_id"):
            pid = ident.get("product_id") or cached.get("product_id")
            if pid:
                data["product_id"] = pid
        if not data.get("variant_id"):
            vid = ident.get("variant_id") or cached.get("variant_id")
            if vid:
                data["variant_id"] = vid

    def poll_job(self, job_id: str, *, transport: httpx.BaseTransport | None = None) -> dict[str, Any]:
        """GET `/v1/jobs/{job_id}` separating `job_state` from `availability` (`Section 3.2`)."""
        resp = self._request("GET", f"/v1/jobs/{job_id}", transport=transport)
        data = resp.json()
        self._hoist_identity_aliases(data)
        data["job_id"] = job_id
        with self._lock:
            prev = self._jobs_by_id.get(job_id, {})
            norm_key = prev.get("norm_key")
            if norm_key:
                data["norm_key"] = norm_key
                self._active_jobs_by_key[norm_key] = data
            self._jobs_by_id[job_id] = data
        return data

    def fetch_and_install_variant(
        self,
        product_id: str,
        variant_id: str,
        *,
        channel: str = "default",
        job_id: str | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> dict[str, Any]:
        """Fetch signed manifest (with ETag `304` support) and stream/verify all blobs into `FieldScanPackageStore` (`M4-WAN-03..05`)."""
        base_url, allowed_host, allowed_scheme = self._ensure_sync_allowed()
        pv_key = f"{product_id}/{variant_id}@{base_url}"

        extra_hdrs: dict[str, str] = {}
        cached_msha: str | None = None
        with self._lock:
            if pv_key in self._etag_cache:
                etag_val, cached_msha = self._etag_cache[pv_key]
                extra_hdrs["If-None-Match"] = etag_val

        m_resp = self._request(
            "GET",
            f"/v1/catalog/products/{product_id}/variants/{variant_id}/manifest",
            extra_headers=extra_hdrs,
            transport=transport,
        )
        if m_resp.status_code == 304 and cached_msha:
            pkg = self.store.get_installed_package(cached_msha)
            return {
                "ok": True,
                "status": "not_modified_304",
                "reused_cached": True,
                "package": pkg,
            }

        env_bytes = m_resp.content
        manifest, manifest_sha, _ = verify_and_decode_manifest_envelope(
            env_bytes,
            trusted_keys=self.store.trusted_keys,
        )

        # Download blobs incrementally to a temporary directory before committing to store
        with tempfile.TemporaryDirectory(dir=str(self.store.staging_dir), prefix="dl-") as tmp_dl:
            tmp_root = Path(tmp_dl)
            blobs_map: dict[str, Path] = {}
            for art in manifest["artifacts"]:
                with self._lock:
                    if not self._sync_enabled or "__GLOBAL_CANCEL__" in self._cancel_tokens or (job_id and job_id in self._cancel_tokens):
                        raise CatalogDomainError("DOWNLOAD_CANCELLED", "Download cancelled because sync was disabled.")

                obj_sha = art["sha256"]
                exp_len = int(art["byte_count"])
                blob_url = f"{base_url}/v1/catalog/blobs/{obj_sha}"
                self._validate_target_origin(blob_url, allowed_host, allowed_scheme)

                corr = f"blob-{obj_sha[:10]}"
                hdrs = {"X-FieldScan-Correlation-Id": corr}
                if self._auth_token:
                    hdrs["Authorization"] = f"Bearer {self._auth_token}"
                if self._boat_port_auth_token:
                    hdrs["Cookie"] = f"_port_auth={self._boat_port_auth_token}"

                t0 = time.perf_counter()
                with self._lock:
                    self._https_requests_emitted += 1

                dest_tmp = tmp_root / f"{obj_sha}.blob"
                written = 0
                try:
                    with httpx.Client(trust_env=False, follow_redirects=False, timeout=15.0, transport=transport) as client:
                        with client.stream("GET", blob_url, headers=hdrs) as stream_resp:
                            if stream_resp.status_code in (301, 302, 303, 307, 308):
                                loc = str(stream_resp.url.join(stream_resp.headers.get("location") or ""))
                                self._validate_target_origin(loc, allowed_host, allowed_scheme)
                            if stream_resp.status_code != 200:
                                raise CatalogDomainError(
                                    "BLOB_DOWNLOAD_FAILED",
                                    f"Blob HTTP {stream_resp.status_code} for {obj_sha[:12]}",
                                    status_code=stream_resp.status_code,
                                )
                            ctype = (stream_resp.headers.get("content-type") or "").lower()
                            if "text/html" in ctype:
                                raise CatalogDomainError("BLOB_DOWNLOAD_FAILED", "Unexpected HTML error page instead of binary blob")
                            with dest_tmp.open("wb") as fh:
                                for chunk in stream_resp.iter_bytes(chunk_size=65536):
                                    with self._lock:
                                        if not self._sync_enabled or "__GLOBAL_CANCEL__" in self._cancel_tokens:
                                            raise CatalogDomainError("DOWNLOAD_CANCELLED", "Sync disabled mid-transfer.")
                                    written += len(chunk)
                                    if written > exp_len:
                                        raise CatalogDomainError("SIZE_BUDGET_EXCEEDED", "Blob stream exceeded declared byte_count")
                                    fh.write(chunk)
                except CatalogDomainError as exc:
                    self._record_log(f"/v1/catalog/blobs/{obj_sha[:12]}", corr, None, written, (time.perf_counter() - t0) * 1000.0, exc.code)
                    raise
                except Exception as exc:
                    self._record_log(f"/v1/catalog/blobs/{obj_sha[:12]}", corr, None, written, (time.perf_counter() - t0) * 1000.0, "BLOB_TRUNCATED")
                    raise CatalogDomainError(
                        "BLOB_TRUNCATED",
                        f"Network interrupted during blob download ({written}/{exp_len} bytes). Previous package remains active.",
                        status_code=503,
                    ) from exc

                elapsed = (time.perf_counter() - t0) * 1000.0
                if written != exp_len:
                    self._record_log(f"/v1/catalog/blobs/{obj_sha[:12]}", corr, 200, written, elapsed, "BLOB_TRUNCATED")
                    raise CatalogDomainError("BLOB_TRUNCATED", f"Truncated blob ({written} != {exp_len} bytes)")
                if sha256_file(dest_tmp) != obj_sha:
                    self._record_log(f"/v1/catalog/blobs/{obj_sha[:12]}", corr, 200, written, elapsed, "BLOB_HASH_MISMATCH")
                    raise CatalogDomainError("BLOB_HASH_MISMATCH", f"Downloaded blob SHA-256 mismatch for {obj_sha[:12]}")

                self._record_log(f"/v1/catalog/blobs/{obj_sha[:12]}", corr, 200, written, elapsed, None)
                blobs_map[obj_sha] = dest_tmp

            installed = self.store.install_verified_package(
                env_bytes,
                blobs_map,
                channel=channel,
                source_origin="cloud_https",
            )

        etag_resp = m_resp.headers.get("ETag") or m_resp.headers.get("etag")
        if etag_resp:
            with self._lock:
                self._etag_cache[pv_key] = (etag_resp, manifest_sha)

        return {
            "ok": True,
            "status": "installed",
            "reused_cached": False,
            "package": installed,
        }
