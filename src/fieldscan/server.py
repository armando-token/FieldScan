"""FieldScan CAD — FastAPI Offline Orchestrator: OpenCV + USB-RS485 Modbus SCADA + Live Repair + Liquid LFM3 + AutoCAD/STL."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import os
from pathlib import Path
import re
from typing import Any

import cv2
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import psutil

from fieldscan.cad_exporter import build_escalation_package
from fieldscan.lfm_engine import MANUAL_PAGE_TITLES, get_lfm_engine
from fieldscan.live_repair import LiveRepairCoordinator
from fieldscan.modbus_rtu import ModbusRTUScanner, discover_serial_ports
from fieldscan.offline_guard import GLOBAL_OFFLINE_GUARD
from fieldscan.pdf_ingest import (
    DEFAULT_PDF_PATH,
    inspect_pdf_document,
    load_tht02_spec,
    match_and_load_sensor,
)
from fieldscan.vision_scanner import VisionScanner

PROJECT_ROOT = Path(__file__).resolve().parents[2]
STATIC_DIR = PROJECT_ROOT / "static"
ASSETS_DIR = PROJECT_ROOT / "assets"
EXPORTS_DIR = PROJECT_ROOT / "exports"
OUTBOX_DIR = PROJECT_ROOT / "outbox"

EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_DIR.mkdir(parents=True, exist_ok=True)

INITIAL_CAM_MODE = os.environ.get("FIELDSCAN_CAMERA_MODE", "sim_normal")
INITIAL_MODBUS_MODE = os.environ.get("FIELDSCAN_MODBUS_MODE", "auto")

_SCANNER = VisionScanner(initial_mode=INITIAL_CAM_MODE, auto_start=False)
_MODBUS = ModbusRTUScanner(initial_mode=INITIAL_MODBUS_MODE, target_slave_id=1, auto_start=False)
_REPAIR = LiveRepairCoordinator()


def _jpeg_to_png_bytes(jpeg_bytes: bytes) -> bytes | None:
    if not jpeg_bytes:
        return None
    arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None or bgr.size == 0:
        return None
    ok, png = cv2.imencode(".png", bgr)
    return png.tobytes() if ok else None


def _detect_conversational_repair_intent(text: str) -> str | None:
    """Detect natural English spoken/typed intents for interactive live repair & sign-off reporting."""
    q = (text or "").lower().strip()
    if not q:
        return None

    # 1. Step 4: Post-repair OEM sign-off & 4-angle dossier
    if any(
        phrase in q
        for phrase in (
            "sign off",
            "sign-off",
            "signoff",
            "manufacturer",
            "all angles",
            "four angles",
            "4 angles",
            "post-repair",
            "dossier",
            "report",
        )
    ):
        return "signoff_report"

    # 2. Step 1: Unpowered / open / unconfigured initial fault discovery
    if any(
        phrase in q
        for phrase in (
            "doesn't turn on",
            "does not turn on",
            "won't power on",
            "will not power on",
            "won't turn on",
            "not turning on",
            "unconfigured",
            "what should i do",
            "found this sensor",
            "not sure if it works",
        )
    ):
        return "inspect_open"

    if re.search(r"\bopen\b", q) and not re.search(r"\b(?:modbus|slave)\b", q):
        return "inspect_open"

    # 3. Step 2: Modbus-RTU / Slave ID / DIP-8 pin guidance
    if re.search(r"\b(?:modbus|slave|pins|dip)\b", q):
        return "guide_dip"

    return None


def _evaluate_live_reactive_watch() -> None:
    """Run lightweight transition check (only synthesizes TTS on actual state edge transitions)."""
    vision_tel = _SCANNER.get_telemetry()
    modbus_tel = _MODBUS.get_telemetry()
    engine = get_lfm_engine()
    _REPAIR.check_reactive_transitions(
        vision_tel=vision_tel,
        modbus_tel=modbus_tel,
        frame_jpeg=_SCANNER.get_latest_jpeg(),
        tts_fn=engine.synthesize_speech_b64,
    )


def _build_unified_status(run_socket_test: bool = False) -> dict[str, Any]:
    _evaluate_live_reactive_watch()
    vision_tel = _SCANNER.get_telemetry()
    modbus_tel = _MODBUS.get_telemetry()
    repair_state = _REPAIR.get_state()
    engine = get_lfm_engine()
    vm = psutil.virtual_memory()
    ram_used_gb = round((vm.total - vm.available) / (1024**3), 2)
    ram_total_gb = round(vm.total / (1024**3), 2)

    if run_socket_test or GLOBAL_OFFLINE_GUARD.verified_at is None:
        offline_info = GLOBAL_OFFLINE_GUARD.self_test()
    else:
        offline_info = {
            "offline_verified": True,
            "guard_active": True,
            "external_egress_blocked": True,
            "blocked_external_attempts": len(GLOBAL_OFFLINE_GUARD.blocked_attempts),
            "loopback_connections": GLOBAL_OFFLINE_GUARD.loopback_connections,
            "verified_at": GLOBAL_OFFLINE_GUARD.verified_at,
        }

    sys_info = {
        "model_name": engine.last_model_label,
        "ram_used_gb": ram_used_gb,
        "ram_total_gb": ram_total_gb,
        "cpu_percent": psutil.cpu_percent(interval=None),
        "last_latency_ms": engine.last_latency_ms,
        "tokens_per_sec": engine.last_tokens_per_sec,
    }

    return {
        "status": "ok",
        "sensor_id": "TZ-THT-02",
        "offline_verified": bool(offline_info["offline_verified"]),
        "blocked_external_attempts": offline_info["blocked_external_attempts"],
        "fps": vision_tel.get("fps", 30.0),
        "vision": vision_tel,
        "modbus": modbus_tel,
        "repair": repair_state,
        "system": sys_info,
        "offline": offline_info,
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    GLOBAL_OFFLINE_GUARD.self_test()
    inspect_pdf_document(DEFAULT_PDF_PATH)
    load_tht02_spec()
    _SCANNER.start()
    _MODBUS.start()
    yield
    _MODBUS.stop()
    _SCANNER.stop()


app = FastAPI(
    title="FieldScan CAD — TZ THT-02 Closed-Loop Offline Twin & SCADA Repair Studio",
    version="2.0.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")
app.mount("/exports", StaticFiles(directory=str(EXPORTS_DIR)), name="exports")
app.mount("/outbox", StaticFiles(directory=str(OUTBOX_DIR)), name="outbox")


@app.get("/", include_in_schema=False)
async def serve_index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/status")
@app.get("/api/telemetry")
@app.get("/api/health")
async def api_status() -> dict[str, Any]:
    return await asyncio.to_thread(_build_unified_status, False)


@app.get("/api/offline/verify")
@app.post("/api/offline/verify")
@app.get("/api/airplane/verify")
async def api_offline_verify() -> dict[str, Any]:
    report = GLOBAL_OFFLINE_GUARD.self_test()
    status = await asyncio.to_thread(_build_unified_status, False)
    status.update(report)
    return status


@app.get("/api/spec")
async def api_spec() -> dict[str, Any]:
    spec = load_tht02_spec()
    pdf_doc = inspect_pdf_document(DEFAULT_PDF_PATH)
    return {
        "sensor_id": spec["sensor_id"],
        "spec": spec,
        "pdf_document": pdf_doc,
        "camera_modes": _SCANNER.list_modes(),
        "serial_ports": discover_serial_ports(),
    }


@app.post("/api/sensor/load")
async def api_sensor_load(payload: dict[str, Any]) -> dict[str, Any]:
    raw_query = (
        payload.get("query")
        or payload.get("sensor_query")
        or payload.get("sensor_id")
        or "TZ THT-02"
    )
    match = match_and_load_sensor(str(raw_query))
    spec = match["spec"]
    dims = spec["dimensions_mm"]
    msg = (
        f"Local datasheet verified ({match['pdf_document']['page_count']} pages, "
        f"{match['pdf_document']['inspected_in_ms']} ms): input '{raw_query}' resolved to "
        f"{spec['name']} ({spec['sensor_id']}). Parametric CAD blueprint loaded: total length "
        f"{dims['total_length']} mm x outer diameter {dims['outer_diameter']} mm, SHT30/SHT3X CMOSens "
        f"probe element, and RS-485 Modbus-RTU bus."
    )
    engine = get_lfm_engine()
    audio_b64 = await asyncio.to_thread(engine.synthesize_speech_b64, msg)
    citations = [
        {"page": 1, "label": MANUAL_PAGE_TITLES[1]},
        {"page": 9, "label": MANUAL_PAGE_TITLES[9]},
    ]
    return {
        "matched": match["matched"],
        "sensor_id": match["sensor_id"],
        "resolved_model": match["sensor_id"],
        "matched_alias": match["matched_alias"],
        "confidence": match["confidence"],
        "manual_page": 9,
        "diagnosis": msg,
        "assistant_message": msg,
        "citations": citations,
        "manual_citations": citations,
        "audio_wav_b64": audio_b64,
        "pdf_inspected_ms": match["pdf_document"]["inspected_in_ms"],
        "spec": spec,
    }


@app.get("/api/video/telemetry")
async def api_video_telemetry() -> dict[str, Any]:
    return _SCANNER.get_telemetry()


@app.get("/api/video/snapshot")
async def api_video_snapshot(raw: bool = False) -> Response:
    jpg = await asyncio.to_thread(_SCANNER.get_raw_jpeg if raw else _SCANNER.get_latest_jpeg)
    return Response(
        content=jpg,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.get("/api/video/dip_crop")
async def api_video_dip_crop() -> Response:
    jpg = await asyncio.to_thread(_SCANNER.get_dip_focus_jpeg)
    return Response(
        content=jpg,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.get("/api/video/stream")
async def api_video_stream(request: Request, raw: bool = False) -> StreamingResponse:
    async def frame_generator():
        while True:
            if await request.is_disconnected():
                break
            jpg = _SCANNER.get_raw_jpeg() if raw else _SCANNER.get_latest_jpeg()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Cache-Control: no-store\r\n\r\n" + jpg + b"\r\n"
            )
            await asyncio.sleep(1.0 / 28.0)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.post("/api/video/mode")
@app.post("/api/camera/mode")
@app.post("/api/scanner/mode")
async def api_set_camera_mode(payload: dict[str, Any]) -> dict[str, Any]:
    mode = str(payload.get("mode") or "sim_normal").strip()
    await asyncio.to_thread(_SCANNER.set_mode, mode)
    return await asyncio.to_thread(_build_unified_status, False)


@app.post("/api/video/upload")
@app.post("/api/camera/upload")
@app.post("/api/scanner/upload")
async def api_upload_camera_frame(
    file: UploadFile | None = File(default=None),
    image: UploadFile | None = File(default=None),
) -> dict[str, Any]:
    upload = file or image
    if upload is None:
        raise HTTPException(status_code=400, detail="No image file uploaded")
    raw_bytes = await upload.read()
    try:
        await asyncio.to_thread(_SCANNER.inject_custom_frame, raw_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return await asyncio.to_thread(_build_unified_status, False)


# ==========================================================================
# MODBUS-RTU / FT2232HL USB-RS485 SCADA & INTERACTIVE LIVE REPAIR ENDPOINTS
# ==========================================================================
@app.get("/api/modbus/telemetry")
async def api_modbus_telemetry() -> dict[str, Any]:
    tel = _MODBUS.get_telemetry()
    tel["available_ports"] = discover_serial_ports()
    return tel


@app.post("/api/modbus/mode")
async def api_modbus_mode(payload: dict[str, Any]) -> dict[str, Any]:
    mode = str(payload.get("mode") or "auto").strip()
    slave_id = payload.get("target_slave_id") or payload.get("slave_id")
    baud_bps = payload.get("baud_bps")
    try:
        await asyncio.to_thread(
            _MODBUS.set_mode,
            mode,
            int(slave_id) if slave_id is not None else None,
            int(baud_bps) if baud_bps is not None else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return await asyncio.to_thread(_build_unified_status, False)


@app.post("/api/modbus/scan")
async def api_modbus_scan(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = payload or {}
    quick = bool(body.get("quick", True))
    scan_res = await asyncio.to_thread(_MODBUS.scan_hardware_bus, quick)
    status = await asyncio.to_thread(_build_unified_status, False)
    status["scan_result"] = scan_res
    return status


@app.get("/api/repair/event/{event_id}")
async def api_repair_event(event_id: int) -> dict[str, Any]:
    ev = _REPAIR.get_event_with_audio(event_id)
    if ev is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


@app.post("/api/repair/watch")
async def api_repair_watch(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("reset"):
        return _REPAIR.reset_session(live_watch=bool(payload.get("enabled", True)))
    return _REPAIR.set_live_watch(bool(payload.get("enabled", True)))


@app.post("/api/repair/step")
async def api_repair_step(payload: dict[str, Any]) -> dict[str, Any]:
    step = str(payload.get("step") or "").strip().lower()
    engine = get_lfm_engine()

    if step == "inspect_open":
        if payload.get("sync_simulator", True) and _SCANNER.get_telemetry().get("camera_source", "").startswith("simulator"):
            await asyncio.to_thread(_SCANNER.set_mode, "sim_open_dip")
            await asyncio.to_thread(_MODBUS.set_mode, "sim_disconnected")
        return await asyncio.to_thread(
            _REPAIR.start_open_inspection,
            _SCANNER.get_telemetry(),
            _MODBUS.get_telemetry(),
            _SCANNER.get_latest_jpeg(),
            engine.synthesize_speech_b64,
        )

    if step == "guide_dip":
        text = str(payload.get("query") or payload.get("text") or "Configure for Industrial Modbus RTU slave 1")
        res = await asyncio.to_thread(
            _REPAIR.guide_dip_for_modbus,
            text,
            _SCANNER.get_latest_jpeg(),
            payload.get("dip_address"),
            engine.synthesize_speech_b64,
        )
        await asyncio.to_thread(_MODBUS.set_target_slave, int(res["target_slave_id"]))
        return res

    if step == "connect_modbus":
        # If real USB-RS485 adapter is attached, probe hardware first; otherwise switch simulator to online
        ports = discover_serial_ports()
        target_sid = int(payload.get("slave_id") or _REPAIR.target_slave_id or 1)
        if ports and not payload.get("force_sim"):
            await asyncio.to_thread(_MODBUS.set_mode, "hardware", target_sid)
        else:
            if _SCANNER.get_telemetry().get("camera_source", "").startswith("simulator"):
                await asyncio.to_thread(_SCANNER.set_mode, "sim_normal")
            await asyncio.to_thread(_MODBUS.set_mode, "sim_online", target_sid)
        status = await asyncio.to_thread(_build_unified_status, False)
        ev_id = status["repair"].get("latest_event_id")
        ev = _REPAIR.get_event_with_audio(ev_id) if ev_id else None
        return ev or status

    if step == "breath_test":
        target_sid = int(payload.get("slave_id") or _REPAIR.target_slave_id or 1)
        await asyncio.to_thread(_MODBUS.set_mode, "sim_breath_test", target_sid)
        return await asyncio.to_thread(_build_unified_status, False)

    raise HTTPException(status_code=400, detail=f"Unknown repair step '{step}'")


@app.post("/api/repair/signoff")
async def api_repair_signoff(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = payload or {}
    spec = load_tht02_spec()
    engine = get_lfm_engine()
    pkg = await asyncio.to_thread(
        _REPAIR.generate_signoff_dossier,
        spec=spec,
        exports_dir=EXPORTS_DIR,
        outbox_dir=OUTBOX_DIR,
        modbus_tel=_MODBUS.get_telemetry(),
        latest_camera_jpeg=_SCANNER.get_latest_jpeg(),
        cad_views_b64=body.get("cad_views_b64"),
        operator_notes=str(body.get("notes") or body.get("operator_notes") or ""),
        tts_fn=engine.synthesize_speech_b64,
    )
    return pkg


async def _handle_multimodal_or_live_repair_query(
    query: str,
    include_camera: bool,
    zone_hint: str | None,
    dip_address: int | None,
    cad_views_b64: dict[str, str] | None = None,
) -> dict[str, Any]:
    engine = get_lfm_engine()
    intent = _detect_conversational_repair_intent(query)

    if intent == "inspect_open":
        return await asyncio.to_thread(
            _REPAIR.start_open_inspection,
            _SCANNER.get_telemetry(),
            _MODBUS.get_telemetry(),
            _SCANNER.get_latest_jpeg(),
            engine.synthesize_speech_b64,
        )

    if intent == "guide_dip":
        res = await asyncio.to_thread(
            _REPAIR.guide_dip_for_modbus,
            query,
            _SCANNER.get_latest_jpeg(),
            dip_address,
            engine.synthesize_speech_b64,
        )
        await asyncio.to_thread(_MODBUS.set_target_slave, int(res["target_slave_id"]))
        return res

    if intent == "signoff_report":
        spec = load_tht02_spec()
        pkg = await asyncio.to_thread(
            _REPAIR.generate_signoff_dossier,
            spec=spec,
            exports_dir=EXPORTS_DIR,
            outbox_dir=OUTBOX_DIR,
            modbus_tel=_MODBUS.get_telemetry(),
            latest_camera_jpeg=_SCANNER.get_latest_jpeg(),
            cad_views_b64=cad_views_b64,
            operator_notes=query,
            tts_fn=engine.synthesize_speech_b64,
        )
        return {
            "stage": pkg["stage"],
            "andon_state": pkg["andon_state"],
            "focus_dip": False,
            "explode_pcb": False,
            "diagnosis": pkg["spoken_summary"],
            "assistant_message": pkg["spoken_summary"],
            "manual_page": 9,
            "citations": [
                {"page": 5, "label": MANUAL_PAGE_TITLES[5]},
                {"page": 7, "label": MANUAL_PAGE_TITLES[7]},
                {"page": 9, "label": MANUAL_PAGE_TITLES[9]},
            ],
            "manual_citations": [
                {"page": 5, "label": MANUAL_PAGE_TITLES[5]},
                {"page": 9, "label": MANUAL_PAGE_TITLES[9]},
            ],
            "audio_wav_b64": pkg["audio_wav_b64"],
            "signoff_package": pkg,
            "model": "FieldScan Closed-Loop Sign-Off Engine",
        }

    spec = load_tht02_spec()
    frame_jpg = _SCANNER.get_latest_jpeg() if include_camera else None
    tel = _SCANNER.get_telemetry() if include_camera else None
    mb_tel = _MODBUS.get_telemetry()

    return await asyncio.to_thread(
        engine.diagnose_sensor,
        query=query,
        spec=spec,
        frame_jpeg=frame_jpg,
        scanner_telemetry=tel,
        modbus_telemetry=mb_tel,
        zone_hint=zone_hint,
        dip_address=dip_address,
    )


@app.post("/api/diagnose")
async def api_diagnose(payload: dict[str, Any]) -> dict[str, Any]:
    query = str(payload.get("query") or payload.get("prompt") or "").strip()
    if not query:
        query = "Diagnose the current condition of the TZ THT-02 sensor on camera and RS-485 bus per Manual V1.1."

    include_camera = bool(payload.get("include_camera", True))
    zone_hint = payload.get("zone") or payload.get("highlighted_zone")
    dip_address = payload.get("dip_address")
    if isinstance(dip_address, str) and dip_address.isdigit():
        dip_address = int(dip_address)

    return await _handle_multimodal_or_live_repair_query(
        query=query,
        include_camera=include_camera,
        zone_hint=zone_hint,
        dip_address=dip_address if isinstance(dip_address, int) else None,
        cad_views_b64=payload.get("cad_views_b64"),
    )


@app.post("/api/voice")
async def api_voice(
    audio: UploadFile | None = File(default=None),
    file: UploadFile | None = File(default=None),
    include_camera: str = Form(default="true"),
    dip_address: str | None = Form(default=None),
) -> dict[str, Any]:
    upload = audio or file
    if upload is None:
        raise HTTPException(status_code=400, detail="Missing audio upload")

    audio_bytes = await upload.read()
    engine = get_lfm_engine()
    asr_res = await asyncio.to_thread(
        engine.transcribe_audio,
        audio_bytes,
        upload.filename or "speech.wav",
    )
    transcript = asr_res["transcript"]
    sensor_match = match_and_load_sensor(transcript)

    use_cam = include_camera.lower() not in ("false", "0", "no")
    dip_int = int(dip_address) if (dip_address and dip_address.isdigit()) else None

    diag = await _handle_multimodal_or_live_repair_query(
        query=transcript,
        include_camera=use_cam,
        zone_hint=None,
        dip_address=dip_int,
    )
    diag["transcript"] = transcript
    diag["asr_ms"] = asr_res["asr_ms"]
    diag["sensor_id"] = sensor_match["sensor_id"]
    diag["matched_alias"] = sensor_match["matched_alias"]
    return diag


@app.post("/api/escalate")
async def api_escalate(payload: dict[str, Any]) -> dict[str, Any]:
    spec = load_tht02_spec()
    if payload.get("signoff_mode") or payload.get("cad_views_b64"):
        engine = get_lfm_engine()
        return await asyncio.to_thread(
            _REPAIR.generate_signoff_dossier,
            spec=spec,
            exports_dir=EXPORTS_DIR,
            outbox_dir=OUTBOX_DIR,
            modbus_tel=_MODBUS.get_telemetry(),
            latest_camera_jpeg=_SCANNER.get_latest_jpeg(),
            cad_views_b64=payload.get("cad_views_b64"),
            operator_notes=str(payload.get("notes") or payload.get("operator_notes") or ""),
            tts_fn=engine.synthesize_speech_b64,
        )

    tel = _SCANNER.get_telemetry()
    fault_zone = (
        payload.get("fault_zone")
        or payload.get("highlighted_zone")
        or tel.get("anomaly_zone")
        or "strainer_head"
    )
    diagnosis_text = str(
        payload.get("diagnosis_text")
        or payload.get("diagnosis_summary")
        or "Fault localized via optical inspection and TZ THT-02 Datasheet V1.1."
    )
    notes = str(payload.get("notes") or payload.get("operator_notes") or "")
    dip_addr = payload.get("dip_address")
    if dip_addr is not None and "DIP" not in notes:
        notes = f"{notes} | DIP-8 Slave Address: {dip_addr}".strip(" |")

    hud_jpg = await asyncio.to_thread(_SCANNER.get_latest_jpeg)
    cam_png = await asyncio.to_thread(_jpeg_to_png_bytes, hud_jpg)

    pkg = await asyncio.to_thread(
        build_escalation_package,
        spec=spec,
        exports_dir=EXPORTS_DIR,
        outbox_dir=OUTBOX_DIR,
        fault_zone=str(fault_zone),
        diagnosis_text=diagnosis_text,
        camera_png_bytes=cam_png,
        operator_notes=notes,
    )
    pkg["status"] = "queued_offline"
    pkg["outbox_path"] = pkg["eml_path"]
    pkg["snapshot_url"] = pkg["png_url"]
    pkg["email"] = pkg["email_preview"]
    return pkg
