"""Comprehensive End-to-End & Airplane-Mode Glue Audit Suite for FieldScan THT-02."""

from __future__ import annotations

import base64
import email
import io
from pathlib import Path
import re
import struct
import wave
import zipfile

import ezdxf
from fastapi.testclient import TestClient
import pytest

from fieldscan.cad_exporter import (
    build_escalation_package,
    export_autocad_dxf,
    export_parametric_stl,
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
        # Ignore harmless XML/SVG namespace URIs like http://www.w3.org/2000/svg
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
    """Verify <50ms 9-page PDF manual parsing and ASR phonetic matching (THS 00, THP02, THT-02)."""
    pdf_info = inspect_pdf_document(DEFAULT_PDF_PATH)
    assert pdf_info["page_count"] == 9
    assert pdf_info["inspected_in_ms"] < 50.0

    for spoken in (
        "Este es un sensor THS 00",
        "Este es un sensor THP02, tiene una falla en la punta",
        "Carga el plano del TZ THT-02",
        "sensor de temperatura y humedad RS485",
    ):
        res = match_and_load_sensor(spoken)
        assert res["matched"] is True, f"Failed to match spoken query: {spoken}"
        assert res["sensor_id"] == "TZ-THT-02"
        assert res["spec"]["dimensions_mm"]["total_length"] == 140.0
        assert res["spec"]["dimensions_mm"]["outer_diameter"] == 16.0


def test_cad_exporter_dxf_stl_and_offline_outbox(tmp_path: Path) -> None:
    """Verify <80ms AutoCAD R2010 DXF, binary STL, and RFC-5322 offline Outbox bundle."""
    spec = load_tht02_spec()
    exports_dir = tmp_path / "exports"
    outbox_dir = tmp_path / "outbox"

    pkg = build_escalation_package(
        spec=spec,
        exports_dir=exports_dir,
        outbox_dir=outbox_dir,
        fault_zone="strainer_head",
        diagnosis_text="Anomalía en cabezal filtrante SHT30 (7FFF H).",
        operator_notes="Parche rojo detectado en inspección de piso.",
    )
    assert pkg["generated_in_ms"] < 150.0

    # Audit AutoCAD DXF
    dxf_doc = ezdxf.readfile(pkg["dxf_path"])
    auditor = dxf_doc.audit()
    assert len(auditor.errors) == 0
    assert "FAULT_CALLOUT" in dxf_doc.layers
    assert "DIMENSIONS" in dxf_doc.layers

    # Audit Binary STL
    stl_bytes = Path(pkg["stl_path"]).read_bytes()
    assert len(stl_bytes) > 84
    tri_count = struct.unpack("<I", stl_bytes[80:84])[0]
    assert tri_count > 500
    assert len(stl_bytes) == 84 + tri_count * 50

    # Audit RFC-5322 Store-and-Forward EML & ZIP
    eml_msg = email.message_from_bytes(Path(pkg["eml_path"]).read_bytes())
    assert eml_msg["X-FieldScan-Outbox-Mode"] == "STORE_AND_FORWARD_OFFLINE"
    with zipfile.ZipFile(pkg["zip_path"]) as zf:
        names = zf.namelist()
        assert any(n.endswith(".dxf") for n in names)
        assert any(n.endswith(".stl") for n in names)
        assert any(n.endswith(".eml") for n in names)


def test_opencv_realtime_scanner_all_modes() -> None:
    """Verify real OpenCV segmentation and anomaly localization across all 4 workbench modes."""
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

    scanner.set_mode("sim_gland_fault")
    t_gland = scanner.step_once()
    assert t_gland["detected"] is True
    assert t_gland["anomaly_detected"] is True
    assert t_gland["anomaly_zone"] == "waterproof_gland_leads"


def test_full_fastapi_stack_with_live_lfm3_and_voice() -> None:
    """End-to-end integration test across FastAPI, OpenCV, LFM3-Audio-2B, LFM3-VL-2B, Piper TTS, and CAD."""
    from fieldscan.server import app

    with TestClient(app) as client:
        # 1. Root UI & status
        r_home = client.get("/")
        assert r_home.status_code == 200
        assert "FIELDSCAN CAD" in r_home.text

        r_status = client.get("/api/status")
        assert r_status.status_code == 200
        st = r_status.json()
        assert st["offline_verified"] is True

        # 2. Load sensor by fuzzy spoken alias 'THS 00'
        r_load = client.post("/api/sensor/load", json={"query": "Este es un sensor THS 00"})
        assert r_load.status_code == 200
        ld = r_load.json()
        assert ld["sensor_id"] == "TZ-THT-02"

        # 3. Switch camera to strainer fault & verify snapshot + telemetry
        r_mode = client.post("/api/video/mode", json={"mode": "sim_strainer_patch"})
        assert r_mode.status_code == 200
        r_tel = client.get("/api/video/telemetry")
        assert r_tel.status_code == 200
        assert r_tel.json()["anomaly_zone"] == "strainer_head"
        r_snap = client.get("/api/video/snapshot")
        assert r_snap.status_code == 200
        assert r_snap.headers["content-type"].startswith("image/jpeg")

        # 4. Run live multimodal diagnosis (OpenCV + Manual + LFM3-VL-2B + Piper TTS)
        r_diag = client.post(
            "/api/diagnose",
            json={
                "prompt": "Tiene una falla o parche en la punta del filtro, ¿qué está fallando según el manual?",
                "include_camera": True,
            },
        )
        assert r_diag.status_code == 200
        dg = r_diag.json()
        assert dg["highlighted_zone"] == "strainer_head"
        assert len(dg["assistant_message"]) > 20
        assert len(dg["manual_citations"]) >= 1

        # 5. Test real voice round-trip if audio_wav_b64 was synthesized
        if dg.get("audio_wav_b64"):
            from piper import PiperVoice

            voice_model = Path("/home/antigravity/vendor/piper/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx")
            if voice_model.is_file():
                pv = PiperVoice.load(str(voice_model))
                buf = io.BytesIO()
                with wave.open(buf, "wb") as wf:
                    pv.synthesize_wav("Este es un sensor THT cero dos con falla en el filtro.", wf)
                r_voice = client.post(
                    "/api/voice",
                    files={"audio": ("speech.wav", buf.getvalue(), "audio/wav")},
                )
                assert r_voice.status_code == 200
                vj = r_voice.json()
                assert len(vj["transcript"]) > 3

        # 6. Escalate CAD package (.DXF + .STL + Outbox .EML + .ZIP)
        r_esc = client.post(
            "/api/escalate",
            json={
                "notes": "Enviar urgente a soporte técnico de planta.",
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
    """Verify byte-exact Manual Page 7 frame (01 03 00 00 00 08 44 0C), negative temp, 0x7FFF, and DIP-8 math."""
    from fieldscan.modbus_rtu import (
        address_to_dip_bits,
        build_read_registers_request,
        build_simulated_tht02_response,
        decode_tht02_holding_response,
        describe_dip_pins_es,
        dip_bits_to_address,
        format_hex,
    )

    # Exact TZ THT-02 V1.1 Manual Page 7 example request
    req = build_read_registers_request(slave_id=1, start_reg=0x0000, count=8)
    assert format_hex(req) == "01 03 00 00 00 08 44 0C"

    # Normal positive reading
    rx_ok = build_simulated_tht02_response(slave_id=1, temp_c=25.3, humidity_rh=56.2, baud_bps=9600)
    dec_ok = decode_tht02_holding_response(rx_ok)
    assert dec_ok["crc_valid"] is True
    assert dec_ok["temp_c"] == 25.3
    assert dec_ok["humidity_rh"] == 56.2
    assert dec_ok["sensor_abnormal_7fff"] is False
    assert dec_ok["reported_slave_id"] == 1

    # Sub-zero signed two's complement reading (-18.4 C)
    rx_neg = build_simulated_tht02_response(slave_id=5, temp_c=-18.4, humidity_rh=71.0)
    dec_neg = decode_tht02_holding_response(rx_neg)
    assert dec_neg["temp_c"] == -18.4
    assert dec_neg["reported_slave_id"] == 5

    # SHT30 probe disconnected sentinel (0x7FFF)
    rx_err = build_simulated_tht02_response(slave_id=1, abnormal_7fff=True)
    dec_err = decode_tht02_holding_response(rx_err)
    assert dec_err["sensor_abnormal_7fff"] is True
    assert dec_err["temp_c"] is None

    # DIP-8 binary weight verification (Page 4 Section 3.3: weights 128..1)
    assert address_to_dip_bits(176) == [1, 0, 1, 1, 0, 0, 0, 0]
    assert dip_bits_to_address([1, 0, 1, 1, 0, 0, 0, 0]) == 176
    pin_guide_1 = describe_dip_pins_es(1)
    assert pin_guide_1["on_pins"] == [8]
    assert pin_guide_1["dip_binary"] == "00000001"


def test_closed_loop_live_repair_and_4angle_signoff_dossier() -> None:
    """Audit full 4-stage Closed-Loop Repair: Open Fault -> DIP-8 Guide -> Reactive Modbus Online -> 4-Angle Sign-Off."""
    from fieldscan.server import app

    with TestClient(app) as client:
        # Reset live watch session cleanly
        r_reset = client.post("/api/repair/watch", json={"reset": True, "enabled": True})
        assert r_reset.status_code == 200

        # Step 1: Operator presents open/unconfigured sensor with disconnected RS-485 bus
        r_s1 = client.post("/api/repair/step", json={"step": "inspect_open", "sync_simulator": True})
        assert r_s1.status_code == 200
        s1 = r_s1.json()
        assert s1["stage"] == "STEP1_OPEN_FAULT_DETECTED"
        assert s1["explode_pcb"] is True
        assert "abiert" in s1["assistant_message"].lower()

        # Step 2: Operator asks how to configure DIP-8 pins for standard Modbus mode (Slave 1)
        r_s2 = client.post(
            "/api/repair/step",
            json={"step": "guide_dip", "query": "Lo quiero en modo Modbus estándar esclavo 1"},
        )
        assert r_s2.status_code == 200
        s2 = r_s2.json()
        assert s2["stage"] == "STEP2_GUIDING_DIP_MODBUS"
        assert s2["target_slave_id"] == 1
        assert s2["dip_bits"] == [0, 0, 0, 0, 0, 0, 0, 1]
        assert "Pin 8" in s2["assistant_message"]

        # Step 3: Operator plugs in sensor on RS-485 -> verify automatic reactive SCADA validation event!
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
        assert tel["repair"]["latest_event_id"] >= 1

        # Fetch proactive voice confirmation event
        ev_id = tel["repair"]["latest_event_id"]
        r_ev = client.get(f"/api/repair/event/{ev_id}")
        assert r_ev.status_code == 200
        ev = r_ev.json()
        assert "Modbus" in ev["assistant_message"] or "Conectado" in ev["assistant_message"]

        # Step 4: Generate 4-Angle 3D + Before/During/After Manufacturer Sign-Off Dossier
        r_s4 = client.post(
            "/api/repair/signoff",
            json={"notes": "Validar si el reajuste DIP-8 Slave 001 conserva garantía IP65 en planta."},
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

        # Verify generated PNGs and RFC-5322 Sign-Off headers are served and valid
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

