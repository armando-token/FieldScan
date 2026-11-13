"""Comprehensive End-to-End, Zero-Spanish & Airplane-Mode Glue Audit Suite for FieldScan THT-02."""

from __future__ import annotations

import email
import io
from pathlib import Path
import re
import struct
import wave
import zipfile

import ezdxf
from fastapi.testclient import TestClient

from fieldscan.cad_exporter import (
    build_escalation_package,
)
from fieldscan.offline_guard import GLOBAL_OFFLINE_GUARD
from fieldscan.pdf_ingest import (
    DEFAULT_PDF_PATH,
    inspect_pdf_document,
    load_tht02_spec,
    match_and_load_sensor,
)
from fieldscan.vision_scanner import VisionScanner

PROJECT_ROOT = Path(__file__).resolve().parents[1]

SPANISH_CHAR_RE = re.compile(r"[áéíóúÁÉÍÓÚñÑ¿¡]")
SPANISH_WORD_RE = re.compile(
    r"\b(diagnóstico|humedad|carcasa|página|esclavo|enchúfalo|conectado|abierto|según|fábrica|fabricante|cámara|micrófono|español)\b",
    re.IGNORECASE,
)


def test_zero_spanish_anywhere_in_codebase() -> None:
    """Guarantee 100% English across all code, prompts, UI, scripts, knowledge base, and docs."""
    scan_dirs = ("src", "static", "knowledge", "scripts", "docs", "tests")
    checked_files = [PROJECT_ROOT / "README.md"]
    for dname in scan_dirs:
        base = PROJECT_ROOT / dname
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if not p.is_file():
                continue
            if p.parent.name == "vendor":
                continue
            if p.suffix in {".py", ".html", ".css", ".js", ".json", ".md", ".sh"}:
                # Skip scanning the regex literal line inside this test file itself
                if p.resolve() == Path(__file__).resolve():
                    continue
                checked_files.append(p)

    violations: list[str] = []
    for fpath in checked_files:
        text = fpath.read_text(encoding="utf-8")
        m_char = SPANISH_CHAR_RE.search(text)
        if m_char:
            violations.append(f"{fpath.relative_to(PROJECT_ROOT)}: Spanish char '{m_char.group(0)}'")
            continue
        m_word = SPANISH_WORD_RE.search(text)
        if m_word:
            violations.append(f"{fpath.relative_to(PROJECT_ROOT)}: Spanish word '{m_word.group(0)}'")

    assert violations == [], f"Spanish content detected in repository: {violations}"


def test_airplane_mode_guard_blocks_external_sockets() -> None:
    """Prove external internet IPs (8.8.8.8:53) are blocked while loopback works."""
    report = GLOBAL_OFFLINE_GUARD.self_test()
    assert report["offline_verified"] is True
    assert report["external_egress_blocked"] is True


def test_zero_external_cdn_links_in_frontend() -> None:
    """Audit HTML, CSS, and JS to guarantee zero external CDN/font/script dependencies."""
    static_dir = PROJECT_ROOT / "static"
    for fname in ("index.html", "styles.css", "app.js"):
        fpath = static_dir / fname
        assert fpath.is_file(), f"Missing frontend file: {fpath}"
        content = fpath.read_text(encoding="utf-8")
        urls = re.findall(r"https?://[^\s\"')>]+", content)
        external = [
            u
            for u in urls
            if not u.startswith("http://www.w3.org/")
            and not u.startswith("http://127.0.0.1")
            and not u.startswith("http://localhost")
        ]
        assert external == [], f"External URLs forbidden in offline UI ({fname}): {external}"


def test_pdf_ingest_and_fuzzy_phonetic_matching() -> None:
    """Verify <50ms 9-page PDF manual parsing and English ASR phonetic matching (THS 00, THP02, THT-02)."""
    pdf_info = inspect_pdf_document(DEFAULT_PDF_PATH)
    assert pdf_info["page_count"] == 9
    assert pdf_info["inspected_in_ms"] < 50.0

    for spoken in (
        "This is a THS 00 sensor",
        "This is sensor THP02, it has a fault on the tip",
        "Load the blueprint for TZ THT-02",
        "RS485 temperature and humidity sensor",
    ):
        res = match_and_load_sensor(spoken)
        assert res["matched"] is True, f"Failed to match spoken query: {spoken}"
        assert res["sensor_id"] == "TZ-THT-02"
        assert res["spec"]["dimensions_mm"]["total_length"] == 140.0
        assert res["spec"]["dimensions_mm"]["outer_diameter"] == 16.0


def test_cad_exporter_dxf_stl_and_offline_outbox(tmp_path: Path) -> None:
    """Verify <150ms AutoCAD R2010 DXF, binary STL, and RFC-5322 offline Outbox bundle."""
    spec = load_tht02_spec()
    exports_dir = tmp_path / "exports"
    outbox_dir = tmp_path / "outbox"

    pkg = build_escalation_package(
        spec=spec,
        exports_dir=exports_dir,
        outbox_dir=outbox_dir,
        fault_zone="strainer_head",
        diagnosis_text="Physical obstruction on stainless sintered SHT30 strainer head (0x7FFF).",
        operator_notes="Red fault marker observed during bench inspection.",
    )
    assert pkg["generated_in_ms"] < 150.0

    dxf_doc = ezdxf.readfile(pkg["dxf_path"])
    auditor = dxf_doc.audit()
    assert len(auditor.errors) == 0
    assert "FAULT_CALLOUT" in dxf_doc.layers
    assert "DIMENSIONS" in dxf_doc.layers

    stl_bytes = Path(pkg["stl_path"]).read_bytes()
    assert len(stl_bytes) > 84
    tri_count = struct.unpack("<I", stl_bytes[80:84])[0]
    assert tri_count > 500
    assert len(stl_bytes) == 84 + tri_count * 50

    eml_msg = email.message_from_bytes(Path(pkg["eml_path"]).read_bytes())
    assert eml_msg["X-FieldScan-Outbox-Mode"] == "STORE_AND_FORWARD_OFFLINE"
    with zipfile.ZipFile(pkg["zip_path"]) as zf:
        names = zf.namelist()
        assert any(n.endswith(".dxf") for n in names)
        assert any(n.endswith(".stl") for n in names)
        assert any(n.endswith(".eml") for n in names)


def test_opencv_realtime_scanner_all_modes() -> None:
    """Verify real OpenCV segmentation, DIP crop, and anomaly localization across all 4 workbench modes."""
    scanner = VisionScanner(initial_mode="sim_normal", auto_start=False)

    scanner.set_mode("sim_normal")
    t_norm = scanner.step_once()
    assert t_norm["detected"] is True
    assert t_norm["anomaly_detected"] is False

    scanner.set_mode("sim_strainer_patch")
    t_tip = scanner.step_once()
    assert t_tip["detected"] is True
    assert t_tip["anomaly_detected"] is True
    assert t_tip["anomaly_zone"] == "strainer_head"

    scanner.set_mode("sim_open_dip")
    t_dip = scanner.step_once()
    assert t_dip["detected"] is True
    assert t_dip["pcb_open_detected"] is True
    assert t_dip["anomaly_zone"] == "upper_barrel_dip"
    dip_jpg = scanner.get_dip_focus_jpeg()
    assert dip_jpg[:2] == b"\xff\xd8"

    scanner.set_mode("sim_gland_fault")
    t_gland = scanner.step_once()
    assert t_gland["detected"] is True
    assert t_gland["anomaly_detected"] is True
    assert t_gland["anomaly_zone"] == "waterproof_gland_leads"


def test_full_fastapi_stack_with_live_lfm3_and_voice() -> None:
    """End-to-end English integration test across FastAPI, OpenCV, LFM3-Audio-2B, LFM3-VL-2B, Piper en_US, and CAD."""
    from fieldscan.server import app

    with TestClient(app) as client:
        r_home = client.get("/")
        assert r_home.status_code == 200
        assert "FIELDSCAN" in r_home.text.upper()

        r_status = client.get("/api/status")
        assert r_status.status_code == 200
        st = r_status.json()
        assert st["offline_verified"] is True

        r_load = client.post("/api/sensor/load", json={"query": "This is sensor THS 00"})
        assert r_load.status_code == 200
        ld = r_load.json()
        assert ld["sensor_id"] == "TZ-THT-02"

        r_mode = client.post("/api/video/mode", json={"mode": "sim_strainer_patch"})
        assert r_mode.status_code == 200
        r_tel = client.get("/api/video/telemetry")
        assert r_tel.status_code == 200
        assert r_tel.json()["anomaly_zone"] == "strainer_head"
        r_snap = client.get("/api/video/snapshot")
        assert r_snap.status_code == 200
        assert r_snap.headers["content-type"].startswith("image/jpeg")

        r_diag = client.post(
            "/api/diagnose",
            json={
                "prompt": "There is a red fault patch on the strainer tip, what is failing according to the manual?",
                "include_camera": True,
            },
        )
        assert r_diag.status_code == 200
        dg = r_diag.json()
        assert dg["highlighted_zone"] == "strainer_head"
        assert len(dg["assistant_message"]) > 20
        assert len(dg["manual_citations"]) >= 1

        if dg.get("audio_wav_b64"):
            from piper import PiperVoice

            voice_model = Path("/home/antigravity/vendor/piper/en/en_US/lessac/medium/en_US-lessac-medium.onnx")
            if voice_model.is_file():
                pv = PiperVoice.load(str(voice_model))
                buf = io.BytesIO()
                with wave.open(buf, "wb") as wf:
                    pv.synthesize_wav("This is a THT zero two sensor with a fault on the strainer tip.", wf)
                r_voice = client.post(
                    "/api/voice",
                    files={"audio": ("speech.wav", buf.getvalue(), "audio/wav")},
                )
                assert r_voice.status_code == 200
                vj = r_voice.json()
                assert len(vj["transcript"]) > 3

        r_esc = client.post(
            "/api/escalate",
            json={
                "notes": "Urgent field engineering escalation for manufacturer review.",
                "fault_zone": dg["highlighted_zone"],
                "diagnosis_text": dg["assistant_message"],
            },
        )
        assert r_esc.status_code == 200
        ej = r_esc.json()
        assert ej["dxf_url"].endswith(".dxf")
        assert ej["stl_url"].endswith(".stl")
        assert ej["zip_url"].endswith(".zip")
        assert client.get(ej["dxf_url"]).status_code == 200
        assert client.get(ej["stl_url"]).status_code == 200


def test_modbus_rtu_crc16_and_register_decoding() -> None:
    """Verify byte-exact Manual Page 7 frame (01 03 00 00 00 08 44 0C), negative temp, 0x7FFF, coil 0x05, and DIP-8 math."""
    from fieldscan.modbus_rtu import (
        address_to_dip_bits,
        build_read_registers_request,
        build_simulated_tht02_response,
        build_write_single_coil_request,
        decode_tht02_holding_response,
        describe_dip_pins,
        dip_bits_to_address,
        format_hex,
        verify_crc16,
    )

    req = build_read_registers_request(slave_id=1, start_reg=0x0000, count=8)
    assert format_hex(req) == "01 03 00 00 00 08 44 0C"

    coil_on = build_write_single_coil_request(slave_id=2, coil_addr=0, turn_on=True)
    assert verify_crc16(coil_on) is True
    assert coil_on[:4] == b"\x02\x05\x00\x00"

    rx_ok = build_simulated_tht02_response(slave_id=1, temp_c=25.3, humidity_rh=56.2, baud_bps=9600)
    dec_ok = decode_tht02_holding_response(rx_ok)
    assert dec_ok["crc_valid"] is True
    assert dec_ok["temp_c"] == 25.3
    assert dec_ok["humidity_rh"] == 56.2
    assert dec_ok["sensor_abnormal_7fff"] is False
    assert dec_ok["reported_slave_id"] == 1

    rx_neg = build_simulated_tht02_response(slave_id=5, temp_c=-18.4, humidity_rh=71.0)
    dec_neg = decode_tht02_holding_response(rx_neg)
    assert dec_neg["temp_c"] == -18.4
    assert dec_neg["reported_slave_id"] == 5

    rx_err = build_simulated_tht02_response(slave_id=1, abnormal_7fff=True)
    dec_err = decode_tht02_holding_response(rx_err)
    assert dec_err["sensor_abnormal_7fff"] is True
    assert dec_err["temp_c"] is None

    assert address_to_dip_bits(176) == [1, 0, 1, 1, 0, 0, 0, 0]
    assert dip_bits_to_address([1, 0, 1, 1, 0, 0, 0, 0]) == 176
    pin_guide_1 = describe_dip_pins(1)
    assert pin_guide_1["on_pins"] == [8]
    assert pin_guide_1["dip_binary"] == "00000001"


def test_closed_loop_live_repair_and_4angle_signoff_dossier() -> None:
    """Audit full 4-stage English Closed-Loop Repair: Open Fault -> DIP-8 Focus -> Reactive Modbus Online -> 4-Angle Sign-Off."""
    from fieldscan.server import app

    with TestClient(app) as client:
        r_reset = client.post("/api/repair/watch", json={"reset": True, "enabled": True})
        assert r_reset.status_code == 200

        r_s1 = client.post("/api/repair/step", json={"step": "inspect_open", "sync_simulator": True})
        assert r_s1.status_code == 200
        s1 = r_s1.json()
        assert s1["stage"] == "STEP1_OPEN_FAULT_DETECTED"
        assert s1["explode_pcb"] is True
        assert s1.get("focus_dip") is True
        assert "dip" in s1["assistant_message"].lower() or "open" in s1["assistant_message"].lower()

        r_crop = client.get("/api/video/dip_crop")
        assert r_crop.status_code == 200
        assert r_crop.content[:2] == b"\xff\xd8"

        r_s2 = client.post(
            "/api/repair/step",
            json={"step": "guide_dip", "query": "Configure it for standard Industrial Modbus RTU slave 1"},
        )
        assert r_s2.status_code == 200
        s2 = r_s2.json()
        assert s2["stage"] == "STEP2_GUIDING_DIP_MODBUS"
        assert s2["target_slave_id"] == 1
        assert s2["dip_bits"] == [0, 0, 0, 0, 0, 0, 0, 1]
        assert "Pin 8" in s2["assistant_message"]

        r_s3 = client.post("/api/repair/step", json={"step": "connect_modbus", "force_sim": True, "slave_id": 1})
        assert r_s3.status_code == 200

        r_tel = client.get("/api/telemetry")
        assert r_tel.status_code == 200
        tel = r_tel.json()
        assert tel["modbus"]["online"] is True
        assert tel["modbus"]["healthy"] is True
        assert tel["modbus"]["temp_c"] is not None
        assert tel["modbus"]["humidity_rh"] is not None
        assert tel["repair"]["stage"] == "STEP3_SCADA_ONLINE_VERIFIED"
        assert tel["repair"]["andon_state"] == "GREEN"
        assert tel["repair"]["latest_event_id"] >= 1

        ev_id = tel["repair"]["latest_event_id"]
        r_ev = client.get(f"/api/repair/event/{ev_id}")
        assert r_ev.status_code == 200
        ev = r_ev.json()
        assert "modbus" in ev["assistant_message"].lower() or "online" in ev["assistant_message"].lower()

        r_s4 = client.post(
            "/api/repair/signoff",
            json={"notes": "Confirm DIP-8 Slave 001 field reconfiguration preserves IP65 factory warranty."},
        )
        assert r_s4.status_code == 200
        s4 = r_s4.json()
        assert s4["signoff_mode"] is True
        assert "compliance_verdict" in s4
        assert s4["quad_3d_url"].endswith(".png")
        assert s4["strip_url"].endswith(".png")
        assert s4["dxf_url"].endswith(".dxf")
        assert s4["stl_url"].endswith(".stl")
        assert s4["eml_url"].endswith(".eml")
        assert s4["zip_url"].endswith(".zip")

        r_quad = client.get(s4["quad_3d_url"])
        assert r_quad.status_code == 200
        assert r_quad.content[:8] == b"\x89PNG\r\n\x1a\n"

        r_strip = client.get(s4["strip_url"])
        assert r_strip.status_code == 200
        assert r_strip.content[:8] == b"\x89PNG\r\n\x1a\n"

        r_eml = client.get(s4["eml_url"])
        assert r_eml.status_code == 200
        eml_msg = email.message_from_bytes(r_eml.content)
        assert eml_msg["X-FieldScan-SignOff-Request"] == "TRUE"
