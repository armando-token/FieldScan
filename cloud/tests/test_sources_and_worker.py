"""Source discovery, defensive downloader, variant ambiguity, and worker lease tests (CL-SRC-02..06)."""

from __future__ import annotations

import json

import httpx
import pytest

from fieldscan_cloud.db import (
    claim_next_job,
    connect_sqlite,
    enqueue_or_get_active_job,
    ensure_default_tenant_and_credential,
    immediate_tx,
)
from fieldscan_cloud.sources.context_client import ContextSearchClient, ContextSearchError
from fieldscan_cloud.sources.downloader import SourceDownloadError, download_allowlisted_source
from fieldscan_cloud.sources.registry import document_confirms_model, filter_artifacts_by_permission
from fieldscan_cloud.worker import process_single_job


def test_defensive_downloader_rejects_html_oversized_and_bad_redirects():
    allowed = {"www.tzonedigital.com"}

    # CL-SRC-05a: HTML login page pretending to be a PDF
    html_transport = httpx.MockTransport(
        lambda req: httpx.Response(
            200,
            headers={"content-type": "text/html"},
            content=b"<!doctype html><html><title>Login</title></html>",
        )
    )
    with pytest.raises(SourceDownloadError) as exc_html:
        download_allowlisted_source(
            "https://www.tzonedigital.com/manual.pdf",
            allowed_domains=allowed,
            expected_kind="pdf",
            transport=html_transport,
            check_dns=False,
        )
    assert exc_html.value.code == "SOURCE_HTML_PORTAL_REJECTED"

    # CL-SRC-05b: Redirect leaving allowlisted origin is blocked
    redir_transport = httpx.MockTransport(
        lambda req: httpx.Response(302, headers={"location": "https://evil.example.com/manual.pdf"})
    )
    with pytest.raises(SourceDownloadError) as exc_redir:
        download_allowlisted_source(
            "https://www.tzonedigital.com/manual.pdf",
            allowed_domains=allowed,
            expected_kind="pdf",
            transport=redir_transport,
            check_dns=False,
        )
    assert exc_redir.value.code == "SOURCE_DOMAIN_NOT_ALLOWED"

    # CL-SRC-05c: Oversized response rejected
    big_transport = httpx.MockTransport(
        lambda req: httpx.Response(200, headers={"content-type": "application/pdf"}, content=b"%PDF-1.4" + b"0" * 5000)
    )
    with pytest.raises(SourceDownloadError) as exc_big:
        download_allowlisted_source(
            "https://www.tzonedigital.com/manual.pdf",
            allowed_domains=allowed,
            expected_kind="pdf",
            max_bytes=1024,
            transport=big_transport,
            check_dns=False,
        )
    assert exc_big.value.code == "SOURCE_TOO_LARGE"

    # SSRF IPv4-mapped IPv6 loopback rejected
    with pytest.raises(SourceDownloadError) as exc_ip:
        download_allowlisted_source(
            "https://[::ffff:127.0.0.1]/manual.pdf",
            allowed_domains={"::ffff:127.0.0.1"},
            expected_kind="pdf",
            transport=big_transport,
            check_dns=True,
        )
    assert exc_ip.value.code == "SOURCE_NON_PUBLIC_IP"


def test_source_permission_policy_filtering():
    arts = [
        {"role": "manual_pdf", "path": "docs/manual.pdf"},
        {"role": "document_index", "path": "docs/index.json"},
    ]
    # CL-SRC-06: Restricted/derived_only excludes raw PDF
    f_derived, r_derived = filter_artifacts_by_permission(arts, permission_policy="derived_only")
    assert all(a["role"] != "manual_pdf" for a in f_derived)
    assert "SOURCE_RIGHTS_DERIVED_ONLY" in r_derived

    f_rest, r_rest = filter_artifacts_by_permission(arts, permission_policy="restricted")
    assert [a["role"] for a in f_rest] == ["document_index"]
    assert "SOURCE_RIGHTS_RESTRICTED" in r_rest

    # §8.2 steps 3-4 / CL-SRC-01: Do not infer applicability from generic OEM software manuals
    assert document_confirms_model(
        "Temp (RH) Management Software User Manual V1.2 for TZONE Cloud Platform",
        manufacturer="TZONE",
        model="TZ THT-03R",
    ) is False
    assert document_confirms_model(
        "TZ THT-03R Industrial RS-485 Temperature and Humidity Transmitter Manual",
        manufacturer="TZONE",
        model="TZ THT-03R",
    ) is True


def test_context_client_quota_and_rate_limit_classification():
    # CL-SRC-04: 402 quota vs 429 rate-limit
    c_402 = ContextSearchClient(
        search_url="https://api.context.dev/v1/web/search",
        api_key="test_key",
        transport=httpx.MockTransport(lambda req: httpx.Response(402, json={"error": "no credits"})),
    )
    with pytest.raises(ContextSearchError) as err402:
        c_402.search(query="TZONE THT-02 manual")
    assert err402.value.code == "CONTEXT_QUOTA_EXCEEDED"
    assert err402.value.transient is False

    c_429 = ContextSearchClient(
        search_url="https://api.context.dev/v1/web/search",
        api_key="test_key",
        transport=httpx.MockTransport(lambda req: httpx.Response(429, headers={"retry-after": "5"})),
    )
    with pytest.raises(ContextSearchError) as err429:
        c_429.search(query="TZONE THT-02 manual")
    assert err429.value.code == "CONTEXT_RATE_LIMITED"
    assert err429.value.transient is True


def test_worker_ambiguous_variant_and_partial_publication_and_lease_recovery(worker_config):
    conn = connect_sqlite(worker_config.db_path, expected_journal_mode="DELETE")
    try:
        ensure_default_tenant_and_credential(conn, tenant_id="pilot", channel="pilot")

        # CL-SRC-02: Ambiguous TZONE TZ THT-02 (no variant/rev) matches both v1_1_rs485 and v1_0_partial
        j_amb, _ = enqueue_or_get_active_job(
            conn,
            tenant_id="pilot",
            channel="pilot",
            request_payload={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": None, "hardware_revision": None},
        )
        claimed = claim_next_job(conn, lease_sec=60, max_attempts=3)
        assert claimed is not None and claimed["id"] == j_amb["id"]
        process_single_job(conn, config=worker_config, job_row=claimed)

        done_amb = conn.execute("SELECT * FROM jobs WHERE id = ?;", (j_amb["id"],)).fetchone()
        assert done_amb["state"] == "completed"
        res_amb = json.loads(done_amb["result_json"])
        assert res_amb["availability"] == "needs_identification"
        assert len(res_amb["candidates"]) == 2

        # Specifying V1.0 produces partial documentation-only publication (CL-CAD-03)
        j_part, _ = enqueue_or_get_active_job(
            conn,
            tenant_id="pilot",
            channel="pilot",
            request_payload={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": "V1.0-PARTIAL", "hardware_revision": "V1.0"},
        )
        claimed_part = claim_next_job(conn, lease_sec=60, max_attempts=3)
        process_single_job(conn, config=worker_config, job_row=claimed_part)
        done_part = conn.execute("SELECT * FROM jobs WHERE id = ?;", (j_part["id"],)).fetchone()
        res_part = json.loads(done_part["result_json"])
        assert res_part["availability"] == "partial"
        assert res_part["capabilities"]["documentation"] == "available"
        assert res_part["capabilities"]["interactive_twin"] == "unavailable"
        assert "INTERNAL_GEOMETRY_UNCONFIRMED" in res_part["reason_codes"]

        # Lease expiration recovery (CL-HOST-04): simulate crashed worker with expired lease
        j_rec, _ = enqueue_or_get_active_job(
            conn,
            tenant_id="pilot",
            channel="pilot",
            request_payload={"manufacturer": "TZONE", "model": "TZ THT-02", "variant": "V1.1-RS485", "hardware_revision": "V1.1"},
        )
        c1 = claim_next_job(conn, lease_sec=60, max_attempts=3)
        assert c1["attempts"] == 1
        # Force lease expiration
        with immediate_tx(conn):
            conn.execute("UPDATE jobs SET lease_until = 1 WHERE id = ?;", (j_rec["id"],))
        c2 = claim_next_job(conn, lease_sec=60, max_attempts=3)
        assert c2 is not None and c2["id"] == j_rec["id"] and c2["attempts"] == 2
        assert c2["lease_token"] != c1["lease_token"]
    finally:
        conn.close()
