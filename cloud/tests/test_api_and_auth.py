"""API & authentication tests covering CL-API-01..06 and config startup checks."""

from __future__ import annotations

import hashlib
import json

from fastapi.testclient import TestClient
import pytest

from fieldscan_cloud.api import create_app
from fieldscan_cloud.config import ConfigError, load_api_config
from fieldscan_cloud.db import connect_sqlite, ensure_default_tenant_and_credential
from fieldscan_cloud.publication.signing import verify_signed_envelope
from fieldscan_cloud.worker import FIXTURES_DIR, _build_fixture_artifacts


def test_config_rejects_placeholders(tmp_path):
    with pytest.raises(ConfigError):
        load_api_config(
            {
                "FS_ENV": "pilot",
                "FS_CHANNEL": "pilot",
                "FS_DATA_DIR": str(tmp_path),
                "FS_DB_PATH": str(tmp_path / "catalog.sqlite3"),
                "FS_SQLITE_JOURNAL_MODE": "DELETE",
                "FS_API_TOKEN_SHA256": "REEMPLAZAR_DIGEST_HEX_DE_64",
            }
        )


def test_healthz_and_auth_and_resolve_and_blobs(api_config, worker_config, env_paths, api_token):
    # Seed THT-02 complete fixture into pilot tenant
    conn = connect_sqlite(worker_config.db_path, expected_journal_mode="DELETE")
    try:
        stage = worker_config.data_dir / "staging" / "seed_test"
        stage.mkdir(parents=True, exist_ok=True)
        pub_res, _ = _build_fixture_artifacts(
            conn,
            config=worker_config,
            fixture_dir=FIXTURES_DIR / "tht02_v1_1",
            staging_dir=stage,
            tenant_id="pilot",
            run_ocr=False,
        )
        assert pub_res.availability == "ready"
        assert pub_res.capabilities.documentation is True
        assert pub_res.capabilities.interactive_twin is True
        assert pub_res.capabilities.procedures is True

        # Add a second isolated tenant (other_tenant) for CL-API-05 cross-tenant check
        other_token = "other_tenant_secret_token_9876543210abcdef9876543210abcdef987654"
        other_digest = hashlib.sha256(other_token.encode("utf-8")).hexdigest()
        ensure_default_tenant_and_credential(
            conn, tenant_id="other_tenant", channel="pilot", token_sha256=other_digest
        )
    finally:
        conn.close()

    app = create_app(api_config)
    auth_hdr = {"Authorization": f"Bearer {api_token}"}
    other_hdr = {"Authorization": f"Bearer {other_token}"}

    with TestClient(app) as client:
        # /healthz works without Bearer token
        h = client.get("/healthz")
        assert h.status_code == 200
        assert h.json()["status"] == "ok"
        assert h.json()["journal_mode"] == "DELETE"

        # CL-API-03: Invalid credentials -> 401 without leaking details
        r_unauth = client.post(
            "/v1/catalog/resolve",
            json={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": None, "hardware_revision": None},
        )
        assert r_unauth.status_code == 401
        assert "error" in r_unauth.json() and "request_id" in r_unauth.json()

        # URL injection rejected by Pydantic validation (422)
        r_url = client.post(
            "/v1/catalog/resolve",
            headers=auth_hdr,
            json={"manufacturer": "https://evil.example", "model": "X"},
        )
        assert r_url.status_code == 422

        # CL-API-01: Published equipment returns 200 cached
        r_cached = client.post(
            "/v1/catalog/resolve",
            headers=auth_hdr,
            json={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": None, "hardware_revision": None},
        )
        assert r_cached.status_code == 200
        body = r_cached.json()
        assert body["availability"] == "ready"
        assert body["identity"]["product_id"] == "tzone_tht02"
        assert body["identity"]["variant_id"] == "v1_1_rs485"
        assert body["capabilities"]["interactive_twin"] == "available"
        assert body["publication_seq"] == 1

        # CL-API-02: Unknown model called twice deduplicates into ONE active job_id (202)
        r_new1 = client.post(
            "/v1/catalog/resolve",
            headers=auth_hdr,
            json={"manufacturer": "ACME", "model": "Sensor-9000", "variant": None, "hardware_revision": None},
        )
        r_new2 = client.post(
            "/v1/catalog/resolve",
            headers=auth_hdr,
            json={"manufacturer": "acme", "model": "sensor 9000", "variant": None, "hardware_revision": None},
        )
        assert r_new1.status_code == 202
        assert r_new2.status_code == 202
        assert set(r_new1.json().keys()) == {"job_id", "job_state", "availability", "retry_after_seconds"}
        assert (env_paths["db_path"].stat().st_mode & 0o777) == 0o600
        job_id = r_new1.json()["job_id"]
        assert r_new2.json()["job_id"] == job_id

        # Oversized body (> max_body_bytes) rejected with 413 PAYLOAD_TOO_LARGE
        r_huge = client.post(
            "/v1/catalog/resolve",
            headers={**auth_hdr, "Content-Type": "application/json"},
            content=b'{"manufacturer":"' + (b"A" * 20000) + b'","model":"B"}',
        )
        assert r_huge.status_code == 413

        # CL-API-03: Job status works for owner, 404 for unknown or other tenant
        assert client.get(f"/v1/jobs/{job_id}", headers=auth_hdr).status_code == 200
        assert client.get(f"/v1/jobs/{job_id}", headers=other_hdr).status_code == 404
        assert client.get("/v1/jobs/job_missing", headers=auth_hdr).status_code == 404

        # CL-API-04: Manifest 200 + ETag -> 304 on repeat; auth enforced BEFORE 304!
        m_url = "/v1/catalog/products/tzone_tht02/variants/v1_1_rs485/manifest"
        m1 = client.get(m_url, headers=auth_hdr)
        assert m1.status_code == 200
        etag = m1.headers["ETag"]
        payload = verify_signed_envelope(
            m1.content,
            public_key_b64=str(env_paths["pub_b64"]),
            expected_key_id="pilot-1",
        )
        assert payload["publication_seq"] == 1
        assert payload["capabilities"]["interactive_twin"] is True

        m_304 = client.get(m_url, headers={**auth_hdr, "If-None-Match": etag})
        assert m_304.status_code == 304
        # Unauthenticated request with matching ETag MUST get 401, never 304!
        m_unauth_304 = client.get(m_url, headers={"If-None-Match": etag})
        assert m_unauth_304.status_code == 401

        # CL-API-05 & CL-API-06: Blob auth isolation, HEAD, full GET, Range 206 & 416
        pdf_art = next(a for a in payload["artifacts"] if a["role"] == "manual_pdf")
        sha = pdf_art["sha256"]
        blob_url = f"/v1/catalog/blobs/{sha}"

        # Another tenant knowing exact SHA-256 is DENIED (404)
        assert client.get(blob_url, headers=other_hdr).status_code == 404
        assert client.get(blob_url).status_code == 401

        # Owner HEAD & full GET
        b_head = client.head(blob_url, headers=auth_hdr)
        assert b_head.status_code == 200
        assert int(b_head.headers["Content-Length"]) == pdf_art["byte_count"]

        b_full = client.get(blob_url, headers=auth_hdr)
        assert b_full.status_code == 200
        assert hashlib.sha256(b_full.content).hexdigest() == sha

        # Range 206
        b_part = client.get(blob_url, headers={**auth_hdr, "Range": "bytes=0-15"})
        assert b_part.status_code == 206
        assert b_part.content == b_full.content[:16]
        assert b_part.headers["Content-Range"] == f"bytes 0-15/{pdf_art['byte_count']}"

        # Unsatisfiable Range 416
        b_416 = client.get(blob_url, headers={**auth_hdr, "Range": f"bytes={pdf_art['byte_count'] + 10}-"})
        assert b_416.status_code == 416

        # M4-WAN-03: 429 RATE_LIMITED includes HTTP Retry-After header alongside JSON error body
        # First active job (ACME Sensor-9000) is already queued; fill remaining slots up to max_active_jobs=5
        for idx in range(2, 6):
            r_fill = client.post(
                "/v1/catalog/resolve",
                headers=auth_hdr,
                json={"manufacturer": "ACME", "model": f"Sensor-Fill-{idx}", "variant": None, "hardware_revision": None},
            )
            assert r_fill.status_code == 202

        r_429 = client.post(
            "/v1/catalog/resolve",
            headers=auth_hdr,
            json={"manufacturer": "ACME", "model": "Sensor-Overflow", "variant": None, "hardware_revision": None},
        )
        assert r_429.status_code == 429
        assert r_429.headers.get("Retry-After") == "5"
        assert r_429.json()["error"]["code"] == "RATE_LIMITED"


def test_device_auto_enroll_disabled_and_enabled(api_config, worker_config):
    from dataclasses import replace

    # Disabled by default -> 403 AUTO_ENROLL_DISABLED
    app_disabled = create_app(api_config)
    with TestClient(app_disabled) as client:
        r_off = client.post(
            "/v1/devices/enroll",
            json={"device_id": "ipad-m4-demo-001", "platform": "ipados", "app_version": "2.1"},
        )
        assert r_off.status_code == 403
        assert r_off.json()["error"]["code"] == "AUTO_ENROLL_DISABLED"

    # Seed fixture so enrolled device can immediately resolve & download manifest
    conn = connect_sqlite(worker_config.db_path, expected_journal_mode="DELETE")
    try:
        stage = worker_config.data_dir / "staging" / "seed_enroll"
        stage.mkdir(parents=True, exist_ok=True)
        _build_fixture_artifacts(
            conn,
            config=worker_config,
            fixture_dir=FIXTURES_DIR / "tht02_v1_1",
            staging_dir=stage,
            tenant_id="pilot",
            run_ocr=False,
        )
    finally:
        conn.close()

    cfg_on = replace(api_config, allow_device_auto_enroll=True, max_enrolled_devices=2)
    app_enabled = create_app(cfg_on)
    with TestClient(app_enabled) as client:
        r_en = client.post(
            "/v1/devices/enroll",
            json={"device_id": "ipad-m4-demo-001", "platform": "ipados", "app_version": "2.1"},
        )
        assert r_en.status_code == 200
        en = r_en.json()
        assert len(en["access_token"]) == 64
        assert en["key_id"] == "pilot-1"

        dev_hdr = {"Authorization": f"Bearer {en['access_token']}"}
        r_res = client.post(
            "/v1/catalog/resolve",
            headers=dev_hdr,
            json={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": "V1.1-RS485", "hardware_revision": "V1.1"},
        )
        assert r_res.status_code == 200
        assert r_res.json()["availability"] == "ready"
        m_resp = client.get("/v1/catalog/products/tzone_tht02/variants/v1_1_rs485/manifest", headers=dev_hdr)
        assert m_resp.status_code == 200
