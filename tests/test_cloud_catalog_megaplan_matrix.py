"""Complete 42-Case Verification Matrix (`M4-BASE-01` .. `M4-END-01`) for Cloud Catalog Integration.

Validates every acceptance criterion in Section 7 of the iPad Air M4 Cloud Integration Megaplan:
- `M4-BASE-01..03`: Offline boot (`0` WAN requests), baseline audit parity, and dual-mode truthful telemetry.
- `M4-ID-01..03`: Strict asset matching (no unconditional THT-02 fallback), variant disambiguation, and session pinning.
- `M4-WAN-01..06`: HTTPS Cloud client (`200`, `202`, `304` ETag, `401/403`, `429`, `5xx`), job dedup, redirect guard,
  mid-download sync cancellation, truncated blob rejection, and zero secret/evidence leakage.
- `M4-PKG-01..09`: Ed25519 envelope verification, duplicate-key block, semantic checks, crash recovery, concurrency,
  anti-rollback (`publication_seq`), disk/size budgets, partial packages, and bounded `.zip` / path security.
- `M4-DOC-01..03`: 12+ page multi-document citations, printed vs physical page numbers, PDF fallback, and XSS sanitization.
- `M4-3D-01..05`: Binary `.glb` inspector, node/part validation, Byte-Range (`206`/`416`/`HEAD`), scene fencing,
  meter-to-140x16mm correspondence, and `.DXF`/`.STL` export guard (`409 CAD_EXPORT_UNSUPPORTED_FOR_GLB`).
- `M4-VOICE-01..04`: `twin_action_v1` turn fencing, barge-in stale turn rejection, `"pin one"` ambiguity clarification,
  and deterministic offline fallback when VLM is unavailable.
- `M4-CAM-01`: Camera `detector_applicability` and `evidence_state` (`observed`, `uncertain_occluded`, `manual_confirmation_required`).
- `M4-BUS-01..03`: Strict isolation between visual DIP simulation and authorized Modbus target slave + homologation gate.
- `M4-SESSION-01..03` & `M4-REVOKE-01`: Mid-session package pinning, `"Historical source unavailable"`, provenance dossier
  export, and `409 INSTRUCTION_REVOKED` safety block.
- `M4-END-01`: End-to-end journey from HTTPS resolve/download -> WAN cut -> local reload -> voice focus -> dossier export.
"""

from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import shutil
import stat
import zipfile

from fastapi.testclient import TestClient
import httpx
import pymupdf
import pytest

from fieldscan import server as srv
from fieldscan.catalog_client import FieldScanCatalogClient
from fieldscan.catalog_store import (
    CatalogDomainError,
    DEMO_FIXTURE_PUBLIC_KEY_32,
    FieldScanPackageStore,
    build_reference_sensor_glb,
    create_signed_manifest_envelope,
    ed25519_public_key_from_seed,
    ed25519_sign,
    inspect_glb_binary,
    sanitize_reference_text,
    sha256_bytes,
    verify_and_decode_manifest_envelope,
    write_reference_signed_package_fixture,
)
from fieldscan.lfm_engine import LFMEngine
from fieldscan.manual_navigator import lookup_manual_in_descriptor
from fieldscan.modbus_tcp import ModbusTCPClient, start_mbap_test_gateway
from fieldscan.offline_guard import GLOBAL_OFFLINE_GUARD, set_authorized_cloud_catalog_host
from fieldscan.profiles_and_manual import verify_resource_manifest
from fieldscan.session_engine import FieldScanSessionEngine, SessionDomainError
from fieldscan.twin_controller import prepare_visual_action

REPO_ROOT = Path(__file__).resolve().parent.parent
FIXTURE_DIR = REPO_ROOT / "knowledge" / "fixtures" / "cloud_catalog_v1"
REF_FULL_ZIP = FIXTURE_DIR / "reference_full_m12_seq10.zip"
REF_PARTIAL_ZIP = FIXTURE_DIR / "reference_partial_no3d_seq10.zip"


@pytest.fixture()
def isolated_server_catalog(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Isolate `fieldscan.server` catalog store, cloud client, and session DB per test with clean teardown."""
    cat_root = tmp_path / "catalog_store"
    store = FieldScanPackageStore(catalog_root=cat_root, bundle_root=REPO_ROOT)
    client = FieldScanCatalogClient(store, sync_enabled=False)
    sessions = FieldScanSessionEngine(
        db_path=tmp_path / "sessions.sqlite3",
        exports_dir=tmp_path / "exports",
        catalog_store=store,
    )
    orig_target = srv._MODBUS.target_slave_id
    orig_vis = srv._SIMULATED_VISUAL_DIP_ADDRESS
    monkeypatch.setattr(srv, "_CATALOG_STORE", store)
    monkeypatch.setattr(srv, "_CATALOG_CLIENT", client)
    monkeypatch.setattr(srv, "_SESSIONS", sessions)
    srv._MODBUS.set_target_slave(1)
    srv._SIMULATED_VISUAL_DIP_ADDRESS = 1
    set_authorized_cloud_catalog_host(None)
    try:
        yield {"store": store, "client": client, "sessions": sessions, "tmp_path": tmp_path}
    finally:
        set_authorized_cloud_catalog_host(None)
        srv._MODBUS.set_target_slave(orig_target)
        srv._SIMULATED_VISUAL_DIP_ADDRESS = orig_vis


def _build_mock_cloud_transport(
    pkg_dir: Path,
    *,
    product_id: str = "tzone_tht02",
    variant_id: str = "m12_4pin_rev2",
    etag: str = '"rev-seq-10"',
    captured_requests: list[httpx.Request] | None = None,
    mode: str = "normal",
    client_to_disable_mid_blob: FieldScanCatalogClient | None = None,
) -> httpx.MockTransport:
    env_bytes = (pkg_dir / "manifest.envelope.json").read_bytes()
    manifest, _, _ = verify_and_decode_manifest_envelope(env_bytes)
    blobs: dict[str, bytes] = {
        a["sha256"]: (pkg_dir / a["path"]).read_bytes() for a in manifest["artifacts"]
    }
    poll_calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        if captured_requests is not None:
            captured_requests.append(request)
        path = request.url.path

        if mode == "redirect_cross_origin":
            return httpx.Response(302, headers={"Location": "https://evil-attacker.invalid/steal"})
        if mode == "401":
            return httpx.Response(401, json={"error": "unauthorized"})
        if mode == "403":
            return httpx.Response(403, json={"error": "forbidden"})
        if mode == "429":
            return httpx.Response(429, headers={"Retry-After": "9"}, json={"error": "rate_limited"})
        if mode == "503":
            return httpx.Response(503, json={"error": "service_unavailable"})

        if path == "/healthz":
            return httpx.Response(200, json={"status": "ok"})

        if path == "/v1/catalog/resolve":
            body = json.loads(request.content.decode("utf-8"))
            if body.get("model") == "CACHED-FAST":
                return httpx.Response(
                    200,
                    json={
                        "job_state": "ready",
                        "availability": "complete",
                        "product_id": product_id,
                        "variant_id": variant_id,
                    },
                )
            return httpx.Response(
                202,
                json={"job_id": "job-cloud-101", "job_state": "queued", "availability": "pending"},
            )

        if path == "/v1/jobs/job-cloud-101":
            poll_calls["n"] += 1
            if poll_calls["n"] == 1 and mode == "two_step_poll":
                return httpx.Response(
                    200,
                    json={"job_id": "job-cloud-101", "job_state": "running", "availability": "pending"},
                )
            return httpx.Response(
                200,
                json={
                    "job_id": "job-cloud-101",
                    "job_state": "ready",
                    "availability": "complete",
                    "product_id": product_id,
                    "variant_id": variant_id,
                },
            )

        if path.endswith("/manifest"):
            if request.headers.get("If-None-Match") == etag:
                return httpx.Response(304, headers={"ETag": etag})
            return httpx.Response(
                200,
                content=env_bytes,
                headers={"ETag": etag, "Content-Type": "application/json"},
            )

        if "/v1/catalog/blobs/" in path:
            sha = path.rsplit("/", 1)[-1]
            raw = blobs.get(sha)
            if raw is None:
                return httpx.Response(404, json={"error": "missing_blob"})
            if client_to_disable_mid_blob is not None:
                client_to_disable_mid_blob.set_sync_enabled(False)
            if mode == "truncate_blob":
                return httpx.Response(200, content=raw[: max(1, len(raw) // 2)])
            return httpx.Response(200, content=raw)

        return httpx.Response(404, json={"error": "not_found"})

    return httpx.MockTransport(handler)


# ==============================================================================
# 1. BASELINE & DUAL-MODE TELEMETRY (`M4-BASE-01..03`)
# ==============================================================================


def test_m4_base_01_launch_offline_zero_wan_requests(isolated_server_catalog) -> None:
    with TestClient(srv.app) as http:
        st = http.get("/api/status").json()
        cat_st = http.get("/api/catalog/status").json()
        off = http.get("/api/offline/verify").json()

    assert cat_st["sync"]["sync_enabled"] is False
    assert cat_st["sync"]["https_requests_emitted"] == 0
    assert cat_st["sync"]["egress_policy"] == "strict_local_only"
    assert st["offline_verified"] is True
    assert off["offline_verified"] is True
    assert cat_st["selected_context"]["content_origin"] == "bundle"
    assert cat_st["selected_context"]["product_id"] == "tzone_tht02"


def test_m4_base_02_manifest_audit_and_swift_python_baseline() -> None:
    res = verify_resource_manifest()
    assert res["verified"] is True and res["mismatches"] == []
    assert REF_FULL_ZIP.is_file() and REF_PARTIAL_ZIP.is_file()


def test_m4_base_03_mac_assisted_and_bundled_offline_modes(isolated_server_catalog) -> None:
    with TestClient(srv.app) as http:
        off_local = http.get("/api/offline/verify").json()
        assert off_local["offline_verified"] is True
        assert off_local["egress_policy"] == "strict_local_only"
        assert "local_listener_scope" in off_local

        # Enabling HTTPS Cloud Sync flips `offline_verified` truthfully (`Section 2.4`, `M4-BASE-03`)
        cfg = http.post(
            "/api/catalog/sync_config",
            json={"base_url": "https://catalog.fieldscan.internal", "sync_enabled": True},
        )
        assert cfg.status_code == 200
        off_cloud = http.get("/api/offline/verify").json()
        assert off_cloud["offline_verified"] is False
        assert off_cloud["egress_policy"] == "catalog_https_authorized"
        assert off_cloud["catalog_sync"]["sync_enabled"] is True


# ==============================================================================
# 2. ASSET IDENTITY, AMBIGUITY & SESSION PINNING (`M4-ID-01..03`)
# ==============================================================================


def test_m4_id_01_exact_alias_unknown_variant_and_foreign_model(isolated_server_catalog) -> None:
    with TestClient(srv.app) as http:
        r_exact = http.post("/api/sensor/load", json={"query": "TZ THT-02"})
        assert r_exact.status_code == 200
        j_exact = r_exact.json()
        assert j_exact["matched"] is True and j_exact["sensor_id"] == "TZ-THT-02"

        r_foreign = http.post("/api/sensor/load", json={"query": "Siemens QFA2060 Duct Hygrometer"})
        assert r_foreign.status_code == 200
        j_foreign = r_foreign.json()
        assert j_foreign["matched"] is False
        assert j_foreign["sensor_id"] is None
        assert j_foreign["spec"] is None
        assert j_foreign["resolution"] == "unknown"

        r_spec_foreign = http.get("/api/spec?query=Honeywell%20H7080B")
        assert r_spec_foreign.status_code == 200
        assert r_spec_foreign.json()["matched"] is False
        assert r_spec_foreign.json()["sensor_id"] is None


def test_m4_id_02_two_plausible_variants_discriminant_without_mutating_open_session(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    sessions: FieldScanSessionEngine = isolated_server_catalog["sessions"]
    tmp: Path = isolated_server_catalog["tmp_path"]

    # Open an existing session pinned to bundled THT-02 first
    s_open = sessions.create_session({"profile_id": "tzone_tht02", "serial_number": "SN-BUNDLE-1"})
    open_sid = s_open["session_id"]

    # Install two distinct hardware connector variants sharing alias `"THT-200X"`
    write_reference_signed_package_fixture(
        tmp / "v_m12",
        variant_id="tht200x_m12",
        publication_seq=1,
        connector_type="m12_4pin",
        extra_aliases=["tht-200x"],
    )
    write_reference_signed_package_fixture(
        tmp / "v_pigtail",
        variant_id="tht200x_pigtail",
        publication_seq=1,
        connector_type="pigtail_4wire",
        extra_aliases=["tht-200x"],
    )
    store.import_package_from_path(tmp / "v_m12")
    store.import_package_from_path(tmp / "v_pigtail")

    amb = store.resolve_asset_query("THT-200X")
    assert amb["matched"] is False
    assert amb["resolution"] == "ambiguous"
    assert amb["identity_status"] == "identify_variant"
    assert len(amb["candidates"]) == 2
    assert {c["connector_type"] for c in amb["candidates"]} == {"m12_4pin", "pigtail_4wire"}

    # Open session context must remain untouched!
    s_after = sessions.get_session(open_sid)
    assert s_after["catalog_context"]["content_origin"] == "bundle"
    assert s_after["catalog_context"]["variant_id"] == "bundled_v1_1"


def test_m4_id_03_create_session_for_selected_variant_and_preserve_bundle(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    sessions: FieldScanSessionEngine = isolated_server_catalog["sessions"]

    pkg = store.import_package_from_path(REF_FULL_ZIP)
    msha = pkg["manifest_sha256"]
    sel_ctx = store.select_context_for_next_session(msha)

    s_cat = sessions.create_session({"catalog_context": sel_ctx, "serial_number": "SN-M12-88"})
    assert s_cat["catalog_context"]["manifest_sha256"] == msha
    assert s_cat["catalog_context"]["variant_id"] == "m12_4pin_rev2"
    assert s_cat["catalog_context"]["content_origin"] == "catalog"

    exp = sessions.export_session_dossier(s_cat["session_id"], {"audience": "private_bench"})
    djson = json.loads(Path(exp["json_path"]).read_text(encoding="utf-8"))
    assert djson["catalog_context"]["manifest_sha256"] == msha

    # Bundled session creation continues working cleanly alongside catalog sessions
    s_bnd = sessions.create_session({"profile_id": "tzone_tht02", "serial_number": "SN-BND-01"})
    assert s_bnd["profile_id"] == "tzone_tht02"
    assert s_bnd["catalog_context"]["content_origin"] == "bundle"


# ==============================================================================
# 3. HTTPS CLOUD CLIENT, POLLING, ETAG, REDIRECTS & PRIVACY (`M4-WAN-01..06`)
# ==============================================================================


def test_m4_wan_01_resolve_cached_200_and_async_202_job(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]

    write_reference_signed_package_fixture(tmp / "cloud_pkg", variant_id="m12_4pin_rev2", publication_seq=10)
    transport = _build_mock_cloud_transport(tmp / "cloud_pkg", mode="two_step_poll")
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True, auth_token="tok-secret-1")

    fast = client.resolve_catalog(manufacturer="TZONE", model="CACHED-FAST", transport=transport)
    assert fast["job_state"] == "ready" and fast["availability"] == "complete"

    queued = client.resolve_catalog(manufacturer="TZONE", model="THT-02-M12", transport=transport)
    assert queued["job_id"] == "job-cloud-101" and queued["job_state"] == "queued"

    p1 = client.poll_job("job-cloud-101", transport=transport)
    assert p1["job_state"] == "running"
    p2 = client.poll_job("job-cloud-101", transport=transport)
    assert p2["job_state"] == "ready" and p2["availability"] == "complete"

    inst = client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=transport)
    assert inst["ok"] is True and inst["status"] == "installed"
    assert len(store.list_installed_packages()) == 1


def test_m4_wan_02_deduplicate_job_and_fence_stale_ui_attempt(isolated_server_catalog) -> None:
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]
    write_reference_signed_package_fixture(tmp / "cloud_pkg", variant_id="m12_4pin_rev2", publication_seq=10)
    reqs: list[httpx.Request] = []
    transport = _build_mock_cloud_transport(tmp / "cloud_pkg", captured_requests=reqs)
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True)

    j1 = client.resolve_catalog(manufacturer="TZONE", model="THT-02", variant="m12", transport=transport)
    j2 = client.resolve_catalog(manufacturer="tzone", model="tht-02", variant="M12", transport=transport)
    assert j1["job_id"] == j2["job_id"]
    assert j2["reused_existing_job"] is True
    assert len(reqs) == 1, "Duplicate resolve for same active identity must reuse in-flight job without extra POST"

    # Subsequent lookup advances ui_attempt_id so UI ignores older j1/j2 completion
    j3 = client.resolve_catalog(manufacturer="TZONE", model="CACHED-FAST", transport=transport)
    assert j3["ui_attempt_id"] > j2["ui_attempt_id"]


def test_m4_wan_03_http_304_401_403_429_and_5xx_preserving_cache(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]
    meta = write_reference_signed_package_fixture(tmp / "cloud_pkg", variant_id="m12_4pin_rev2", publication_seq=10)

    t_ok = _build_mock_cloud_transport(tmp / "cloud_pkg", etag='"etag-v10"')
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True, auth_token="valid-token")
    r_first = client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=t_ok)
    assert r_first["status"] == "installed"

    # Second fetch sends If-None-Match and receives HTTP 304 without re-downloading blobs
    r_304 = client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=t_ok)
    assert r_304["status"] == "not_modified_304"
    assert r_304["package"]["manifest_sha256"] == meta["manifest_sha256"]

    for mode, exp_code in (
        ("401", "HTTP_UNAUTHORIZED"),
        ("403", "HTTP_UNAUTHORIZED"),
        ("429", "HTTP_RATE_LIMITED"),
        ("503", "HTTP_SERVER_ERROR"),
    ):
        t_err = _build_mock_cloud_transport(tmp / "cloud_pkg", mode=mode)
        with pytest.raises(CatalogDomainError) as exc:
            client.resolve_catalog(manufacturer="TZONE", model=f"TEST-{mode}", transport=t_err)
        assert exc.value.code == exp_code
        if mode == "429":
            assert getattr(exc.value, "retry_after_s", 0) == 9

    # Cached local package remains 100% intact after all HTTP errors
    assert store.get_installed_package(meta["manifest_sha256"])["publication_seq"] == 10


def test_m4_wan_04_block_cross_origin_redirect_and_cancel_on_sync_disable(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]
    write_reference_signed_package_fixture(tmp / "cloud_pkg", variant_id="m12_4pin_rev2", publication_seq=10)
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True)

    # 1. Cross-origin 302 redirect blocked
    t_redir = _build_mock_cloud_transport(tmp / "cloud_pkg", mode="redirect_cross_origin")
    with pytest.raises(CatalogDomainError) as r_exc:
        client.resolve_catalog(manufacturer="TZONE", model="THT-02", transport=t_redir)
    assert r_exc.value.code == "REDIRECT_BLOCKED"

    # 2. Disabling sync mid-download cancels installation and preserves clean store
    t_cancel = _build_mock_cloud_transport(tmp / "cloud_pkg", client_to_disable_mid_blob=client)
    with pytest.raises(CatalogDomainError) as c_exc:
        client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=t_cancel)
    assert c_exc.value.code in ("DOWNLOAD_CANCELLED", "SYNC_DISABLED")
    assert store.list_installed_packages() == []


def test_m4_wan_05_truncated_blob_rejected_and_reload_succeeds(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]
    v10 = write_reference_signed_package_fixture(tmp / "v10", variant_id="m12_4pin_rev2", publication_seq=10)
    store.import_package_from_path(tmp / "v10")

    v11 = write_reference_signed_package_fixture(tmp / "v11", variant_id="m12_4pin_rev2", publication_seq=11)
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True)

    t_trunc = _build_mock_cloud_transport(tmp / "v11", etag='"etag-v11"', mode="truncate_blob")
    with pytest.raises(CatalogDomainError) as exc:
        client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=t_trunc)
    assert exc.value.code in ("BLOB_TRUNCATED", "BLOB_HASH_MISMATCH")

    # Active installation remains seq 10, zero truncated files in store
    active = [p for p in store.list_installed_packages() if p["is_active_for_variant"]]
    assert len(active) == 1 and active[0]["manifest_sha256"] == v10["manifest_sha256"]

    # Retry over healthy network installs seq 11 cleanly
    t_ok = _build_mock_cloud_transport(tmp / "v11", etag='"etag-v11"')
    res_ok = client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=t_ok)
    assert res_ok["package"]["manifest_sha256"] == v11["manifest_sha256"]


def test_m4_wan_06_authorized_egress_only_and_zero_secret_or_evidence_leak(isolated_server_catalog) -> None:
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]
    write_reference_signed_package_fixture(tmp / "cloud_pkg", variant_id="m12_4pin_rev2", publication_seq=10)
    reqs: list[httpx.Request] = []
    transport = _build_mock_cloud_transport(tmp / "cloud_pkg", captured_requests=reqs)

    secret_token = "SUPER_SECRET_BEARER_TOKEN_9988"
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True, auth_token=secret_token)
    client.resolve_catalog(manufacturer="TZONE", model="THT-02", variant="m12", transport=transport)

    # Outbound request body contains ONLY minimal asset identity (never serials, photos, or bench IPs)
    sent_json = json.loads(reqs[0].content.decode("utf-8"))
    assert set(sent_json.keys()) == {"manufacturer", "model", "variant", "hardware_revision"}

    # Sync telemetry never exposes raw bearer token
    tel_dump = json.dumps(client.get_sync_telemetry())
    assert secret_token not in tel_dump
    assert client.get_sync_telemetry()["has_credentials"] is True

    # Arbitrary WAN IPs (e.g. 8.8.8.8) remain blocked by OfflineSocketGuard even while catalog sync is enabled
    guard_report = GLOBAL_OFFLINE_GUARD.self_test()
    assert guard_report["external_egress_blocked"] is True


# ==============================================================================
# 4. SIGNED PACKAGE STORE, TAMPERING, ROLLBACK & RECOVERY (`M4-PKG-01..09`)
# ==============================================================================


def test_m4_pkg_01_import_signed_fixture_offline_from_files(isolated_server_catalog) -> None:
    with TestClient(srv.app) as http:
        with REF_FULL_ZIP.open("rb") as fh:
            resp = http.post(
                "/api/catalog/import",
                files={"file": ("reference_full_m12_seq10.zip", fh.read(), "application/zip")},
            )
        assert resp.status_code == 200
        pkg = resp.json()["package"]
        assert pkg["product_id"] == "tzone_tht02"
        assert pkg["variant_id"] == "m12_4pin_rev2"
        assert pkg["publication_seq"] == 10
        assert pkg["capabilities"] == {"documentation": True, "interactive_twin": True, "procedures": True}


def test_m4_pkg_02_tampered_manifest_signature_key_id_and_pdf_hash_rejected(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    base_pkg = store.import_package_from_path(REF_FULL_ZIP)
    active_sha = base_pkg["manifest_sha256"]

    pkg_dir = tmp_path / "tamper"
    write_reference_signed_package_fixture(pkg_dir, variant_id="m12_4pin_rev2", publication_seq=11)
    env = json.loads((pkg_dir / "manifest.envelope.json").read_text(encoding="utf-8"))

    # 2a. Tamper payload_b64 without re-signing
    raw_payload = bytearray(base64.b64decode(env["payload_b64"]))
    raw_payload[-3] ^= 0x01
    bad_env_payload = dict(env, payload_b64=base64.b64encode(bytes(raw_payload)).decode("ascii"))
    with pytest.raises(CatalogDomainError) as e1:
        verify_and_decode_manifest_envelope(json.dumps(bad_env_payload).encode("utf-8"))
    assert e1.value.code == "INVALID_SIGNATURE"

    # 2b. Tamper signature_b64
    sig_bytes = bytearray(base64.b64decode(env["signature_b64"]))
    sig_bytes[0] ^= 0xFF
    bad_env_sig = dict(env, signature_b64=base64.b64encode(bytes(sig_bytes)).decode("ascii"))
    with pytest.raises(CatalogDomainError) as e2:
        verify_and_decode_manifest_envelope(json.dumps(bad_env_sig).encode("utf-8"))
    assert e2.value.code == "INVALID_SIGNATURE"

    # 2c. Untrusted key_id
    bad_env_key = dict(env, key_id="unknown-prod-key-99")
    with pytest.raises(CatalogDomainError) as e3:
        verify_and_decode_manifest_envelope(json.dumps(bad_env_key).encode("utf-8"))
    assert e3.value.code == "UNTRUSTED_KEY_ID"

    # 2d. Tamper PDF bytes on disk after signing
    pdf_file = pkg_dir / "docs" / "manual_12p.pdf"
    pdf_file.write_bytes(pdf_file.read_bytes()[:-4] + b"XXXX")
    with pytest.raises(CatalogDomainError) as e4:
        store.import_package_from_path(pkg_dir)
    assert e4.value.code == "BLOB_HASH_MISMATCH"

    # Active manifest unchanged
    active = [p for p in store.list_installed_packages() if p["is_active_for_variant"]]
    assert len(active) == 1 and active[0]["manifest_sha256"] == active_sha


def test_m4_pkg_03_unexpected_incomplete_duplicate_key_and_invalid_role_rejected(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)

    # 3a. Duplicate JSON keys inside signed payload (`{"schema_version": 1, "schema_version": 1, ...}`)
    dup_raw = b'{"schema_version":1,"schema_version":1,"interaction_version":1,"key_id":"demo-1"}'
    seed = hashlib.sha256(b"fieldscan-demo-fixture-key-v1-not-for-production").digest()
    dup_env = {
        "key_id": "demo-1",
        "payload_b64": base64.b64encode(dup_raw).decode("ascii"),
        "signature_b64": base64.b64encode(ed25519_sign(seed, dup_raw)).decode("ascii"),
    }
    with pytest.raises(CatalogDomainError) as e_dup:
        verify_and_decode_manifest_envelope(json.dumps(dup_env).encode("utf-8"))
    assert e_dup.value.code == "DUPLICATE_JSON_KEYS"

    # 3b. Unexpected extra blob passed to install_verified_package
    pkg_dir = tmp_path / "valid_src"
    write_reference_signed_package_fixture(pkg_dir, variant_id="m12_4pin_rev2", publication_seq=10)
    env_bytes = (pkg_dir / "manifest.envelope.json").read_bytes()
    manifest, _, _ = verify_and_decode_manifest_envelope(env_bytes)
    blobs = {a["sha256"]: pkg_dir / a["path"] for a in manifest["artifacts"]}
    extra_f = tmp_path / "unexpected.bin"
    extra_f.write_bytes(b"rogue")
    blobs[sha256_bytes(b"rogue")] = extra_f
    with pytest.raises(CatalogDomainError) as e_unexp:
        store.install_verified_package(env_bytes, blobs)
    assert e_unexp.value.code == "SEMANTIC_REFERENCE_BROKEN"

    # 3c. Missing blob (incomplete)
    incomplete_blobs = dict(list(blobs.items())[:2])
    with pytest.raises(CatalogDomainError):
        store.install_verified_package(env_bytes, incomplete_blobs)

    # 3d. Invalid artifact role rejected
    bad_role_manifest = dict(manifest)
    bad_role_manifest["artifacts"] = [dict(manifest["artifacts"][0], role="arbitrary_binary_plugin")]
    bad_env = create_signed_manifest_envelope(bad_role_manifest)
    with pytest.raises(CatalogDomainError):
        verify_and_decode_manifest_envelope(json.dumps(bad_env).encode("utf-8"))

    # Zero staging files served or leaked
    assert list(store.staging_dir.iterdir()) == []


def test_m4_pkg_04_crash_recovery_before_and_after_move_consistent(tmp_path: Path) -> None:
    cat_root = tmp_path / "store"
    store = FieldScanPackageStore(catalog_root=cat_root, bundle_root=REPO_ROOT)
    v10 = store.import_package_from_path(REF_FULL_ZIP)

    # Simulate crash after moving `packages/<sha>` into place but BEFORE SQLite commit
    v11_dir = tmp_path / "v11"
    v11_meta = write_reference_signed_package_fixture(v11_dir, variant_id="m12_4pin_rev2", publication_seq=11)
    env11 = (v11_dir / "manifest.envelope.json").read_bytes()
    man11, _, _ = verify_and_decode_manifest_envelope(env11)
    blobs11 = {a["sha256"]: v11_dir / a["path"] for a in man11["artifacts"]}

    # Also leave a leftover orphan directory in `staging/`
    (store.staging_dir / "orphan_crash_dir").mkdir(parents=True, exist_ok=True)

    with pytest.raises(RuntimeError):
        store.install_verified_package(env11, blobs11, simulate_crash_before_db_commit=True)

    # Reboot store -> `recover_on_boot` cleans `staging/` and quarantines uncommitted `v11` dir!
    rebooted = FieldScanPackageStore(catalog_root=cat_root, bundle_root=REPO_ROOT)
    assert list(rebooted.staging_dir.iterdir()) == []
    assert not (rebooted.packages_dir / v11_meta["manifest_sha256"]).exists()
    pkgs = rebooted.list_installed_packages()
    assert len(pkgs) == 1 and pkgs[0]["manifest_sha256"] == v10["manifest_sha256"]


def test_m4_pkg_05_concurrent_two_revisions_publishes_newest_seq(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    d10 = tmp_path / "seq10"
    d12 = tmp_path / "seq12"
    write_reference_signed_package_fixture(d10, variant_id="m12_4pin_rev2", publication_seq=10)
    m12 = write_reference_signed_package_fixture(d12, variant_id="m12_4pin_rev2", publication_seq=12)

    def _imp(path: Path):
        try:
            return store.import_package_from_path(path)
        except CatalogDomainError as err:
            return {"error_code": err.code}

    with ThreadPoolExecutor(max_workers=2) as pool:
        f1 = pool.submit(_imp, d10)
        f2 = pool.submit(_imp, d12)
        _ = (f1.result(), f2.result())

    active = [p for p in store.list_installed_packages() if p["is_active_for_variant"]]
    assert len(active) == 1
    assert active[0]["publication_seq"] == 12
    assert active[0]["manifest_sha256"] == m12["manifest_sha256"]


def test_m4_pkg_06_anti_rollback_blocks_older_seq_and_allows_higher_seq_revert(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    store.import_package_from_path(REF_FULL_ZIP)  # seq 10

    # Attempt to install seq 9 -> ROLLBACK_BLOCKED
    d9 = tmp_path / "seq9"
    write_reference_signed_package_fixture(d9, variant_id="m12_4pin_rev2", publication_seq=9)
    with pytest.raises(CatalogDomainError) as rb_err:
        store.import_package_from_path(d9)
    assert rb_err.value.code == "ROLLBACK_BLOCKED"

    # Legitimate content revert published with higher sequence number (`seq 11 > 10`) succeeds!
    d11 = tmp_path / "seq11_revert"
    m11 = write_reference_signed_package_fixture(d11, variant_id="m12_4pin_rev2", publication_seq=11)
    inst11 = store.import_package_from_path(d11)
    assert inst11["publication_seq"] == 11 and inst11["manifest_sha256"] == m11["manifest_sha256"]


def test_m4_pkg_07_disk_full_and_budget_exceeded_preserve_active_install(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    v10 = store.import_package_from_path(REF_FULL_ZIP)

    # 7a. Disk full check
    d11 = tmp_path / "seq11"
    write_reference_signed_package_fixture(d11, variant_id="m12_4pin_rev2", publication_seq=11)
    store.min_free_bytes = 10**18
    with pytest.raises(CatalogDomainError) as df_err:
        store.import_package_from_path(d11)
    assert df_err.value.code == "DISK_FULL"
    store.min_free_bytes = 4 * 1024 * 1024

    # 7b. Artifact exceeding 50 MB single-object budget rejected at manifest verification
    env11 = json.loads((d11 / "manifest.envelope.json").read_text(encoding="utf-8"))
    man11 = json.loads(base64.b64decode(env11["payload_b64"]).decode("utf-8"))
    man11["artifacts"][0]["byte_count"] = 60 * 1024 * 1024
    huge_env = create_signed_manifest_envelope(man11)
    with pytest.raises(CatalogDomainError) as bg_err:
        verify_and_decode_manifest_envelope(json.dumps(huge_env).encode("utf-8"))
    assert bg_err.value.code == "SIZE_BUDGET_EXCEEDED"

    assert list(store.staging_dir.iterdir()) == []
    assert store.get_installed_package(v10["manifest_sha256"])["publication_seq"] == 10


def test_m4_pkg_08_partial_package_accepted_and_broken_complete_package_rejected(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)

    # Partial package (`interactive_twin = false`) installs and declares `docs_only_no_3d`
    part_pkg = store.import_package_from_path(REF_PARTIAL_ZIP)
    assert part_pkg["capabilities"]["documentation"] is True
    assert part_pkg["capabilities"]["interactive_twin"] is False
    desc = store.build_scene_and_manual_descriptor(store.select_context_for_next_session(part_pkg["manifest_sha256"]))
    assert desc["scene_origin"] == "docs_only_no_3d"
    assert desc["twin"] is None

    # Complete package claiming `interactive_twin = true` without `twin.actions.json` is rejected!
    d_bad = tmp_path / "broken_full"
    write_reference_signed_package_fixture(d_bad, variant_id="broken_v1", publication_seq=1, include_twin=True)
    env = json.loads((d_bad / "manifest.envelope.json").read_text(encoding="utf-8"))
    man = json.loads(base64.b64decode(env["payload_b64"]).decode("utf-8"))
    man["artifacts"] = [a for a in man["artifacts"] if a["role"] != "twin_actions"]
    bad_env = create_signed_manifest_envelope(man)
    with pytest.raises(CatalogDomainError) as dep_err:
        verify_and_decode_manifest_envelope(json.dumps(bad_env).encode("utf-8"))
    assert dep_err.value.code == "MISSING_CAPABILITY_DEPENDENCY"


def test_m4_pkg_09_archive_entry_limit_path_traversal_symlink_and_exec_rejected(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)

    # 9a. Path traversal `../outside.txt` in ZIP
    z_trav = tmp_path / "traversal.zip"
    with zipfile.ZipFile(z_trav, "w") as zf:
        zf.writestr("../outside.txt", b"escape")
    with pytest.raises(CatalogDomainError) as e_trav:
        store.import_package_from_path(z_trav)
    assert e_trav.value.code == "EXECUTABLE_OR_UNSAFE_PATH"
    assert not (tmp_path / "outside.txt").exists()

    # 9b. Executable `.sh` script inside ZIP
    z_exec = tmp_path / "exec.zip"
    with zipfile.ZipFile(z_exec, "w") as zf:
        zf.writestr("scripts/postinstall.sh", b"#!/bin/sh\necho pwn")
    with pytest.raises(CatalogDomainError) as e_exec:
        store.import_package_from_path(z_exec)
    assert e_exec.value.code == "EXECUTABLE_OR_UNSAFE_PATH"

    # 9c. Symlink entry inside ZIP
    z_sym = tmp_path / "symlink.zip"
    with zipfile.ZipFile(z_sym, "w") as zf:
        zi = zipfile.ZipInfo("docs/link.pdf")
        zi.create_system = 3
        zi.external_attr = (stat.S_IFLNK | 0o777) << 16
        zf.writestr(zi, b"/etc/passwd")
    with pytest.raises(CatalogDomainError) as e_sym:
        store.import_package_from_path(z_sym)
    assert e_sym.value.code == "EXECUTABLE_OR_UNSAFE_PATH"

    # 9d. Excessive archive member count (> 72 entries)
    z_many = tmp_path / "too_many.zip"
    with zipfile.ZipFile(z_many, "w") as zf:
        for i in range(80):
            zf.writestr(f"docs/f_{i}.png", b"x")
    with pytest.raises(CatalogDomainError) as e_many:
        store.import_package_from_path(z_many)
    assert e_many.value.code == "ARCHIVE_LIMIT_EXCEEDED"

    # 9e. Direct HTTP path import outside authorized fixture/staging directories blocked with 403 UNTRUSTED_IMPORT_PATH
    with TestClient(srv.app) as http:
        r_untrusted = http.post("/api/catalog/import", json={"path": "/etc/passwd"})
        assert r_untrusted.status_code == 403
        assert r_untrusted.json()["error_code"] == "UNTRUSTED_IMPORT_PATH"


# ==============================================================================
# 5. MULTI-DOCUMENT 12+ PAGE MANUALS & SANITIZATION (`M4-DOC-01..03`)
# ==============================================================================


def test_m4_doc_01_twelve_page_manual_and_two_docs_same_page_numbers(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    pkg = store.import_package_from_path(REF_FULL_ZIP)
    desc = store.build_scene_and_manual_descriptor(store.select_context_for_next_session(pkg["manifest_sha256"]))

    assert len(desc["documents"]) == 2
    assert desc["documents"][0]["page_count"] == 12
    assert desc["documents"][1]["page_count"] == 4

    # Page 12 lookup in Document 1 (`fixture_manual_12p`)
    hit_p12 = lookup_manual_in_descriptor("Show extended calibration drift appendix", desc)
    assert hit_p12["matched"] is True
    assert hit_p12["document_id"] == "fixture_manual_12p"
    assert hit_p12["manual_page"] == 12
    assert hit_p12["printed_page"] == "A-12"
    assert hit_p12["document_revision"] == "rev-10"

    # Page 4 lookup in Document 2 (`wiring_bulletin_tb204`) — distinct from Document 1 Page 4!
    hit_tb = lookup_manual_in_descriptor(
        "Open wiring bulletin page 4",
        desc,
        preferred_document_id="wiring_bulletin_tb204",
    )
    assert hit_tb["matched"] is True
    assert hit_tb["document_id"] == "wiring_bulletin_tb204"
    assert hit_tb["manual_page"] == 4
    assert hit_tb["printed_page"] == "B-4"
    assert hit_tb["document_revision"] == "TB-204-A"


def test_m4_doc_02_out_of_range_page_blocked_and_missing_crop_falls_back_to_pdf(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    pkg = store.import_package_from_path(REF_FULL_ZIP)
    desc = store.build_scene_and_manual_descriptor(store.select_context_for_next_session(pkg["manifest_sha256"]))

    bad = lookup_manual_in_descriptor("Open page 99", desc, preferred_document_id="fixture_manual_12p")
    assert bad["matched"] is False
    assert bad["error_code"] == "PAGE_OUT_OF_RANGE"

    # Reference fixture omits rasterized PNG crops -> must provide verified local `pdf_fallback_url`!
    ok = lookup_manual_in_descriptor("Open page 5", desc, preferred_document_id="fixture_manual_12p")
    assert ok["matched"] is True
    assert ok["image_url"] is None
    assert ok["pdf_fallback_url"].endswith("#page=5")
    assert ok["pdf_fallback_url"].startswith(f"/api/catalog/installed/{pkg['manifest_sha256']}/objects/")


def test_m4_doc_03_html_script_and_markdown_sanitized_preserving_origin() -> None:
    malicious = (
        'Inspect <b>SW1</b> <script>window.fieldscanNativeBridge.postMessage("pwn")</script> '
        '<iframe src="https://evil.invalid"></iframe> javascript:alert(1)'
    )
    cleaned = sanitize_reference_text(malicious)
    assert "<script" not in cleaned.lower()
    assert "<iframe" not in cleaned.lower()
    assert "javascript:" not in cleaned.lower()
    assert "<b>" not in cleaned
    assert "Inspect SW1" in cleaned


# ==============================================================================
# 6. BINARY GLB SCENE, BYTE-RANGE STREAMING & CAD EXPORT GUARD (`M4-3D-01..05`)
# ==============================================================================


def test_m4_3d_01_compatible_glb_import_open_cap_focus_dip_and_reset(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    pkg = store.import_package_from_path(REF_FULL_ZIP)
    desc = store.build_scene_and_manual_descriptor(store.select_context_for_next_session(pkg["manifest_sha256"]))

    assert desc["scene_origin"] == "catalog_glb"
    assert desc["twin"]["glb_url"].startswith(f"/api/catalog/installed/{pkg['manifest_sha256']}/objects/")

    focus = prepare_visual_action(
        "Show me the DIP bank",
        descriptor=desc,
        scene_generation=3,
        turn_id="turn-3d-1",
    )
    v1 = focus["twin_action_v1"]
    assert v1 is not None
    assert v1["kind"] == "focus_part"
    assert v1["part_id"] == "dip.bank"
    assert v1["view_id"] == "open_dip"
    assert v1["citation_id"] == "fixture_manual_12p:p5:5.1"

    rst = prepare_visual_action(
        "Close housing and reset view",
        descriptor=desc,
        scene_generation=3,
        turn_id="turn-3d-2",
    )
    assert rst["twin_action_v1"]["kind"] == "reset_view"


def test_m4_3d_02_duplicate_part_missing_node_and_external_uri_rejected(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)

    # 2a. External URI in GLB JSON chunk rejected (`SEMANTIC_REFERENCE_BROKEN`)
    import struct

    bad_gltf_json = json.dumps(
        {"asset": {"version": "2.0"}, "buffers": [{"uri": "https://cdn.evil.invalid/mesh.bin", "byteLength": 16}]}
    ).encode("utf-8")
    while len(bad_gltf_json) % 4 != 0:
        bad_gltf_json += b" "
    bad_glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(bad_gltf_json)) + struct.pack(
        "<II", len(bad_gltf_json), 0x4E4F534A
    ) + bad_gltf_json
    with pytest.raises(CatalogDomainError) as ext_err:
        inspect_glb_binary(bad_glb)
    assert ext_err.value.code == "SEMANTIC_REFERENCE_BROKEN"

    # 2b. Missing node_name in `twin.parts.json` rejected before commit
    d_miss = tmp_path / "missing_node"
    write_reference_signed_package_fixture(d_miss, variant_id="miss_node", publication_seq=1)
    parts_p = d_miss / "scene" / "twin.parts.json"
    parts_obj = json.loads(parts_p.read_text(encoding="utf-8"))
    parts_obj["parts"][0]["node_name"] = "non_existent_glb_node_xyz"
    parts_bytes = json.dumps(parts_obj).encode("utf-8")
    parts_p.write_bytes(parts_bytes)
    env = json.loads((d_miss / "manifest.envelope.json").read_text(encoding="utf-8"))
    man = json.loads(base64.b64decode(env["payload_b64"]).decode("utf-8"))
    for a in man["artifacts"]:
        if a["role"] == "twin_parts":
            a["sha256"] = sha256_bytes(parts_bytes)
            a["byte_count"] = len(parts_bytes)
    (d_miss / "manifest.envelope.json").write_bytes(json.dumps(create_signed_manifest_envelope(man)).encode("utf-8"))

    with pytest.raises(CatalogDomainError) as miss_err:
        store.import_package_from_path(d_miss)
    assert miss_err.value.code == "SEMANTIC_REFERENCE_BROKEN"


def test_m4_3d_03_repeated_scene_swaps_generation_fencing_and_byte_range_streaming(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg_full = store.import_package_from_path(REF_FULL_ZIP)
    pkg_part = store.import_package_from_path(REF_PARTIAL_ZIP)
    glb_art = next(a for a in pkg_full["artifacts"] if a["role"] == "twin_glb")

    with TestClient(srv.app) as http:
        # Rapidly switch geometry 4 times -> `scene_generation` increments monotonically and fences stale `scene_ready`
        gens = []
        for target in (pkg_full["manifest_sha256"], "bundle", pkg_part["manifest_sha256"], pkg_full["manifest_sha256"]):
            r = http.post("/api/catalog/select", json={"manifest_sha256": target})
            assert r.status_code == 200
            gens.append(r.json()["scene_generation"])
        assert gens == sorted(gens) and len(set(gens)) == 4

        stale = http.post("/api/catalog/scene_ready", json={"scene_generation": gens[0], "turn_id": "old"})
        assert stale.json()["accepted"] is False
        fresh = http.post("/api/catalog/scene_ready", json={"scene_generation": gens[-1], "turn_id": "cur"})
        assert fresh.json()["accepted"] is True

        # Verify local object streaming (`200`, `206` Byte-Range, `416` invalid range, `HEAD` empty body)
        obj_url = glb_art["local_url"]
        r_head = http.head(obj_url)
        assert r_head.status_code == 200
        assert r_head.content == b""
        assert int(r_head.headers["content-length"]) == glb_art["byte_count"]

        r_206 = http.get(obj_url, headers={"Range": "bytes=0-19"})
        assert r_206.status_code == 206
        assert len(r_206.content) == 20
        assert r_206.content[:4] == b"glTF"

        r_416 = http.get(obj_url, headers={"Range": "bytes=99999999-999999999"})
        assert r_416.status_code == 416


def test_m4_3d_04_glb_units_axes_bounds_and_140x16mm_correspondence(tmp_path: Path) -> None:
    glb_bytes = build_reference_sensor_glb()
    meta = inspect_glb_binary(glb_bytes)
    assert meta["has_bin_chunk"] is True
    assert "dip.bank" in meta["node_names"]
    assert "rear.connector" in meta["node_names"]

    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    pkg = store.import_package_from_path(REF_FULL_ZIP)
    desc = store.build_scene_and_manual_descriptor(store.select_context_for_next_session(pkg["manifest_sha256"]))
    assert desc["twin"]["units"] == "meters"
    assert desc["twin"]["scale_to_studio_mm"] == 1000.0
    assert desc["twin"]["reference_dimensions_mm"] == {"length": 140.0, "outer_diameter": 16.0}


def test_m4_3d_05_cad_export_guard_for_downloaded_glb_vs_bundled_model(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg = store.import_package_from_path(REF_FULL_ZIP)

    with TestClient(srv.app) as http:
        # Bundled parametric TZ THT-02 supports `.dxf` and `.stl`
        http.post("/api/catalog/select", json={"manifest_sha256": "bundle"})
        r_dxf_ok = http.post("/api/export/dxf", json={"notes": "Bundled CAD export check"})
        assert r_dxf_ok.status_code == 200 and r_dxf_ok.json()["ok"] is True

        # Downloaded GLB variant blocks `.dxf` & `.stl` cleanly with `409 CAD_EXPORT_UNSUPPORTED_FOR_GLB`
        http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]})
        for fmt in ("dxf", "stl"):
            r_blk = http.post(f"/api/export/{fmt}", json={})
            assert r_blk.status_code == 409
            assert r_blk.json()["error_code"] == "CAD_EXPORT_UNSUPPORTED_FOR_GLB"


# ==============================================================================
# 7. VOICE / TURN FENCING, AMBIGUITY & VLM FALLBACK (`M4-VOICE-01..04`)
# ==============================================================================


def test_m4_voice_01_text_and_ptt_show_dip_bank_with_turn_and_citation(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg = store.import_package_from_path(REF_FULL_ZIP)

    with TestClient(srv.app) as http:
        sel = http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]}).json()
        gen = sel["scene_generation"]

        diag = http.post(
            "/api/diagnose",
            json={
                "prompt": "Show me the DIP bank",
                "include_camera": False,
                "scene_generation": gen,
                "turn_id": "turn-voice-01",
            },
        ).json()
        assert diag["language"] == "en"
        assert diag["twin_action_v1"]["part_id"] == "dip.bank"
        assert diag["twin_action_v1"]["turn_id"] == "turn-voice-01"
        assert diag["twin_action_v1"]["scene_generation"] == gen
        assert diag["twin_action_v1"]["manifest_sha256"] == pkg["manifest_sha256"]
        assert diag["twin_action_v1"]["citation_id"] == "fixture_manual_12p:p5:5.1"


def test_m4_voice_02_handsfree_barge_in_cancels_stale_turn_generation(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg = store.import_package_from_path(REF_FULL_ZIP)

    with TestClient(srv.app) as http:
        s1 = http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]}).json()
        old_gen = s1["scene_generation"]
        t1 = http.post(
            "/api/diagnose",
            json={"prompt": "Show me the DIP bank", "scene_generation": old_gen, "turn_id": "turn-old"},
        ).json()

        # Simulate scene/turn advancement after Hands-Free barge-in interruption
        s2 = http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]}).json()
        new_gen = s2["scene_generation"]
        t2 = http.post(
            "/api/diagnose",
            json={"prompt": "Show me the rear connector", "scene_generation": new_gen, "turn_id": "turn-new"},
        ).json()

        assert new_gen > old_gen
        assert t1["twin_action_v1"]["scene_generation"] == old_gen
        assert t2["twin_action_v1"]["scene_generation"] == new_gen
        assert t2["twin_action_v1"]["part_id"] == "rear.connector"
        assert t2["twin_action_v1"]["turn_id"] == "turn-new"

        # Late report from interrupted turn is fenced out by `/api/catalog/scene_ready`
        r_old = http.post("/api/catalog/scene_ready", json={"scene_generation": old_gen, "turn_id": "turn-old"}).json()
        assert r_old["accepted"] is False


def test_m4_voice_03_ambiguous_pin_one_requests_clarification_without_selecting(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg = store.import_package_from_path(REF_FULL_ZIP)

    with TestClient(srv.app) as http:
        http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]})
        res = http.post(
            "/api/diagnose",
            json={"prompt": "Show me pin one", "include_camera": False, "turn_id": "turn-ambig-pin1"},
        ).json()

        assert res["clarification_required"] is True
        assert res["twin_action"] is None
        assert res["twin_action_v1"] is None
        assert "DIP Switch Pin 1" in res["assistant_message"]
        assert "Rear Connector Pin 1" in res["assistant_message"]
        assert set(res["candidate_part_ids"]) == {"dip.pin_1", "rear.pin_1"}


def test_m4_voice_04_vlm_provider_offline_deterministic_fallback_preserves_viewer(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    pkg = store.import_package_from_path(REF_FULL_ZIP)
    desc = store.build_scene_and_manual_descriptor(store.select_context_for_next_session(pkg["manifest_sha256"]))

    # Construct LFMEngine pointed at an unreachable local llama-server port so VLM fails fast into deterministic fallback
    from fieldscan.pdf_ingest import load_tht02_spec

    eng = LFMEngine(vl_url="http://127.0.0.1:65529", audio_url="http://127.0.0.1:65528")
    out = eng.diagnose_sensor(
        query="Show me the DIP bank",
        spec=load_tht02_spec(),
        scanner_telemetry={"detected": False},
        modbus_telemetry={"online": False},
        catalog_descriptor=desc,
        scene_generation=5,
        turn_id="turn-offline-vlm",
    )
    assert out["language"] == "en"
    assert out["twin_action_v1"]["part_id"] == "dip.bank"
    assert out["open_manual"] is True and out["manual_page"] == 5
    assert len(out["assistant_message"]) > 15


# ==============================================================================
# 8. CAMERA EVIDENCE APPLICABILITY & BUS ISOLATION (`M4-CAM-01`, `M4-BUS-01..03`)
# ==============================================================================


def test_m4_cam_01_supported_occluded_and_catalog_variant_evidence_states(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg = store.import_package_from_path(REF_FULL_ZIP)

    with TestClient(srv.app) as http:
        # 1. Bundled calibrated TZ THT-02 clean view -> `observed`
        http.post("/api/catalog/select", json={"manifest_sha256": "bundle"})
        http.post("/api/video/mode", json={"mode": "sim_normal"})
        t_obs = http.get("/api/video/telemetry").json()
        assert t_obs["detector_applicability"] == "calibrated_tht02_140x16mm"
        assert t_obs["evidence_state"] == "observed"

        # 2. Occluded region (`sim_hand_screwdriver`) -> `uncertain_occluded`
        http.post("/api/video/mode", json={"mode": "sim_hand_screwdriver"})
        t_occ = http.get("/api/video/telemetry").json()
        assert t_occ["evidence_state"] == "uncertain_occluded"

        # 3. Uncalibrated catalog variant (`m12_4pin_rev2`) -> `manual_confirmation_required`
        http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]})
        t_cat = http.get("/api/video/telemetry").json()
        assert t_cat["detector_applicability"] == "generic_cylinder_manual_confirmation"
        assert t_cat["evidence_state"] == "manual_confirmation_required"


def test_m4_bus_01_simulated_dip_via_text_and_voice_never_mutates_bus_target(isolated_server_catalog) -> None:
    with TestClient(srv.app) as http:
        assert srv._MODBUS.target_slave_id == 1

        # Simulate DIP address 3 via `/api/diagnose` (voice/text path)
        res = http.post(
            "/api/diagnose",
            json={"prompt": "Configure it for slave 3", "include_camera": False},
        ).json()
        assert res["simulated_visual_dip_address"] == 3
        assert res["authorized_bus_slave_id"] == 1
        assert srv._MODBUS.target_slave_id == 1, "Visual/voice DIP simulation MUST NEVER mutate live Modbus polling target"


def test_m4_bus_02_authorized_confirmed_target_slave_and_isolated_mbap_read(isolated_server_catalog) -> None:
    with TestClient(srv.app) as http:
        # Missing `confirmed: true` rejected
        r_unconf = http.post("/api/modbus/target_slave", json={"slave_id": 4, "confirmed": False})
        assert r_unconf.status_code == 400
        assert r_unconf.json()["error_code"] == "CONFIRMATION_REQUIRED"

        # Explicit technician confirmation updates target_slave_id cleanly
        r_conf = http.post("/api/modbus/target_slave", json={"slave_id": 4, "confirmed": True})
        assert r_conf.status_code == 200
        assert r_conf.json()["target_slave_id"] == 4
        assert srv._MODBUS.target_slave_id == 4

    # Verify read-only FC03 over local MBAP gateway stub (`0` writes)
    gw, _, port, _ = start_mbap_test_gateway(mode="nominal", temp_c=23.4, humidity_rh=48.9)
    try:
        mb = ModbusTCPClient(host="127.0.0.1", port=port, timeout_s=1.0)
        read_res = mb.read_tht02_holding(unit_id=1)
        mb.close()
    finally:
        gw.shutdown()
        gw.server_close()
    assert read_res["ok"] is True and read_res["decoded"]["temp_c"] == 23.4


def test_m4_bus_03_unhomologated_catalog_profile_blocks_bus_polling(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    pkg = store.import_package_from_path(REF_FULL_ZIP)  # `bench_modbus_homologated = False`

    with TestClient(srv.app) as http:
        http.post("/api/catalog/select", json={"manifest_sha256": pkg["manifest_sha256"]})

        r_poll = http.post("/api/modbus/poll", json={})
        assert r_poll.status_code == 409
        assert r_poll.json()["error_code"] == "PROFILE_NOT_HOMOLOGATED_FOR_BUS"

        r_slave = http.post("/api/modbus/target_slave", json={"slave_id": 2, "confirmed": True})
        assert r_slave.status_code == 409
        assert r_slave.json()["error_code"] == "PROFILE_NOT_HOMOLOGATED_FOR_BUS"


# ==============================================================================
# 9. SESSION REVISION PINNING, DOSSIER & REVOCATIONS (`M4-SESSION-01..03`, `M4-REVOKE-01`)
# ==============================================================================


def test_m4_session_01_mid_session_install_keeps_open_session_pinned(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    tmp: Path = isolated_server_catalog["tmp_path"]

    v10 = store.import_package_from_path(REF_FULL_ZIP)
    with TestClient(srv.app) as http:
        http.post("/api/catalog/select", json={"manifest_sha256": v10["manifest_sha256"]})
        ses = http.post(
            "/api/sessions",
            json={"catalog_context": store.get_selected_context(), "serial_number": "PIN-SN-10"},
        ).json()
        sid = ses["session_id"]

        # Install newer revision `seq 11` while session `sid` is still open!
        d11 = tmp / "v11_mid"
        v11 = write_reference_signed_package_fixture(d11, variant_id="m12_4pin_rev2", publication_seq=11)
        store.import_package_from_path(d11)
        http.post("/api/catalog/select", json={"manifest_sha256": v11["manifest_sha256"]})

        st = http.get("/api/catalog/status").json()
        assert st["update_ready_for_next_session"] is True
        assert st["pinned_session_context"]["manifest_sha256"] == v10["manifest_sha256"]
        assert st["selected_context"]["manifest_sha256"] == v11["manifest_sha256"]

        # Diagnose inside open session `sid` continues using `v10` (rev-10), NOT `v11`!
        diag = http.post("/api/diagnose", json={"prompt": "Show me the DIP bank", "session_id": sid}).json()
        assert diag["twin_action_v1"]["manifest_sha256"] == v10["manifest_sha256"]


def test_m4_session_02_reopen_historical_session_or_report_historical_source_unavailable(tmp_path: Path) -> None:
    cat_root = tmp_path / "store"
    store = FieldScanPackageStore(catalog_root=cat_root, bundle_root=REPO_ROOT)
    sessions = FieldScanSessionEngine(
        db_path=tmp_path / "s.sqlite3",
        exports_dir=tmp_path / "exports",
        catalog_store=store,
    )
    v10 = store.import_package_from_path(REF_FULL_ZIP)
    ctx10 = store.select_context_for_next_session(v10["manifest_sha256"])
    s10 = sessions.create_session({"catalog_context": ctx10, "serial_number": "HIST-10"})
    sid = s10["session_id"]
    sessions.apply_action(sid, {"action": "close_session"})

    # Install seq 11 so active pointer changes -> reopening `sid` still resolves historical `v10` cleanly!
    d11 = tmp_path / "v11"
    write_reference_signed_package_fixture(d11, variant_id="m12_4pin_rev2", publication_seq=11)
    store.import_package_from_path(d11)
    reopened = sessions.get_session(sid)
    assert reopened["historical_source_status"]["available"] is True
    assert reopened["catalog_context"]["manifest_sha256"] == v10["manifest_sha256"]

    # Now simulate purged historical package directory -> reports `"Historical source unavailable"` cleanly!
    shutil.rmtree(store.packages_dir / v10["manifest_sha256"])
    purged_snap = sessions.get_session(sid)
    assert purged_snap["historical_source_status"]["available"] is False
    assert purged_snap["historical_source_status"]["message"] == "Historical source unavailable"


def test_m4_session_03_export_pdf_and_json_dossier_preserves_catalog_provenance(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    sessions = FieldScanSessionEngine(
        db_path=tmp_path / "s.sqlite3",
        exports_dir=tmp_path / "exports",
        catalog_store=store,
    )
    v10 = store.import_package_from_path(REF_FULL_ZIP)
    ctx10 = store.select_context_for_next_session(v10["manifest_sha256"])
    s = sessions.create_session({"catalog_context": ctx10, "serial_number": "EXP-M12-9001"})
    sid = s["session_id"]
    sessions.apply_action(sid, {"action": "record_observation", "note_text": "Verified M12 4-pin keyway alignment"})
    sessions.apply_action(sid, {"action": "close_session"})

    exp = sessions.export_session_dossier(sid, {"audience": "public_demo"})
    djson = json.loads(Path(exp["json_path"]).read_text(encoding="utf-8"))
    assert djson["catalog_context"]["manifest_sha256"] == v10["manifest_sha256"]
    assert djson["catalog_context"]["variant_id"] == "m12_4pin_rev2"
    assert set(djson["evidence_states_legend"].keys()) == {"documented", "simulated", "observed", "measured"}
    assert djson["device"]["serial_number"].endswith("9001") and "*" in djson["device"]["serial_number"]

    with pymupdf.open(exp["pdf_path"]) as doc:
        pdf_text = "\n".join(p.get_text("text") for p in doc)
    assert "m12_4pin_rev2" in pdf_text
    assert v10["manifest_sha256"][:16] in pdf_text


def test_m4_revoke_01_synced_revocation_labels_history_and_blocks_next_execution(tmp_path: Path) -> None:
    store = FieldScanPackageStore(catalog_root=tmp_path / "store", bundle_root=REPO_ROOT)
    sessions = FieldScanSessionEngine(
        db_path=tmp_path / "s.sqlite3",
        exports_dir=tmp_path / "exports",
        catalog_store=store,
    )
    v10 = store.import_package_from_path(REF_FULL_ZIP)
    ctx10 = store.select_context_for_next_session(v10["manifest_sha256"])
    s = sessions.create_session({"catalog_context": ctx10})
    sid = s["session_id"]

    # Before revocation, executing `proc_step_legacy_jumper` succeeds
    ok_exec = sessions.apply_action(
        sid,
        {"action": "execute_procedure_step", "instruction_id": "proc_step_legacy_jumper"},
    )
    assert ok_exec["executed_instruction_id"] == "proc_step_legacy_jumper"

    # Publish & install `seq 11` revoking `proc_step_legacy_jumper`
    d11 = tmp_path / "v11_revoke"
    write_reference_signed_package_fixture(
        d11,
        variant_id="m12_4pin_rev2",
        publication_seq=11,
        revoked_instructions=[
            {"instruction_id": "proc_step_legacy_jumper", "reason": "Superseded by isolated shield bulletin TB-204-B"}
        ],
    )
    store.import_package_from_path(d11)

    # Historical session snapshot surfaces `revocation_banner` and blocks subsequent execution with 409!
    snap_after = sessions.get_session(sid)
    assert len(snap_after["revoked_instructions"]) == 1
    assert snap_after["revoked_instructions"][0]["instruction_id"] == "proc_step_legacy_jumper"
    assert "revoked" in snap_after["revocation_banner"].lower()

    with pytest.raises(SessionDomainError) as rev_exc:
        sessions.apply_action(
            sid,
            {"action": "execute_procedure_step", "instruction_id": "proc_step_legacy_jumper"},
        )
    assert rev_exc.value.code == "INSTRUCTION_REVOKED"
    assert rev_exc.value.status_code == 409


# ==============================================================================
# 10. END-TO-END JOURNEY (`M4-END-01`)
# ==============================================================================


def test_m4_end_01_full_end_to_end_https_download_offline_relaunch_voice_and_export(isolated_server_catalog) -> None:
    store: FieldScanPackageStore = isolated_server_catalog["store"]
    client: FieldScanCatalogClient = isolated_server_catalog["client"]
    tmp: Path = isolated_server_catalog["tmp_path"]

    # 1. Build cloud package & download over HTTPS
    cloud_src = tmp / "cloud_e2e"
    cloud_meta = write_reference_signed_package_fixture(cloud_src, variant_id="m12_4pin_rev2", publication_seq=10)
    transport = _build_mock_cloud_transport(cloud_src)
    client.configure_endpoint("https://catalog.fieldscan.internal", sync_enabled=True, auth_token="e2e-token")
    job = client.resolve_catalog(manufacturer="TZONE", model="THT-02-M12", transport=transport)
    ready = client.poll_job(job["job_id"], transport=transport)
    assert ready["job_state"] == "ready"
    installed = client.fetch_and_install_variant("tzone_tht02", "m12_4pin_rev2", transport=transport)
    msha = installed["package"]["manifest_sha256"]
    assert msha == cloud_meta["manifest_sha256"]

    # 2. Cut WAN (`sync_enabled = False`) and simulate app restart on same `catalog_root`
    client.set_sync_enabled(False)
    restarted_store = FieldScanPackageStore(catalog_root=store.catalog_root, bundle_root=REPO_ROOT)
    restarted_client = FieldScanCatalogClient(restarted_store, sync_enabled=False)
    restarted_sessions = FieldScanSessionEngine(
        db_path=tmp / "sessions.sqlite3",
        exports_dir=tmp / "exports",
        catalog_store=restarted_store,
    )
    srv._CATALOG_STORE = restarted_store
    srv._CATALOG_CLIENT = restarted_client
    srv._SESSIONS = restarted_sessions

    # 3. Select package offline, open inspection session, run voice turn, stream GLB, and export dossier
    with TestClient(srv.app) as http:
        off = http.get("/api/offline/verify").json()
        assert off["offline_verified"] is True

        sel = http.post("/api/catalog/select", json={"manifest_sha256": msha}).json()
        glb_url = sel["catalog_descriptor"]["twin"]["glb_url"]
        r_glb = http.get(glb_url)
        assert r_glb.status_code == 200 and r_glb.content[:4] == b"glTF"

        ses = http.post(
            "/api/sessions",
            json={"catalog_context": sel["selected_context"], "serial_number": "E2E-M4-777"},
        ).json()
        sid = ses["session_id"]

        turn = http.post(
            "/api/diagnose",
            json={
                "prompt": "Show me the DIP bank",
                "session_id": sid,
                "scene_generation": sel["scene_generation"],
                "turn_id": "turn-e2e-1",
            },
        ).json()
        assert turn["twin_action_v1"]["part_id"] == "dip.bank"
        assert turn["twin_action_v1"]["citation_id"] == "fixture_manual_12p:p5:5.1"

        http.post(f"/api/sessions/{sid}/actions", json={"action": "close_session"})
        dossier = http.post(f"/api/sessions/{sid}/exports", json={"audience": "private_bench"}).json()
        assert Path(dossier["pdf_path"]).is_file()
        exported_json = json.loads(Path(dossier["json_path"]).read_text(encoding="utf-8"))
        assert exported_json["catalog_context"]["manifest_sha256"] == msha
        assert exported_json["latest_sample_evaluation"]["fresh"] is False
        assert "fresh_physical_modbus_sample" in exported_json["pending_evidence"]
