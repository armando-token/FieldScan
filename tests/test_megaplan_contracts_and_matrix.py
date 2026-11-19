"""Comprehensive Contract, Adversarial, Parity & Section 14 Matrix Test Suite for FieldScan CAD v2.1.

Covers automated software, transport framing, state machine, vision quality/provenance,
bilingual voice intents, grounding filter, PDF/JSON atomic exports, offline/security guards,
planned calibration extension (`CAL-00..09`), and live Swift-vs-Python parity (`DAT-09`).
"""

from __future__ import annotations

import hashlib
import json
import plistlib
import shutil
import subprocess
import time
from pathlib import Path

import cv2
import numpy as np
import pymupdf
import pytest
from fastapi.testclient import TestClient

from fieldscan.calibration_planned import (
    evaluate_calibration_comparison_contract,
    get_planned_calibration_card,
)
from fieldscan.modbus_rtu import ModbusRTUScanner, build_simulated_tht02_response, describe_dip_pins
from fieldscan.modbus_tcp import (
    ModbusFramingError,
    ModbusTCPClient,
    ModbusTCPStreamParser,
    PilotWriteBlockedError,
    build_mbap_read_holding_request,
    decode_tht02_pdu_registers,
    start_mbap_test_gateway,
)
from fieldscan.offline_guard import OfflineSocketGuard
from fieldscan.profiles_and_manual import (
    resolve_device_profile,
    verify_and_resolve_citations,
    verify_resource_manifest,
)
from fieldscan.server import app
from fieldscan.session_engine import (
    FieldScanSessionEngine as SessionEngine,
    SessionDomainError as DomainError,
    apply_deterministic_grounding_filter,
    classify_bilingual_voice_intent,
)
from fieldscan.vision_scanner import VisionScanner

REPO_ROOT = Path(__file__).resolve().parent.parent


def _make_sharp_probe_jpeg(seed: int = 1, sticker: bool = False, blur: bool = False, dark: bool = False) -> bytes:
    """Create a deterministic synthetic camera frame for quality/stability/occlusion testing."""
    img = np.full((540, 960, 3), 18 if dark else 42, dtype=np.uint8)
    if not dark:
        # Sharp metallic cylindrical body + high-contrast ticks (unique per seed so frame digest changes)
        cv2.rectangle(img, (210, 236), (750, 304), (195, 202, 210), -1)
        for idx in range(0, 500, 25):
            cv2.line(img, (220 + idx, 236), (220 + idx, 304), (35, 45, 58), 2)
        cv2.circle(img, (240 + (seed % 37) * 5, 270), 6, (80, 180, 240), -1)
    if sticker:
        # Bright low-saturation white sticker occluding central DIP region (`VIS-05`)
        cv2.rectangle(img, (350, 190), (610, 350), (242, 242, 242), -1)
    if blur:
        img = cv2.GaussianBlur(img, (31, 31), 11.0)
    ok, enc = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    assert ok
    return bytes(enc)


# ==============================================================================
# 1. DATA, SESSION, FRESHNESS, CRASH RECOVERY & IDEMPOTENCY (`DAT-01..09`)
# ==============================================================================


def test_dat01_as_found_timeout_records_no_response_without_overclaims(tmp_path: Path) -> None:
    eng = SessionEngine(db_path=tmp_path / "s.sqlite3", exports_dir=tmp_path / "exports")
    snap = eng.create_session({"profile_id": "tzone_tht02", "transport_mode": "pusr_tcp"})
    sid = snap["session_id"]

    eng.apply_action(sid, {"action": "confirm_identity"})
    updated = eng.record_modbus_observation(
        sid,
        {
            "online": False,
            "error_code": "READ_TIMEOUT",
            "temp_c": None,
            "humidity_rh": None,
            "protocol": "modbus_tcp_mbap",
            "source": "hardware:pusr_tcp:192.168.0.7:502",
            "simulation": False,
        },
    )
    assert updated["state"]["as_found"]["communication"] == "no_response"
    assert updated["freshness"]["fresh"] is False
    dumped = json.dumps(updated).lower()
    assert "calibrated values" not in dumped
    assert "scada online" not in dumped


def test_dat02_stale_sample_after_3s_and_prior_boot_marked_historical(tmp_path: Path) -> None:
    clock = [100.0]
    eng = SessionEngine(
        db_path=tmp_path / "s.sqlite3",
        exports_dir=tmp_path / "exports",
        monotonic_fn=lambda: clock[0],
    )
    snap = eng.create_session({"profile_id": "tzone_tht02", "transport_mode": "pusr_tcp"})
    sid = snap["session_id"]

    s_live = eng.record_modbus_observation(
        sid,
        {
            "online": True,
            "temp_c": 24.7,
            "humidity_rh": 51.9,
            "temp_quality": "valid",
            "humidity_quality": "valid",
            "slave_id": 1,
            "protocol": "modbus_tcp_mbap",
            "source": "hardware:pusr_tcp:192.168.0.7:502",
            "simulation": False,
        },
    )
    assert s_live["freshness"]["fresh"] is True
    assert s_live["freshness"]["sample_state"] == "fresh"

    # Advance monotonic clock past 3.0s freshness window (`DAT-02`)
    clock[0] = 103.6
    s_stale = eng.get_session(sid)
    assert s_stale["freshness"]["fresh"] is False
    assert s_stale["freshness"]["sample_state"] == "historical"
    assert s_stale["freshness"]["reason"] == "STALE_SAMPLE"
    assert s_stale["freshness"]["sample"]["measurements"][0]["value"] == 24.7

    # Simulate process restart with new boot_id (`DAT-07` / `Section 8.3`)
    eng_restarted = SessionEngine(
        db_path=tmp_path / "s.sqlite3",
        exports_dir=tmp_path / "exports",
        monotonic_fn=lambda: 5.0,
    )
    eng_restarted._live_sample_tracker.clear()
    s_reboot = eng_restarted.get_session(sid)
    assert s_reboot["freshness"]["fresh"] is False
    assert s_reboot["freshness"]["sample_state"] == "historical"


def test_dat03_dat04_unconfirmed_vs_confirmed_changes_and_partial_report(tmp_path: Path) -> None:
    eng = SessionEngine(db_path=tmp_path / "s.sqlite3", exports_dir=tmp_path / "exports")
    snap = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "SN-001", "transport_mode": "pusr_tcp"})
    sid = snap["session_id"]

    # Unconfirmed suggestion/observation must NOT increment confirmed_changes (`DAT-03`)
    eng.apply_action(sid, {"action": "record_observation", "note_text": "Recommended checking SW1 Pin 8"})
    closed = eng.apply_action(sid, {"action": "close_session"})["session"]
    assert closed["state"]["partial_close"] is True
    assert "inspection_photo_evidence" in closed["state"]["missing_evidence"]
    assert "fresh_physical_modbus_sample" in closed["state"]["missing_evidence"]

    exp1 = eng.export_session_dossier(sid, {"audience": "private_bench"})
    assert exp1["confirmed_changes_count"] == 0
    assert exp1["partial_report"] is True
    with pymupdf.open(exp1["pdf_path"]) as doc:
        full_pdf_text = "\n".join(page.get_text("text") for page in doc)
    assert "PARTIAL REPORT" in full_pdf_text
    assert "CONFIRMED PHYSICAL CHANGES (0)" in full_pdf_text

    # Now open a second session and confirm an explicit physical change (`DAT-03`)
    snap2 = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "SN-002", "transport_mode": "pusr_tcp"})
    sid2 = snap2["session_id"]
    res_chg = eng.apply_action(
        sid2,
        {
            "action": "confirm_physical_change",
            "observed": "SW1 pins all OFF",
            "action_taken": "Set SW1 Pin 8 ON for Slave ID 1",
            "technician_id": "tech-armando",
        },
    )
    assert len(res_chg["session"]["state"]["confirmed_changes"]) == 1
    assert res_chg["confirmed_change"]["confirmed_by"] == "tech-armando"


def test_dat05_dat06_dat07_dat08_simulation_isolation_single_active_orphan_and_idempotency(tmp_path: Path) -> None:
    exports_dir = tmp_path / "exports"
    exports_dir.mkdir(parents=True, exist_ok=True)
    orphan_file = exports_dir / "aborted_write.pdf.tmp"
    orphan_file.write_bytes(b"corrupt_partial")

    eng = SessionEngine(db_path=tmp_path / "s.sqlite3", exports_dir=exports_dir)
    assert not orphan_file.exists(), "DAT-07: Orphan .tmp file must be purged on startup"

    s1 = eng.create_session(
        {"profile_id": "tzone_tht02", "transport_mode": "sim_online", "simulation": True, "idempotency_key": "k-sim-1"}
    )
    s1_replay = eng.create_session(
        {"profile_id": "tzone_tht02", "transport_mode": "sim_online", "simulation": True, "idempotency_key": "k-sim-1"}
    )
    assert s1_replay["session_id"] == s1["session_id"]
    assert s1_replay.get("idempotent_replay") is True

    # DAT-08: Same key, different payload -> 409 IDEMPOTENCY_CONFLICT
    with pytest.raises(DomainError) as exc_info:
        eng.create_session(
            {"profile_id": "tzone_tht02", "transport_mode": "pusr_tcp", "simulation": False, "idempotency_key": "k-sim-1"}
        )
    assert exc_info.value.code == "IDEMPOTENCY_CONFLICT"
    assert exc_info.value.status_code == 409

    # DAT-05: Simulation export clearly stamped SIMULATION_
    exp_sim = eng.export_session_dossier(s1["session_id"], {"audience": "public_demo"})
    assert exp_sim["simulation"] is True
    assert exp_sim["export_profile"] == "simulated_demo"
    assert Path(exp_sim["pdf_path"]).name.startswith("SIMULATION_")

    # DAT-06: Creating a second session pauses the first session
    s2 = eng.create_session({"profile_id": "tzone_tht02", "transport_mode": "pusr_tcp"})
    s1_after = eng.get_session(s1["session_id"])
    assert s1_after["status"] == "paused"
    assert s2["status"] == "open"

    # DAT-08: Stale expected_seq rejected with 409 INVALID_TRANSITION
    with pytest.raises(DomainError) as stale_exc:
        eng.apply_action(s2["session_id"], {"action": "confirm_identity", "expected_seq": 999})
    assert stale_exc.value.code == "INVALID_TRANSITION"


# ==============================================================================
# 2. MODBUS RTU & MODBUS TCP MBAP TRANSPORT (`BUS-02..10`, `BUS-12`)
# ==============================================================================


def test_bus02_bus03_mbap_no_fake_crc_and_port_5502_raw_rtu_guard() -> None:
    # Port 5502 raw-RTU bridge refused by default (`BUS-03`)
    c5502 = ModbusTCPClient(host="127.0.0.1", port=5502)
    res_5502 = c5502.read_tht02_holding(unit_id=1)
    assert res_5502["ok"] is False
    assert res_5502["error_code"] == "PROTOCOL_MISMATCH"

    # Raw 21-byte RTU response frame arriving on MBAP socket detected as PROTOCOL_MISMATCH (`BUS-03`)
    parser = ModbusTCPStreamParser()
    raw_rtu = build_simulated_tht02_response(slave_id=1, temp_c=24.5, humidity_rh=50.2)
    with pytest.raises(ModbusFramingError) as exc:
        parser.feed(raw_rtu)
    assert exc.value.code == "PROTOCOL_MISMATCH"


def test_bus04_bus05_split_7byte_mbap_header_and_concatenated_frames() -> None:
    # Live TCP server splitting the 7-byte MBAP header across three packets (`BUS-04`)
    srv, _, port, _ = start_mbap_test_gateway(mode="split_header", temp_c=25.0, humidity_rh=60.0)
    try:
        client = ModbusTCPClient(host="127.0.0.1", port=port, timeout_s=1.0)
        res = client.read_tht02_holding(unit_id=1)
        client.close()
    finally:
        srv.shutdown()
        srv.server_close()

    assert res["ok"] is True
    assert res["crc_checked_by_client"] is False
    assert res["crc_valid"] is None
    assert res["mbap_valid"] is True
    assert res["decoded"]["temp_c"] == 25.0
    assert res["decoded"]["humidity_rh"] == 60.0

    # BUS-05: Two concatenated frames in one chunk + bounded buffer overflow guard
    parser = ModbusTCPStreamParser(max_buffer_bytes=128)
    f1 = bytes.fromhex("00 11 00 00 00 13 01 03 10 00 FA 02 58 00 00 00 00 00 01 25 80 06 00 00 0B")
    f2 = bytes.fromhex("00 12 00 00 00 03 01 83 02")
    frames = parser.feed(f1 + f2)
    assert len(frames) == 2
    assert frames[0].transaction_id == 0x0011 and not frames[0].is_exception
    assert frames[1].transaction_id == 0x0012 and frames[1].is_exception and frames[1].exception_code == 0x02

    with pytest.raises(ModbusFramingError) as ovf:
        parser.feed(b"\x00" * 200)
    assert ovf.value.code == "BUFFER_OVERFLOW"
    assert parser.buffered_bytes == 0


def test_bus06_bus07_bus08_late_txid_wrong_unit_exception_and_per_channel_7fff() -> None:
    # BUS-06: Prepend stale TxID frame before matching TxID + negative two's complement temperature
    srv, _, port, _ = start_mbap_test_gateway(mode="stale_then_valid", temp_c=-10.0, humidity_rh=50.0)
    try:
        client = ModbusTCPClient(host="127.0.0.1", port=port, timeout_s=1.0)
        res = client.read_tht02_holding(unit_id=1)
        client.close()
    finally:
        srv.shutdown()
        srv.server_close()

    assert res["ok"] is True
    assert res["decoded"]["temp_c"] == -10.0
    assert res["decoded"]["humidity_rh"] == 50.0

    # BUS-06: Wrong Unit ID rejected cleanly
    srv_u, _, port_u, _ = start_mbap_test_gateway(mode="wrong_unit")
    try:
        c_u = ModbusTCPClient(host="127.0.0.1", port=port_u, timeout_s=1.0)
        res_u = c_u.read_tht02_holding(unit_id=1)
        c_u.close()
    finally:
        srv_u.shutdown()
        srv_u.server_close()
    assert res_u["ok"] is False
    assert res_u["error_code"] == "WRONG_UNIT"

    # BUS-07: Modbus Exception 0x02 vs READ_TIMEOUT
    srv_e, _, port_e, _ = start_mbap_test_gateway(mode="exception_02")
    try:
        c_e = ModbusTCPClient(host="127.0.0.1", port=port_e, timeout_s=0.6)
        res_e = c_e.read_tht02_holding(unit_id=1)
        c_e.close()
    finally:
        srv_e.shutdown()
        srv_e.server_close()
    assert res_e["ok"] is False
    assert res_e["error_code"] == "MODBUS_EXCEPTION"
    assert res_e["exception_code"] == 0x02

    srv_t, _, port_t, _ = start_mbap_test_gateway(mode="drop_silent")
    try:
        c_t = ModbusTCPClient(host="127.0.0.1", port=port_t, timeout_s=0.25)
        res_t = c_t.read_tht02_holding(unit_id=1)
        c_t.close()
    finally:
        srv_t.shutdown()
        srv_t.server_close()
    assert res_t["ok"] is False
    assert res_t["error_code"] == "READ_TIMEOUT"

    # BUS-08: Per-channel 0x7FFF sentinel (Temp = 0x7FFF, RH = 55.5 %RH valid)
    srv_s, _, port_s, beh_s = start_mbap_test_gateway(mode="nominal", temp_c=24.0, humidity_rh=55.5)
    beh_s["temp_7fff"] = True
    try:
        c_s = ModbusTCPClient(host="127.0.0.1", port=port_s, timeout_s=1.0)
        res_s = c_s.read_tht02_holding(unit_id=1)
        c_s.close()
    finally:
        srv_s.shutdown()
        srv_s.server_close()
    assert res_s["ok"] is True
    assert res_s["decoded"]["temp_c"] is None
    assert res_s["decoded"]["temp_quality"] == "invalid_sentinel_7fff"
    assert res_s["decoded"]["humidity_rh"] == 55.5
    assert res_s["decoded"]["humidity_quality"] == "valid"


def test_bus09_bus10_bus12_backoff_recovery_and_zero_write_gate() -> None:
    # BUS-09: Exponential backoff schedule 0.5, 1.0, 2.0, 4.0s on unreachable port
    clock = [10.0]
    c_fail = ModbusTCPClient(host="127.0.0.1", port=65530, timeout_s=0.2, monotonic_fn=lambda: clock[0])
    r1 = c_fail.read_tht02_holding(unit_id=1, respect_backoff=True)
    assert r1["ok"] is False and r1["backoff_s"] == 0.5
    r_wait = c_fail.read_tht02_holding(unit_id=1, respect_backoff=True)
    assert r_wait["error_code"] == "BACKOFF_ACTIVE"
    clock[0] += 0.6
    r2 = c_fail.read_tht02_holding(unit_id=1, respect_backoff=True)
    assert r2["backoff_s"] == 1.0
    c_fail.close()

    # BUS-12: Zero write function codes (0x05, 0x06, 0x10) allowed in pilot mode
    for fc in (0x05, 0x06, 0x10):
        with pytest.raises(PilotWriteBlockedError) as w_exc:
            build_mbap_read_holding_request(
                transaction_id=1, unit_id=1, function_code=fc, pilot_readonly=True
            )
        assert w_exc.value.code == "PILOT_WRITE_BLOCKED"

    rtu_mgr = ModbusRTUScanner(auto_start=False)
    relay_res = rtu_mgr.drive_andon_relay("GREEN")
    assert relay_res["transmitted_hardware"] is False and relay_res["pilot_disabled"] is True


# ==============================================================================
# 3. GUIDED FLOW, UNKNOWN PROFILES, VISION & MANUAL CITATIONS (`FLU-01..06`, `VIS-01..10`)
# ==============================================================================


def test_flu01_to_flu06_guided_workflow_and_unknown_profile_gate(tmp_path: Path) -> None:
    dip1 = describe_dip_pins(1)
    dip176 = describe_dip_pins(176)
    assert dip1["dip_binary"] == "00000001" and dip1["on_pins"] == [8]
    assert dip176["dip_binary"] == "10110000" and dip176["on_pins"] == [1, 3, 4]

    # FLU-04: THT-03R & unknown model inhibit auto register decode
    p_03r = resolve_device_profile("THT-03R")
    assert p_03r["identity_pending"] is True and p_03r["auto_decode_allowed"] is False

    eng = SessionEngine(db_path=tmp_path / "flu.sqlite3", exports_dir=tmp_path / "exports")
    s_unk = eng.create_session({"model": "Generic RS485 Probe 9000"})
    assert s_unk["profile_id"] == "unknown_pending_identity"
    assert s_unk["identity_pending"] is True
    with pytest.raises(DomainError) as pm_err:
        eng.record_modbus_observation(s_unk["session_id"], {"online": True, "temp_c": 22.0, "humidity_rh": 45.0})
    assert pm_err.value.code == "PROFILE_MISMATCH"

    # Full guided flow on verified THT-02 (`FLU-01..03`, `FLU-05..06`)
    s_ok = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "THT02-4411", "transport_mode": "pusr_tcp"})
    sid = s_ok["session_id"]
    eng.apply_action(sid, {"action": "confirm_identity"})
    eng.apply_action(sid, {"action": "record_as_found", "communication": "responded"})
    eng.apply_action(sid, {"action": "advance_step", "target_step": "verify_modbus"})
    eng.record_modbus_observation(
        sid,
        {
            "online": True,
            "temp_c": 25.1,
            "humidity_rh": 54.2,
            "temp_quality": "valid",
            "humidity_quality": "valid",
            "slave_id": 1,
            "protocol": "modbus_tcp_mbap",
            "source": "hardware:pusr_tcp:192.168.0.7:502",
            "simulation": False,
        },
    )
    eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=10),
        vision_tel={"detected": True, "sharpness_score": 55.0, "exposure_ok": True},
        camera_source="ipad:avfoundation:back",
        manual_trigger=True,
    )
    closed = eng.apply_action(sid, {"action": "close_session"})["session"]
    assert closed["status"] == "closed"
    assert closed["state"]["partial_close"] is False


def test_vis01_to_vis10_auto_capture_freeze_occlusion_and_manual_integrity(tmp_path: Path) -> None:
    clock = [50.0]
    eng = SessionEngine(
        db_path=tmp_path / "vis.sqlite3",
        exports_dir=tmp_path / "exports",
        monotonic_fn=lambda: clock[0],
    )
    snap = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "SN-VIS", "transport_mode": "pusr_tcp"})
    sid = snap["session_id"]

    # VIS-07: Simulator & uploaded sources blocked from auto-capture
    r_sim = eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=1),
        vision_tel={"detected": True, "sharpness_score": 60.0, "exposure_ok": True},
        camera_source="simulator:sim_open_dip",
        manual_trigger=False,
    )
    assert r_sim["captured"] is False and r_sim["reason"] == "NON_PHYSICAL_SOURCE_AUTO_CAPTURE_BLOCKED"

    # VIS-04 & VIS-05: Blurry, hand-occluded, or white-sticker-occluded frames rejected
    r_blur = eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=2, blur=True),
        vision_tel={"detected": True, "sharpness_score": 8.5, "exposure_ok": True},
        camera_source="ipad:avfoundation:back",
        manual_trigger=False,
    )
    assert r_blur["captured"] is False and r_blur["reason"] == "FRAME_REJECTED_OCCLUDED_OR_BLURRY"

    r_sticker = eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=3, sticker=True),
        vision_tel={"detected": True, "sharpness_score": 52.0, "exposure_ok": True, "white_sticker_occluded": True},
        camera_source="ipad:avfoundation:back",
        manual_trigger=False,
    )
    assert r_sticker["captured"] is False and r_sticker["reason"] == "FRAME_REJECTED_OCCLUDED_OR_BLURRY"

    # VIS-03: Duplicate JPEG digest marks stream frozen
    frozen_jpg = _make_sharp_probe_jpeg(seed=99)
    eng.ingest_camera_frame_for_session(sid, frozen_jpg, vision_tel={"detected": True}, camera_source="ipad:avfoundation:back", manual_trigger=False)
    eng.ingest_camera_frame_for_session(sid, frozen_jpg, vision_tel={"detected": True}, camera_source="ipad:avfoundation:back", manual_trigger=False)
    r_frozen = eng.ingest_camera_frame_for_session(sid, frozen_jpg, vision_tel={"detected": True}, camera_source="ipad:avfoundation:back", manual_trigger=False)
    assert r_frozen["captured"] is False and r_frozen.get("stream_frozen") is True

    # VIS-01, VIS-02 & VIS-06: 5 distinct sharp physical frames within 1.5s auto-capture once, then dedup
    eng.notify_camera_source_changed("uvc:bench_macro")
    results = []
    for idx in range(6):
        clock[0] += 0.2
        res = eng.ingest_camera_frame_for_session(
            sid,
            _make_sharp_probe_jpeg(seed=200 + idx),
            vision_tel={"detected": True, "sharpness_score": 58.0, "exposure_ok": True, "anomaly_zone": "upper_barrel_dip"},
            camera_source="uvc:bench_macro",
            manual_trigger=False,
        )
        results.append(res)
    assert [r["captured"] for r in results[:4]] == [False, False, False, False]
    assert results[4]["captured"] is True
    assert results[4]["photo"]["evidence_origin"] == "live_physical_camera"
    assert results[5]["captured"] is False and results[5]["reason"] == "ALREADY_CAPTURED_FOR_STEP_CONTEXT"

    # VIS-08 & VIS-10: Parametric CAD label + Manual SHA-256 tamper block
    html_txt = (REPO_ROOT / "static" / "index.html").read_text(encoding="utf-8")
    assert "PARAMETRIC CAD MODEL" in html_txt
    assert "100% DIGITAL TWIN MATCH" not in html_txt

    prof = resolve_device_profile("tzone_tht02")
    tampered_prof = json.loads(json.dumps(prof))
    tampered_prof["references"]["manual_sha256"] = "0" * 64
    cit_bad = verify_and_resolve_citations(tampered_prof, [5])
    assert cit_bad["verified"] is False and cit_bad["error_code"] == "MANUAL_HASH_MISMATCH" and cit_bad["instruction_blocked"] is True


# ==============================================================================
# 4. BILINGUAL VOICE, ECHO GUARD & GROUNDING FILTER (`VOZ-01..10`, `IA-01..04`)
# ==============================================================================


def test_voz01_to_voz10_bilingual_intents_echo_guard_and_confirmation_gate(tmp_path: Path) -> None:
    # Construct accented Spanish test phrases dynamically to keep source ASCII-clean
    es_what_check = chr(0xBF) + "Qu" + chr(0xE9) + " debo revisar?"
    es_show_conn = "Mu" + chr(0xE9) + "strame el conector"
    es_responding = chr(0xBF) + "Est" + chr(0xE1) + " respondiendo el sensor?"
    es_page_4 = "Mu" + chr(0xE9) + "strame la p" + chr(0xE1) + "gina 4"
    es_switch = "Cambiar a espa" + chr(0xF1) + "ol"

    assert classify_bilingual_voice_intent(es_what_check)["detected_language"] == "es"
    c_conn = classify_bilingual_voice_intent(es_show_conn)
    assert c_conn["intent"] == "highlight_component" and c_conn["component_3d_id"] == "waterproof_gland_leads"
    assert classify_bilingual_voice_intent(es_responding)["intent"] == "read_current"
    c_p4 = classify_bilingual_voice_intent(es_page_4)
    assert c_p4["intent"] == "show_manual" and c_p4["page"] == 4
    c_sw = classify_bilingual_voice_intent(es_switch)
    assert c_sw["intent"] == "switch_language" and c_sw["target_language"] == "es"
    assert classify_bilingual_voice_intent("Switch to English")["target_language"] == "en"

    # VOZ-04: Bare number without unit requires clarification
    c_amb = classify_bilingual_voice_intent("176")
    assert c_amb["ambiguous"] is True and c_amb["clarification_reason"] == "AMBIGUOUS_NUMERIC_WITHOUT_UNIT"

    # VOZ-05 & VOZ-10: Spoken change cannot self-confirm or bypass confirmation
    eng = SessionEngine(db_path=tmp_path / "voz.sqlite3", exports_dir=tmp_path / "exports")
    sid = eng.create_session({"profile_id": "tzone_tht02"})["session_id"]

    v_req = eng.apply_action(sid, {"action": "voice_utterance", "utterance": "I changed DIP switch pin 8", "utterance_id": "u-1"})
    assert v_req["confirmation_required"] is True
    assert len(v_req["session"]["state"]["confirmed_changes"]) == 0

    # VOZ-07: Duplicate utterance_id ignored
    v_dup = eng.apply_action(sid, {"action": "voice_utterance", "utterance": "I changed DIP switch pin 8", "utterance_id": "u-1"})
    assert v_dup["ignored"] is True and v_dup["reason"] == "DUPLICATE_UTTERANCE_ID"

    # VOZ-05: Voice operator attempting confirm_physical_change without matching token fails
    with pytest.raises(DomainError) as conf_err:
        eng.apply_action(
            sid,
            {"action": "confirm_physical_change", "actor": "voice_operator", "action_taken": "Set Pin 8 ON", "confirmation_token": "wrong"},
        )
    assert conf_err.value.code == "CONFIRMATION_REQUIRED"

    # VOZ-06: TTS echo rejection
    eng.register_tts_playback("Sensor responded on Modbus Slave Address 1", duration_estimate_s=1.2)
    echo_res = eng.apply_action(sid, {"action": "voice_utterance", "utterance": "Sensor responded on Modbus Slave Address 1"})
    assert echo_res["ignored"] is True

    # VOZ-08: Flapping alert suppression & 3.0s cooldown
    for _ in range(3):
        eng.invalidate_live_connection("flap")
    a1 = eng.should_emit_transition_alert("MODBUS_LOST")
    a2 = eng.should_emit_transition_alert("MODBUS_LOST")
    assert a1["intermittent"] is True
    assert a2["emit"] is False and a2["suppressed_reason"] == "COOLDOWN_3S"


def test_ia04_deterministic_grounding_filter() -> None:
    prof = resolve_device_profile("tzone_tht02")
    bad = apply_deterministic_grounding_filter(
        "SCADA online confirmed calibrated values of 99.9 C per Page 12.",
        profile=prof,
        verified_telemetry={"online": True, "fresh": True, "temp_c": 24.5, "humidity_rh": 52.0},
    )
    assert bad["grounding_corrected"] is True
    assert "24.5" in bad["text"]
    assert "Page 12" not in bad["text"]


# ==============================================================================
# 5. EXPORTS, SHARE ALLOWLIST, DISK FULL, OFFLINE & CALIBRATION (`EXP`, `OFF`, `CAL`)
# ==============================================================================


def test_exp01_to_exp07_multipage_pdf_masking_share_allowlist_disk_full_and_supersedes(tmp_path: Path) -> None:
    eng = SessionEngine(db_path=tmp_path / "exp.sqlite3", exports_dir=tmp_path / "exports")
    s = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "THT02-SECRET9912", "transport_mode": "pusr_tcp"})
    sid = s["session_id"]
    eng.apply_action(sid, {"action": "confirm_identity"})
    eng.apply_action(sid, {"action": "record_as_found", "communication": "responded"})

    # Add 28 observations so event timeline spans multiple PDF pages without truncation (`EXP-02`)
    for idx in range(28):
        eng.apply_action(sid, {"action": "record_observation", "note_text": f"Detailed bench inspection checkpoint #{idx + 1} verified."})

    jpg_bytes = _make_sharp_probe_jpeg(seed=77)
    cap = eng.ingest_camera_frame_for_session(
        sid,
        jpg_bytes,
        vision_tel={"detected": True, "sharpness_score": 60.0, "exposure_ok": True},
        camera_source="ipad:avfoundation:back",
        manual_trigger=True,
    )
    assert cap["captured"] is True

    eng.apply_action(sid, {"action": "close_session"})
    exp_pub = eng.export_session_dossier(sid, {"audience": "public_demo"})

    # EXP-02: Multi-page PDF verification
    with pymupdf.open(exp_pub["pdf_path"]) as doc:
        assert len(doc) >= 2, "EXP-02: Long event timeline must paginate across >=2 PDF pages"
        txt = " ".join("\n".join(p.get_text("text") for p in doc).split())
    assert "checkpoint #28" in txt

    # EXP-03 & EXP-04: Evidence SHA-256 integrity + serial masking
    data_json = json.loads(Path(exp_pub["json_path"]).read_text(encoding="utf-8"))
    assert data_json["device"]["serial_number"] == "************9912"
    ev_entry = data_json["evidence_catalog"][0]
    ev_disk = (tmp_path / "exports" / "session_evidence" / ev_entry["original_filename"]).read_bytes()
    assert hashlib.sha256(ev_disk).hexdigest() == ev_entry["original_sha256"]

    # EXP-05: Canonical share path allowlist
    assert eng.resolve_authorized_export_path("../exp.sqlite3") is None
    assert eng.resolve_authorized_export_path("/etc/passwd") is None
    assert eng.resolve_authorized_export_path(Path(exp_pub["pdf_path"]).name) is not None

    # EXP-07: Amend closed session + supersedes export chain
    eng.apply_action(sid, {"action": "amend_closed_session", "amendment_note": "Added post-bench review note"})
    exp_v2 = eng.export_session_dossier(sid, {"audience": "private_bench", "supersedes_export_id": exp_pub["export_id"]})
    assert exp_v2["supersedes_export_id"] == exp_pub["export_id"]
    assert exp_v2["export_id"] != exp_pub["export_id"]
    assert Path(exp_pub["pdf_path"]).exists() and Path(exp_v2["pdf_path"]).exists()

    # EXP-06: Disk-full simulation on a new revision preserves session and leaves zero .tmp files
    eng.apply_action(sid, {"action": "amend_closed_session", "amendment_note": "Trigger new seq before disk-full check"})
    eng.min_free_disk_bytes = 10**18
    with pytest.raises(DomainError) as df_err:
        eng.export_session_dossier(sid, {"audience": "private_bench", "idempotency_key": "force-new-export"})
    assert df_err.value.code == "DISK_FULL"
    assert list((tmp_path / "exports").glob("*.tmp")) == []


def test_off01_off03_off05_off08_security_and_manifest_parity() -> None:
    from fieldscan.offline_guard import is_allowed_local_host, set_authorized_bench_gateway

    set_authorized_bench_gateway("192.168.0.7")
    assert is_allowed_local_host("127.0.0.1") is True
    assert is_allowed_local_host("192.168.0.7") is True
    assert is_allowed_local_host("8.8.8.8") is False

    guard = OfflineSocketGuard()
    guard.install()
    try:
        import socket

        with pytest.raises(OSError):
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                s.connect(("8.8.8.8", 443))
            finally:
                s.close()
    finally:
        guard.uninstall()
    assert len(guard.blocked_attempts) >= 1

    # OFF-08: Manifest & BundleResources parity
    m_res = verify_resource_manifest()
    assert m_res["verified"] is True and m_res["mismatches"] == []

    # OFF-05: Info.plist must NOT enable NSAllowsArbitraryLoadsInWebContent
    plist_data = plistlib.loads((REPO_ROOT / "ios" / "FieldScanM4" / "Info.plist").read_bytes())
    ats = plist_data.get("NSAppTransportSecurity", {})
    assert ats.get("NSAllowsArbitraryLoadsInWebContent") is not True


def test_cal00_to_cal09_planned_calibration_and_metrology_contracts() -> None:
    card = get_planned_calibration_card()
    assert card["status"] == "planned"
    assert card["pilot_writes_enabled"] is False
    assert card["tzone_offset_write_supported"] is False

    base_ref = {
        "instrument_id": "VAISALA-HM40",
        "certificate_id": "CAL-2026-99",
        "valid_until_utc": "2027-05-01T00:00:00Z",
        "uncertainty": 0.08,
        "unit": "Cel",
        "samples": [{"value": 25.00, "ts_s": 1.0}, {"value": 25.02, "ts_s": 2.0}],
    }
    base_uut = {
        "unit": "Cel",
        "samples": [{"value": 25.60, "ts_s": 1.1}, {"value": 25.62, "ts_s": 2.1}],
    }

    # CAL-01: Expired certificate blocked
    expired = dict(base_ref, valid_until_utc="2025-01-01T00:00:00Z")
    r_exp = evaluate_calibration_comparison_contract(
        {"profile_id": "tzone_tht02", "quantity": "temperature", "evaluated_at_utc": "2026-11-19T00:00:00Z", "reference": expired, "uut": base_uut}
    )
    assert r_exp["status_code"] == "REFERENCE_EXPIRED" and r_exp["proposal_allowed"] is False

    # CAL-02: Unstable / skewed samples marked INDETERMINATE
    skew_uut = {"unit": "Cel", "samples": [{"value": 25.1, "ts_s": 20.0}, {"value": 26.2, "ts_s": 25.0}]}
    r_skew = evaluate_calibration_comparison_contract(
        {"profile_id": "tzone_tht02", "quantity": "temperature", "reference": base_ref, "uut": skew_uut}
    )
    assert r_skew["status_code"] == "INDETERMINATE_UNSTABLE_OR_SKEWED"

    # CAL-03: TZONE read-only delta comparison
    r_tz = evaluate_calibration_comparison_contract(
        {"profile_id": "tzone_tht02", "quantity": "temperature", "reference": base_ref, "uut": base_uut}
    )
    assert r_tz["status_code"] == "READONLY_COMPARISON_COMPLETE"
    assert r_tz["writes_emitted"] == 0 and r_tz["claimed_calibrated"] is False
    assert r_tz["error_uut_minus_ref"] == 0.6

    # CAL-04 & CAL-05 & CAL-07: Compatible NOVUS lab profile additive offset + post-reboot verification
    r_nov = evaluate_calibration_comparison_contract(
        {
            "profile_id": "novus_rht_climate_lab",
            "quantity": "temperature",
            "prior_device_offset": 0.2,
            "reference": base_ref,
            "uut": base_uut,
            "human_confirmed": True,
            "as_left_uut_mean": 25.03,
            "readback_offset_after_reboot": -0.4,
        }
    )
    assert r_nov["proposed_device_offset"] == -0.4
    assert r_nov["status_code"] == "VERIFIED_ADJUSTMENT_PASS"
    assert r_nov["persistence_verified"] is True

    # CAL-06: Link drop after parameter transmission requires readback reconciliation before retry
    r_unc = evaluate_calibration_comparison_contract(
        {"profile_id": "novus_rht_climate_lab", "quantity": "temperature", "reference": base_ref, "uut": base_uut, "prior_write_link_dropped": True}
    )
    assert r_unc["status_code"] == "UNCERTAIN_RESULT_RECONCILIATION_REQUIRED" and r_unc["retry_blocked"] is True

    # CAL-08: Multi-point non-linearity failure
    r_mp = evaluate_calibration_comparison_contract(
        {
            "profile_id": "vaisala_hmp110_lab",
            "quantity": "temperature",
            "reference": base_ref,
            "uut": base_uut,
            "second_point": {"ref_value": 50.0, "uut_value": 51.8},
        }
    )
    assert r_mp["status_code"] == "NONLINEAR_OR_RESIDUAL_OUT_OF_CRITERIA"

    # CAL-09: Ambiguous spoken reference value blocked
    r_amb = evaluate_calibration_comparison_contract(
        {"profile_id": "novus_rht_climate_lab", "quantity": "temperature", "voice_ambiguous": True, "reference": base_ref, "uut": base_uut}
    )
    assert r_amb["status_code"] == "CLARIFICATION_REQUIRED"


# ==============================================================================
# 6. FASTAPI ENDPOINTS & LIVE SWIFT-VS-PYTHON CONTRACT PARITY (`DAT-09`)
# ==============================================================================


def test_dat09_fastapi_endpoints_and_swift_engine_parity(tmp_path: Path) -> None:
    with TestClient(app) as client:
        cap = client.get("/api/capabilities")
        assert cap.status_code == 200
        cap_json = cap.json()
        assert cap_json["contract_version"] == "2.1.0"
        assert cap_json["pilot_writes_enabled"] is False
        assert cap_json["planned_calibration"]["status"] == "planned"

        profs = client.get("/api/profiles")
        assert profs.status_code == 200
        assert any(p["profile_id"] == "tzone_tht02" for p in profs.json()["profiles"])

        gw_bad = client.post("/api/modbus/gateway", json={"host": "192.168.0.7", "port": 5502})
        assert gw_bad.status_code == 400
        assert gw_bad.json()["error_code"] == "PROTOCOL_MISMATCH"

        ses = client.post("/api/sessions", json={"profile_id": "tzone_tht02", "serial_number": "API-SN-7788"})
        assert ses.status_code == 200
        sid = ses.json()["session_id"]

        act = client.post(f"/api/sessions/{sid}/actions", json={"action": "confirm_identity"})
        assert act.status_code == 200 and act.json()["session"]["step_id"] == "as_found"

        exp = client.post(f"/api/sessions/{sid}/exports", json={"audience": "public_demo"})
        assert exp.status_code == 200
        assert exp.json()["export_id"].startswith(f"exp-{sid}")

    # Compile and execute native Swift contract runner (`ModbusTCPClient.swift` + `FieldScanSessionEngine.swift`)
    swift_bin = tmp_path / "swift_contract_runner"
    cmd_compile = [
        "xcrun",
        "swiftc",
        "-O",
        str(REPO_ROOT / "ios" / "FieldScanM4" / "ModbusTCPClient.swift"),
        str(REPO_ROOT / "ios" / "FieldScanM4" / "FieldScanSessionEngine.swift"),
        str(REPO_ROOT / "scripts" / "run_swift_contract_tests.swift"),
        "-lsqlite3",
        "-o",
        str(swift_bin),
    ]
    comp = subprocess.run(cmd_compile, cwd=REPO_ROOT, capture_output=True, text=True, check=False)
    assert comp.returncode == 0, f"Swift contract runner compile failed:\n{comp.stderr}"

    run_res = subprocess.run([str(swift_bin)], cwd=REPO_ROOT, capture_output=True, text=True, check=False)
    assert run_res.returncode == 0, f"Swift contract suite failed:\n{run_res.stderr}"
    swift_summary = json.loads(run_res.stdout.strip().splitlines()[-1])
    assert swift_summary["swift_contract_suite"] == "PASS"
    assert swift_summary["contract_version"] == "2.1.0"
    assert swift_summary["golden_mbap_vectors_passed"] == 4
    assert swift_summary["golden_voice_en_passed"] == 20
    assert swift_summary["golden_voice_es_passed"] == 20
    assert swift_summary["golden_voice_adversarial_passed"] == 6
    assert swift_summary["swift_intent_n"] == 40
    assert swift_summary["swift_intent_p95_ms"] < 50.0


def test_section14_golden_fixtures_40_voice_corpus_latency_and_vis09_matrix(tmp_path: Path) -> None:
    """Validate Section 14.2 & 14.4 quantitative criteria on shared golden vectors + 7-scenario VIS-09 matrix."""
    golden = json.loads((REPO_ROOT / "knowledge" / "fixtures" / "golden_contracts_v2_1.json").read_text(encoding="utf-8"))
    assert golden["contract_version"] == "2.1.0"

    # 1. Shared MBAP vectors in Python (`DAT-09`, `BUS-04..08`)
    for vec in golden["mbap_vectors"]:
        parser = ModbusTCPStreamParser()
        frames = parser.feed(bytes.fromhex(vec["frame_hex"]))
        assert len(frames) == 1
        exp = vec["expected"]
        assert frames[0].transaction_id == exp["transaction_id"]
        assert frames[0].is_exception is exp["is_exception"]
        if frames[0].is_exception:
            assert frames[0].exception_code == exp["exception_code"]
        else:
            dec = decode_tht02_pdu_registers(frames[0].unit_id, frames[0].pdu_payload)
            assert dec["temp_c"] == exp["temp_c"]
            assert dec["humidity_rh"] == exp["humidity_rh"]
            assert dec["temp_quality"] == exp["temp_quality"]
            assert dec["humidity_quality"] == exp["humidity_quality"]

    # 2. 40-utterance EN + ES voice benchmark (`>=90%` threshold, asserting 100%) + latency p50/p95 (`n=40`)
    latencies_ms: list[float] = []
    for expected_lang, key in (("en", "voice_corpus_en"), ("es", "voice_corpus_es")):
        items = golden[key]
        assert len(items) == 20
        correct = 0
        for item in items:
            opp_lang = "es" if expected_lang == "en" else "en"
            t0 = time.perf_counter()
            parsed = classify_bilingual_voice_intent(item["utterance"], current_language=opp_lang)
            latencies_ms.append((time.perf_counter() - t0) * 1000.0)
            ok = parsed["intent"] == item["expected_intent"] and parsed["detected_language"] == expected_lang
            if "expected_page" in item:
                ok = ok and parsed.get("page") == item["expected_page"]
            if "expected_component" in item:
                ok = ok and parsed.get("component_3d_id") == item["expected_component"]
            if "expected_target_language" in item:
                ok = ok and parsed.get("target_language") == item["expected_target_language"]
            assert ok, f"Golden {expected_lang} voice failure on {item['utterance']!r}: {parsed}"
            correct += 1
        accuracy = correct / len(items)
        assert accuracy >= 0.90 and correct == 20

    sorted_lat = sorted(latencies_ms)
    p50_ms = sorted_lat[len(sorted_lat) // 2]
    p95_ms = sorted_lat[min(len(sorted_lat) - 1, int(len(sorted_lat) * 0.95))]
    assert len(sorted_lat) == 40
    assert p50_ms < 25.0 and p95_ms < 50.0

    # 3. 6 adversarial utterances (`VOZ-04`, `VOZ-05`, `VOZ-10`)
    for adv in golden["voice_adversarial"]:
        parsed = classify_bilingual_voice_intent(adv["utterance"], current_language="en")
        if adv.get("expected_ambiguous"):
            assert parsed["ambiguous"] is True
            assert parsed["clarification_reason"] == adv["expected_reason"]
        if adv.get("expected_bypass_blocked"):
            assert parsed["bypass_blocked"] is True
            assert parsed["intent"] == adv["expected_intent"]

    # 4. 7-scenario VIS-09 vision & auto-capture quality matrix
    scanner = VisionScanner(initial_mode="sim_normal", auto_start=False)
    eng = SessionEngine(db_path=tmp_path / "vis09.sqlite3", exports_dir=tmp_path / "exports")
    sid = eng.create_session({"profile_id": "tzone_tht02", "serial_number": "VIS09-BENCH"})["session_id"]

    # (a) sim_normal
    scanner.set_mode("sim_normal")
    t_norm = scanner.step_once()
    assert t_norm["detected"] is True and t_norm["anomaly_detected"] is False

    # (b) sim_open_dip
    scanner.set_mode("sim_open_dip")
    t_dip = scanner.step_once()
    assert t_dip["detected"] is True and t_dip["pcb_open_detected"] is True and t_dip["anomaly_zone"] == "upper_barrel_dip"

    # (c) sim_strainer_patch
    scanner.set_mode("sim_strainer_patch")
    t_strainer = scanner.step_once()
    assert t_strainer["detected"] is True and t_strainer["anomaly_zone"] == "strainer_head"

    # (d) sim_gland_fault
    scanner.set_mode("sim_gland_fault")
    t_gland = scanner.step_once()
    assert t_gland["detected"] is True and t_gland["anomaly_zone"] == "waterproof_gland_leads"

    # (e) sim_hand_screwdriver -> hand/tool occlusion flagged & rejected from auto-capture (`VIS-04`, `VIS-09`)
    scanner.set_mode("sim_hand_screwdriver")
    time.sleep(0.03)
    t_occ = scanner.step_once()
    assert t_occ["hand_detected"] is True and t_occ["tool_detected"] is True
    r_occ = eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=301),
        vision_tel=t_occ,
        camera_source="ipad:avfoundation:back",
        manual_trigger=False,
    )
    assert r_occ["captured"] is False and r_occ["reason"] == "FRAME_REJECTED_OCCLUDED_OR_BLURRY"

    # (f) white_sticker -> white occlusion rejected (`VIS-05`, `VIS-09`)
    r_white = eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=302, sticker=True),
        vision_tel={"detected": True, "sharpness_score": 60.0, "exposure_ok": True, "white_sticker_occluded": True},
        camera_source="ipad:avfoundation:back",
        manual_trigger=False,
    )
    assert r_white["captured"] is False and r_white["reason"] == "FRAME_REJECTED_OCCLUDED_OR_BLURRY"

    # (g) blur_dark -> low sharpness / underexposed rejected (`VIS-04`, `VIS-09`)
    r_dark_blur = eng.ingest_camera_frame_for_session(
        sid,
        _make_sharp_probe_jpeg(seed=303, blur=True),
        vision_tel={"detected": True, "sharpness_score": 6.0, "exposure_ok": False},
        camera_source="ipad:avfoundation:back",
        manual_trigger=False,
    )
    assert r_dark_blur["captured"] is False and r_dark_blur["reason"] == "FRAME_REJECTED_OCCLUDED_OR_BLURRY"
