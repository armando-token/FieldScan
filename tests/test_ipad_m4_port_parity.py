"""Comprehensive iPad Air M4 (12 GB) Port Parity & iOS Sandbox Compliance Test Suite."""

from __future__ import annotations

import io
import math
from pathlib import Path
import plistlib
import socket
import subprocess
import wave

import cv2
from fastapi.testclient import TestClient
import numpy as np
import pytest

from fieldscan.lfm_engine import (
    _normalize_wav_to_16khz_mono_in_memory,
    _transcode_to_16khz_mono_wav,
)
from fieldscan.modbus_rtu import (
    ModbusRTUScanner,
    _poll_tcp_rs485_bridge,
    decode_tht02_holding_response,
    discover_serial_ports,
    format_hex,
    verify_crc16,
)
from fieldscan.offline_guard import GLOBAL_OFFLINE_GUARD, is_allowed_local_host
from fieldscan.vision_scanner import VisionScanner

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _make_test_wav(sample_rate: int = 48000, channels: int = 2, sampwidth: int = 2, duration_s: float = 0.25) -> bytes:
    """Synthesize a deterministic sine-wave WAV with arbitrary sample rate, channels, and sample width."""
    num_frames = int(sample_rate * duration_s)
    t = np.linspace(0.0, duration_s, num_frames, endpoint=False, dtype=np.float32)
    sine = 0.4 * np.sin(2.0 * math.pi * 440.0 * t)
    if channels > 1:
        sine = np.tile(sine[:, None], (1, channels)).reshape(-1)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        if sampwidth == 1:
            pcm = np.clip((sine * 127.0) + 128.0, 0, 255).astype(np.uint8).tobytes()
        elif sampwidth == 2:
            pcm = np.clip(sine * 32767.0, -32768, 32767).astype("<i2").tobytes()
        elif sampwidth == 4:
            pcm = np.clip(sine * 2147483647.0, -2147483648, 2147483647).astype("<i4").tobytes()
        else:
            raise ValueError(f"Unsupported test sampwidth: {sampwidth}")
        wf.writeframes(pcm)
    return buf.getvalue()


def test_in_memory_16khz_wav_without_ffmpeg(monkeypatch: pytest.MonkeyPatch) -> None:
    """Gate G03: Verify 16 kHz mono PCM WAV conversion runs 100% in memory with subprocess.run forbidden."""
    monkeypatch.setenv("FIELDSCAN_PLATFORM", "ios")
    monkeypatch.setenv("FIELDSCAN_NO_SUBPROCESS", "1")

    def _forbidden_subprocess_run(*args, **kwargs):
        raise RuntimeError("subprocess.run is strictly forbidden inside iPadOS sandbox")

    monkeypatch.setattr(subprocess, "run", _forbidden_subprocess_run)

    for sr, ch, sw in ((48000, 2, 2), (44100, 1, 2), (24000, 2, 1), (32000, 1, 4)):
        raw_wav = _make_test_wav(sample_rate=sr, channels=ch, sampwidth=sw, duration_s=0.2)
        norm_wav = _transcode_to_16khz_mono_wav(raw_wav)
        assert norm_wav[:4] == b"RIFF"
        assert norm_wav[8:12] == b"WAVE"
        with wave.open(io.BytesIO(norm_wav), "rb") as wf:
            assert wf.getnchannels() == 1
            assert wf.getsampwidth() == 2
            assert wf.getframerate() == 16000
            assert wf.getnframes() > 2500

    # Also test raw headerless PCM fallback on iOS without ffmpeg
    raw_pcm = (np.sin(np.linspace(0, 20, 3200)) * 12000).astype("<i2").tobytes()
    wrapped = _transcode_to_16khz_mono_wav(raw_pcm)
    assert wrapped[:4] == b"RIFF"
    with wave.open(io.BytesIO(wrapped), "rb") as wf:
        assert wf.getframerate() == 16000
        assert wf.getnchannels() == 1


def test_vision_scanner_ios_inprocess_and_ipad_camera_stream(monkeypatch: pytest.MonkeyPatch) -> None:
    """Gate G04: Verify VisionScanner runs all 5 simulator modes + live iPad camera stream with zero subprocesses."""
    monkeypatch.setenv("FIELDSCAN_PLATFORM", "ios")
    monkeypatch.setenv("FIELDSCAN_NO_SUBPROCESS", "1")

    def _forbidden_popen(*args, **kwargs):
        raise RuntimeError("subprocess.Popen is strictly forbidden inside iPadOS sandbox")

    monkeypatch.setattr(subprocess, "Popen", _forbidden_popen)

    scanner = VisionScanner(initial_mode="ipad_camera", auto_start=False)
    modes = scanner.list_modes()
    assert any(m["id"] == "ipad_camera" for m in modes)

    # Standby frame before first iPad frame arrives
    t_wait = scanner.step_once()
    assert t_wait["mode"] == "ipad_camera"
    assert t_wait["detected"] is False

    # Synthesize a realistic open-DIP workbench frame and push it as a live iPad Air M4 camera frame
    open_bgr = scanner.synth.render_frame("sim_open_dip", t_sec=0.5)
    ok, enc_jpg = cv2.imencode(".jpg", open_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    assert ok is True

    tel_live = scanner.push_live_camera_frame(enc_jpg.tobytes(), source_label="ipad:avfoundation:back")
    assert tel_live["detected"] is True
    assert tel_live["pcb_open_detected"] is True
    assert tel_live["anomaly_zone"] == "upper_barrel_dip"
    assert tel_live["camera_source"] == "ipad:avfoundation:back"

    # Stepping while stream is fresh preserves live iPad telemetry
    tel_step = scanner.step_once()
    assert tel_step["detected"] is True
    assert tel_step["camera_source"] == "ipad:avfoundation:back"

    # Verify FastAPI endpoint /api/video/ipad_frame (both raw JPEG body and multipart upload)
    from fieldscan.server import app

    with TestClient(app) as client:
        r_raw = client.post(
            "/api/video/ipad_frame?source=ipad:m4:back",
            content=enc_jpg.tobytes(),
            headers={"Content-Type": "image/jpeg"},
        )
        assert r_raw.status_code == 200
        js_raw = r_raw.json()
        assert js_raw["vision"]["detected"] is True
        assert js_raw["vision"]["pcb_open_detected"] is True

        r_mp = client.post(
            "/api/camera/ipad_frame",
            files={"frame": ("ipad_frame.jpg", enc_jpg.tobytes(), "image/jpeg")},
        )
        assert r_mp.status_code == 200
        assert r_mp.json()["vision"]["detected"] is True


def test_modbus_tcp_rs485_usb_bridge_and_linklocal_offline_guard(monkeypatch: pytest.MonkeyPatch) -> None:
    """Gate G02 & G10: Verify USB-C link-local (169.254.x.x) allowance, external block, and TCP-to-RS485 bridge."""
    import sys

    scripts_dir = str(PROJECT_ROOT / "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    from start_rs485_usb_bridge import start_background_bridge

    # Verify offline guard permits loopback and 169.254.x.x USB-C tether while blocking public IPs
    monkeypatch.setenv("FIELDSCAN_ALLOW_USB_TETHER", "1")
    assert is_allowed_local_host("127.0.0.1") is True
    assert is_allowed_local_host("169.254.37.69") is True
    assert is_allowed_local_host("169.254.45.65") is True
    assert is_allowed_local_host("8.8.8.8") is False

    guard_report = GLOBAL_OFFLINE_GUARD.self_test()
    assert guard_report["offline_verified"] is True
    assert guard_report["external_egress_blocked"] is True

    # Start simulated FT2232HL TCP bridge on ephemeral loopback port
    server, bound_host, port = start_background_bridge(
        host="127.0.0.1",
        port=0,
        sim_slave=1,
        sim_temp_c=24.6,
        sim_humidity_rh=52.8,
    )
    try:
        endpoint = f"{bound_host}:{port}"
        monkeypatch.setenv("FIELDSCAN_RS485_BRIDGE", f"tcp://{endpoint}")
        ports = discover_serial_ports()
        assert any(p.get("device") == f"tcp://{endpoint}" for p in ports)

        tx_bytes, rx_bytes = _poll_tcp_rs485_bridge(endpoint, slave_id=1, baud_bps=9600, timeout_s=0.5)
        assert format_hex(tx_bytes) == "01 03 00 00 00 08 44 0C"
        assert len(rx_bytes) == 21
        assert verify_crc16(rx_bytes) is True
        decoded = decode_tht02_holding_response(rx_bytes)
        assert decoded["crc_valid"] is True
        assert decoded["temp_c"] == 24.6
        assert decoded["humidity_rh"] == 52.8
        assert decoded["reported_slave_id"] == 1

        scanner = ModbusRTUScanner(initial_mode="hardware", target_slave_id=1, auto_start=False)
        tel = scanner.step_once()
        assert tel["online"] is True
        assert tel["healthy"] is True
        assert tel["temp_c"] == 24.6
        assert tel["humidity_rh"] == 52.8
    finally:
        server.shutdown()
        server.server_close()


def test_xcode_ipad_m4_project_and_12gb_entitlements() -> None:
    """Gate G07 & G08: Audit Xcode project structure, 12 GB memory entitlements, and Swift bridges."""
    ios_dir = PROJECT_ROOT / "ios"
    pbxproj = ios_dir / "FieldScanM4.xcodeproj" / "project.pbxproj"
    entitlements_path = ios_dir / "FieldScanM4" / "FieldScanM4.entitlements"
    info_plist_path = ios_dir / "FieldScanM4" / "Info.plist"
    build_script = PROJECT_ROOT / "scripts" / "build_ipad_m4_app.sh"
    doc_08 = PROJECT_ROOT / "docs" / "08_IPAD_AIR_M4_12GB_NATIVE_APP_GLUE.md"

    assert pbxproj.is_file()
    assert entitlements_path.is_file()
    assert info_plist_path.is_file()
    assert build_script.is_file()
    assert doc_08.is_file()

    ent = plistlib.loads(entitlements_path.read_bytes())
    assert ent.get("com.apple.developer.kernel.increased-memory-limit") is True

    info = plistlib.loads(info_plist_path.read_bytes())
    assert info.get("UIFileSharingEnabled") is True
    assert "NSCameraUsageDescription" in info
    assert "NSMicrophoneUsageDescription" in info

    for swift_file in (
        "AppDelegate.swift",
        "SceneDelegate.swift",
        "FieldScanRuntimeConfig.swift",
        "LlamaServerBridge.swift",
        "PythonRuntimeBridge.swift",
        "NativeCameraBridge.swift",
        "FieldScanWebViewController.swift",
    ):
        assert (ios_dir / "FieldScanM4" / swift_file).is_file(), f"Missing {swift_file}"
