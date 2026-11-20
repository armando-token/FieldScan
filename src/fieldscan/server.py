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
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
import psutil

from fieldscan.cad_exporter import build_escalation_package
from fieldscan.calibration_planned import (
    evaluate_calibration_comparison_contract,
    get_planned_calibration_card,
)
from fieldscan.catalog_client import FieldScanCatalogClient
from fieldscan.catalog_store import CatalogDomainError, FieldScanPackageStore
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
from fieldscan.profiles_and_manual import (
    load_all_profiles,
    resolve_device_profile,
    verify_resource_manifest,
)
from fieldscan.session_engine import (
    CONTRACT_VERSION,
    FieldScanSessionEngine,
    SessionDomainError,
)
from fieldscan.vision_scanner import VisionScanner

PROJECT_ROOT = Path(__file__).resolve().parents[2]
STATIC_DIR = PROJECT_ROOT / "static"
ASSETS_DIR = PROJECT_ROOT / "assets"
EXPORTS_DIR = PROJECT_ROOT / "exports"
OUTBOX_DIR = PROJECT_ROOT / "outbox"

EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_DIR.mkdir(parents=True, exist_ok=True)

INITIAL_CAM_MODE = os.environ.get("FIELDSCAN_CAMERA_MODE", "usb")
INITIAL_MODBUS_MODE = os.environ.get("FIELDSCAN_MODBUS_MODE", "auto")

_SCANNER = VisionScanner(initial_mode=INITIAL_CAM_MODE, auto_start=False)
_MODBUS = ModbusRTUScanner(initial_mode=INITIAL_MODBUS_MODE, target_slave_id=1, auto_start=False)
_REPAIR = LiveRepairCoordinator()
_CATALOG_STORE = FieldScanPackageStore(
    catalog_root=PROJECT_ROOT / "data" / "FieldScanCatalog",
    bundle_root=PROJECT_ROOT,
)
_CATALOG_CLIENT = FieldScanCatalogClient(_CATALOG_STORE)
_SESSIONS = FieldScanSessionEngine(
    exports_dir=EXPORTS_DIR,
    project_root=PROJECT_ROOT,
    catalog_store=_CATALOG_STORE,
)

_SIMULATED_VISUAL_DIP_ADDRESS: int = 1
_ACTIVE_SCENE_GENERATION: int = 1
_LATEST_SCENE_READY_TURN: dict[str, Any] = {}


def _resolve_effective_context(
    session_id: str | None = None,
    manifest_sha256: str | None = None,
) -> dict[str, Any]:
    m_sha = (manifest_sha256 or "").strip()
    if m_sha:
        if m_sha == "bundle" or m_sha.startswith("bundle-"):
            return _CATALOG_STORE.build_bundle_default_context()
        try:
            pkg = _CATALOG_STORE.get_installed_package(m_sha)
            m_obj = pkg["manifest"]
            homologated = bool(m_obj.get("bench_modbus_homologated", False))
            return {
                "product_id": pkg["product_id"],
                "variant_id": pkg["variant_id"],
                "title": m_obj.get("title") or f"{pkg['product_id']} ({pkg['variant_id']})",
                "publication_seq": pkg["publication_seq"],
                "manifest_sha256": m_sha,
                "local_profile_id": m_obj.get("bench_profile_id") if homologated else None,
                "content_origin": "catalog",
                "bench_modbus_homologated": homologated,
                "capabilities": pkg["capabilities"],
            }
        except CatalogDomainError:
            pass

    sid_to_check = (session_id or "").strip() or _SESSIONS._active_session_id
    if sid_to_check:
        try:
            snap = _SESSIONS.get_session(sid_to_check)
            if (snap.get("status") == "open" or bool(session_id)) and isinstance(snap.get("catalog_context"), dict):
                cat_ctx = snap["catalog_context"]
                if cat_ctx.get("content_origin") == "catalog" and cat_ctx.get("manifest_sha256"):
                    return dict(cat_ctx)
        except SessionDomainError:
            pass
    return _CATALOG_STORE.get_selected_context()


def _enrich_vision_telemetry(raw_tel: dict[str, Any], eff_ctx: dict[str, Any] | None = None) -> dict[str, Any]:
    tel = dict(raw_tel or {})
    ctx = eff_ctx or _resolve_effective_context()
    is_calibrated_tht02 = ctx.get("product_id") == "tzone_tht02" and ctx.get("content_origin") != "catalog"
    occluded = bool(
        tel.get("hand_detected")
        or tel.get("tool_detected")
        or tel.get("white_sticker_occluded")
        or not tel.get("detected", False)
    )
    tel["detector_applicability"] = (
        "calibrated_tht02_140x16mm" if is_calibrated_tht02 else "generic_cylinder_manual_confirmation"
    )
    if not is_calibrated_tht02:
        tel["evidence_state"] = "manual_confirmation_required"
    elif occluded:
        tel["evidence_state"] = "uncertain_occluded"
    else:
        tel["evidence_state"] = "observed"
    return tel


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
    """Detect explicit workflow action commands while letting natural questions go to interactive LFM3-VL-2B."""
    q = (text or "").lower().strip()
    if not q:
        return None

    # Never hijack conversational greetings or natural questions — route them to interactive VLM
    if q.endswith("?") or q.startswith("\u00bf") or re.match(
        r"^(?:hola|buenos|buenas|hey|hi|hello|good\s+(?:morning|afternoon|evening)|"
        r"what|which|how|why|where|who|when|can\s+you|could\s+you|explain|tell\s+me|"
        r"que|cual|como|por\s+que|donde|en\s+que|puedes|me\s+escuchas|muestrame|dime|"
        r"is\s+the|are\s+the|do\s+i|does\s+it)\b",
        q,
    ):
        return None

    # 1. Step 4: Explicit post-repair OEM sign-off & 4-angle dossier command
    if any(
        phrase in q
        for phrase in (
            "sign off",
            "sign-off",
            "signoff",
            "all angles",
            "four angles",
            "4 angles",
            "post-repair",
            "dossier",
            "generate report",
            "compile report",
            "manufacturer report",
        )
    ):
        return "signoff_report"

    # 2. Step 1: Explicit unpowered / open housing initial repair trigger
    if any(
        phrase in q
        for phrase in (
            "doesn't turn on",
            "does not turn on",
            "won't power on",
            "will not power on",
            "won't turn on",
            "not turning on",
            "housing is open",
            "sensor is open",
            "open and unconfigured",
        )
    ):
        return "inspect_open"

    # 3. Step 2: Explicit imperative command to configure/set DIP-8 switches or Modbus Slave ID
    if re.search(
        r"\b(?:configure|set|setup|set\s+up|guide|assign)\b.*\b(?:dip|slave|pins|address)\b",
        q,
    ):
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
    eff_ctx = _resolve_effective_context()
    vision_tel = _enrich_vision_telemetry(_SCANNER.get_telemetry(), eff_ctx)
    modbus_tel = _MODBUS.get_telemetry()
    repair_state = _REPAIR.get_state()
    engine = get_lfm_engine()
    vm = psutil.virtual_memory()
    ram_used_gb = round((vm.total - vm.available) / (1024**3), 2)
    ram_total_gb = round(vm.total / (1024**3), 2)

    sync_tel = _CATALOG_CLIENT.get_sync_telemetry()
    sync_on = bool(sync_tel.get("sync_enabled"))
    https_emitted = int(sync_tel.get("https_requests_emitted") or 0)

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
    strictly_offline = bool(offline_info["offline_verified"]) and (not sync_on) and (https_emitted == 0)
    offline_info = {
        **offline_info,
        "offline_verified": strictly_offline,
        "external_egress_blocked": bool(offline_info["external_egress_blocked"]) and (not sync_on),
        "egress_policy": sync_tel["egress_policy"],
        "local_listener_scope": "loopback_127.0.0.1",
        "https_requests_emitted": https_emitted,
    }

    sys_info = {
        "model_name": engine.last_model_label,
        "ram_used_gb": ram_used_gb,
        "ram_total_gb": ram_total_gb,
        "cpu_percent": psutil.cpu_percent(interval=None),
        "last_latency_ms": engine.last_latency_ms,
        "tokens_per_sec": engine.last_tokens_per_sec,
    }

    sensor_id_out = "TZ-THT-02" if eff_ctx.get("product_id") == "tzone_tht02" else str(eff_ctx.get("product_id", "")).upper()
    return {
        "status": "ok",
        "contract_version": CONTRACT_VERSION,
        "sensor_id": sensor_id_out,
        "active_context": eff_ctx,
        "scene_generation": _ACTIVE_SCENE_GENERATION,
        "simulated_visual_dip_address": _SIMULATED_VISUAL_DIP_ADDRESS,
        "authorized_bus_slave_id": int(modbus_tel.get("target_slave_id") or 1),
        "local_listener_scope": "loopback_127.0.0.1",
        "offline_verified": strictly_offline,
        "blocked_external_attempts": offline_info["blocked_external_attempts"],
        "catalog_sync": sync_tel,
        "fps": vision_tel.get("fps", 30.0),
        "vision": vision_tel,
        "modbus": modbus_tel,
        "repair": repair_state,
        "system": sys_info,
        "offline": offline_info,
        "calibration_extension": {"status": "planned", "pilot_writes_enabled": False},
    }


def _build_capabilities_payload() -> dict[str, Any]:
    engine = get_lfm_engine()
    ai_health = engine.check_health()
    ports = discover_serial_ports()
    gw_cfg = _MODBUS.get_gateway_config()
    mb_tel = _MODBUS.get_telemetry()
    manifest_check = verify_resource_manifest()
    profiles = load_all_profiles()

    mb_mode = str(mb_tel.get("mode", "auto"))
    if mb_mode.startswith("sim"):
        topology_mode = "explicit_simulation"
    elif mb_mode == "pusr_tcp":
        topology_mode = "mac_local_bench_pusr"
    elif os.environ.get("FIELDSCAN_ALLOW_USB_TETHER", "1") == "1":
        topology_mode = "mac_usb_tether"
    else:
        topology_mode = "mac_local_bench"

    return {
        "contract_version": CONTRACT_VERSION,
        "backend_runtime": "python_fastapi",
        "topology_mode": topology_mode,
        "pilot_readonly_enforced": True,
        "pilot_writes_enabled": False,
        "andon_hardware_writes_enabled": False,
        "providers": {
            "ai": {
                "active_provider_id": ai_health["provider_id"],
                "active_provider_label": ai_health["provider_label"],
                "vl_online": ai_health["vl_online"],
                "effective_vl_model_id": ai_health["effective_vl_model_id"],
                "local_rules_available": True,
            },
            "voice": {
                "audio_asr_online": ai_health["audio_online"],
                "effective_audio_model_id": ai_health["effective_audio_model_id"],
                "tts_ready": ai_health["tts_ready"],
                "piper_voice": ai_health["piper_voice"],
                "supported_intent_languages": ["en", "es"],
            },
        },
        "modbus": {
            "active_mode": mb_mode,
            "serial_ports_detected": ports,
            "pusr_gateway": gw_cfg,
            "legacy_bridge_port_5502_framing": "rtu_over_tcp_bridge",
            "pusr_gateway_framing": "modbus_tcp_mbap",
            "tx_audit_count": len(_MODBUS.tx_audit_log),
        },
        "camera": {
            "active_mode": _SCANNER.get_telemetry().get("mode"),
            "available_modes": _SCANNER.list_modes(),
        },
        "profiles": {
            pid: {
                "model": p.get("model"),
                "validation_status": p.get("validation_status"),
                "tested_revision": p.get("tested_profile_revision"),
                "profile_sha256": p.get("_profile_sha256"),
            }
            for pid, p in profiles.items()
        },
        "resource_manifest": manifest_check,
        "exports": {
            "formats": ["pdf", "json", "dxf", "stl", "png", "eml", "zip"],
            "profiles": ["intervention", "simulated_demo"],
        },
        "calibration_extension": get_planned_calibration_card(),
        "planned_calibration": get_planned_calibration_card(),
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _CATALOG_STORE.recover_on_boot()
    GLOBAL_OFFLINE_GUARD.self_test()
    inspect_pdf_document(DEFAULT_PDF_PATH)
    load_tht02_spec()
    _SCANNER.start()
    _MODBUS.start()
    yield
    _MODBUS.stop()
    _SCANNER.stop()


app = FastAPI(
    title="FieldScan CAD — TZ THT-02 Closed-Loop Offline Twin & Bench Maintenance Studio",
    version="2.1.0",
    lifespan=lifespan,
)


@app.exception_handler(SessionDomainError)
async def _handle_session_domain_error(_request: Request, exc: SessionDomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.exception_handler(CatalogDomainError)
async def _handle_catalog_domain_error(_request: Request, exc: CatalogDomainError) -> JSONResponse:
    body = exc.to_dict()
    if hasattr(exc, "retry_after_s"):
        body["retry_after_s"] = getattr(exc, "retry_after_s")
    return JSONResponse(status_code=exc.status_code, content=body)

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
    sync_tel = status["catalog_sync"]
    strictly_offline = (
        bool(report["offline_verified"])
        and (not sync_tel["sync_enabled"])
        and (int(sync_tel["https_requests_emitted"]) == 0)
    )
    status.update(report)
    status["offline_verified"] = strictly_offline
    status["offline"]["offline_verified"] = strictly_offline
    return status


@app.get("/api/spec")
async def api_spec(
    query: str | None = None,
    session_id: str | None = None,
    manifest_sha256: str | None = None,
) -> dict[str, Any]:
    if query and query.strip():
        resolved = await asyncio.to_thread(_CATALOG_STORE.resolve_asset_query, query.strip())
        if not resolved.get("matched"):
            return {
                "matched": False,
                "resolution": resolved.get("resolution", "unknown"),
                "identity_status": resolved.get("identity_status", "unknown_pending_identity"),
                "sensor_id": None,
                "resolved_model": None,
                "spec": None,
                "candidates": resolved.get("candidates", []),
                "discriminant_prompt": resolved.get("discriminant_prompt"),
            }
    eff_ctx = _resolve_effective_context(session_id=session_id, manifest_sha256=manifest_sha256)
    spec = load_tht02_spec()
    pdf_doc = inspect_pdf_document(DEFAULT_PDF_PATH)
    try:
        descriptor = _CATALOG_STORE.build_scene_and_manual_descriptor(eff_ctx)
    except CatalogDomainError:
        descriptor = _CATALOG_STORE.build_scene_and_manual_descriptor(_CATALOG_STORE.build_bundle_default_context())
    sensor_id_out = "TZ-THT-02" if eff_ctx.get("product_id") == "tzone_tht02" else str(eff_ctx.get("product_id") or "").upper()
    return {
        "sensor_id": sensor_id_out,
        "active_context": eff_ctx,
        "catalog_descriptor": descriptor,
        "cad_exports_supported": descriptor.get("cad_exports_supported", ["dxf", "stl", "pdf", "json"]),
        "spec": spec,
        "pdf_document": pdf_doc,
        "camera_modes": _SCANNER.list_modes(),
        "serial_ports": discover_serial_ports(),
    }


@app.post("/api/sensor/load")
async def api_sensor_load(payload: dict[str, Any]) -> dict[str, Any]:
    global _ACTIVE_SCENE_GENERATION
    has_explicit_key = any(k in payload for k in ("query", "sensor_query", "sensor_id"))
    raw_query = (
        payload.get("query")
        if payload.get("query") is not None
        else (
            payload.get("sensor_query")
            if payload.get("sensor_query") is not None
            else (payload.get("sensor_id") if payload.get("sensor_id") is not None else ("" if has_explicit_key else "TZ THT-02"))
        )
    )
    resolved = await asyncio.to_thread(_CATALOG_STORE.resolve_asset_query, str(raw_query))
    if not resolved.get("matched"):
        if resolved.get("resolution") == "ambiguous":
            prompt = str(resolved.get("discriminant_prompt") or "Multiple variants match; select exact hardware variant.")
            return {
                "matched": False,
                "resolution": "ambiguous",
                "identity_status": resolved.get("identity_status", "identify_variant"),
                "sensor_id": None,
                "resolved_model": None,
                "spec": None,
                "discriminant_field": resolved.get("discriminant_field"),
                "discriminant_prompt": prompt,
                "candidates": resolved.get("candidates", []),
                "diagnosis": prompt,
                "assistant_message": prompt,
                "citations": [],
                "manual_citations": [],
            }
        unknown_msg = (
            f"No local verified profile matches '{raw_query}'. Automatic TZONE THT-02 register mapping is inhibited; "
            "import a signed package or enable Cloud Catalog search."
        )
        return {
            "matched": False,
            "resolution": "unknown",
            "identity_status": "unknown_pending_identity",
            "sensor_id": None,
            "resolved_model": None,
            "spec": None,
            "confidence": 0.0,
            "can_query_cloud_catalog": True,
            "suggested_cloud_query": resolved.get("suggested_cloud_query", {}),
            "candidates": [],
            "diagnosis": unknown_msg,
            "assistant_message": unknown_msg,
            "citations": [],
            "manual_citations": [],
        }

    ctx = resolved["context"]
    sensor_id = str(resolved.get("sensor_id") or "TZ-THT-02")
    spec = load_tht02_spec()
    engine = get_lfm_engine()

    if ctx.get("content_origin") == "catalog" and ctx.get("manifest_sha256"):
        sel_ctx = await asyncio.to_thread(_CATALOG_STORE.select_context_for_next_session, str(ctx["manifest_sha256"]))
        desc = await asyncio.to_thread(_CATALOG_STORE.build_scene_and_manual_descriptor, sel_ctx)
        _ACTIVE_SCENE_GENERATION += 1
        doc_count = len(desc.get("documents", []))
        msg = f"Verified signed catalog package loaded for {sel_ctx['title']} (publication seq #{sel_ctx['publication_seq']}, {doc_count} document(s))."
        audio_b64 = await asyncio.to_thread(engine.synthesize_speech_b64, msg)
        return {
            "matched": True,
            "resolution": "exact",
            "identity_status": resolved.get("identity_status", "matched"),
            "sensor_id": sensor_id,
            "resolved_model": sensor_id,
            "matched_alias": resolved.get("matched_alias", sensor_id),
            "confidence": 0.99,
            "context": sel_ctx,
            "catalog_descriptor": desc,
            "scene_generation": _ACTIVE_SCENE_GENERATION,
            "diagnosis": msg,
            "assistant_message": msg,
            "citations": [],
            "manual_citations": [],
            "audio_wav_b64": audio_b64,
            "spec": spec,
        }

    match = match_and_load_sensor(str(raw_query) or "TZ THT-02")
    dims = spec["dimensions_mm"]
    msg = (
        f"Local datasheet verified ({match['pdf_document']['page_count']} pages, "
        f"{match['pdf_document']['inspected_in_ms']} ms): input '{raw_query}' resolved to "
        f"{sensor_id}. Parametric CAD blueprint loaded: total length "
        f"{dims['total_length']} mm x outer diameter {dims['outer_diameter']} mm, SHT30/SHT3X CMOSens "
        f"probe element, and RS-485 Modbus-RTU bus."
    )
    audio_b64 = await asyncio.to_thread(engine.synthesize_speech_b64, msg)
    citations = [
        {"page": 1, "label": MANUAL_PAGE_TITLES[1]},
        {"page": 9, "label": MANUAL_PAGE_TITLES[9]},
    ]
    return {
        "matched": True,
        "resolution": "exact",
        "identity_status": resolved.get("identity_status", "matched"),
        "sensor_id": sensor_id,
        "resolved_model": sensor_id,
        "matched_alias": resolved.get("matched_alias") or match["matched_alias"],
        "confidence": 0.99,
        "context": ctx,
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
    return _enrich_vision_telemetry(_SCANNER.get_telemetry())


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
            if jpg:
                part_header = (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Cache-Control: no-store, no-cache, must-revalidate, max-age=0\r\n"
                    + f"Content-Length: {len(jpg)}\r\n\r\n".encode("ascii")
                )
                yield part_header + jpg + b"\r\n"
            await asyncio.sleep(1.0 / 26.0)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/video/mode")
@app.post("/api/camera/mode")
@app.post("/api/scanner/mode")
async def api_set_camera_mode(payload: dict[str, Any]) -> dict[str, Any]:
    mode = str(payload.get("mode") or "sim_normal").strip()
    _SESSIONS.notify_camera_source_changed(mode)
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


@app.post("/api/video/ipad_frame")
@app.post("/api/camera/ipad_frame")
async def api_push_ipad_camera_frame(request: Request) -> dict[str, Any]:
    source_label = (
        request.query_params.get("source")
        or request.headers.get("x-camera-source")
        or "ipad:avfoundation:back"
    )
    content_type = request.headers.get("content-type", "").lower()
    raw_bytes = b""
    if "multipart/form-data" in content_type:
        form = await request.form()
        cand = form.get("file") or form.get("image") or form.get("frame")
        if cand is None:
            for val in form.values():
                if hasattr(val, "read"):
                    cand = val
                    break
        if cand is not None and hasattr(cand, "read"):
            raw_bytes = await cand.read()
    else:
        raw_bytes = await request.body()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="No camera frame bytes provided")
    try:
        await asyncio.to_thread(_SCANNER.push_live_camera_frame, raw_bytes, source_label)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await asyncio.to_thread(_evaluate_live_reactive_watch)
    return await asyncio.to_thread(_build_unified_status, False)


# ==========================================================================
# MODBUS-RTU / FT2232HL USB-RS485 SCADA & INTERACTIVE LIVE REPAIR ENDPOINTS
# ==========================================================================
@app.get("/api/modbus/telemetry")
async def api_modbus_telemetry() -> dict[str, Any]:
    tel = _MODBUS.get_telemetry()
    tel["available_ports"] = discover_serial_ports()
    return tel


@app.post("/api/modbus/mode", response_model=None)
async def api_modbus_mode(payload: dict[str, Any]) -> Response | dict[str, Any]:
    mode = str(payload.get("mode") or "auto").strip()
    eff_ctx = _resolve_effective_context(session_id=payload.get("session_id"))
    if not mode.lower().startswith("sim_") and mode.lower() != "auto" and not eff_ctx.get("bench_modbus_homologated", True):
        return JSONResponse(
            status_code=409,
            content={
                "ok": False,
                "error_code": "PROFILE_NOT_HOMOLOGATED_FOR_BUS",
                "message": f"Active profile '{eff_ctx.get('product_id')}/{eff_ctx.get('variant_id')}' is not homologated for hardware Modbus polling.",
            },
        )
    slave_id = payload.get("target_slave_id") or payload.get("slave_id")
    baud_bps = payload.get("baud_bps")
    pusr_host = payload.get("pusr_host") or payload.get("gateway_host")
    pusr_port = payload.get("pusr_port") or payload.get("gateway_port")
    if pusr_host is not None:
        _MODBUS.set_pusr_gateway(str(pusr_host), int(pusr_port or 502))
    _SESSIONS.invalidate_live_connection("modbus_mode_changed")
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


@app.post("/api/modbus/target_slave", response_model=None)
async def api_modbus_target_slave(payload: dict[str, Any]) -> Response | dict[str, Any]:
    global _SIMULATED_VISUAL_DIP_ADDRESS
    if not bool(payload.get("confirmed", False)):
        return JSONResponse(
            status_code=400,
            content={
                "ok": False,
                "error_code": "CONFIRMATION_REQUIRED",
                "message": "Changing the authorized Modbus polling target requires explicit confirmed=true.",
            },
        )
    raw_sid = payload.get("slave_id") if payload.get("slave_id") is not None else payload.get("target_slave_id")
    try:
        sid = int(raw_sid)
    except (TypeError, ValueError):
        sid = -1
    if not (1 <= sid <= 247):
        return JSONResponse(
            status_code=400,
            content={"ok": False, "error_code": "INVALID_SLAVE_ID", "message": "Modbus Slave ID must be in 1..247."},
        )
    eff_ctx = _resolve_effective_context(session_id=payload.get("session_id"))
    if not eff_ctx.get("bench_modbus_homologated", True):
        return JSONResponse(
            status_code=409,
            content={
                "ok": False,
                "error_code": "PROFILE_NOT_HOMOLOGATED_FOR_BUS",
                "message": f"Profile '{eff_ctx.get('product_id')}/{eff_ctx.get('variant_id')}' is not homologated for Modbus register polling.",
            },
        )
    await asyncio.to_thread(_MODBUS.set_target_slave, sid)
    _SIMULATED_VISUAL_DIP_ADDRESS = sid
    return {
        "ok": True,
        "target_slave_id": sid,
        "simulated_visual_dip_address": sid,
        "modbus": _MODBUS.get_telemetry(),
    }


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
    session_id: str | None = None,
    manifest_sha256: str | None = None,
    scene_generation: int | None = None,
    turn_id: str | None = None,
) -> dict[str, Any]:
    global _SIMULATED_VISUAL_DIP_ADDRESS
    engine = get_lfm_engine()
    eff_ctx = _resolve_effective_context(session_id=session_id, manifest_sha256=manifest_sha256)
    try:
        cat_desc = _CATALOG_STORE.build_scene_and_manual_descriptor(eff_ctx)
    except CatalogDomainError:
        cat_desc = _CATALOG_STORE.build_scene_and_manual_descriptor(_CATALOG_STORE.build_bundle_default_context())
    eff_scene_gen = int(scene_generation if scene_generation is not None else _ACTIVE_SCENE_GENERATION)
    intent = _detect_conversational_repair_intent(query)

    if intent == "inspect_open":
        res = await asyncio.to_thread(
            _REPAIR.start_open_inspection,
            _SCANNER.get_telemetry(),
            _MODBUS.get_telemetry(),
            _SCANNER.get_latest_jpeg(),
            engine.synthesize_speech_b64,
        )
        from fieldscan.twin_controller import prepare_visual_action

        prep = prepare_visual_action(
            query,
            descriptor=cat_desc,
            zone_hint="upper_barrel_dip",
            current_dip_address=dip_address or _SIMULATED_VISUAL_DIP_ADDRESS,
            scene_generation=eff_scene_gen,
            turn_id=turn_id,
        )
        res.setdefault("language", "en")
        res["twin_action"] = prep["twin_action"]
        res["twin_action_v1"] = prep["twin_action_v1"]
        return res

    if intent == "guide_dip":
        res = await asyncio.to_thread(
            _REPAIR.guide_dip_for_modbus,
            query,
            _SCANNER.get_latest_jpeg(),
            dip_address,
            engine.synthesize_speech_b64,
        )
        target_sid = int(res["target_slave_id"])
        # Conversational/voice requests update ONLY visual DIP simulation, NEVER `_MODBUS.target_slave_id` (`M4-BUS-01`)
        _SIMULATED_VISUAL_DIP_ADDRESS = target_sid
        from fieldscan.twin_controller import prepare_visual_action

        prep = prepare_visual_action(
            query,
            descriptor=cat_desc,
            zone_hint="upper_barrel_dip",
            current_dip_address=target_sid,
            scene_generation=eff_scene_gen,
            turn_id=turn_id,
        )
        res.setdefault("language", "en")
        res["simulated_visual_dip_address"] = target_sid
        res["authorized_bus_slave_id"] = int(_MODBUS.get_telemetry().get("target_slave_id") or 1)
        res["bus_target_mutated"] = False
        res["twin_action"] = prep["twin_action"]
        res["twin_action_v1"] = prep["twin_action_v1"]
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
    tel = _SCANNER.get_telemetry() if include_camera else None
    raw_jpg: bytes | None = None
    if include_camera:
        raw_jpg = _SCANNER.get_raw_jpeg()
        q_low = query.lower()
        if bool(tel and tel.get("pcb_open_detected")) and any(
            kw in q_low for kw in ("dip", "pin", "switch", "rocker", "slave", "address", "pcb", "config")
        ):
            frame_jpg = _SCANNER.get_dip_focus_jpeg()
        else:
            frame_jpg = _SCANNER.get_latest_jpeg()
    else:
        frame_jpg = None
    mb_tel = _MODBUS.get_telemetry()

    diag_out = await asyncio.to_thread(
        engine.diagnose_sensor,
        query=query,
        spec=spec,
        frame_jpeg=frame_jpg,
        scanner_telemetry=tel,
        modbus_telemetry=mb_tel,
        zone_hint=zone_hint,
        dip_address=dip_address if dip_address is not None else _SIMULATED_VISUAL_DIP_ADDRESS,
        raw_frame_jpeg=raw_jpg,
        catalog_descriptor=cat_desc,
        scene_generation=eff_scene_gen,
        turn_id=turn_id,
    )
    ta = diag_out.get("twin_action")
    if isinstance(ta, dict) and isinstance(ta.get("target_slave_id"), int) and (1 <= int(ta["target_slave_id"]) <= 247):
        _SIMULATED_VISUAL_DIP_ADDRESS = int(ta["target_slave_id"])
    diag_out["simulated_visual_dip_address"] = _SIMULATED_VISUAL_DIP_ADDRESS
    diag_out["authorized_bus_slave_id"] = int(mb_tel.get("target_slave_id") or 1)
    diag_out["bus_target_mutated"] = False
    return diag_out


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
        session_id=payload.get("session_id"),
        manifest_sha256=payload.get("manifest_sha256"),
        scene_generation=payload.get("scene_generation"),
        turn_id=payload.get("turn_id"),
    )


@app.post("/api/voice")
async def api_voice(
    audio: UploadFile | None = File(default=None),
    file: UploadFile | None = File(default=None),
    include_camera: str = Form(default="true"),
    dip_address: str | None = Form(default=None),
    hands_free: str = Form(default="false"),
) -> dict[str, Any]:
    upload = audio or file
    if upload is None:
        raise HTTPException(status_code=400, detail="Missing audio upload")

    is_hands_free = hands_free.lower() in ("true", "1", "yes", "on")
    audio_bytes = await upload.read()
    engine = get_lfm_engine()
    asr_res = await asyncio.to_thread(
        engine.transcribe_audio,
        audio_bytes,
        upload.filename or "speech.wav",
        is_hands_free,
    )
    transcript = asr_res["transcript"]
    if is_hands_free and asr_res.get("empty_speech"):
        return {
            "ignored_silence": True,
            "transcript": "",
            "asr_ms": asr_res["asr_ms"],
        }

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


# ==========================================================================
# CONTRACT v2.1 ENDPOINTS: CAPABILITIES, SESSIONS, GATEWAY & PLANNED EXT.
# ==========================================================================
@app.get("/api/capabilities")
async def api_capabilities() -> dict[str, Any]:
    return await asyncio.to_thread(_build_capabilities_payload)


@app.get("/api/profiles")
async def api_profiles() -> dict[str, Any]:
    by_id = load_all_profiles()
    return {
        "contract_version": CONTRACT_VERSION,
        "profiles": list(by_id.values()),
        "profiles_by_id": by_id,
    }


@app.post("/api/modbus/gateway", response_model=None)
async def api_modbus_gateway(payload: dict[str, Any]) -> Response | dict[str, Any]:
    host = str(payload.get("host") or payload.get("pusr_host") or "").strip()
    port = int(payload.get("port") or payload.get("pusr_port") or 502)
    if port == 5502:
        return JSONResponse(
            status_code=400,
            content={
                "ok": False,
                "error_code": "PROTOCOL_MISMATCH",
                "message": "Port 5502 is reserved for raw RTU-over-TCP framing; configure PUSR USR-DR164 as Modbus TCP (MBAP) on port 502.",
            },
        )
    _SESSIONS.invalidate_live_connection("gateway_endpoint_changed")
    cfg = _MODBUS.set_pusr_gateway(host, port)
    if payload.get("activate_mode") or payload.get("activate"):
        await asyncio.to_thread(_MODBUS.set_mode, "pusr_tcp")
    return {
        "ok": True,
        "gateway": cfg,
        "modbus": _MODBUS.get_telemetry(),
    }


@app.post("/api/modbus/poll", response_model=None)
async def api_modbus_poll(payload: dict[str, Any] | None = None) -> Response | dict[str, Any]:
    body = payload or {}
    eff_ctx = _resolve_effective_context(session_id=body.get("session_id"))
    if not eff_ctx.get("bench_modbus_homologated", True):
        return JSONResponse(
            status_code=409,
            content={
                "ok": False,
                "error_code": "PROFILE_NOT_HOMOLOGATED_FOR_BUS",
                "message": f"Active profile '{eff_ctx.get('product_id')}/{eff_ctx.get('variant_id')}' is not homologated for TZONE Modbus register polling.",
            },
        )
    tel = await asyncio.to_thread(_MODBUS.step_once)
    session_id = str(body.get("session_id") or "").strip()
    session_snap = None
    if session_id:
        session_snap = await asyncio.to_thread(_SESSIONS.record_modbus_observation, session_id, tel)
    return {
        "ok": True,
        "modbus": tel,
        "session": session_snap,
    }


@app.post("/api/sessions")
async def api_create_session(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = dict(payload or {})
    if "transport_mode" not in body:
        body["transport_mode"] = _MODBUS.get_telemetry().get("mode", "auto")
    return await asyncio.to_thread(_SESSIONS.create_session, body)


@app.get("/api/sessions")
async def api_list_sessions(limit: int = 20) -> dict[str, Any]:
    items = await asyncio.to_thread(_SESSIONS.list_sessions, limit)
    return {"contract_version": CONTRACT_VERSION, "sessions": items}


@app.get("/api/sessions/{session_id}")
async def api_get_session(session_id: str) -> dict[str, Any]:
    return await asyncio.to_thread(_SESSIONS.get_session, session_id)


@app.post("/api/sessions/{session_id}/actions")
async def api_session_action(session_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    res = await asyncio.to_thread(_SESSIONS.apply_action, session_id, payload)
    # If voice/HMI requested a read-only check or photo capture, execute against live backend
    applied = res.get("action_applied") or (res.get("parsed_intent") or {}).get("intent")
    if applied == "start_readonly_check":
        tel = await asyncio.to_thread(_MODBUS.step_once)
        snap = await asyncio.to_thread(_SESSIONS.record_modbus_observation, session_id, tel, actor="operator_poll")
        res["modbus"] = tel
        res["session"] = snap
    elif applied == "request_capture":
        raw_jpg = await asyncio.to_thread(_SCANNER.get_raw_jpeg)
        ann_jpg = await asyncio.to_thread(_SCANNER.get_latest_jpeg)
        vtel = _SCANNER.get_telemetry()
        cap_res = await asyncio.to_thread(
            _SESSIONS.ingest_camera_frame_for_session,
            session_id,
            raw_jpg,
            annotated_jpeg=ann_jpg,
            vision_tel=vtel,
            camera_source=str(vtel.get("camera_source") or vtel.get("mode") or "usb"),
            manual_trigger=True,
        )
        res["capture"] = cap_res
        res["session"] = await asyncio.to_thread(_SESSIONS.get_session, session_id)
    return res


@app.post("/api/sessions/{session_id}/capture")
async def api_session_capture(session_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = payload or {}
    manual = bool(body.get("manual", True))
    raw_jpg = await asyncio.to_thread(_SCANNER.get_raw_jpeg)
    ann_jpg = await asyncio.to_thread(_SCANNER.get_latest_jpeg)
    vtel = _SCANNER.get_telemetry()
    cap_res = await asyncio.to_thread(
        _SESSIONS.ingest_camera_frame_for_session,
        session_id,
        raw_jpg,
        annotated_jpeg=ann_jpg,
        vision_tel=vtel,
        camera_source=str(body.get("camera_source") or vtel.get("camera_source") or vtel.get("mode") or "usb"),
        manual_trigger=manual,
    )
    snap = await asyncio.to_thread(_SESSIONS.get_session, session_id)
    return {"ok": True, "capture": cap_res, "session": snap}


@app.post("/api/sessions/{session_id}/exports")
async def api_session_exports(session_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return await asyncio.to_thread(_SESSIONS.export_session_dossier, session_id, payload or {})


@app.get("/api/calibration/planned")
async def api_calibration_planned() -> dict[str, Any]:
    return get_planned_calibration_card()


@app.post("/api/calibration/compare")
async def api_calibration_compare(payload: dict[str, Any]) -> dict[str, Any]:
    return evaluate_calibration_comparison_contract(payload)


# ==========================================================================
# CLOUD & INSTALLED SIGNED CATALOG ROUTES + CAD EXPORT GUARD (`MEGAPLAN`)
# ==========================================================================
@app.post("/api/export/{fmt}", response_model=None)
async def api_export_cad_format(fmt: str, payload: dict[str, Any] | None = None) -> Response | dict[str, Any]:
    body = payload or {}
    clean_fmt = fmt.strip().lower()
    if clean_fmt not in ("dxf", "stl"):
        raise HTTPException(status_code=404, detail=f"Unsupported CAD format '{fmt}'")
    eff_ctx = _resolve_effective_context(
        session_id=body.get("session_id"),
        manifest_sha256=body.get("manifest_sha256"),
    )
    desc = await asyncio.to_thread(_CATALOG_STORE.build_scene_and_manual_descriptor, eff_ctx)
    supported = list(desc.get("cad_exports_supported") or ["dxf", "stl", "pdf", "json"])
    if clean_fmt not in supported:
        return JSONResponse(
            status_code=409,
            content={
                "ok": False,
                "error_code": "CAD_EXPORT_UNSUPPORTED_FOR_GLB",
                "message": (
                    f"Parametric AutoCAD .{clean_fmt.upper()} generation is available only for the bundled TZ THT-02 "
                    f"engineering model; catalog GLB package '{eff_ctx.get('product_id')}/{eff_ctx.get('variant_id')}' "
                    f"supports {', '.join(supported)}."
                ),
                "cad_exports_supported": supported,
            },
        )
    pkg = await api_repair_signoff(body)
    return {
        "ok": True,
        "format": clean_fmt,
        "url": pkg["dxf_url"] if clean_fmt == "dxf" else pkg["stl_url"],
        "path": pkg["dxf_path"] if clean_fmt == "dxf" else pkg["stl_path"],
    }


@app.get("/api/catalog/status")
async def api_catalog_status() -> dict[str, Any]:
    selected = await asyncio.to_thread(_CATALOG_STORE.get_selected_context)
    installed = await asyncio.to_thread(_CATALOG_STORE.list_installed_packages)
    pinned_ctx: dict[str, Any] | None = None
    update_ready_for_next = False
    active_sid = _SESSIONS._active_session_id
    if active_sid:
        try:
            snap = await asyncio.to_thread(_SESSIONS.get_session, active_sid)
            if snap.get("status") == "open" and isinstance(snap.get("catalog_context"), dict):
                pinned_ctx = snap["catalog_context"]
                p_prod = pinned_ctx.get("product_id")
                p_var = pinned_ctx.get("variant_id")
                p_seq = int(pinned_ctx.get("publication_seq") or 0)
                if any(
                    p["product_id"] == p_prod and p["variant_id"] == p_var and int(p["publication_seq"]) > p_seq
                    for p in installed
                ):
                    update_ready_for_next = True
        except SessionDomainError:
            pass
    return {
        "ok": True,
        "sync": _CATALOG_CLIENT.get_sync_telemetry(),
        "selected_context": selected,
        "pinned_session_context": pinned_ctx,
        "update_ready_for_next_session": update_ready_for_next,
        "installed_count": len(installed),
        "scene_generation": _ACTIVE_SCENE_GENERATION,
        "latest_scene_ready": _LATEST_SCENE_READY_TURN,
    }


@app.get("/api/catalog/packages")
async def api_catalog_packages() -> dict[str, Any]:
    pkgs = await asyncio.to_thread(_CATALOG_STORE.list_installed_packages)
    sel = await asyncio.to_thread(_CATALOG_STORE.get_selected_context)
    return {"ok": True, "packages": pkgs, "selected_context": sel}


@app.post("/api/catalog/select")
async def api_catalog_select(payload: dict[str, Any]) -> dict[str, Any]:
    global _ACTIVE_SCENE_GENERATION
    m_sha = payload.get("manifest_sha256")
    ctx = await asyncio.to_thread(_CATALOG_STORE.select_context_for_next_session, str(m_sha) if m_sha else None)
    desc = await asyncio.to_thread(_CATALOG_STORE.build_scene_and_manual_descriptor, ctx)
    _ACTIVE_SCENE_GENERATION += 1
    return {
        "ok": True,
        "selected_context": ctx,
        "catalog_descriptor": desc,
        "scene_generation": _ACTIVE_SCENE_GENERATION,
    }


@app.post("/api/catalog/import")
async def api_catalog_import(request: Request) -> dict[str, Any]:
    import base64
    import tempfile

    ctype = (request.headers.get("content-type") or "").lower()
    if "multipart/form-data" in ctype:
        form = await request.form()
        cand = form.get("file") or form.get("package") or next(iter(form.values()), None)
        if cand is None or not hasattr(cand, "read"):
            raise CatalogDomainError("INVALID_ENVELOPE", "Missing package archive in multipart form")
        raw = await cand.read()
        with tempfile.NamedTemporaryFile(dir=str(_CATALOG_STORE.staging_dir), suffix=".zip", delete=False) as tf:
            tf.write(raw)
            tmp_p = Path(tf.name)
        try:
            pkg = await asyncio.to_thread(_CATALOG_STORE.import_package_from_path, tmp_p)
            return {"ok": True, "package": pkg}
        finally:
            tmp_p.unlink(missing_ok=True)

    body = await request.json()
    if body.get("path"):
        cand_p = Path(str(body["path"])).resolve()
        allowed_roots = [
            _CATALOG_STORE.staging_dir.resolve(),
            (PROJECT_ROOT / "knowledge" / "fixtures").resolve(),
            Path(tempfile.gettempdir()).resolve(),
        ]
        if not any(cand_p == r or r in cand_p.parents for r in allowed_roots):
            raise CatalogDomainError(
                "UNTRUSTED_IMPORT_PATH",
                "Direct path import is restricted to authorized fixture, temporary, or staging directories.",
                status_code=403,
            )
        pkg = await asyncio.to_thread(_CATALOG_STORE.import_package_from_path, cand_p)
        return {"ok": True, "package": pkg}
    if body.get("archive_b64"):
        b64_s = str(body["archive_b64"])
        if "," in b64_s and b64_s.startswith("data:"):
            b64_s = b64_s.split(",", 1)[1]
        raw = base64.b64decode(b64_s)
        with tempfile.NamedTemporaryFile(dir=str(_CATALOG_STORE.staging_dir), suffix=".zip", delete=False) as tf:
            tf.write(raw)
            tmp_p = Path(tf.name)
        try:
            pkg = await asyncio.to_thread(_CATALOG_STORE.import_package_from_path, tmp_p)
            return {"ok": True, "package": pkg}
        finally:
            tmp_p.unlink(missing_ok=True)
    raise CatalogDomainError("INVALID_ENVELOPE", "Provide path, archive_b64, or multipart file")


@app.post("/api/catalog/sync_config")
async def api_catalog_sync_config(payload: dict[str, Any]) -> dict[str, Any]:
    from fieldscan.catalog_store import DEFAULT_PILOT_CLOUD_BASE_URL

    raw_base = str(payload.get("base_url") or "").strip()
    base_url = raw_base or DEFAULT_PILOT_CLOUD_BASE_URL
    sync_en = payload.get("sync_enabled")
    auth_tok = payload.get("auth_token")
    boat_tok = payload.get("boat_port_auth_token")
    signers = payload.get("trusted_signers")
    if isinstance(signers, list):
        for s in signers:
            if isinstance(s, dict) and s.get("key_id") and s.get("public_key_b64"):
                await asyncio.to_thread(
                    _CATALOG_STORE.register_trusted_signer,
                    str(s["key_id"]),
                    str(s["public_key_b64"]),
                )
    tel = await asyncio.to_thread(
        _CATALOG_CLIENT.configure_endpoint,
        base_url,
        sync_enabled=bool(sync_en) if sync_en is not None else None,
        auth_token=str(auth_tok) if auth_tok is not None else None,
        boat_port_auth_token=str(boat_tok) if boat_tok is not None else None,
    )
    return {"ok": True, "sync": tel}


@app.post("/api/catalog/download_latest")
async def api_catalog_download_latest(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    global _ACTIVE_SCENE_GENERATION
    body = payload or {}
    pid = str(body.get("product_id") or "").strip() or "tzone_tht02"
    vid = str(body.get("variant_id") or "").strip() or "v1_1_rs485"
    res = await asyncio.to_thread(_CATALOG_CLIENT.download_latest_package, pid, vid)
    pkg = res.get("package") if isinstance(res, dict) else None
    if isinstance(pkg, dict) and pkg.get("manifest_sha256"):
        ctx = await asyncio.to_thread(_CATALOG_STORE.select_context_for_next_session, str(pkg["manifest_sha256"]))
        desc = await asyncio.to_thread(_CATALOG_STORE.build_scene_and_manual_descriptor, ctx)
        _ACTIVE_SCENE_GENERATION += 1
        res["selected_context"] = ctx
        res["catalog_descriptor"] = desc
        res["scene_generation"] = _ACTIVE_SCENE_GENERATION
    res["sync"] = _CATALOG_CLIENT.get_sync_telemetry()
    return res


@app.get("/api/catalog/healthz")
async def api_catalog_healthz() -> dict[str, Any]:
    return await asyncio.to_thread(_CATALOG_CLIENT.check_health)


@app.post("/api/catalog/resolve")
async def api_catalog_resolve(payload: dict[str, Any]) -> dict[str, Any]:
    model = str(payload.get("model") or "").strip()
    if not model:
        raise CatalogDomainError("INVALID_ENVELOPE", "model is required")
    await asyncio.to_thread(_CATALOG_CLIENT.ensure_auto_enrolled_if_needed)
    return await asyncio.to_thread(
        _CATALOG_CLIENT.resolve_catalog,
        manufacturer=payload.get("manufacturer"),
        model=model,
        variant=payload.get("variant"),
        hardware_revision=payload.get("hardware_revision"),
    )


@app.get("/api/catalog/jobs/{job_id}")
async def api_catalog_poll_job(job_id: str) -> dict[str, Any]:
    return await asyncio.to_thread(_CATALOG_CLIENT.poll_job, job_id)


@app.post("/api/catalog/install")
async def api_catalog_install(payload: dict[str, Any]) -> dict[str, Any]:
    pid = str(payload.get("product_id") or "").strip()
    vid = str(payload.get("variant_id") or "").strip()
    if not pid or not vid:
        raise CatalogDomainError("INVALID_ENVELOPE", "product_id and variant_id are required")
    channel = str(payload.get("channel") or "default")
    return await asyncio.to_thread(_CATALOG_CLIENT.fetch_and_install_variant, pid, vid, channel=channel)


@app.post("/api/catalog/scene_ready")
async def api_catalog_scene_ready(payload: dict[str, Any]) -> dict[str, Any]:
    global _LATEST_SCENE_READY_TURN
    gen = int(payload.get("scene_generation") or 1)
    accepted = gen >= _ACTIVE_SCENE_GENERATION
    if accepted:
        _LATEST_SCENE_READY_TURN = {
            "scene_generation": gen,
            "turn_id": payload.get("turn_id"),
            "manifest_sha256": payload.get("manifest_sha256"),
            "status": str(payload.get("status") or "ready"),
        }
    return {"ok": True, "accepted": accepted, "active_scene_generation": _ACTIVE_SCENE_GENERATION}


@app.api_route(
    "/api/catalog/installed/{manifest_sha256}/objects/{object_sha256}",
    methods=["GET", "HEAD"],
    response_model=None,
)
async def api_catalog_installed_object(
    manifest_sha256: str,
    object_sha256: str,
    request: Request,
) -> Response:
    range_hdr = request.headers.get("range")
    res = await asyncio.to_thread(
        _CATALOG_STORE.read_object_range,
        manifest_sha256,
        object_sha256,
        range_hdr,
    )
    body_bytes = b"" if request.method == "HEAD" else res["body"]
    return Response(
        content=body_bytes,
        status_code=int(res["status_code"]),
        media_type=str(res["mime_type"]),
        headers=dict(res["headers"]),
    )
