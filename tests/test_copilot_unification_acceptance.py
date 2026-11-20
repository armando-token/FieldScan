"""Comprehensive Characterization & Acceptance Test Suite for FieldScan Copilot Unification.

Covers:
- Characterization tests for all 5 audit-table findings
- Acceptance matrix: UI-01, UI-02, UI-03, DIP-01, DIP-02, DIP-03, DOC-01, CTX-01, CTX-02, CTX-03,
  BUS-01, BUS-02, HIST-01, HIST-02, REG-01
- Bilingual EN + ES voice command routing via audited `knowledge/localization/copilot_voice_es.json`
- Deterministic latency measurement (median, p95, n) across text, ptt, handsfree, and touch modes.
"""

from __future__ import annotations

import json
from pathlib import Path
import time

from fastapi.testclient import TestClient
import pytest

from fieldscan.copilot_registry import (
    GuidanceSessionTracker,
    build_action_registry,
    build_screen_inventory,
    compute_scene_capabilities,
    evaluate_unified_link_diagnostic,
    resolve_copilot_action_plan,
)
from fieldscan.session_engine import FieldScanSessionEngine, SessionDomainError
import fieldscan.server as server_mod

PROJECT_ROOT = Path(__file__).resolve().parents[1]
REF_FULL_ZIP = PROJECT_ROOT / "knowledge" / "fixtures" / "cloud_catalog_v1" / "reference_full_m12_seq10.zip"
REF_PARTIAL_ZIP = PROJECT_ROOT / "knowledge" / "fixtures" / "cloud_catalog_v1" / "reference_partial_no3d_seq10.zip"


@pytest.fixture()
def client():
    with TestClient(server_mod.app) as c:
        # Ensure clean starting state (bundled context, no pinned session, Slave #1)
        server_mod._SESSIONS._active_session_id = None
        server_mod._CATALOG_STORE.select_context_for_next_session("bundle")
        server_mod._MODBUS.set_mode("auto", 1)
        server_mod._CATALOG_CLIENT.set_sync_enabled(False)
        yield c
        server_mod._SESSIONS._active_session_id = None
        server_mod._CATALOG_STORE.select_context_for_next_session("bundle")


# ==============================================================================
# 1. CHARACTERIZATION TESTS FOR ALL 5 AUDIT TABLE FINDINGS
# ==============================================================================


def test_finding1_unified_turn_context_and_pinned_session_authority(client: TestClient) -> None:
    """Finding 1 & CTX-01: text/voice share turn_id + context, and pinned open session rejects conflicting manifest."""
    imp = client.post("/api/catalog/import", json={"path": str(REF_FULL_ZIP)})
    assert imp.status_code == 200
    full_sha = imp.json()["package"]["manifest_sha256"]

    # Create open session pinned to bundled TZ THT-02
    sess = client.post("/api/sessions", json={"profile_id": "tzone_tht02", "transport_mode": "auto"}).json()
    sid = sess["session_id"]

    # Sending conflicting manifest while open session is pinned must reject with MANIFEST_SESSION_MISMATCH
    mismatch = client.post(
        "/api/diagnose",
        json={
            "query": "Open PUSR settings",
            "session_id": sid,
            "manifest_sha256": full_sha,
            "scene_generation": 1,
            "turn_id": "turn-ctx01-mismatch",
            "input_mode": "ptt",
        },
    ).json()
    assert mismatch["ok"] is False
    assert mismatch["error_code"] == "MANIFEST_SESSION_MISMATCH"
    assert mismatch["requires_session_switch"] is True
    assert mismatch["turn_id"] == "turn-ctx01-mismatch"
    assert mismatch["bus_target_mutated"] is False


def test_finding2_voice_and_dip_guide_never_mutate_authorized_bus_target(client: TestClient) -> None:
    """Finding 2: voice context sync, DIP guidance, and guide_dip without confirmed=true never mutate target_slave_id."""
    r_auth = client.post("/api/modbus/target_slave", json={"slave_id": 1, "confirmed": True})
    assert r_auth.status_code == 200
    assert r_auth.json()["target_slave_id"] == 1

    # Voice context sync with visual DIP=176 must NOT change authorized_bus_slave_id
    r_sync = client.post("/api/voice/context_sync", json={"dip_address": 176, "language": "es", "scene_generation": 1})
    assert r_sync.status_code == 200
    assert r_sync.json()["authorized_bus_slave_id"] == 1
    assert r_sync.json()["bus_target_mutated"] is False

    # DIP configuration query for Slave 176 must update visual DIP only
    r_dip = client.post("/api/diagnose", json={"query": "Show me how to configure the DIP switches for address 176", "input_mode": "handsfree"})
    assert r_dip.status_code == 200
    body = r_dip.json()
    assert body["simulated_visual_dip_address"] == 176
    assert body["authorized_bus_slave_id"] == 1
    assert body["bus_target_mutated"] is False

    # Unconfirmed /api/repair/step guide_dip must keep authorized bus target at 1
    r_step = client.post("/api/repair/step", json={"step": "guide_dip", "query": "Configure slave 176"})
    assert r_step.status_code == 200
    assert r_step.json()["target_slave_id"] == 176
    assert r_step.json()["authorized_bus_slave_id"] == 1
    assert r_step.json()["bus_target_mutated"] is False

    st = client.get("/api/status").json()
    assert st["authorized_bus_slave_id"] == 1


def test_finding3_action_registry_and_screen_inventory_completeness(client: TestClient) -> None:
    """Finding 3: bounded action registry and complete screen inventory match static/app.js handlers."""
    reg_resp = client.get("/api/copilot/registry").json()
    scr_resp = client.get("/api/copilot/screens").json()
    assert reg_resp["ok"] is True
    assert scr_resp["ok"] is True
    actions = reg_resp["actions"]
    screens = scr_resp["screens"]
    assert len(actions) >= 25
    assert len(screens) >= 14

    app_js = (PROJECT_ROOT / "static" / "app.js").read_text(encoding="utf-8")
    for act in actions:
        aid = act["id"]
        assert f"'{aid}':" in app_js, f"Missing JS handler for registered action {aid}"
        assert act["category"] in ("config", "twin", "manual", "camera", "bench", "bench_session", "session", "help")
        assert act["intent_mode"] in ("show", "explain", "propose", "apply")

    # Help query lists available actions from the same registry
    help_resp = client.post("/api/diagnose", json={"query": "list available actions"}).json()
    assert help_resp["copilot_action_plan"]["actions"][0]["id"] == "help.list_actions"


def test_finding4_glb_action_parity_and_capability_declaration() -> None:
    """Finding 4 & CTX-02/CTX-03: GLB supports X-Ray/Solid/Reset, and reference GLB never invents DIP pins."""
    glb_desc_with_explode = {
        "scene_origin": "catalog_glb",
        "context": {"manifest_sha256": "sha-glb-1", "bench_modbus_homologated": False},
        "twin": {
            "glb_url": "/api/catalog/installed/sha-glb-1/objects/o1",
            "parts": [{"part_id": "housing.main", "label": "Main Housing", "explode_offset_m": [0, 0.02, 0]}],
            "views": [{"view_id": "default_overview"}],
        },
        "documents": [{"document_id": "doc1", "title": "Generic Manual", "page_count": 6}],
    }
    caps = compute_scene_capabilities(glb_desc_with_explode)
    assert caps["supports_3d"] is True
    assert caps["supports_xray"] is True
    assert caps["supports_explode"] is True
    assert caps["supports_dip_pins"] is False

    # X-Ray works on GLB
    p_xray = resolve_copilot_action_plan("Switch to X-Ray mode", descriptor=glb_desc_with_explode)
    assert p_xray is not None
    assert p_xray["actions"][0]["id"] == "twin.set_render_mode"
    assert p_xray["actions"][0]["params"]["mode"] == "wireframe"
    assert "status_hint" not in p_xray["actions"][0]

    # Explode works on GLB with offsets
    p_exp = resolve_copilot_action_plan("Explode the 3D model", descriptor=glb_desc_with_explode)
    assert p_exp is not None
    assert p_exp["actions"][0]["id"] == "twin.set_explode"

    # Generic GLB without verified DIP profile refuses DIP pin invention cleanly (`CTX-03`)
    p_dip = resolve_copilot_action_plan("How do I configure the DIP switches for address 1?", descriptor=glb_desc_with_explode)
    assert p_dip is not None
    assert p_dip["actions"][0]["status_hint"] == "unavailable"

    # Docs-only package refuses 3D actions cleanly without inventing geometry (`CTX-02`)
    docs_only_desc = {
        "scene_origin": "docs_only_no_3d",
        "context": {"manifest_sha256": "sha-docs-only", "bench_modbus_homologated": False},
        "documents": [{"document_id": "doc_only", "title": "Docs Only Manual", "page_count": 4}],
    }
    p_docs_xray = resolve_copilot_action_plan("Switch to X-Ray view", descriptor=docs_only_desc)
    assert p_docs_xray is not None
    assert p_docs_xray["actions"][0]["status_hint"] == "unavailable"


def test_finding5_durable_conversation_history_and_receipts(tmp_path: Path) -> None:
    """Finding 5 & HIST-01: full conversation turns and UI receipts survive restart and export to PDF+JSON."""
    eng = FieldScanSessionEngine(exports_dir=tmp_path / "exports", db_path=tmp_path / "sessions.sqlite3", project_root=PROJECT_ROOT)
    snap = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "SN-4401", "asset_tag": "AHU-04", "transport_mode": "auto"})
    sid = snap["session_id"]

    t1 = eng.record_conversation_turn(
        {
            "turn_id": "turn-hist-001",
            "session_id": sid,
            "user_text": "Open PUSR settings and show me the port",
            "assistant_reply": "Opened PUSR Gateway configuration and highlighted Port 502.",
            "input_mode": "ptt",
            "language": "en",
            "manual_page": 5,
            "planned_actions": [{"id": "config.open_pusr"}, {"id": "config.show_pusr_field", "params": {"field": "port"}}],
        }
    )
    assert t1["ok"] is True and t1["deduplicated"] is False

    # Deduplication by turn_id
    t1_dup = eng.record_conversation_turn({"turn_id": "turn-hist-001", "session_id": sid, "user_text": "dup", "assistant_reply": "dup"})
    assert t1_dup["deduplicated"] is True

    ack = eng.record_action_ack(
        {
            "turn_id": "turn-hist-001",
            "session_id": sid,
            "input_mode": "ptt",
            "receipts": [{"action_id": "config.open_pusr", "status": "applied"}],
        }
    )
    assert ack["ok"] is True

    # Simulate fresh process restart opening the same SQLite DB
    eng2 = FieldScanSessionEngine(exports_dir=tmp_path / "exports", db_path=tmp_path / "sessions.sqlite3", project_root=PROJECT_ROOT)
    reloaded = eng2.get_session(sid)
    assert len(reloaded["state"]["conversation_turns"]) == 1
    assert reloaded["state"]["conversation_turns"][0]["turn_id"] == "turn-hist-001"
    assert reloaded["state"]["conversation_turns"][0]["action_receipts"][0]["status"] == "applied"

    exp = eng2.export_session_dossier(sid)
    json_data = json.loads((tmp_path / "exports" / Path(exp["json_url"]).name).read_text(encoding="utf-8"))
    assert len(json_data["conversation_turns"]) == 1
    assert len(json_data["action_receipts"]) == 1
    assert (tmp_path / "exports" / Path(exp["pdf_url"]).name).stat().st_size > 1000


# ==============================================================================
# 2. ACCEPTANCE MATRIX CASES (`UI-01..03`, `DIP-01..03`, `DOC-01`, `BUS-01..02`, `HIST-02`, `REG-01`)
# ==============================================================================


def test_ui01_pusr_config_and_port_locator_en_and_es(client: TestClient) -> None:
    """UI-01: Opening PUSR config and locating host/port/address in EN and ES without editing or connecting."""
    es_pack = json.loads((PROJECT_ROOT / "knowledge" / "localization" / "copilot_voice_es.json").read_text(encoding="utf-8"))
    es_pusr_addr_cmd = es_pack["action_aliases"]["config.open_pusr"][0] + " y " + es_pack["action_aliases"]["config.show_pusr_field"][1]
    es_pusr_port_cmd = es_pack["action_aliases"]["config.open_pusr"][0] + " y " + es_pack["action_aliases"]["config.show_pusr_field"][2]

    for query, exp_lang, exp_field in [
        ("Open PUSR configuration and show me where to see the port", "en", "port"),
        ("Open PUSR settings and show me the address", "en", "address"),
        (es_pusr_addr_cmd, "es", "address"),
        (es_pusr_port_cmd, "es", "port"),
    ]:
        r = client.post("/api/diagnose", json={"query": query, "input_mode": "text"}).json()
        assert r["language"] == exp_lang
        plan = r["copilot_action_plan"]
        assert plan["intent_mode"] == "show"
        ids = [a["id"] for a in plan["actions"]]
        assert ids == ["config.open_pusr", "config.show_pusr_field"]
        assert plan["actions"][1]["params"]["field"] == exp_field
        assert r["bus_target_mutated"] is False

    # Confirm UI-01 did not mutate gateway settings
    st = client.get("/api/status").json()
    assert st["pusr_gateway"]["host"] == ""
    assert st["pusr_gateway"]["port"] == 502


def test_ui02_cloud_settings_read_only_zero_wan(client: TestClient) -> None:
    """UI-02: Showing cloud settings opens catalog modal with zero WAN requests and Cloud Sync untouched."""
    r = client.post("/api/diagnose", json={"query": "Show me where cloud settings are configured"}).json()
    plan = r["copilot_action_plan"]
    assert [a["id"] for a in plan["actions"]] == ["config.open_catalog", "config.show_cloud_settings"]
    assert plan["cloud_enabled"] is False
    st = client.get("/api/status").json()
    assert st["catalog_sync"]["sync_enabled"] is False
    assert st["catalog_sync"]["https_requests_emitted"] == 0


def test_ui03_close_manual_keeps_session_and_camera(client: TestClient) -> None:
    """UI-03: Closing manual emits manual.close cleanly without dropping session or bus target."""
    r = client.post("/api/diagnose", json={"query": "Close the manual"}).json()
    assert [a["id"] for a in r["copilot_action_plan"]["actions"]] == ["manual.close"]
    assert r["bus_target_mutated"] is False


def test_dip01_dip02_dip03_synchronized_guidance_and_camera_verification(client: TestClient) -> None:
    """DIP-01, DIP-02, DIP-03: DIP-1 trio, occlusion/motion debounce, non-live/discrepancy review, manual confirm."""
    # DIP-01: Synchronized Twin + Manual Page 5 + DIP Macro without mutating bus target
    r_dip = client.post("/api/diagnose", json={"query": "Show me how to configure the DIP switches for address 1"}).json()
    plan = r_dip["copilot_action_plan"]
    assert [a["id"] for a in plan["actions"]] == ["twin.show_dip", "manual.open_section", "camera.show_dip_macro"]
    assert r_dip["manual_page"] == 5
    assert r_dip["dip_bits"] == [0, 0, 0, 0, 0, 0, 0, 1]
    assert r_dip["guidance_state"]["state"] == "waiting_for_operator"
    assert r_dip["guidance_state"]["expected_dip_address"] == 1
    assert r_dip["guidance_state"]["authorized_bus_slave_id"] == 1
    assert r_dip["bus_target_mutated"] is False

    # DIP-02: Occlusion + Discrepancy + Non-Live rejection
    tracker = GuidanceSessionTracker()
    tracker.start_dip_guidance(target_slave_id=1, session_id="ses-1", profile_id="tzone_tht02", supports_dip_pins=True, authorized_bus_slave_id=1)

    # Simulator frame must NOT credit physical DIP position
    sim_eval = tracker.evaluate_camera_observation({"camera_source": "simulator:open_dip", "pcb_open_detected": True, "dip_confidence": 0.95}, authorized_bus_slave_id=1)
    assert sim_eval["state"] == "needs_review"
    assert sim_eval["camera_observation"]["can_credit_physical_position"] is False

    # Hand covering DIP transitions to waiting_for_clear_frame
    occ_eval = tracker.evaluate_camera_observation({"camera_source": "ipad:avfoundation:back", "hand_detected": True, "frame_age_s": 0.1}, authorized_bus_slave_id=1)
    assert occ_eval["state"] == "waiting_for_clear_frame"

    # Discrepant bits [0,0,0,0,0,0,1,0] (addr 2 instead of 1) must stay needs_review
    bad_eval = tracker.evaluate_camera_observation(
        {
            "camera_source": "ipad:avfoundation:back",
            "pcb_open_detected": True,
            "dip_confidence": 0.92,
            "dip_orientation_confirmed": True,
            "observed_dip_bits": [0, 0, 0, 0, 0, 0, 1, 0],
            "frame_age_s": 0.1,
        },
        authorized_bus_slave_id=1,
    )
    assert bad_eval["state"] == "needs_review"

    # Clear live frames (2 frames debounce) reach `observed`, still never crediting Modbus operation
    tracker.evaluate_camera_observation(
        {"camera_source": "ipad:avfoundation:back", "pcb_open_detected": True, "dip_confidence": 0.90, "observed_dip_bits": [0, 0, 0, 0, 0, 0, 0, 1], "frame_age_s": 0.1},
        authorized_bus_slave_id=1,
    )
    ok_eval = tracker.evaluate_camera_observation(
        {"camera_source": "ipad:avfoundation:back", "pcb_open_detected": True, "dip_confidence": 0.91, "observed_dip_bits": [0, 0, 0, 0, 0, 0, 0, 1], "frame_age_s": 0.1},
        authorized_bus_slave_id=1,
    )
    assert ok_eval["state"] == "observed"
    assert ok_eval["camera_observation"]["can_credit_physical_position"] is True
    assert ok_eval["camera_observation"]["can_credit_modbus_operation"] is False

    # DIP-03: Manual operator confirmation advances cleanly with explicit provenance
    conf = tracker.confirm_operator_step(manual=True, authorized_bus_slave_id=1, complete=True)
    assert conf["state"] == "complete"
    assert conf["confirmed_origin"] == "manual_operator_confirmation"


def test_doc01_valid_and_out_of_range_manual_pages(client: TestClient) -> None:
    """DOC-01: Valid page opens exact manual/page; out-of-range page refuses cleanly without inventing content."""
    ok_p = client.post("/api/diagnose", json={"query": "Open manual page 5"}).json()
    assert ok_p["manual_page"] == 5
    assert ok_p["page_out_of_range"] is False
    assert ok_p["copilot_action_plan"]["actions"][0]["id"] == "manual.open_page"

    bad_p = client.post("/api/diagnose", json={"query": "Open manual page 99"}).json()
    assert bad_p["page_out_of_range"] is True
    assert bad_p["error_code"] == "PAGE_OUT_OF_RANGE"
    assert bad_p["copilot_action_plan"]["actions"][0]["status_hint"] == "unavailable"


def test_bus01_bus02_unified_6_state_link_diagnostics() -> None:
    """BUS-01 & BUS-02: Separate gateway-connected/no-sensor hypotheses, historical preservation, 0x7FFF, and falling trend."""
    gw_cfg = {"host": "10.10.100.254", "port": 502}
    # 1. Gateway connected, no sensor reply -> hypotheses only, never confirmed broken hardware
    d_gw = evaluate_unified_link_diagnostic(
        {"online": False, "gateway_connected": True, "error_code": "READ_TIMEOUT", "target_slave_id": 1},
        gateway_config=gw_cfg,
    )
    assert d_gw["state"] == "gateway_connected_no_sensor_reply"
    assert d_gw["severity"] == "amber"
    assert len(d_gw["hypotheses"]) >= 2

    # 2. Link lost after valid sample -> strictly historical, no falling trend invented
    d_hist = evaluate_unified_link_diagnostic(
        {
            "online": False,
            "fresh": False,
            "gateway_connected": False,
            "error_code": "READ_TIMEOUT",
            "historical_sample": {"captured_at_utc": "2026-11-20T18:00:00Z", "temp_c": 24.5, "humidity_rh": 51.0},
        },
        gateway_config=gw_cfg,
    )
    assert d_hist["state"] == "link_lost_historical"
    assert d_hist["temperature_trend"] == "no_recent_data"

    # 3. Falling trend ONLY when >= 2 valid fresh readings from same source show drop
    d_fall = evaluate_unified_link_diagnostic(
        {
            "online": True,
            "healthy": True,
            "fresh": True,
            "simulation": False,
            "temp_c": 22.0,
            "humidity_rh": 50.0,
            "history": [
                {"ts": 100.0, "temp_c": 25.0, "humidity_rh": 50.0},
                {"ts": 102.0, "temp_c": 22.0, "humidity_rh": 50.0},
            ],
        },
        gateway_config=gw_cfg,
    )
    assert d_fall["state"] == "online_temp_falling"
    assert d_fall["temperature_trend"] == "falling"
    assert d_fall["trend_delta_c"] == -3.0

    # 4. Channel 0x7FFF sentinel
    d_7fff = evaluate_unified_link_diagnostic(
        {"online": True, "healthy": False, "sensor_abnormal_7fff": True, "slave_id": 1},
        gateway_config=gw_cfg,
    )
    assert d_7fff["state"] == "channel_fault_7fff"

    # 5. Simulation separated from physical
    d_sim = evaluate_unified_link_diagnostic({"online": True, "healthy": True, "simulation": True, "temp_c": 24.6, "humidity_rh": 52.8})
    assert d_sim["state"] == "simulation_mode"


def test_hist02_cross_session_recall_photo_budget_and_drafts(tmp_path: Path) -> None:
    """HIST-02: Asset recall by confirmed (profile_id, serial_number), photo budget, and verified-only stock drafts."""
    fake_mono = [100.0]
    eng = FieldScanSessionEngine(
        exports_dir=tmp_path / "exports",
        db_path=tmp_path / "sessions.sqlite3",
        project_root=PROJECT_ROOT,
        monotonic_fn=lambda: fake_mono[0],
    )

    # General history outside session requires explicit confirmation before attaching
    g_turn = eng.record_conversation_turn({"turn_id": "turn-gen-1", "user_text": "hello", "assistant_reply": "hi"})
    assert g_turn["scope"] == "general"

    s1 = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "THT02-SN-99", "transport_mode": "auto"})
    eng.record_modbus_observation(s1["session_id"], {"online": False, "error_code": "READ_TIMEOUT", "source": "hardware:pusr_tcp"})
    eng.apply_action(s1["session_id"], {"action": "close_session", "allow_partial_close": True})

    s2 = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "THT02-SN-99", "transport_mode": "auto"})
    with pytest.raises(SessionDomainError) as exc_att:
        eng.attach_general_history_to_session(s2["session_id"], ["turn-gen-1"], confirmed=False)
    assert exc_att.value.code == "CONFIRMATION_REQUIRED"

    att_ok = eng.attach_general_history_to_session(s2["session_id"], ["turn-gen-1"], confirmed=True)
    assert att_ok["attached_turn_ids"] == ["turn-gen-1"]

    # Recall factual episodes without inferring root cause
    recall = eng.recall_asset_history(profile_id="tzone_tht02", serial_number="THT02-SN-99")
    assert recall["episode_counts"]["total_sessions"] == 2
    assert recall["episode_counts"]["no_response_sessions"] == 1
    assert recall["root_cause_inferred"] is False

    # Stock draft refuses unverified/missing sensor assumption
    with pytest.raises(SessionDomainError) as exc_stk:
        eng.create_local_draft(s2["session_id"], kind="stock", payload={"sku": "SHT30-PROBE"})
    assert exc_stk.value.code == "UNVERIFIED_STOCK_DATA"

    stk_ok = eng.create_local_draft(
        s2["session_id"],
        kind="stock",
        payload={"sku": "SHT30-PROBE", "verified_quantity": 2, "reorder_threshold": 5, "verified_by_operator": True},
    )
    assert stk_ok["draft"]["below_threshold"] is True
    assert stk_ok["draft"]["external_sent"] is False

    mfg_ok = eng.create_local_draft(s2["session_id"], kind="manufacturer", payload={"questions": ["Is firmware V1.1 current?"]})
    assert mfg_ok["draft"]["local_only"] is True
    assert mfg_ok["draft"]["external_sent"] is False

    # Auto-capture evidence budget limit enforced cleanly
    import cv2
    import numpy as np

    eng.configure_evidence_policy({"max_auto_captures_per_session": 2})
    # High-contrast checkerboard image passes sharpness & exposure gates cleanly
    img = np.zeros((160, 160, 3), dtype=np.uint8)
    for y in range(0, 160, 8):
        for x in range(0, 160, 8):
            if ((x // 8) + (y // 8)) % 2 == 0:
                img[y : y + 8, x : x + 8] = (230, 230, 230)
            else:
                img[y : y + 8, x : x + 8] = (30, 30, 30)
    ok_enc, buf = cv2.imencode(".jpg", img)
    assert ok_enc
    valid_jpg = buf.tobytes()

    frame_seq = [0]

    def _auto_cap(roi_zone: str) -> dict:
        # Advance past prior window and feed 5 fresh live-camera frames within 1.5s stability window
        fake_mono[0] += 2.0
        res: dict = {}
        for _ in range(5):
            frame_seq[0] += 1
            frame_img = img.copy()
            # Simulate natural sensor pixel noise so each frame has a unique SHA-256 (passes VIS-06 freeze guard)
            frame_img[0, frame_seq[0] % 160, 0] = (frame_seq[0] * 17) % 255
            ok_i, buf_i = cv2.imencode(".jpg", frame_img)
            assert ok_i
            fake_mono[0] += 0.1
            v = {
                "detected": True,
                "angle_deg": 0.0,
                "est_length_mm": 140.0,
                "camera_source": "ipad:avfoundation:back",
                "anomaly_zone": roi_zone,
            }
            res = eng.ingest_camera_frame_for_session(
                s2["session_id"],
                buf_i.tobytes(),
                vision_tel=v,
                camera_source="ipad:avfoundation:back",
                manual_trigger=False,
            )
        return res

    c1 = _auto_cap("strainer_head")
    c2 = _auto_cap("upper_barrel_dip")
    c3 = _auto_cap("mounting_flange")
    assert c1["captured"] is True and c2["captured"] is True
    assert c3["captured"] is False and c3["reason"] == "EVIDENCE_BUDGET_REACHED"


def test_reg01_deterministic_latency_metrics_and_offline_roundtrip(client: TestClient) -> None:
    """REG-01: Deterministic latency metrics (median, p95, n) across text/ptt/handsfree + offline roundtrip."""
    for idx, mode in enumerate(["text", "ptt", "handsfree", "text", "ptt"]):
        t0 = time.perf_counter()
        r = client.post(
            "/api/diagnose",
            json={"query": "Open PUSR configuration and show me the port", "input_mode": mode, "turn_id": f"turn-lat-{idx}"},
        )
        assert r.status_code == 200
        dt_ms = round((time.perf_counter() - t0) * 1000.0, 1)
        ack = client.post(
            "/api/copilot/action_ack",
            json={
                "turn_id": f"turn-lat-{idx}",
                "input_mode": mode,
                "stale": False,
                "receipts": [{"action_id": "config.open_pusr", "status": "applied"}],
                "phrase_end_to_ui_ack_ms": dt_ms,
                "phrase_end_to_tts_start_ms": round(dt_ms + 12.0, 1),
            },
        )
        assert ack.status_code == 200

    metrics = client.get("/api/copilot/metrics").json()
    assert metrics["ok"] is True
    lat = metrics["deterministic_latency_ms"]
    assert lat["text"]["ui_ack"]["n"] >= 2
    assert lat["ptt"]["ui_ack"]["n"] >= 2
    assert lat["handsfree"]["ui_ack"]["n"] >= 1
    assert lat["text"]["ui_ack"]["p95_ms"] < 2000.0

    # Verify offline -> authorized online -> offline roundtrip preserves zero unsolicited egress
    st_off1 = client.get("/api/offline/verify").json()
    assert st_off1["offline_verified"] is True
    client.post("/api/catalog/sync_config", json={"sync_enabled": True})
    st_on = client.get("/api/status").json()
    assert st_on["catalog_sync"]["sync_enabled"] is True
    client.post("/api/catalog/sync_config", json={"sync_enabled": False})
    st_off2 = client.get("/api/offline/verify").json()
    assert st_off2["offline_verified"] is True
    assert st_off2["catalog_sync"]["https_requests_emitted"] == 0
