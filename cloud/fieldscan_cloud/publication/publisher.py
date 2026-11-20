"""Atomic publication builder, idempotent republishing, restoration, and withdrawal (Megaplan §11)."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import sqlite3
from typing import Any
import uuid

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from fieldscan_cloud.db import immediate_tx, now_ts
from fieldscan_cloud.models import ManifestArtifact, ManifestCapabilities, ManifestPayload, ManifestSource
from fieldscan_cloud.publication.signing import sign_manifest_payload


class PublicationConflictError(RuntimeError):
    """Raised when lease was lost or concurrent publisher advanced publication_seq."""


@dataclass(frozen=True)
class ArtifactInput:
    role: str
    path: str
    sha256: str
    byte_count: int
    document_id: str | None = None


@dataclass(frozen=True)
class PublicationResult:
    publication_id: str
    publication_seq: int
    availability: str
    reused_existing: bool
    manifest_sha256: str
    envelope_etag: str
    capabilities: ManifestCapabilities
    reason_codes: list[str]


def compute_input_fingerprint(
    *,
    sources: list[dict[str, Any]],
    artifacts: list[ArtifactInput],
    capabilities: ManifestCapabilities,
    reason_codes: list[str],
    withdrawn_procedures: list[str] | None = None,
    restored_from_seq: int | None = None,
    reissue_intent: str | None = None,
) -> str:
    """Deterministic fingerprint of all publication inputs for idempotency (CL-PUB-03)."""
    canonical = {
        "sources": sorted(sources, key=lambda s: (s.get("source_id", ""), s.get("revision_label", ""))),
        "artifacts": sorted(
            [
                {
                    "role": a.role,
                    "path": a.path,
                    "sha256": a.sha256,
                    "byte_count": a.byte_count,
                    "document_id": a.document_id,
                }
                for a in artifacts
            ],
            key=lambda a: (a["role"], a["path"]),
        ),
        "capabilities": capabilities.model_dump(),
        "reason_codes": sorted(set(reason_codes)),
        "withdrawn_procedures": sorted(set(withdrawn_procedures or [])),
        "restored_from_seq": restored_from_seq,
        "reissue_intent": reissue_intent,
    }
    raw = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def publish_variant_atomically(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    issuer: str,
    channel: str,
    product_id: str,
    variant_id: str,
    sources: list[ManifestSource],
    artifacts: list[ArtifactInput],
    capabilities: ManifestCapabilities,
    reason_codes: list[str],
    private_key: Ed25519PrivateKey,
    key_id: str,
    job_id: str | None = None,
    lease_token: str | None = None,
    actor: str = "worker",
    withdrawn_procedures: list[str] | None = None,
    restored_from_seq: int | None = None,
    reissue_intent: str | None = None,
) -> PublicationResult:
    """
    Build, sign, verify, and atomically commit a publication.
    - If an identical current publication exists with the same input_fingerprint (and no reissue_intent),
      returns the existing publication without incrementing publication_seq (CL-PUB-03).
    - If job_id & lease_token are given, enforces active lease ownership inside the commit transaction.
    - Never exposes partial state before commit (CL-PUB-02).
    """
    if not artifacts:
        raise ValueError("Cannot publish a manifest without at least one verified artifact")

    availability = (
        "ready"
        if (capabilities.documentation and capabilities.interactive_twin and capabilities.procedures)
        else "partial"
    )
    normalized_reasons = sorted(set(reason_codes))
    withdrawn = sorted(set(withdrawn_procedures or []))
    fingerprint = compute_input_fingerprint(
        sources=[s.model_dump() for s in sources],
        artifacts=artifacts,
        capabilities=capabilities,
        reason_codes=normalized_reasons,
        withdrawn_procedures=withdrawn,
        restored_from_seq=restored_from_seq,
        reissue_intent=reissue_intent,
    )

    # Phase 1: Inspect current pointer & check idempotency before signing
    current_row = conn.execute(
        """
        SELECT cp.publication_seq, p.id, p.input_fingerprint, p.availability,
               p.manifest_sha256, p.envelope_etag,
               p.cap_documentation, p.cap_interactive_twin, p.cap_procedures,
               p.reason_codes_json
        FROM current_publications cp
        JOIN publications p ON p.id = cp.publication_id
        WHERE cp.tenant_id = ? AND cp.channel = ? AND cp.product_id = ? AND cp.variant_id = ?;
        """,
        (tenant_id, channel, product_id, variant_id),
    ).fetchone()

    expected_prev_seq = int(current_row["publication_seq"]) if current_row is not None else 0
    if current_row is not None and reissue_intent is None and current_row["input_fingerprint"] == fingerprint:
        return PublicationResult(
            publication_id=str(current_row["id"]),
            publication_seq=expected_prev_seq,
            availability=str(current_row["availability"]),
            reused_existing=True,
            manifest_sha256=str(current_row["manifest_sha256"]),
            envelope_etag=str(current_row["envelope_etag"]),
            capabilities=ManifestCapabilities(
                documentation=bool(current_row["cap_documentation"]),
                interactive_twin=bool(current_row["cap_interactive_twin"]),
                procedures=bool(current_row["cap_procedures"]),
            ),
            reason_codes=json.loads(current_row["reason_codes_json"]),
        )

    # Determine next monotonic sequence for this issuer/channel/variant line
    max_seq_row = conn.execute(
        """
        SELECT COALESCE(MAX(publication_seq), 0) AS max_seq
        FROM publications
        WHERE tenant_id = ? AND issuer = ? AND channel = ? AND product_id = ? AND variant_id = ?;
        """,
        (tenant_id, issuer, channel, product_id, variant_id),
    ).fetchone()
    next_seq = max(expected_prev_seq, int(max_seq_row["max_seq"])) + 1

    manifest_model = ManifestPayload(
        schema_version=1,
        interaction_version=1,
        issuer=issuer,
        key_id=key_id,
        product_id=product_id,
        variant_id=variant_id,
        publication_seq=next_seq,
        minimum_app_build=1,
        sources=sources,
        capabilities=capabilities,
        artifacts=[
            ManifestArtifact(
                role=a.role,
                path=a.path,
                sha256=a.sha256,
                byte_count=a.byte_count,
                document_id=a.document_id,
            )
            for a in artifacts
        ],
        reason_codes=normalized_reasons,
        withdrawn_procedures=withdrawn,
        restored_from_seq=restored_from_seq,
    )

    payload_dict = manifest_model.model_dump(exclude_none=True)
    envelope_bytes, manifest_sha256, etag = sign_manifest_payload(
        payload_dict,
        private_key=private_key,
        key_id=key_id,
    )

    pub_id = f"pub_{uuid.uuid4().hex[:16]}"
    ts = now_ts()

    # Phase 2: Short atomic commit transaction checking lease & expected previous sequence
    with immediate_tx(conn):
        if job_id is not None and lease_token is not None:
            lease_row = conn.execute(
                "SELECT 1 FROM jobs WHERE id = ? AND state = 'running' AND lease_token = ?;",
                (job_id, lease_token),
            ).fetchone()
            if lease_row is None:
                raise PublicationConflictError(f"Lease lost before commit for job {job_id}")

        live_current = conn.execute(
            """
            SELECT publication_id, publication_seq
            FROM current_publications
            WHERE tenant_id = ? AND channel = ? AND product_id = ? AND variant_id = ?;
            """,
            (tenant_id, channel, product_id, variant_id),
        ).fetchone()
        live_seq = int(live_current["publication_seq"]) if live_current is not None else 0
        if live_seq != expected_prev_seq:
            raise PublicationConflictError(
                f"Concurrent publication advanced seq from {expected_prev_seq} to {live_seq}"
            )

        # Ensure every referenced object exists in objects table before inserting publication
        for art in artifacts:
            obj_row = conn.execute("SELECT byte_count FROM objects WHERE sha256 = ?;", (art.sha256,)).fetchone()
            if obj_row is None or int(obj_row["byte_count"]) != art.byte_count:
                raise ValueError(f"Artifact object missing or size mismatch in store: {art.sha256}")

        if live_current is not None:
            conn.execute(
                "UPDATE publications SET status = 'superseded' WHERE id = ? AND status = 'published';",
                (live_current["publication_id"],),
            )

        conn.execute(
            """
            INSERT INTO publications (
              id, tenant_id, issuer, channel, product_id, variant_id, publication_seq,
              input_fingerprint, availability,
              cap_documentation, cap_interactive_twin, cap_procedures,
              reason_codes_json, key_id, manifest_sha256, envelope_etag, envelope_bytes,
              status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?);
            """,
            (
                pub_id,
                tenant_id,
                issuer,
                channel,
                product_id,
                variant_id,
                next_seq,
                fingerprint,
                availability,
                1 if capabilities.documentation else 0,
                1 if capabilities.interactive_twin else 0,
                1 if capabilities.procedures else 0,
                json.dumps(normalized_reasons),
                key_id,
                manifest_sha256,
                etag,
                sqlite3.Binary(envelope_bytes),
                ts,
            ),
        )

        for art in artifacts:
            conn.execute(
                """
                INSERT INTO publication_objects (
                  publication_id, role, package_path, document_id, object_sha256, byte_count
                ) VALUES (?, ?, ?, ?, ?, ?);
                """,
                (pub_id, art.role, art.path, art.document_id, art.sha256, art.byte_count),
            )

        conn.execute(
            """
            INSERT INTO current_publications (
              tenant_id, channel, product_id, variant_id, publication_id, publication_seq, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(tenant_id, channel, product_id, variant_id) DO UPDATE SET
              publication_id = excluded.publication_id,
              publication_seq = excluded.publication_seq,
              updated_at = excluded.updated_at;
            """,
            (tenant_id, channel, product_id, variant_id, pub_id, next_seq, ts),
        )

        conn.execute(
            """
            INSERT INTO publication_events (
              publication_id, job_id, event_type, actor, reason, detail_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
            """,
            (
                pub_id,
                job_id,
                "restored" if restored_from_seq is not None else "published",
                actor,
                reissue_intent or ",".join(normalized_reasons),
                json.dumps(
                    {
                        "publication_seq": next_seq,
                        "availability": availability,
                        "restored_from_seq": restored_from_seq,
                        "withdrawn_procedures": withdrawn,
                    },
                    sort_keys=True,
                ),
                ts,
            ),
        )

    return PublicationResult(
        publication_id=pub_id,
        publication_seq=next_seq,
        availability=availability,
        reused_existing=False,
        manifest_sha256=manifest_sha256,
        envelope_etag=etag,
        capabilities=capabilities,
        reason_codes=normalized_reasons,
    )


def restore_previous_publication(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    issuer: str,
    channel: str,
    product_id: str,
    variant_id: str,
    target_seq: int,
    private_key: Ed25519PrivateKey,
    key_id: str,
    reason: str = "operator_restore",
    actor: str = "cli",
) -> PublicationResult:
    """Re-issue a validated historical publication under a higher monotonic sequence (CL-PUB-04)."""
    row = conn.execute(
        """
        SELECT * FROM publications
        WHERE tenant_id = ? AND issuer = ? AND channel = ?
          AND product_id = ? AND variant_id = ? AND publication_seq = ?;
        """,
        (tenant_id, issuer, channel, product_id, variant_id, target_seq),
    ).fetchone()
    if row is None:
        raise LookupError(f"Historical publication seq={target_seq} not found")

    envelope = json.loads(bytes(row["envelope_bytes"]).decode("utf-8"))
    import base64

    old_payload = json.loads(base64.b64decode(envelope["payload_b64"]).decode("utf-8"))
    sources = [ManifestSource(**s) for s in old_payload["sources"]]
    artifacts = [
        ArtifactInput(
            role=a["role"],
            path=a["path"],
            sha256=a["sha256"],
            byte_count=a["byte_count"],
            document_id=a.get("document_id"),
        )
        for a in old_payload["artifacts"]
    ]
    caps = ManifestCapabilities(**old_payload["capabilities"])
    return publish_variant_atomically(
        conn,
        tenant_id=tenant_id,
        issuer=issuer,
        channel=channel,
        product_id=product_id,
        variant_id=variant_id,
        sources=sources,
        artifacts=artifacts,
        capabilities=caps,
        reason_codes=list(old_payload.get("reason_codes", [])),
        private_key=private_key,
        key_id=key_id,
        actor=actor,
        withdrawn_procedures=list(old_payload.get("withdrawn_procedures", [])),
        restored_from_seq=target_seq,
        reissue_intent=f"restore:{target_seq}:{reason}",
    )


def withdraw_procedures_publication(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    issuer: str,
    channel: str,
    product_id: str,
    variant_id: str,
    withdrawn_procedures: list[str],
    reason_code: str,
    private_key: Ed25519PrivateKey,
    key_id: str,
    actor: str = "cli",
) -> PublicationResult:
    """Emit a new signed publication disabling procedures and listing withdrawn items (CL-PUB-05)."""
    cur = conn.execute(
        """
        SELECT p.*
        FROM current_publications cp
        JOIN publications p ON p.id = cp.publication_id
        WHERE cp.tenant_id = ? AND cp.channel = ? AND cp.product_id = ? AND cp.variant_id = ?;
        """,
        (tenant_id, channel, product_id, variant_id),
    ).fetchone()
    if cur is None:
        raise LookupError("No active publication to withdraw procedures from")

    import base64

    envelope = json.loads(bytes(cur["envelope_bytes"]).decode("utf-8"))
    old_payload = json.loads(base64.b64decode(envelope["payload_b64"]).decode("utf-8"))
    sources = [ManifestSource(**s) for s in old_payload["sources"]]
    artifacts = [
        ArtifactInput(
            role=a["role"],
            path=a["path"],
            sha256=a["sha256"],
            byte_count=a["byte_count"],
            document_id=a.get("document_id"),
        )
        for a in old_payload["artifacts"]
    ]
    old_caps = ManifestCapabilities(**old_payload["capabilities"])
    new_caps = ManifestCapabilities(
        documentation=old_caps.documentation,
        interactive_twin=old_caps.interactive_twin,
        procedures=False,
    )
    reasons = sorted(set(list(old_payload.get("reason_codes", [])) + [reason_code]))
    merged_withdrawn = sorted(set(list(old_payload.get("withdrawn_procedures", [])) + withdrawn_procedures))
    return publish_variant_atomically(
        conn,
        tenant_id=tenant_id,
        issuer=issuer,
        channel=channel,
        product_id=product_id,
        variant_id=variant_id,
        sources=sources,
        artifacts=artifacts,
        capabilities=new_caps,
        reason_codes=reasons,
        private_key=private_key,
        key_id=key_id,
        actor=actor,
        withdrawn_procedures=merged_withdrawn,
        reissue_intent=f"withdraw:{reason_code}:{','.join(merged_withdrawn)}",
    )
