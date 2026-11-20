"""SQLite persistence, migrations, job queue with leases, and atomic publication commits (Megaplan §7)."""

from __future__ import annotations

from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time
from typing import Any, Iterator
import uuid

from fieldscan_cloud.models import normalize_token

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


class SchemaError(RuntimeError):
    """Raised when SQLite schema or journal mode does not match release expectations."""


def now_ts() -> int:
    return int(time.time())


def connect_sqlite(db_path: Path, *, expected_journal_mode: str | None = None) -> sqlite3.Connection:
    """Open an independent SQLite connection with mandatory PRAGMAs (§7.1)."""
    conn = sqlite3.connect(str(db_path), timeout=5.0, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA synchronous = FULL;")
    if expected_journal_mode is not None:
        actual = str(conn.execute("PRAGMA journal_mode;").fetchone()[0]).upper()
        if actual != expected_journal_mode.upper():
            conn.close()
            raise SchemaError(
                f"SQLite journal_mode mismatch: expected {expected_journal_mode.upper()}, got {actual}"
            )
    return conn


@contextmanager
def immediate_tx(conn: sqlite3.Connection) -> Iterator[sqlite3.Connection]:
    """Run a short BEGIN IMMEDIATE transaction, rolling back cleanly on exception."""
    conn.execute("BEGIN IMMEDIATE;")
    try:
        yield conn
        conn.execute("COMMIT;")
    except Exception:
        if conn.in_transaction:
            conn.execute("ROLLBACK;")
        raise


def apply_migrations(
    db_path: Path,
    *,
    journal_mode: str = "DELETE",
    migrations_dir: Path = MIGRATIONS_DIR,
) -> int:
    """Create database if needed, enforce persistent journal mode, and apply numbered SQL migrations."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect_sqlite(db_path)
    try:
        os.chmod(db_path, 0o600)
        actual_mode = str(conn.execute(f"PRAGMA journal_mode = {journal_mode.upper()};").fetchone()[0]).upper()
        if actual_mode != journal_mode.upper():
            raise SchemaError(f"Failed to set journal_mode={journal_mode.upper()}, got {actual_mode}")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
              version INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              applied_at INTEGER NOT NULL
            );
            """
        )
        applied = {
            int(row["version"])
            for row in conn.execute("SELECT version FROM schema_migrations;").fetchall()
        }

        sql_files = sorted(migrations_dir.glob("[0-9][0-9][0-9]_*.sql"))
        if not sql_files:
            raise SchemaError(f"No migration files found in {migrations_dir}")

        latest_version = max(applied) if applied else 0
        for sql_file in sql_files:
            version = int(sql_file.name.split("_", 1)[0])
            if version in applied:
                latest_version = max(latest_version, version)
                continue
            script = sql_file.read_text(encoding="utf-8")
            with immediate_tx(conn):
                for statement in _split_sql_statements(script):
                    conn.execute(statement)
                conn.execute(
                    "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);",
                    (version, sql_file.name, now_ts()),
                )
            latest_version = max(latest_version, version)

        return latest_version
    finally:
        conn.close()


def _split_sql_statements(script: str) -> list[str]:
    statements: list[str] = []
    buffer: list[str] = []
    for line in script.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        buffer.append(line)
        joined = "\n".join(buffer)
        if sqlite3.complete_statement(joined):
            statements.append(joined)
            buffer.clear()
    leftover = "\n".join(buffer).strip()
    if leftover:
        statements.append(leftover)
    return statements


def verify_schema(conn: sqlite3.Connection, *, expected_journal_mode: str) -> tuple[int, str]:
    """Verify schema_migrations exists, latest migration is applied, and journal mode matches."""
    actual_mode = str(conn.execute("PRAGMA journal_mode;").fetchone()[0]).upper()
    if actual_mode != expected_journal_mode.upper():
        raise SchemaError(
            f"SQLite journal_mode mismatch: expected {expected_journal_mode.upper()}, got {actual_mode}"
        )
    row = conn.execute("SELECT MAX(version) AS v FROM schema_migrations;").fetchone()
    if row is None or row["v"] is None:
        raise SchemaError("Database has no applied schema_migrations")
    return int(row["v"]), actual_mode


def ensure_default_tenant_and_credential(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    channel: str,
    token_sha256: str | None = None,
) -> None:
    """Idempotently ensure the default tenant and configured API credential exist."""
    ts = now_ts()
    with immediate_tx(conn):
        conn.execute(
            """
            INSERT INTO tenants (id, name, channel, status, created_at)
            VALUES (?, ?, ?, 'active', ?)
            ON CONFLICT(id) DO UPDATE SET channel = excluded.channel, status = 'active';
            """,
            (tenant_id, f"FieldScan {tenant_id}", channel, ts),
        )
        if token_sha256:
            cred_id = f"cred_{tenant_id}_primary"
            conn.execute(
                """
                INSERT INTO api_credentials (id, tenant_id, label, token_sha256, status, max_active_jobs, created_at)
                VALUES (?, ?, 'primary-env-token', ?, 'active', 8, ?)
                ON CONFLICT(id) DO UPDATE SET
                  token_sha256 = excluded.token_sha256,
                  status = 'active',
                  revoked_at = NULL;
                """,
                (cred_id, tenant_id, token_sha256.lower(), ts),
            )


def lookup_active_credential(conn: sqlite3.Connection, token_sha256: str) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT c.id, c.tenant_id, c.label, c.token_sha256, c.max_active_jobs, t.channel, t.status AS tenant_status
        FROM api_credentials c
        JOIN tenants t ON t.id = c.tenant_id
        WHERE c.token_sha256 = ? AND c.status = 'active' AND t.status = 'active';
        """,
        (token_sha256.lower(),),
    ).fetchone()


def enroll_device_credential(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    channel: str,
    device_id: str,
    token_sha256: str,
    max_devices: int = 50,
    max_active_jobs: int = 5,
) -> str:
    """Atomically register or rotate a per-device Bearer credential digest for zero-typing iPad onboarding."""
    dev_hash = hashlib.sha256(f"{tenant_id}:{device_id.strip()}".encode("utf-8")).hexdigest()[:16]
    cred_id = f"cred_dev_{dev_hash}"
    label = f"device:{device_id.strip()[:48]}"
    ts = now_ts()
    with immediate_tx(conn):
        conn.execute(
            """
            INSERT INTO tenants (id, name, channel, status, created_at)
            VALUES (?, ?, ?, 'active', ?)
            ON CONFLICT(id) DO UPDATE SET channel = excluded.channel, status = 'active';
            """,
            (tenant_id, f"FieldScan {tenant_id}", channel, ts),
        )
        existing = conn.execute("SELECT id FROM api_credentials WHERE id = ?;", (cred_id,)).fetchone()
        if existing is None:
            dev_count = int(
                conn.execute(
                    "SELECT COUNT(*) AS cnt FROM api_credentials WHERE tenant_id = ? AND id LIKE 'cred_dev_%' AND status = 'active';",
                    (tenant_id,),
                ).fetchone()["cnt"]
            )
            if dev_count >= max_devices:
                raise PermissionError("ENROLL_LIMIT_EXCEEDED")
        conn.execute(
            """
            INSERT INTO api_credentials (id, tenant_id, label, token_sha256, status, max_active_jobs, created_at)
            VALUES (?, ?, ?, ?, 'active', ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              label = excluded.label,
              token_sha256 = excluded.token_sha256,
              status = 'active',
              revoked_at = NULL;
            """,
            (cred_id, tenant_id, label, token_sha256.lower(), max_active_jobs, ts),
        )
    return cred_id


def compute_request_key(
    *,
    tenant_id: str,
    channel: str,
    manufacturer: str,
    model: str,
    variant: str | None,
    hardware_revision: str | None,
    purpose: str = "resolve",
) -> str:
    """Deterministic canonical request key for job deduplication (§7.2)."""
    canonical = {
        "tenant_id": tenant_id,
        "channel": channel,
        "purpose": purpose,
        "manufacturer": normalize_token(manufacturer),
        "model": normalize_token(model),
        "variant": normalize_token(variant),
        "hardware_revision": normalize_token(hardware_revision),
    }
    raw = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def enqueue_or_get_active_job(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    channel: str,
    request_payload: dict[str, Any],
    purpose: str = "resolve",
    max_active_jobs: int = 8,
) -> tuple[sqlite3.Row, bool]:
    """Return existing active job for identical request_key or atomically insert a new queued job."""
    req_key = compute_request_key(
        tenant_id=tenant_id,
        channel=channel,
        manufacturer=str(request_payload["manufacturer"]),
        model=str(request_payload["model"]),
        variant=request_payload.get("variant"),
        hardware_revision=request_payload.get("hardware_revision"),
        purpose=purpose,
    )
    ts = now_ts()
    with immediate_tx(conn):
        existing = conn.execute(
            """
            SELECT * FROM jobs
            WHERE tenant_id = ? AND request_key = ? AND state IN ('queued', 'running')
            LIMIT 1;
            """,
            (tenant_id, req_key),
        ).fetchone()
        if existing is not None:
            return existing, False

        active_count = int(
            conn.execute(
                "SELECT COUNT(*) AS cnt FROM jobs WHERE tenant_id = ? AND state IN ('queued', 'running');",
                (tenant_id,),
            ).fetchone()["cnt"]
        )
        if active_count >= max_active_jobs:
            raise PermissionError("ACTIVE_JOB_LIMIT_EXCEEDED")

        job_id = f"job_{uuid.uuid4().hex[:16]}"
        conn.execute(
            """
            INSERT INTO jobs (
              id, tenant_id, request_key, request_json, purpose,
              state, phase, attempts, available_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'queued', 'enqueued', 0, ?, ?, ?);
            """,
            (
                job_id,
                tenant_id,
                req_key,
                json.dumps(request_payload, sort_keys=True, separators=(",", ":")),
                purpose,
                ts,
                ts,
                ts,
            ),
        )
        created = conn.execute("SELECT * FROM jobs WHERE id = ?;", (job_id,)).fetchone()
        return created, True


def claim_next_job(
    conn: sqlite3.Connection,
    *,
    lease_sec: int,
    max_attempts: int,
) -> sqlite3.Row | None:
    """Atomically claim one queued job or one running job whose lease expired (§7.2)."""
    ts = now_ts()
    with immediate_tx(conn):
        # First fail any expired jobs that exhausted max_attempts
        conn.execute(
            """
            UPDATE jobs
            SET state = 'failed',
                phase = 'lease_exhausted',
                error_code = 'JOB_ATTEMPTS_EXHAUSTED',
                error_message = 'Job exceeded maximum attempts after lease expiration',
                lease_until = NULL,
                lease_token = NULL,
                updated_at = ?
            WHERE state = 'running' AND lease_until IS NOT NULL AND lease_until <= ? AND attempts >= ?;
            """,
            (ts, ts, max_attempts),
        )

        row = conn.execute(
            """
            SELECT * FROM jobs
            WHERE (state = 'queued' AND available_at <= ?)
               OR (state = 'running' AND lease_until IS NOT NULL AND lease_until <= ? AND attempts < ?)
            ORDER BY created_at ASC
            LIMIT 1;
            """,
            (ts, ts, max_attempts),
        ).fetchone()
        if row is None:
            return None

        lease_token = uuid.uuid4().hex
        new_attempts = int(row["attempts"]) + 1
        conn.execute(
            """
            UPDATE jobs
            SET state = 'running',
                phase = 'claimed',
                attempts = ?,
                lease_until = ?,
                lease_token = ?,
                updated_at = ?
            WHERE id = ? AND state = ?;
            """,
            (new_attempts, ts + lease_sec, lease_token, ts, row["id"], row["state"]),
        )
        return conn.execute("SELECT * FROM jobs WHERE id = ?;", (row["id"],)).fetchone()


def renew_job_lease(
    conn: sqlite3.Connection,
    *,
    job_id: str,
    lease_token: str,
    lease_sec: int,
    phase: str | None = None,
) -> bool:
    ts = now_ts()
    with immediate_tx(conn):
        if phase is not None:
            cur = conn.execute(
                """
                UPDATE jobs
                SET lease_until = ?, phase = ?, updated_at = ?
                WHERE id = ? AND state = 'running' AND lease_token = ?;
                """,
                (ts + lease_sec, phase, ts, job_id, lease_token),
            )
        else:
            cur = conn.execute(
                """
                UPDATE jobs
                SET lease_until = ?, updated_at = ?
                WHERE id = ? AND state = 'running' AND lease_token = ?;
                """,
                (ts + lease_sec, ts, job_id, lease_token),
            )
        return cur.rowcount == 1


def complete_job(
    conn: sqlite3.Connection,
    *,
    job_id: str,
    lease_token: str,
    result_payload: dict[str, Any],
    phase: str = "completed",
) -> bool:
    ts = now_ts()
    with immediate_tx(conn):
        cur = conn.execute(
            """
            UPDATE jobs
            SET state = 'completed',
                phase = ?,
                result_json = ?,
                error_code = NULL,
                error_message = NULL,
                lease_until = NULL,
                lease_token = NULL,
                updated_at = ?
            WHERE id = ? AND state = 'running' AND lease_token = ?;
            """,
            (
                phase,
                json.dumps(result_payload, sort_keys=True, separators=(",", ":")),
                ts,
                job_id,
                lease_token,
            ),
        )
        return cur.rowcount == 1


def requeue_or_fail_job(
    conn: sqlite3.Connection,
    *,
    job_id: str,
    lease_token: str,
    attempts: int,
    max_attempts: int,
    error_code: str,
    error_message: str,
    transient: bool = True,
) -> bool:
    ts = now_ts()
    with immediate_tx(conn):
        if transient and attempts < max_attempts:
            backoff = min(60, 2 ** max(1, attempts))
            cur = conn.execute(
                """
                UPDATE jobs
                SET state = 'queued',
                    phase = 'retry_scheduled',
                    available_at = ?,
                    lease_until = NULL,
                    lease_token = NULL,
                    error_code = ?,
                    error_message = ?,
                    updated_at = ?
                WHERE id = ? AND state = 'running' AND lease_token = ?;
                """,
                (ts + backoff, error_code, error_message, ts, job_id, lease_token),
            )
        else:
            cur = conn.execute(
                """
                UPDATE jobs
                SET state = 'failed',
                    phase = 'failed',
                    lease_until = NULL,
                    lease_token = NULL,
                    error_code = ?,
                    error_message = ?,
                    updated_at = ?
                WHERE id = ? AND state = 'running' AND lease_token = ?;
                """,
                (error_code, error_message, ts, job_id, lease_token),
            )
        return cur.rowcount == 1


def upsert_product_and_variant(
    conn: sqlite3.Connection,
    *,
    product_id: str,
    manufacturer: str,
    model: str,
    display_name: str,
    variant_id: str,
    variant_code: str,
    hardware_revision: str | None,
    variant_display_name: str,
    discriminant_hint: str,
    aliases: list[str] | None = None,
    bench_support_status: str = "homologated",
) -> None:
    ts = now_ts()
    with immediate_tx(conn):
        conn.execute(
            """
            INSERT INTO products (
              id, manufacturer, manufacturer_norm, model, model_norm,
              display_name, bench_support_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              display_name = excluded.display_name,
              bench_support_status = excluded.bench_support_status,
              updated_at = excluded.updated_at;
            """,
            (
                product_id,
                manufacturer,
                normalize_token(manufacturer),
                model,
                normalize_token(model),
                display_name,
                bench_support_status,
                ts,
                ts,
            ),
        )
        conn.execute(
            """
            INSERT INTO variants (
              id, product_id, variant_code, variant_norm,
              hardware_revision, hardware_revision_norm,
              discriminant_hint, display_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              variant_code = excluded.variant_code,
              hardware_revision = excluded.hardware_revision,
              hardware_revision_norm = excluded.hardware_revision_norm,
              discriminant_hint = excluded.discriminant_hint,
              display_name = excluded.display_name,
              updated_at = excluded.updated_at;
            """,
            (
                variant_id,
                product_id,
                variant_code,
                normalize_token(variant_code),
                hardware_revision,
                normalize_token(hardware_revision),
                discriminant_hint,
                variant_display_name,
                ts,
                ts,
            ),
        )
        if aliases:
            for alias in aliases:
                alias_norm = normalize_token(alias)
                if not alias_norm:
                    continue
                exists = conn.execute(
                    "SELECT 1 FROM aliases WHERE alias_norm = ? AND product_id = ? AND variant_id IS ?;",
                    (alias_norm, product_id, variant_id),
                ).fetchone()
                if exists is None:
                    conn.execute(
                        "INSERT INTO aliases (alias_norm, product_id, variant_id, priority, created_at) VALUES (?, ?, ?, 100, ?);",
                        (alias_norm, product_id, variant_id, ts),
                    )


def find_matching_variants(
    conn: sqlite3.Connection,
    *,
    manufacturer: str,
    model: str,
    variant: str | None = None,
    hardware_revision: str | None = None,
) -> list[sqlite3.Row]:
    """Find matching variants by normalized manufacturer/model or alias, filtered by variant/revision if provided."""
    mfr_norm = normalize_token(manufacturer)
    model_norm = normalize_token(model)
    combined_norm = normalize_token(f"{manufacturer} {model}")
    var_norm = normalize_token(variant)
    rev_norm = normalize_token(hardware_revision)

    rows = conn.execute(
        """
        SELECT DISTINCT v.*, p.manufacturer, p.model
        FROM variants v
        JOIN products p ON p.id = v.product_id
        LEFT JOIN aliases a ON a.product_id = p.id AND (a.variant_id IS NULL OR a.variant_id = v.id)
        WHERE (p.manufacturer_norm = ? AND p.model_norm = ?)
           OR a.alias_norm IN (?, ?)
        ORDER BY v.id ASC;
        """,
        (mfr_norm, model_norm, model_norm, combined_norm),
    ).fetchall()

    if not rows:
        return []

    filtered = list(rows)
    if var_norm:
        exact_var = [
            r
            for r in filtered
            if r["variant_norm"] == var_norm or normalize_token(r["id"]) == var_norm
        ]
        if exact_var:
            filtered = exact_var
        else:
            return []

    if rev_norm:
        exact_rev = [r for r in filtered if r["hardware_revision_norm"] == rev_norm]
        if exact_rev:
            filtered = exact_rev
        else:
            return []

    return filtered


def get_current_publication(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    channel: str,
    product_id: str,
    variant_id: str,
) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT p.*
        FROM current_publications cp
        JOIN publications p ON p.id = cp.publication_id
        WHERE cp.tenant_id = ? AND cp.channel = ? AND cp.product_id = ? AND cp.variant_id = ?;
        """,
        (tenant_id, channel, product_id, variant_id),
    ).fetchone()


def get_authorized_blob(
    conn: sqlite3.Connection,
    *,
    tenant_id: str,
    sha256: str,
) -> sqlite3.Row | None:
    """Authorize blob access strictly through tenant publications (CL-API-05)."""
    return conn.execute(
        """
        SELECT o.sha256, o.byte_count, o.media_type, o.storage_relpath
        FROM objects o
        WHERE o.sha256 = ?
          AND EXISTS (
            SELECT 1
            FROM publication_objects po
            JOIN publications p ON p.id = po.publication_id
            WHERE po.object_sha256 = o.sha256
              AND p.tenant_id = ?
              AND p.status IN ('published', 'superseded')
          )
        LIMIT 1;
        """,
        (sha256.lower(), tenant_id),
    ).fetchone()


def record_source_event(
    conn: sqlite3.Connection,
    *,
    event_type: str,
    detail: dict[str, Any],
    source_id: str | None = None,
    job_id: str | None = None,
    actor: str = "worker",
) -> None:
    with immediate_tx(conn):
        conn.execute(
            """
            INSERT INTO source_events (source_id, job_id, event_type, actor, detail_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (source_id, job_id, event_type, actor, json.dumps(detail, sort_keys=True), now_ts()),
        )


def ensure_seed_sources(conn: sqlite3.Connection, seed_entries: list[dict[str, str]]) -> None:
    """Idempotently register the documented OEM/public seed references in SQLite (§2 & §8.2)."""
    ts = now_ts()
    with immediate_tx(conn):
        for entry in seed_entries:
            conn.execute(
                """
                INSERT INTO sources (
                  id, product_id, variant_id, origin_kind, canonical_url, final_url,
                  allowed_domain, source_class, permission_policy, decision_evidence,
                  created_at, updated_at
                ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  canonical_url = excluded.canonical_url,
                  final_url = excluded.final_url,
                  allowed_domain = excluded.allowed_domain,
                  permission_policy = excluded.permission_policy,
                  decision_evidence = excluded.decision_evidence,
                  updated_at = excluded.updated_at;
                """,
                (
                    entry["source_id"],
                    entry["origin_kind"],
                    entry["canonical_url"],
                    entry["canonical_url"],
                    entry["allowed_domain"],
                    entry["source_class"],
                    entry["permission_policy"],
                    entry["decision_evidence"],
                    ts,
                    ts,
                ),
            )

