"""Bounded Executable Copilot Action Registry, Screen Inventory, Unified Link Diagnostics & Guidance State Machine.

Pure leaf module (zero imports from `server.py` or `lfm_engine.py`, 100% English source).
Localized Spanish voice aliases and response templates are loaded strictly from the audited
resource `knowledge/localization/copilot_voice_es.json`.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import time
from typing import Any
import unicodedata
import uuid

from fieldscan.manual_navigator import (
    lookup_manual_for_query,
    lookup_manual_in_descriptor,
)
from fieldscan.twin_controller import (
    _address_to_dip_bits,
    _format_dip_instruction_en,
    parse_requested_slave_id,
    prepare_visual_action,
    resolve_twin_action,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOCALIZATION_ES_PATH = PROJECT_ROOT / "knowledge" / "localization" / "copilot_voice_es.json"

GUIDANCE_STATES: tuple[str, ...] = (
    "preparing",
    "showing_instruction",
    "waiting_for_operator",
    "waiting_for_clear_frame",
    "observed",
    "needs_review",
    "confirmed",
    "complete",
)

ACTION_RESULT_STATUSES: tuple[str, ...] = (
    "applied",
    "unavailable",
    "requires_confirmation",
    "stale",
    "pending_scene_ready",
)

_ES_PACK_CACHE: dict[str, Any] | None = None


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def normalize_ascii_lower(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()
    return re.sub(r"\s+", " ", stripped).strip()


def load_spanish_voice_pack(project_root: Path = PROJECT_ROOT) -> dict[str, Any]:
    """Load audited Spanish voice aliases and response templates from `knowledge/localization/copilot_voice_es.json`."""
    global _ES_PACK_CACHE
    if _ES_PACK_CACHE is not None and project_root == PROJECT_ROOT:
        return _ES_PACK_CACHE
    path = project_root / "knowledge" / "localization" / "copilot_voice_es.json"
    if not path.is_file():
        return {"speech_locales": [], "tts_locales": [], "language_cues": [], "action_aliases": {}, "responses": {}}
    data = json.loads(path.read_text(encoding="utf-8"))
    if project_root == PROJECT_ROOT:
        _ES_PACK_CACHE = data
    return data


def detect_copilot_language(query: str, preferred_language: str = "en", project_root: Path = PROJECT_ROOT) -> str:
    """Detect whether the operator utterance is English (`en`) or Spanish (`es`) using audited cues."""
    norm = normalize_ascii_lower(query)
    if not norm:
        return "es" if preferred_language == "es" else "en"
    if re.search(r"\b(switch to english|english mode|speak english)\b", norm):
        return "en"
    if re.search(r"\b(switch to spanish|spanish mode|speak spanish|cambiar a espan\w*|hablar en espan\w*|modo espan\w*)\b", norm):
        return "es"

    pack = load_spanish_voice_pack(project_root)
    es_cues = [normalize_ascii_lower(c) for c in (pack.get("language_cues") or []) if c]
    padded = f" {norm} "
    es_hits = sum(1 for cue in es_cues if f" {cue} " in padded or (len(cue) >= 6 and cue in norm))
    en_cues = (
        "open ", "close ", "show ", "where ", "what ", "which ", "how ", "configure ",
        "settings", "catalog", "manual", "page ", "port", "host", "explode", "x-ray",
        "xray", "solid", "reset", "focus", "capture", "photo", "help", "history", "draft",
        "stock", "manufacturer", "responding", "switch to", "temperature", "humidity",
    )
    en_hits = sum(1 for cue in en_cues if cue in padded)
    if es_hits > en_hits and es_hits >= 1:
        return "es"
    if en_hits > es_hits and en_hits >= 1:
        return "en"
    return "es" if preferred_language == "es" else "en"


def build_screen_inventory() -> list[dict[str, Any]]:
    """Complete inventory of all FieldScan HMI screens, overlays, drawers, and native iPadOS sheets."""
    return [
        {
            "screen_id": "main_workspace",
            "title": "Main Dual Viewport Workspace",
            "surface": "web",
            "dom_id": "videoFrame,canvasStage",
            "route": "/",
            "primary_controls": ["btnHandsFreeMic", "btnVoiceRecord", "btnOpenChat", "btnOpenTools", "btnStepInspect", "btnStepDip", "btnStepConnect", "btnStepSignoff"],
            "aliases_en": ["main screen", "home", "workspace"],
            "availability": "always",
        },
        {
            "screen_id": "camera_viewport",
            "title": "Live Optical Camera Viewport",
            "surface": "web",
            "dom_id": "videoFrame",
            "route": "/#videoFrame",
            "primary_controls": ["videoStream", "btnToggleDipPip", "btnCycleCvHud", "btnZoomAuto", "btnRawLiveToggle"],
            "aliases_en": ["camera", "live camera", "live view", "optical feed"],
            "availability": "always",
        },
        {
            "screen_id": "dip_macro_pip",
            "title": "SW1 DIP-8 Macro Picture-in-Picture",
            "surface": "web",
            "dom_id": "dipMacroPip",
            "route": "/#dipMacroPip",
            "primary_controls": ["dipCropImg", "dipSwitchesRow", "dipCalcAddr", "btnCloseDipPip"],
            "aliases_en": ["dip macro", "dip crop", "dip inset", "dip overlay"],
            "availability": "requires_dip_profile",
        },
        {
            "screen_id": "twin_viewport",
            "title": "Interactive 3D Digital Twin Stage",
            "surface": "web",
            "dom_id": "canvasStage",
            "route": "/#canvasStage",
            "primary_controls": ["cadCanvas", "btnModeSolid", "btnModeWireframe", "btnToggleExplode", "btnResetView", "assemblyTreePills"],
            "aliases_en": ["3d twin", "digital twin", "3d model", "cad stage"],
            "availability": "requires_3d_scene",
        },
        {
            "screen_id": "chat_panel",
            "title": "AI Engineer Slide-Over Chat Panel",
            "surface": "web",
            "dom_id": "chatPage",
            "route": "/#chatPage",
            "primary_controls": ["chatFeed", "textQueryForm", "queryInput", "chatMicBtn", "btnSendQuery"],
            "aliases_en": ["chat", "chat panel", "conversation", "messages"],
            "availability": "always",
        },
        {
            "screen_id": "tools_panel",
            "title": "Tools, SCADA, Manual & Field Setup Slide-Over",
            "surface": "web",
            "dom_id": "toolsPage",
            "route": "/#toolsPage",
            "primary_controls": ["btnConfigGateway", "btnOpenCatalogModal", "btnSensorPill", "btnOpenCalibrationPlanned", "btnPollReadonly", "btnScanRealModbus", "selectCameraMode", "selectModbusMode", "manualDrawer", "sessionEventLog"],
            "aliases_en": ["tools", "settings", "tools panel", "field setup", "history", "session log"],
            "availability": "always",
        },
        {
            "screen_id": "manual_drawer",
            "title": "Embedded 2D Technical Manual Drawer",
            "surface": "web",
            "dom_id": "manualDrawer",
            "route": "/#manualDrawer",
            "primary_controls": ["manualDocSelect", "manualPrevBtn", "manualNextBtn", "btnExpandManual", "manualQuickPills", "manualPageImg"],
            "aliases_en": ["manual drawer", "datasheet drawer", "technical manual"],
            "availability": "requires_documentation",
        },
        {
            "screen_id": "manual_lightbox",
            "title": "Fullscreen OEM Datasheet Lightbox",
            "surface": "web",
            "dom_id": "manualModal",
            "route": "/#manualModal",
            "primary_controls": ["lightboxImg", "lightboxPrevBtn", "lightboxNextBtn", "lightboxCloseBtn", "lightboxSectionBanner"],
            "aliases_en": ["manual lightbox", "fullscreen manual", "datasheet viewer", "manual"],
            "availability": "requires_documentation",
        },
        {
            "screen_id": "pusr_gateway_modal",
            "title": "PUSR USR-DR164 Direct AP Gateway Setup",
            "surface": "web",
            "dom_id": "pusrGatewayModal",
            "route": "/#pusrGatewayModal",
            "primary_controls": ["pusrGatewayActiveReadout", "btnAutoSetupPusr", "btnDiscoverPusrAp", "btnPresetPusrApDefault", "btnPresetPusrApAlt", "pusrAdvancedDetails", "inputPusrCustomHost", "inputPusrCustomPort", "selectPusrCustomTopology", "btnSavePusrCustom", "btnClearPusrGateway"],
            "aliases_en": ["pusr", "pusr settings", "pusr config", "gateway", "gateway settings", "modbus gateway"],
            "availability": "always",
        },
        {
            "screen_id": "catalog_modal",
            "title": "Signed Package Store & Cloud Catalog Modal",
            "surface": "web",
            "dom_id": "catalogModal",
            "route": "/#catalogModal",
            "primary_controls": ["toggleCloudSync", "catalogEgressBadge", "btnImportSignedPackage", "btnResetBundledContext", "btnDownloadLatestCloud", "btnCheckCloudHealth", "catalogResolveForm", "inputCloudEndpoint", "inputCloudToken", "inputBoatPortToken", "btnSaveSyncConfig", "catalogPackagesList"],
            "aliases_en": ["catalog", "packages", "cloud catalog", "cloud settings", "package store"],
            "availability": "always",
        },
        {
            "screen_id": "calibration_modal",
            "title": "Calibration & Verified Adjustment Roadmap Modal",
            "surface": "web",
            "dom_id": "calibrationPlannedModal",
            "route": "/#calibrationPlannedModal",
            "primary_controls": ["calibrationPlannedCloseBtn", "plannedCalEventCopy", "plannedCalScopeReason"],
            "aliases_en": ["calibration", "calibration roadmap", "metrology"],
            "availability": "always",
        },
        {
            "screen_id": "escalation_modal",
            "title": "Manufacturer Engineering Dossier & Outbox Modal",
            "surface": "web",
            "dom_id": "escalationModal",
            "route": "/#escalationModal",
            "primary_controls": ["escZipDownloadLink", "escEmailTo", "escEmailSubject", "escEmailBody", "tabPreviewQuad", "tabPreviewStrip", "escalationCloseBtn"],
            "aliases_en": ["escalation", "manufacturer dossier", "sign-off modal", "outbox"],
            "availability": "always",
        },
        {
            "screen_id": "native_operator_sheet",
            "title": "iPadOS Native Bench Control Action Sheet",
            "surface": "native_ios",
            "dom_id": "fieldscanNativeBridge.presentOperatorControlSheet",
            "route": "native://operator_sheet",
            "primary_controls": ["iPad Autonomous Mode", "PUSR Direct AP Setup", "Mac Mini Assisted", "Share Verified Dossier Files", "Import Signed Package"],
            "aliases_en": ["native control sheet", "bench control", "endpoint switcher"],
            "availability": "ipad_native_only",
        },
        {
            "screen_id": "native_pusr_sheet",
            "title": "iPadOS Native PUSR Gateway Selector Sheet",
            "surface": "native_ios",
            "dom_id": "fieldscanNativeBridge.presentPusrGatewayConfig",
            "route": "native://pusr_sheet",
            "primary_controls": ["1-Tap Auto-Setup", "Auto-Detect Direct AP", "Custom IP / Lab Router"],
            "aliases_en": ["native pusr sheet"],
            "availability": "ipad_native_only",
        },
        {
            "screen_id": "native_package_picker",
            "title": "iPadOS Files Signed Package Document Picker",
            "surface": "native_ios",
            "dom_id": "fieldscanNativeBridge.presentPackageImporter",
            "route": "native://package_picker",
            "primary_controls": ["UIDocumentPickerViewController"],
            "aliases_en": ["import package", "files picker"],
            "availability": "ipad_native_only",
        },
        {
            "screen_id": "ipad_app_settings",
            "title": "iPadOS FieldScan App Settings (UIApplication.openSettingsURLString)",
            "surface": "native_ios",
            "dom_id": "fieldscanNativeBridge.openAppSettings",
            "route": "app-settings:",
            "primary_controls": ["Local Network", "Camera", "Microphone", "Speech Recognition"],
            "aliases_en": ["app settings", "ipad settings", "permissions", "local network permission"],
            "availability": "ipad_native_only",
        },
    ]


def build_action_registry(project_root: Path = PROJECT_ROOT) -> list[dict[str, Any]]:
    """Return the complete bounded registry of executable FieldScan copilot actions."""
    es_pack = load_spanish_voice_pack(project_root)
    es_aliases = es_pack.get("action_aliases") or {}

    base: list[dict[str, Any]] = [
        # --- Family 1: Configuration ---
        {
            "id": "config.open_pusr",
            "category": "config",
            "intent_mode": "show",
            "description": "Open the PUSR USR-DR164 Gateway configuration panel in read-only mode without saving or connecting.",
            "params_schema": {"prefer_native": "bool?"},
            "aliases_en": ["open pusr settings", "open pusr configuration", "open pusr", "open gateway settings", "open gateway config"],
            "target_surface": "pusrGatewayModal",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigOpenPusr",
            "verifiable_outcome": "pusrGatewayModal.hidden === false",
        },
        {
            "id": "config.show_pusr_field",
            "category": "config",
            "intent_mode": "show",
            "description": "Open PUSR Gateway panel if needed, reveal Advanced section, and highlight host, port, topology, or address field without editing.",
            "params_schema": {"field": "enum(host,port,topology,address)"},
            "aliases_en": ["show me the port", "show pusr port", "where is the port", "show gateway address", "where to see the address", "show gateway host"],
            "target_surface": "pusrGatewayModal",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigShowPusrField",
            "verifiable_outcome": "target_field_visible && highlighted && values_unmodified",
        },
        {
            "id": "config.open_catalog",
            "category": "config",
            "intent_mode": "show",
            "description": "Open the Signed Package Store & Cloud Catalog modal without enabling Cloud sync or emitting WAN requests.",
            "params_schema": {},
            "aliases_en": ["open catalog", "open the catalog", "show catalog", "open package store", "show packages"],
            "target_surface": "catalogModal",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigOpenCatalog",
            "verifiable_outcome": "catalogModal.hidden === false && wan_requests_delta === 0",
        },
        {
            "id": "config.show_cloud_settings",
            "category": "config",
            "intent_mode": "show",
            "description": "Open Catalog modal, highlight Cloud Sync toggle & server settings, report whether Cloud is enabled, keep secrets masked and WAN untouched.",
            "params_schema": {},
            "aliases_en": ["show me where cloud is configured", "where is cloud configured", "show cloud settings", "is cloud enabled"],
            "target_surface": "catalogModal#toggleCloudSync",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigShowCloudSettings",
            "verifiable_outcome": "catalogModal.hidden === false && cloud_controls_visible && tokens_masked && wan_requests_delta === 0",
        },
        {
            "id": "config.open_tools",
            "category": "config",
            "intent_mode": "show",
            "description": "Open the Tools & Field Setup slide-over panel.",
            "params_schema": {"section": "string?"},
            "aliases_en": ["open tools", "open settings", "show tools panel"],
            "target_surface": "toolsPage",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigOpenTools",
            "verifiable_outcome": "toolsPage.classList.contains('open')",
        },
        {
            "id": "config.close_tools",
            "category": "config",
            "intent_mode": "apply",
            "description": "Close the Tools & Field Setup slide-over panel.",
            "params_schema": {},
            "aliases_en": ["close tools", "hide tools"],
            "target_surface": "toolsPage",
            "permissions": ["local_ui_write"],
            "availability": "always",
            "handler": "executeConfigCloseTools",
            "verifiable_outcome": "!toolsPage.classList.contains('open')",
        },
        {
            "id": "config.open_chat",
            "category": "config",
            "intent_mode": "show",
            "description": "Open the AI Engineer Chat slide-over panel.",
            "params_schema": {},
            "aliases_en": ["open chat", "show chat", "show conversation"],
            "target_surface": "chatPage",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigOpenChat",
            "verifiable_outcome": "chatPage.classList.contains('open')",
        },
        {
            "id": "config.close_chat",
            "category": "config",
            "intent_mode": "apply",
            "description": "Close the AI Engineer Chat slide-over panel.",
            "params_schema": {},
            "aliases_en": ["close chat", "hide chat"],
            "target_surface": "chatPage",
            "permissions": ["local_ui_write"],
            "availability": "always",
            "handler": "executeConfigCloseChat",
            "verifiable_outcome": "!chatPage.classList.contains('open')",
        },
        {
            "id": "config.open_calibration",
            "category": "config",
            "intent_mode": "show",
            "description": "Open the Calibration & Verified Adjustment planned roadmap modal (read-only).",
            "params_schema": {},
            "aliases_en": ["open calibration", "show calibration roadmap"],
            "target_surface": "calibrationPlannedModal",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigOpenCalibration",
            "verifiable_outcome": "calibrationPlannedModal.hidden === false",
        },
        {
            "id": "config.open_escalation",
            "category": "config",
            "intent_mode": "show",
            "description": "Open the Manufacturer Engineering Escalation & Outbox modal.",
            "params_schema": {},
            "aliases_en": ["open escalation", "email manufacturer", "open outbox", "contact manufacturer"],
            "target_surface": "escalationModal",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeConfigOpenEscalation",
            "verifiable_outcome": "escalationModal.hidden === false",
        },
        {
            "id": "config.open_sensor_spec",
            "category": "config",
            "intent_mode": "show",
            "description": "Open sensor datasheet specification summary (Page 3 & sensor metadata).",
            "params_schema": {},
            "aliases_en": ["open sensor spec", "show sensor specifications"],
            "target_surface": "manualModal",
            "permissions": ["local_ui_read"],
            "availability": "requires_documentation",
            "handler": "executeConfigOpenSensorSpec",
            "verifiable_outcome": "manual_visible && page === 3",
        },
        {
            "id": "config.open_app_settings",
            "category": "config",
            "intent_mode": "apply",
            "description": "Open FieldScan's own iPadOS Settings screen via public UIApplication.openSettingsURLString (or explain manual steps on non-iPad hosts).",
            "params_schema": {},
            "aliases_en": ["open app settings", "open fieldscan settings", "open ipad permissions"],
            "target_surface": "native://app_settings",
            "permissions": ["ios_public_settings_api"],
            "availability": "ipad_native_only",
            "handler": "executeConfigOpenAppSettings",
            "verifiable_outcome": "native_settings_ack === 'opened' || unavailable_reason",
        },
        # --- Family 2: 3D Digital Twin ---
        {
            "id": "twin.reset_view",
            "category": "twin",
            "intent_mode": "apply",
            "description": "Reset 3D Digital Twin camera, collapse exploded housing, and restore solid overview.",
            "params_schema": {},
            "aliases_en": ["reset view", "reset 3d", "close housing", "close the housing", "center twin", "full view"],
            "target_surface": "canvasStage",
            "permissions": ["local_ui_write"],
            "availability": "requires_3d_scene",
            "handler": "executeTwinResetView",
            "verifiable_outcome": "state.exploded === false && state.renderMode === 'solid'",
        },
        {
            "id": "twin.set_render_mode",
            "category": "twin",
            "intent_mode": "apply",
            "description": "Switch active 3D Digital Twin between solid and X-Ray wireframe mode (for both bundled and GLB twins).",
            "params_schema": {"mode": "enum(solid,wireframe)"},
            "aliases_en": ["x-ray", "xray", "xray mode", "wireframe", "solid view", "solid mode"],
            "target_surface": "canvasStage",
            "permissions": ["local_ui_write"],
            "availability": "requires_3d_scene",
            "handler": "executeTwinSetRenderMode",
            "verifiable_outcome": "state.renderMode === params.mode",
        },
        {
            "id": "twin.set_explode",
            "category": "twin",
            "intent_mode": "apply",
            "description": "Toggle exploded assembly view on the active 3D twin (checks GLB explode capability before claiming applied).",
            "params_schema": {"exploded": "bool"},
            "aliases_en": ["explode", "exploded view", "explode twin", "open housing", "collapse twin"],
            "target_surface": "canvasStage",
            "permissions": ["local_ui_write"],
            "availability": "requires_3d_explode",
            "handler": "executeTwinSetExplode",
            "verifiable_outcome": "state.exploded === params.exploded",
        },
        {
            "id": "twin.rotate_view",
            "category": "twin",
            "intent_mode": "apply",
            "description": "Orbit, rotate, or zoom the active 3D Digital Twin camera to any requested angle (left, right, front, back, top, bottom, zoom_in, zoom_out, spin).",
            "params_schema": {"direction": "enum(left,right,front,back,top,bottom,zoom_in,zoom_out,spin)"},
            "aliases_en": ["rotate twin", "turn around", "zoom in", "zoom out", "show back", "show top", "spin model"],
            "target_surface": "canvasStage",
            "permissions": ["local_ui_write"],
            "availability": "requires_3d_scene",
            "handler": "executeTwinRotateView",
            "verifiable_outcome": "camera_view_adjusted",
        },
        {
            "id": "twin.focus_part",
            "category": "twin",
            "intent_mode": "apply",
            "description": "Highlight and focus a verified component/part on the active 3D Digital Twin.",
            "params_schema": {"part_id": "string", "view_id": "string?"},
            "aliases_en": ["focus part", "show strainer", "show probe", "show rear cable", "show flange", "show seal"],
            "target_surface": "canvasStage",
            "permissions": ["local_ui_write"],
            "availability": "requires_3d_scene",
            "handler": "executeTwinFocusPart",
            "verifiable_outcome": "focused_part_matches_requested",
        },
        {
            "id": "twin.show_dip",
            "category": "twin",
            "intent_mode": "propose",
            "description": "Display proposed SW1 DIP-8 rocker pattern for a requested Slave ID (visual proposal only; never mutates authorized Modbus target).",
            "params_schema": {"slave_id": "int(1..247)"},
            "aliases_en": ["show dip switches", "configure dip", "how to configure dip", "dip for address", "dip for modbus"],
            "target_surface": "canvasStage#upper_barrel_dip",
            "permissions": ["local_ui_write"],
            "availability": "requires_dip_profile",
            "handler": "executeTwinShowDip",
            "verifiable_outcome": "visual_dip_matches && authorized_bus_slave_unchanged",
        },
        # --- Family 3: Manual / Documentation ---
        {
            "id": "manual.open_page",
            "category": "manual",
            "intent_mode": "show",
            "description": "Open a specific verified page in the active manual document and confirm page load.",
            "params_schema": {"page": "int", "document_id": "string?", "open_lightbox": "bool?"},
            "aliases_en": ["open page", "go to page", "show page"],
            "target_surface": "manualModal",
            "permissions": ["local_ui_read"],
            "availability": "requires_documentation",
            "handler": "executeManualOpenPage",
            "verifiable_outcome": "manual_page_loaded && document_id_matches",
        },
        {
            "id": "manual.open_section",
            "category": "manual",
            "intent_mode": "show",
            "description": "Locate and highlight a verified datasheet topic/section (e.g., DIP, calibration, wiring, registers) and open viewer.",
            "params_schema": {"topic": "string", "document_id": "string?", "page": "int?", "open_lightbox": "bool?"},
            "aliases_en": ["open manual", "show dip section", "show wiring section", "show calibration section", "where in the manual"],
            "target_surface": "manualModal",
            "permissions": ["local_ui_read"],
            "availability": "requires_documentation",
            "handler": "executeManualOpenSection",
            "verifiable_outcome": "manual_section_banner_visible && page_loaded",
        },
        {
            "id": "manual.close",
            "category": "manual",
            "intent_mode": "apply",
            "description": "Close the fullscreen manual lightbox and collapse manual preview.",
            "params_schema": {},
            "aliases_en": ["close manual", "close the manual", "hide manual", "close lightbox"],
            "target_surface": "manualModal",
            "permissions": ["local_ui_write"],
            "availability": "always",
            "handler": "executeManualClose",
            "verifiable_outcome": "manualModal.hidden === true",
        },
        # --- Family 4: Live Camera ---
        {
            "id": "camera.show_live",
            "category": "camera",
            "intent_mode": "show",
            "description": "Bring live optical camera viewport into focus and report current frame origin and age.",
            "params_schema": {},
            "aliases_en": ["show live camera", "show camera", "live view"],
            "target_surface": "videoFrame",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeCameraShowLive",
            "verifiable_outcome": "videoFrame_visible && frame_origin_reported",
        },
        {
            "id": "camera.show_dip_macro",
            "category": "camera",
            "intent_mode": "show",
            "description": "Open the live DIP-8 macro inset over the camera viewport with expected vs observed vs bus target readouts.",
            "params_schema": {"visible": "bool?"},
            "aliases_en": ["open dip macro", "show dip crop", "open dip inset", "zoom dip"],
            "target_surface": "dipMacroPip",
            "permissions": ["local_ui_read"],
            "availability": "requires_dip_profile",
            "handler": "executeCameraShowDipMacro",
            "verifiable_outcome": "dipMacroPip.hidden === false",
        },
        {
            "id": "camera.highlight_region",
            "category": "camera",
            "intent_mode": "show",
            "description": "Highlight an optical inspection ROI on the spatial camera overlay.",
            "params_schema": {"region": "string"},
            "aliases_en": ["highlight region", "point out region"],
            "target_surface": "cvSpatialHudCanvas",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeCameraHighlightRegion",
            "verifiable_outcome": "spatial_hud_region_highlighted",
        },
        {
            "id": "camera.capture_evidence",
            "category": "camera",
            "intent_mode": "apply",
            "description": "Capture a verified evidence keyframe photo into the active session respecting storage budget & provenance tagging.",
            "params_schema": {"manual": "bool?"},
            "aliases_en": ["capture photo", "take photo", "capture evidence", "save photo"],
            "target_surface": "btnCaptureManualPhoto",
            "permissions": ["session_evidence_write"],
            "availability": "always",
            "handler": "executeCameraCaptureEvidence",
            "verifiable_outcome": "evidence_photo_recorded_or_budget_notice",
        },
        # --- Family 5: Bench Link, Session & Drafts ---
        {
            "id": "bench.diagnose_link",
            "category": "bench_session",
            "intent_mode": "explain",
            "description": "Diagnose PUSR/Modbus link status using unified single-source telemetry, freshness, channel quality, and trend.",
            "params_schema": {},
            "aliases_en": ["link diagnostic", "is the sensor responding", "modbus status", "pusr status", "check connection"],
            "target_surface": "systemStateBanner",
            "permissions": ["bench_telemetry_read"],
            "availability": "always",
            "handler": "executeBenchDiagnoseLink",
            "verifiable_outcome": "unified_link_state_reported",
        },
        {
            "id": "bench.poll_readonly",
            "category": "bench_session",
            "intent_mode": "apply",
            "description": "Execute a single read-only Modbus Function 0x03 poll against the authorized bus slave target.",
            "params_schema": {},
            "aliases_en": ["poll sensor", "read sensor now", "run readonly poll", "modbus read"],
            "target_surface": "btnPollReadonly",
            "permissions": ["bench_readonly_poll"],
            "availability": "requires_homologated_bus",
            "handler": "executeBenchPollReadonly",
            "verifiable_outcome": "fc03_poll_completed && zero_bus_writes",
        },
        {
            "id": "session.open_history",
            "category": "bench_session",
            "intent_mode": "show",
            "description": "Open the session activity & persistent equipment history panel.",
            "params_schema": {},
            "aliases_en": ["open history", "show history", "equipment history", "previous sessions"],
            "target_surface": "toolsPage#sessionEventLog",
            "permissions": ["session_read"],
            "availability": "always",
            "handler": "executeSessionOpenHistory",
            "verifiable_outcome": "toolsPage.classList.contains('open') && sessionEventLog_visible",
        },
        {
            "id": "session.prepare_dossier",
            "category": "bench_session",
            "intent_mode": "propose",
            "description": "Prepare local PDF + JSON maintenance dossier for the active session.",
            "params_schema": {"audience": "enum(private_bench,public_demo)?"},
            "aliases_en": ["prepare dossier", "export dossier", "generate dossier"],
            "target_surface": "btnExportSessionDossier",
            "permissions": ["session_export_local"],
            "availability": "always",
            "handler": "executeSessionPrepareDossier",
            "verifiable_outcome": "local_dossier_prepared",
        },
        {
            "id": "session.prepare_manufacturer_draft",
            "category": "bench_session",
            "intent_mode": "propose",
            "description": "Prepare a local manufacturer escalation email draft with facts, open questions, and technician-selected attachments (never auto-sends).",
            "params_schema": {},
            "aliases_en": ["manufacturer draft", "prepare escalation", "email manufacturer draft"],
            "target_surface": "escalationModal",
            "permissions": ["session_draft_local"],
            "availability": "always",
            "handler": "executeSessionPrepareManufacturerDraft",
            "verifiable_outcome": "local_draft_saved && external_sent === false",
        },
        {
            "id": "session.prepare_stock_draft",
            "category": "bench_session",
            "intent_mode": "propose",
            "description": "Prepare a local stock replenishment draft ONLY when verified SKU, quantity, and threshold are explicitly provided.",
            "params_schema": {"sku": "string", "verified_quantity": "int", "reorder_threshold": "int"},
            "aliases_en": ["stock draft", "reorder stock", "prepare stock order"],
            "target_surface": "toolsPage#sessionEventLog",
            "permissions": ["session_draft_local"],
            "availability": "requires_verified_stock_data",
            "handler": "executeSessionPrepareStockDraft",
            "verifiable_outcome": "local_stock_draft_saved || unverified_blocked",
        },
        {
            "id": "catalog.clear_sensor",
            "category": "config",
            "intent_mode": "apply",
            "description": "Clear active sensor profile and cached cloud packages to a clean empty workspace without modifying PUSR gateway settings.",
            "params_schema": {"clear_installed_packages": "bool?"},
            "aliases_en": ["clear sensor", "reset sensor", "wipe sensor", "clear sensor workspace"],
            "target_surface": "catalogModal",
            "permissions": ["local_catalog_write"],
            "availability": "always",
            "handler": "executeCatalogClearSensor",
            "verifiable_outcome": "scene_origin === 'empty_workspace' && pusr_preserved === true",
        },
        {
            "id": "catalog.identify_new_sensor",
            "category": "config",
            "intent_mode": "show",
            "description": "Capture a live camera snapshot and prompt the operator for the new sensor's manufacturer and model.",
            "params_schema": {"capture_photo": "bool?"},
            "aliases_en": ["new sensor", "identify new sensor", "identify this sensor", "scan new sensor"],
            "target_surface": "sensorOnboardModal",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeCatalogIdentifyNewSensor",
            "verifiable_outcome": "sensorOnboardModal.hidden === false",
        },
        {
            "id": "catalog.onboard_sensor",
            "category": "config",
            "intent_mode": "apply",
            "description": "Populate or submit a new sensor onboarding request to FieldScan Cloud with live progress and automatic hot-load.",
            "params_schema": {"manufacturer": "string?", "model": "string?", "variant": "string?", "auto_submit": "bool?", "force_refresh": "bool?"},
            "aliases_en": ["this is a", "this sensor is", "onboard sensor", "process in cloud", "download manual for"],
            "target_surface": "sensorOnboardModal",
            "permissions": ["catalog_cloud_authorized"],
            "availability": "always",
            "handler": "executeCatalogOnboardSensor",
            "verifiable_outcome": "cloud_onboarding_dispatched_or_ready",
        },
        # --- Family 6: Help ---
        {
            "id": "help.list_actions",
            "category": "help",
            "intent_mode": "explain",
            "description": "List available copilot actions dynamically from the bounded action registry.",
            "params_schema": {},
            "aliases_en": ["help", "what can you do", "list actions", "available actions", "commands"],
            "target_surface": "chatPage",
            "permissions": ["local_ui_read"],
            "availability": "always",
            "handler": "executeHelpListActions",
            "verifiable_outcome": "registry_actions_enumerated",
        },
    ]

    for item in base:
        item["aliases_es"] = list(es_aliases.get(item["id"]) or [])
    return base


def compute_scene_capabilities(descriptor: dict[str, Any] | None) -> dict[str, Any]:
    """Compute declared runtime capabilities for the active scene (`bundled_parametric`, `catalog_glb`, `docs_only_no_3d`)."""
    desc = descriptor or {}
    origin = str(desc.get("scene_origin") or "bundled_parametric")
    ctx = desc.get("context") or {}
    docs = list(desc.get("documents") or [])
    homologated = bool(ctx.get("bench_modbus_homologated", origin == "bundled_parametric"))

    if origin == "bundled_parametric":
        return {
            "scene_origin": origin,
            "supports_3d": True,
            "supports_xray": True,
            "supports_explode": True,
            "supports_dip_pins": True,
            "supports_documentation": True,
            "bench_modbus_homologated": homologated,
            "part_ids": [
                "strainer_head",
                "upper_seal_ring",
                "upper_barrel_dip",
                "mounting_flange",
                "lower_barrel_rs485",
                "waterproof_gland_leads",
            ],
            "view_ids": ["isometric_home", "dip_closeup", "rear_wiring", "tip_closeup", "flange_closeup"],
            "document_count": max(1, len(docs)),
        }

    if origin == "empty_workspace":
        return {
            "scene_origin": origin,
            "supports_3d": False,
            "supports_xray": False,
            "supports_explode": False,
            "supports_dip_pins": False,
            "supports_documentation": False,
            "bench_modbus_homologated": False,
            "part_ids": [],
            "view_ids": [],
            "document_count": 0,
        }
    if origin == "docs_only_no_3d":
        return {
            "scene_origin": origin,
            "supports_3d": False,
            "supports_xray": False,
            "supports_explode": False,
            "supports_dip_pins": False,
            "supports_documentation": len(docs) > 0,
            "bench_modbus_homologated": homologated,
            "part_ids": [],
            "view_ids": [],
            "document_count": len(docs),
        }

    twin = desc.get("twin") or {}
    parts = list(twin.get("parts") or [])
    views = list(twin.get("views") or [])
    part_ids = [str(p.get("part_id") or "") for p in parts if p.get("part_id")]
    view_ids = [str(v.get("view_id") or "") for v in views if v.get("view_id")]
    has_explode = any(
        isinstance(p.get("explode_offset_m"), list) and len(p.get("explode_offset_m")) == 3 for p in parts
    ) or any(
        isinstance(v.get("exploded_offsets_m"), dict) and len(v.get("exploded_offsets_m")) > 0 for v in views
    )
    has_dip_pins = any("dip" in pid.lower() for pid in part_ids)
    return {
        "scene_origin": origin,
        "supports_3d": bool(twin.get("glb_url")),
        "supports_xray": bool(twin.get("glb_url")),
        "supports_explode": bool(twin.get("glb_url")) and has_explode,
        "supports_dip_pins": has_dip_pins,
        "supports_documentation": len(docs) > 0,
        "bench_modbus_homologated": homologated,
        "part_ids": part_ids,
        "view_ids": view_ids,
        "document_count": len(docs),
    }


def format_voice_template(
    key: str,
    *,
    language: str = "en",
    en_default: str,
    params: dict[str, Any] | None = None,
    project_root: Path = PROJECT_ROOT,
) -> str:
    """Format a localized spoken/text response (English in code, Spanish from audited JSON resource)."""
    vals = params or {}
    tpl = en_default
    if language == "es":
        pack = load_spanish_voice_pack(project_root)
        es_tpl = (pack.get("responses") or {}).get(key)
        if isinstance(es_tpl, str) and es_tpl.strip():
            tpl = es_tpl
    try:
        return tpl.format(**vals)
    except Exception:
        return tpl


def evaluate_unified_link_diagnostic(
    modbus_tel: dict[str, Any] | None,
    *,
    gateway_config: dict[str, Any] | None = None,
    language: str = "en",
    ssid_verified: bool = False,
    previous_online: bool | None = None,
    project_root: Path = PROJECT_ROOT,
) -> dict[str, Any]:
    """Single source of truth for HMI and voice Modbus/PUSR link diagnosis (Section 4).

    Distinguishes:
    - `local_network_or_permission_unconfirmed`
    - `gateway_connected_no_sensor_reply`
    - `channel_fault_7fff`
    - `link_lost_historical`
    - `online_temp_falling` (only when >= 2 valid fresh samples from same source & unit)
    - `link_recovered` (only on new valid response after offline state)
    - `online_nominal`
    - `simulation_mode`
    """
    mb = modbus_tel or {}
    gw = gateway_config or {}
    online = bool(mb.get("online"))
    fresh = bool(mb.get("fresh", online))
    is_sim = bool(mb.get("simulation") or str(mb.get("source") or "").startswith("simulator"))
    gw_connected = bool(mb.get("gateway_connected"))
    err_code = str(mb.get("error_code") or "")
    err_detail = str(mb.get("error_detail") or mb.get("status_label") or err_code or "unconfirmed")
    target_slave = int(mb.get("target_slave_id") or mb.get("slave_id") or 1)
    host = str(gw.get("host") or "").strip()
    port = int(gw.get("port") or 502)
    gw_label = f"{host}:{port}" if host else str(mb.get("port") or "PUSR :502")
    source_label = str(mb.get("source") or ("simulation" if is_sim else "modbus_tcp_mbap"))
    protocol = str(mb.get("protocol") or ("simulation" if is_sim else "modbus_tcp_mbap"))

    temp_c = mb.get("temp_c")
    hum_rh = mb.get("humidity_rh")
    temp_q = str(mb.get("temp_quality") or ("valid" if temp_c is not None else "unavailable"))
    hum_q = str(mb.get("humidity_quality") or ("valid" if hum_rh is not None else "unavailable"))
    abn_7fff = bool(mb.get("sensor_abnormal_7fff") or temp_q == "invalid_sentinel_7fff" or hum_q == "invalid_sentinel_7fff")
    hist_sample = mb.get("historical_sample") if isinstance(mb.get("historical_sample"), dict) else None
    history_rows = mb.get("history") if isinstance(mb.get("history"), list) else []

    ssid_note_en = "" if ssid_verified else "SSID not verified (iPadOS does not expose Wi-Fi SSID)."
    ssid_note_es = "" if ssid_verified else "SSID no comprobado."

    # 1. Valid reply with 0x7FFF sentinel on one or both channels
    if online and abn_7fff:
        fault_parts = []
        valid_parts = []
        if temp_q == "invalid_sentinel_7fff":
            fault_parts.append("Temperature=0x7FFF")
        elif temp_c is not None and temp_q == "valid":
            valid_parts.append(f"Temperature={float(temp_c):.1f} degC (valid)")
        if hum_q == "invalid_sentinel_7fff":
            fault_parts.append("Humidity=0x7FFF")
        elif hum_rh is not None and hum_q == "valid":
            valid_parts.append(f"Humidity={float(hum_rh):.1f} %RH (valid)")
        fault_detail = ", ".join(fault_parts) or "0x7FFF"
        valid_sibling = (f"Other channel preserved: {', '.join(valid_parts)}." if valid_parts else "Both sensing channels returned 0x7FFF.")
        msg = format_voice_template(
            "link_channel_fault",
            language=language,
            en_default=(
                "The transmitter responds on Slave #{slave_id}, but the sensing channel reports a probe fault ({fault_detail}). "
                "{valid_sibling}"
            ),
            params={"slave_id": target_slave, "fault_detail": fault_detail, "valid_sibling": valid_sibling},
            project_root=project_root,
        )
        return {
            "state": "channel_fault_7fff",
            "severity": "red",
            "mode": "simulation" if is_sim else "physical",
            "gateway_connected": True,
            "sensor_responded": True,
            "fresh": fresh,
            "temp_quality": temp_q,
            "humidity_quality": hum_q,
            "hypotheses": ["SHT30 sensing element fault, condensation, or open probe connection (Manual Page 6)."],
            "recommended_action": "twin.focus_part:strainer_head",
            "message": msg,
            "ssid_verified": ssid_verified,
        }

    # 2. Online valid fresh reading (check recovery & real falling temperature trend)
    if online and fresh:
        temp_str = f"{float(temp_c):.1f} degC" if temp_c is not None else "N/A"
        hum_str = f"{float(hum_rh):.1f} %RH" if hum_rh is not None else "N/A"

        # Detect falling temperature ONLY across >= 2 valid fresh samples from same source & unit
        valid_temps: list[float] = []
        for row in history_rows[-6:]:
            if not isinstance(row, dict):
                continue
            if row.get("simulation", is_sim) != is_sim:
                continue
            if row.get("source") and str(row.get("source")) != source_label:
                continue
            if row.get("unit") and str(row.get("unit")) not in ("Cel", "degC", "C"):
                continue
            if row.get("temp_quality", "valid") != "valid":
                continue
            tv = row.get("temp_c")
            if isinstance(tv, (int, float)):
                valid_temps.append(float(tv))
        if isinstance(temp_c, (int, float)) and temp_q == "valid":
            if not valid_temps or abs(valid_temps[-1] - float(temp_c)) > 1e-6:
                valid_temps.append(float(temp_c))

        temp_falling = False
        delta_t = 0.0
        if len(valid_temps) >= 2:
            delta_t = round(valid_temps[-1] - valid_temps[0], 2)
            # Strictly monotone non-increasing with meaningful drop >= 0.4 degC
            if delta_t <= -0.4 and all(valid_temps[i + 1] <= valid_temps[i] + 0.05 for i in range(len(valid_temps) - 1)):
                temp_falling = True

        recovered = previous_online is False
        if recovered:
            msg = format_voice_template(
                "link_recovered",
                language=language,
                en_default="Modbus link recovered after a new valid reading on Slave #{slave_id}: {temp_str}, {hum_str}.",
                params={"slave_id": target_slave, "temp_str": temp_str, "hum_str": hum_str},
                project_root=project_root,
            )
            state_name = "link_recovered"
        elif temp_falling:
            msg = format_voice_template(
                "link_temp_falling",
                language=language,
                en_default=(
                    "Observed across {sample_count} fresh valid samples from the same source: "
                    "temperature decreased from {first_temp} to {last_temp} degC ({delta_temp} degC)."
                ),
                params={
                    "sample_count": len(valid_temps),
                    "first_temp": f"{valid_temps[0]:.1f}",
                    "last_temp": f"{valid_temps[-1]:.1f}",
                    "delta_temp": f"{delta_t:+.1f}",
                },
                project_root=project_root,
            )
            state_name = "online_temp_falling"
        else:
            msg = format_voice_template(
                "link_online_ok",
                language=language,
                en_default="Transmitter responded on Slave #{slave_id} ({protocol}, source: {source_label}): Temperature {temp_str}, Humidity {hum_str}.",
                params={
                    "slave_id": target_slave,
                    "protocol": protocol,
                    "source_label": source_label,
                    "temp_str": temp_str,
                    "hum_str": hum_str,
                },
                project_root=project_root,
            )
            state_name = "simulation_mode" if is_sim else "online_nominal"

        return {
            "state": state_name,
            "severity": "green",
            "mode": "simulation" if is_sim else "physical",
            "gateway_connected": True,
            "sensor_responded": True,
            "fresh": True,
            "recovered": recovered,
            "temperature_trend": "falling" if temp_falling else "stable",
            "trend_sample_count": len(valid_temps),
            "trend_delta_c": delta_t,
            "temp_quality": temp_q,
            "humidity_quality": hum_q,
            "hypotheses": [],
            "recommended_action": None,
            "message": msg,
            "ssid_verified": ssid_verified,
        }

    # 3. Prior valid reading exists, link now lost -> strictly historical
    if hist_sample is not None:
        last_ts = str(hist_sample.get("captured_at_utc") or "earlier")
        ht = hist_sample.get("temp_c")
        hh = hist_sample.get("humidity_rh")
        last_vals = f"{ht if ht is not None else '--'} degC / {hh if hh is not None else '--'} %RH"
        msg = format_voice_template(
            "link_lost_historical",
            language=language,
            en_default="Last valid reading at {last_ts} ({last_values}); there is no recent data now ({error_code}). Displayed strictly as historical.",
            params={"last_ts": last_ts, "last_values": last_vals, "error_code": err_code or "READ_TIMEOUT"},
            project_root=project_root,
        )
        return {
            "state": "link_lost_historical",
            "severity": "amber" if gw_connected else "red",
            "mode": "simulation" if is_sim else "physical",
            "gateway_connected": gw_connected,
            "sensor_responded": False,
            "fresh": False,
            "historical_sample": hist_sample,
            "temperature_trend": "no_recent_data",
            "hypotheses": [
                "Link dropped after prior valid sample; check power, RS-485 A+/B- wiring, or Wi-Fi AP association (unverified hypotheses)."
            ],
            "recommended_action": "config.open_pusr" if not gw_connected else "bench.poll_readonly",
            "message": msg,
            "ssid_verified": ssid_verified,
        }

    # 4. PUSR gateway reachable on :502, but RS-485 transmitter did not respond (or returned exception)
    if gw_connected:
        msg = format_voice_template(
            "link_gateway_no_sensor",
            language=language,
            en_default=(
                "The gateway responds ({gateway}), but the Modbus transmitter did not answer this query ({error_code}). "
                "Bench hypotheses to check (not confirmed faults): 5-24V DC power, RS-485 A+/B- polarity, 9600 8N1 baud, and Slave #{target_slave} DIP address."
            ),
            params={"gateway": gw_label, "error_code": err_code or "READ_TIMEOUT", "target_slave": target_slave},
            project_root=project_root,
        )
        return {
            "state": "gateway_connected_no_sensor_reply",
            "severity": "amber",
            "mode": "physical",
            "gateway_connected": True,
            "sensor_responded": False,
            "fresh": False,
            "hypotheses": [
                "Sensor 5-24V DC power supply not energized (hypothesis — not measured by iPad)",
                "RS-485 Yellow (A+) / Green (B-) polarity swapped or missing common Black GND (Manual Page 4)",
                f"Baud rate mismatch (9600 8N1 expected) or SW1 DIP-8 address differs from authorized target #{target_slave} (Manual Page 5)",
            ],
            "recommended_action": "manual.open_section:wiring_grounding",
            "message": msg,
            "ssid_verified": ssid_verified,
        }

    # 5. Local network / permission / route not confirmed
    reason_kind = (
        "iPadOS Local Network permission denied"
        if err_code == "LOCAL_NETWORK_DENIED"
        else ("No PUSR gateway host configured" if not host else f"Route unreachable ({err_detail})")
    )
    msg = format_voice_template(
        "link_local_blocked",
        language=language,
        en_default="The iPad cannot reach the gateway yet ({detail}). {ssid_note} Check Local Network permission or open the PUSR setup panel.",
        params={"detail": reason_kind, "ssid_note": ssid_note_es if language == "es" else ssid_note_en},
        project_root=project_root,
    )
    return {
        "state": "local_network_or_permission_unconfirmed",
        "severity": "red",
        "mode": "simulation" if is_sim else "physical",
        "gateway_connected": False,
        "sensor_responded": False,
        "fresh": False,
        "hypotheses": [reason_kind],
        "recommended_action": "config.open_app_settings" if err_code == "LOCAL_NETWORK_DENIED" else "config.open_pusr",
        "message": msg,
        "ssid_verified": ssid_verified,
    }


class GuidanceSessionTracker:
    """Synchronized physical guidance state machine (`preparing` .. `complete`, Section 3)."""

    def __init__(self) -> None:
        self.active: bool = False
        self.guidance_id: str | None = None
        self.session_id: str | None = None
        self.state: str = "preparing"
        self.topic: str = "dip_config"
        self.profile_id: str = "tzone_tht02"
        self.target_slave_id: int = 1
        self.expected_bits: list[int] = [0, 0, 0, 0, 0, 0, 0, 1]
        self.current_switch_index: int = 7  # Pin 8 first for Slave #1
        self.step_order: list[int] = [8, 1, 2, 3, 4, 5, 6, 7]
        self.step_cursor: int = 0
        self.reference_only: bool = False
        self.occlusion_streak: int = 0
        self.clear_streak: int = 0
        self.last_angle_deg: float | None = None
        self.transitions: list[dict[str, Any]] = []
        self.confirmed_origin: str | None = None
        self.last_camera_eval: dict[str, Any] = {}

    def start_dip_guidance(
        self,
        *,
        target_slave_id: int,
        session_id: str | None,
        profile_id: str,
        supports_dip_pins: bool,
        authorized_bus_slave_id: int,
        turn_id: str | None = None,
    ) -> dict[str, Any]:
        self.active = True
        self.guidance_id = f"guid-{uuid.uuid4().hex[:10]}"
        self.session_id = session_id
        self.profile_id = profile_id
        self.target_slave_id = max(1, min(247, int(target_slave_id)))
        self.expected_bits = _address_to_dip_bits(self.target_slave_id)
        self.reference_only = not supports_dip_pins
        self.occlusion_streak = 0
        self.clear_streak = 0
        self.confirmed_origin = None
        self.transitions = []

        on_pins = [i + 1 for i, b in enumerate(self.expected_bits) if b == 1]
        off_pins = [i + 1 for i, b in enumerate(self.expected_bits) if b == 0]
        self.step_order = on_pins + off_pins
        self.step_cursor = 0
        self.current_switch_index = (self.step_order[0] - 1) if self.step_order else 7

        self._record_transition("preparing", reason="guidance_initialized", turn_id=turn_id)
        if self.reference_only:
            self._record_transition("needs_review", reason="profile_reference_only_no_verified_dip_geometry", turn_id=turn_id)
        else:
            self._record_transition("showing_instruction", reason="dip_pattern_displayed", turn_id=turn_id)
            self._record_transition("waiting_for_operator", reason="awaiting_physical_switch_setup", turn_id=turn_id)
        return self.snapshot(authorized_bus_slave_id=authorized_bus_slave_id)

    def _record_transition(self, next_state: str, *, reason: str, turn_id: str | None = None, extra: dict[str, Any] | None = None) -> None:
        if next_state not in GUIDANCE_STATES:
            return
        self.state = next_state
        entry: dict[str, Any] = {
            "state": next_state,
            "reason": reason,
            "at_utc": _utc_now_iso(),
            "turn_id": turn_id,
        }
        if extra:
            entry.update(extra)
        self.transitions.append(entry)
        if len(self.transitions) > 40:
            self.transitions = self.transitions[-40:]

    def evaluate_camera_observation(
        self,
        vision_tel: dict[str, Any],
        *,
        authorized_bus_slave_id: int,
        language: str = "en",
        turn_id: str | None = None,
        project_root: Path = PROJECT_ROOT,
    ) -> dict[str, Any]:
        """Evaluate live camera frame with occlusion debounce, motion gating, freshness & orientation checks."""
        if not self.active:
            return self.snapshot(authorized_bus_slave_id=authorized_bus_slave_id)

        cam_src = str(vision_tel.get("camera_source") or vision_tel.get("mode") or "unknown").lower()
        is_sim = cam_src.startswith("sim") or "simulator" in cam_src
        is_upload = "upload" in cam_src or "custom" in cam_src or "file" in cam_src
        is_cad = "cad" in cam_src or "blueprint" in cam_src
        frame_origin = "simulation" if is_sim else ("uploaded_file" if is_upload else ("cad_blueprint" if is_cad else "live_physical_camera"))

        frame_age_s = float(vision_tel.get("frame_age_s") or 0.0)
        hand_or_tool = bool(vision_tel.get("hand_detected") or vision_tel.get("tool_detected") or vision_tel.get("occlusion_filtered"))
        pcb_open = bool(vision_tel.get("pcb_open_detected"))
        dip_conf = float(vision_tel.get("dip_confidence") or 0.0)
        orientation_confirmed = bool(vision_tel.get("dip_orientation_confirmed", True))
        orientation_inverted = bool(vision_tel.get("dip_orientation_inverted", False))
        angle_deg = vision_tel.get("angle_deg")
        rapid_motion = False
        if isinstance(angle_deg, (int, float)) and self.last_angle_deg is not None:
            if abs(float(angle_deg) - self.last_angle_deg) > 12.0:
                rapid_motion = True
        if isinstance(angle_deg, (int, float)):
            self.last_angle_deg = float(angle_deg)

        active_pin = self.step_order[self.step_cursor] if self.step_cursor < len(self.step_order) else 8
        alert_msg: str | None = None

        if self.reference_only:
            self._record_transition("needs_review", reason="reference_only_profile", turn_id=turn_id)
            alert_msg = format_voice_template(
                "dip_reference_only",
                language=language,
                en_default="Active package has no verified DIP switch geometry; staying in reference mode without inventing pin positions.",
                project_root=project_root,
            )
        elif frame_origin != "live_physical_camera":
            self._record_transition("needs_review", reason=f"non_live_source:{frame_origin}", turn_id=turn_id)
            alert_msg = format_voice_template(
                "dip_low_confidence",
                language=language,
                en_default="Cannot confirm switch {switch_num} yet ({reason}). Show a live physical camera view or confirm manually.",
                params={"switch_num": active_pin, "reason": f"source={frame_origin}"},
                project_root=project_root,
            )
        elif frame_age_s > 3.0:
            self._record_transition("needs_review", reason="stale_camera_frame", turn_id=turn_id)
            alert_msg = format_voice_template(
                "dip_low_confidence",
                language=language,
                en_default="Cannot confirm switch {switch_num} yet ({reason}). Point the live camera at the DIP block or confirm manually.",
                params={"switch_num": active_pin, "reason": f"frame_age={frame_age_s:.1f}s"},
                project_root=project_root,
            )
        elif hand_or_tool:
            self.occlusion_streak += 1
            self.clear_streak = 0
            if self.occlusion_streak >= 2 or self.state != "waiting_for_clear_frame":
                self._record_transition("waiting_for_clear_frame", reason="hand_or_tool_occluding_dip", turn_id=turn_id)
                alert_msg = format_voice_template(
                    "dip_occlusion",
                    language=language,
                    en_default="Your hand or tool is covering the DIP block. Please move it aside briefly so I can verify the switch position.",
                    project_root=project_root,
                )
        elif rapid_motion:
            self.clear_streak = 0
            self._record_transition("waiting_for_clear_frame", reason="camera_in_motion_throttled", turn_id=turn_id)
        elif orientation_inverted or not orientation_confirmed:
            self.clear_streak = 0
            self._record_transition("needs_review", reason="dip_orientation_unconfirmed_or_inverted", turn_id=turn_id)
            alert_msg = format_voice_template(
                "dip_low_confidence",
                language=language,
                en_default="Cannot confirm switch {switch_num} yet ({reason}). Align Pin 1..8 orientation clearly or confirm manually.",
                params={"switch_num": active_pin, "reason": "inverted_or_unconfirmed_orientation"},
                project_root=project_root,
            )
        elif not pcb_open or dip_conf < 0.55:
            self.clear_streak = 0
            self._record_transition("needs_review", reason="low_dip_optical_confidence", turn_id=turn_id)
            alert_msg = format_voice_template(
                "dip_low_confidence",
                language=language,
                en_default="Cannot confirm switch {switch_num} yet ({reason}). Bring the exposed DIP-8 block into clear focus or confirm manually.",
                params={"switch_num": active_pin, "reason": f"confidence={dip_conf:.2f}"},
                project_root=project_root,
            )
        else:
            self.occlusion_streak = 0
            self.clear_streak += 1
            observed_bits = vision_tel.get("observed_dip_bits")
            if isinstance(observed_bits, list) and len(observed_bits) == 8 and observed_bits != self.expected_bits:
                mismatched = [i + 1 for i in range(8) if int(observed_bits[i]) != int(self.expected_bits[i])]
                self._record_transition(
                    "needs_review",
                    reason="dip_pattern_discrepancy",
                    turn_id=turn_id,
                    extra={"mismatched_pins": mismatched},
                )
                alert_msg = format_voice_template(
                    "dip_low_confidence",
                    language=language,
                    en_default="Discrepancy detected on switch {switch_num} ({reason}). Expected {expected_pattern}; verify physically.",
                    params={
                        "switch_num": mismatched[0],
                        "reason": f"pins_differ:{mismatched}",
                        "expected_pattern": _format_dip_instruction_en(self.expected_bits),
                    },
                    project_root=project_root,
                )
            elif self.clear_streak >= 2:
                self._record_transition("observed", reason="multi_frame_clear_optical_observation", turn_id=turn_id)
                alert_msg = format_voice_template(
                    "dip_observed",
                    language=language,
                    en_default=(
                        "Clear optical view observed ({source_label}). Expected pattern: {expected_pattern}. "
                        "Optical view credits visible position only; Modbus operation requires a fresh physical bus read."
                    ),
                    params={"source_label": frame_origin, "expected_pattern": _format_dip_instruction_en(self.expected_bits)},
                    project_root=project_root,
                )

        self.last_camera_eval = {
            "frame_origin": frame_origin,
            "frame_age_s": round(frame_age_s, 3),
            "hand_or_tool_occluded": hand_or_tool,
            "rapid_motion": rapid_motion,
            "orientation_confirmed": orientation_confirmed and not orientation_inverted,
            "dip_confidence": round(dip_conf, 3),
            "can_credit_physical_position": self.state == "observed",
            "can_credit_modbus_operation": False,
            "alert_message": alert_msg,
        }
        return self.snapshot(authorized_bus_slave_id=authorized_bus_slave_id)

    def confirm_operator_step(
        self,
        *,
        manual: bool = True,
        authorized_bus_slave_id: int = 1,
        complete: bool = False,
        turn_id: str | None = None,
    ) -> dict[str, Any]:
        if not self.active:
            return self.snapshot(authorized_bus_slave_id=authorized_bus_slave_id)
        self.confirmed_origin = "manual_operator_confirmation" if manual else "optical_plus_operator_confirmation"
        self._record_transition("confirmed", reason=self.confirmed_origin, turn_id=turn_id)
        if complete or self.step_cursor + 1 >= len(self.step_order):
            self._record_transition("complete", reason="guidance_steps_completed", turn_id=turn_id)
        else:
            self.step_cursor += 1
            self.current_switch_index = self.step_order[self.step_cursor] - 1
            self._record_transition("showing_instruction", reason="next_switch_step", turn_id=turn_id)
        return self.snapshot(authorized_bus_slave_id=authorized_bus_slave_id)

    def snapshot(self, *, authorized_bus_slave_id: int) -> dict[str, Any]:
        active_pin = self.step_order[self.step_cursor] if self.step_cursor < len(self.step_order) else 8
        want_state = "ON" if (0 <= active_pin - 1 < len(self.expected_bits) and self.expected_bits[active_pin - 1] == 1) else "OFF"
        return {
            "active": self.active,
            "guidance_id": self.guidance_id,
            "session_id": self.session_id,
            "state": self.state,
            "profile_id": self.profile_id,
            "reference_only": self.reference_only,
            "expected_dip_address": self.target_slave_id,
            "expected_dip_bits": list(self.expected_bits),
            "expected_pattern_summary": _format_dip_instruction_en(self.expected_bits),
            "active_switch_number": active_pin,
            "active_switch_instruction": f"Switch {active_pin} -> {want_state}",
            "authorized_bus_slave_id": int(authorized_bus_slave_id),
            "bus_target_mutated": False,
            "confirmed_origin": self.confirmed_origin,
            "camera_observation": dict(self.last_camera_eval),
            "transitions": list(self.transitions[-12:]),
        }


def resolve_copilot_action_plan(
    query: str,
    *,
    descriptor: dict[str, Any] | None = None,
    modbus_tel: dict[str, Any] | None = None,
    vision_tel: dict[str, Any] | None = None,
    gateway_config: dict[str, Any] | None = None,
    sync_telemetry: dict[str, Any] | None = None,
    authorized_bus_slave_id: int = 1,
    current_dip_address: int = 1,
    session_id: str | None = None,
    scene_generation: int = 1,
    turn_id: str | None = None,
    preferred_language: str = "en",
    is_ipad_native: bool = False,
    project_root: Path = PROJECT_ROOT,
) -> dict[str, Any] | None:
    """Resolve an EN/ES operator query into a validated `copilot_action_plan_v1` (or `None` to fall through to conversational/VLM)."""
    raw = (query or "").strip()
    if not raw:
        return None
    norm = normalize_ascii_lower(raw)
    lang = detect_copilot_language(raw, preferred_language=preferred_language, project_root=project_root)
    tid = turn_id or f"turn-{uuid.uuid4().hex[:10]}"
    ctx = (descriptor or {}).get("context") or {}
    manifest_sha = str(ctx.get("manifest_sha256") or "bundle-tzone-tht02-v2.1")
    caps = compute_scene_capabilities(descriptor)
    gw = gateway_config or {}
    sync = sync_telemetry or {}
    cloud_enabled = bool(sync.get("sync_enabled", False))
    cloud_state_txt = ("enabled" if cloud_enabled else "disabled") if lang == "en" else ("habilitado" if cloud_enabled else "deshabilitado")
    gw_host = str(gw.get("host") or "").strip()
    gw_port = int(gw.get("port") or 502)
    host_display = gw_host if gw_host else ("Not configured" if lang == "en" else "Sin configurar")

    def _plan(
        actions: list[dict[str, Any]],
        *,
        intent_mode: str,
        reply: str,
        confirmation: str = "none",
        ambiguous: bool = False,
        clarification_prompt: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        out: dict[str, Any] = {
            "schema": "copilot_action_plan_v1",
            "turn_id": tid,
            "session_id": session_id,
            "scene_generation": int(scene_generation),
            "manifest_sha256": manifest_sha,
            "language": lang,
            "intent_mode": intent_mode,
            "confirmation": confirmation,
            "ambiguous": ambiguous,
            "clarification_prompt": clarification_prompt,
            "actions": actions,
            "reply_text": reply,
            "authorized_bus_slave_id": int(authorized_bus_slave_id),
            "bus_target_mutated": False,
            "scene_capabilities": caps,
        }
        if extra:
            out.update(extra)
        return out

    # 0a. Clear Sensor Workspace (preserves fixed PUSR gateway 100%)
    if re.search(r"\b(clear|reset|wipe|unload|remove)\b.*\b(sensor|workspace|twin|profile|device)\b", norm) and not re.search(r"\b(3d|view|camera|pusr|gateway)\b", norm):
        return _plan(
            [{"id": "catalog.clear_sensor", "params": {"clear_installed_packages": True}}],
            intent_mode="apply",
            reply=(
                "Sensor workspace cleared. No sensor profile is loaded on this iPad. "
                "Your PUSR RS-485 gateway connection remains active. Point the camera at a sensor "
                "and say 'Identify this sensor' or tell me its manufacturer and model."
            ),
        )

    # 0b. Identify New Sensor (live camera snapshot + prompt for manufacturer & model)
    if re.search(r"\b(identify|scan|add|onboard|register|detect)\b.*\b(new|this|unknown|different)?\s*(sensor|device|equipment)\b", norm) or re.match(
        r"^(new sensor|i have a new sensor|different sensor|unknown sensor)$", norm
    ):
        return _plan(
            [{"id": "catalog.identify_new_sensor", "params": {"capture_photo": True}}],
            intent_mode="show",
            reply="Photo captured from the live camera. No matching sensor profile is loaded yet. What manufacturer and model is this sensor?",
        )

    # 0c. Spoken Brand & Model Identification or Cloud Onboarding Confirmation (100% English)
    parsed_sensor = _parse_spoken_sensor_identity(raw)
    if parsed_sensor is not None:
        mfg, mod, variant, auto_sub = parsed_sensor
        act_params: dict[str, Any] = {
            "manufacturer": mfg,
            "model": mod,
            "auto_submit": auto_sub,
            "force_refresh": True,
        }
        if variant:
            act_params["variant"] = variant
        spoken_name = mod if mfg == "UNKNOWN" else f"{mfg} {mod}"
        reply = (
            f"Got it — {spoken_name}. Submitting your request to FieldScan Cloud now to fetch the latest official datasheet and build the 3D Digital Twin."
            if auto_sub
            else f"Captured {spoken_name} with the live camera photo. Say 'Process in cloud' or tap Request from FieldScan Cloud to fetch the official manual and 3D Digital Twin."
        )
        return _plan(
            [{"id": "catalog.onboard_sensor", "params": act_params}],
            intent_mode="apply",
            reply=reply,
        )
    if re.search(r"\b(process in cloud|send to cloud|download from cloud|fetch from cloud|yes download|yes process|download the manual and twin)\b", norm):
        return _plan(
            [{"id": "catalog.onboard_sensor", "params": {"confirm_pending": True, "auto_submit": True, "force_refresh": True}}],
            intent_mode="apply",
            reply="Confirmed. Submitting the sensor request to FieldScan Cloud now.",
        )

    # 0. Explicit help / list available actions from the registry
    if re.search(r"\b(list actions|available actions|what actions|help me|ayuda|lista de acciones|acciones disponibles)\b", norm) or norm in ("help", "commands", "ayuda"):
        reg = build_action_registry(project_root)
        cats = sorted({a["category"] for a in reg})
        summary = ", ".join(f"{c}: {sum(1 for a in reg if a['category'] == c)}" for c in cats)
        reply = format_voice_template(
            "help_intro",
            language=lang,
            en_default="Available FieldScan copilot actions ({count} registered across categories): {summary}.",
            params={"count": len(reg), "summary": summary},
            project_root=project_root,
        )
        return _plan(
            [{"id": "help.list_actions", "params": {"categories": cats, "count": len(reg)}}],
            intent_mode="explain",
            reply=reply,
            extra={"registry_count": len(reg)},
        )

    # 1. Explicit guard on mutating network/bus/cloud settings by voice/chat without explicit confirmation
    if re.search(r"\b(change|set|modify|save|write|cambiar|guardar|modificar)\b.*\b(target slave|bus slave|modbus target|pusr ip|gateway ip|cloud sync|habilitar cloud|enable cloud)\b", norm):
        reply = format_voice_template(
            "confirmation_required",
            language=lang,
            en_default="This action ({action_id}) requires explicit operator confirmation in the UI control. No settings were modified.",
            params={"action_id": "configuration_mutation"},
            project_root=project_root,
        )
        return _plan(
            [{"id": "config.open_pusr" if "pusr" in norm or "gateway" in norm else "config.open_catalog", "params": {"read_only_preview": True}, "status_hint": "requires_confirmation"}],
            intent_mode="propose",
            confirmation="required",
            reply=reply,
        )

    # 2. PUSR Gateway Config & Field Locator (UI-01: EN + ES)
    wants_pusr = bool(re.search(r"\b(pusr|usr-?dr164|gateway)\b", norm))
    wants_pusr_open_or_show = wants_pusr and bool(
        re.search(r"\b(open|show|where|config|setup|settings|port|host|ip|address|abre|abrir|muestr\w*|donde|configur\w*|puerto|direccion|panel)\b", norm)
    )
    if wants_pusr_open_or_show and not re.search(r"\b(diagnos\w*|status|respondiendo|respond|estado del enlace|link)\b", norm):
        wants_port = bool(re.search(r"\b(port|puerto)\b", norm))
        wants_host = bool(re.search(r"\b(host|ip|ipv4)\b", norm))
        wants_addr = bool(re.search(r"\b(address|direccion)\b", norm))
        actions: list[dict[str, Any]] = [{"id": "config.open_pusr", "params": {"read_only": True}}]
        if wants_port:
            actions.append({"id": "config.show_pusr_field", "params": {"field": "port", "unit": "TCP port", "example": "502", "source": "PUSR USR-DR164 MBAP"}})
            reply = format_voice_template(
                "pusr_opened_port",
                language=lang,
                en_default="Opened PUSR Gateway configuration and highlighted the Modbus TCP Port field (standard value 502; never 5502). Current port: {port}. No values were changed.",
                params={"port": gw_port},
                project_root=project_root,
            )
        elif wants_host:
            actions.append({"id": "config.show_pusr_field", "params": {"field": "host", "unit": "IPv4", "example": "10.10.100.254", "source": "PUSR Direct AP"}})
            reply = format_voice_template(
                "pusr_opened_host",
                language=lang,
                en_default="Opened PUSR Gateway configuration and highlighted the IPv4 Host field (read-only; no values changed). Currently configured: {host_display}.",
                params={"host_display": host_display},
                project_root=project_root,
            )
        elif wants_addr:
            actions.append({"id": "config.show_pusr_field", "params": {"field": "address", "unit": "IPv4:Port", "example": "10.10.100.254:502", "source": "PUSR Direct AP"}})
            reply = format_voice_template(
                "pusr_opened_address",
                language=lang,
                en_default="Opened PUSR Gateway configuration and focused the gateway address ({host_display}:{port}). Authorized Modbus polling target remains Slave #{authorized_slave}.",
                params={"host_display": host_display, "port": gw_port, "authorized_slave": authorized_bus_slave_id},
                project_root=project_root,
            )
        else:
            reply = format_voice_template(
                "pusr_opened_generic",
                language=lang,
                en_default="Opened the PUSR Gateway setup panel (read-only preview; no parameters saved or connected automatically).",
                project_root=project_root,
            )
        return _plan(actions, intent_mode="show", reply=reply)

    # 3. Cloud Settings & Catalog Modal (UI-02: EN + ES, strictly 0 WAN requests)
    if re.search(r"\b(cloud|nube)\b", norm) and re.search(r"\b(show|where|config|setup|settings|enabled|status|muestr\w*|donde|configur\w*|habilitad\w*|estado|abre|abrir)\b", norm):
        reply = format_voice_template(
            "cloud_settings_shown",
            language=lang,
            en_default="Opened the Catalog panel and highlighted the Cloud configuration controls. Cloud Sync remains {cloud_state}, tokens stay masked, and zero external requests were emitted.",
            params={"cloud_state": cloud_state_txt},
            project_root=project_root,
        )
        return _plan(
            [
                {"id": "config.open_catalog", "params": {"read_only": True}},
                {"id": "config.show_cloud_settings", "params": {"highlight_controls": ["toggleCloudSync", "inputCloudEndpoint"], "cloud_enabled": cloud_enabled}},
            ],
            intent_mode="show",
            reply=reply,
            extra={"cloud_enabled": cloud_enabled},
        )

    if re.search(r"\b(open|show|abre|abrir|muestr\w*)\b.*\b(catalog|catalogo|package store|paquetes)\b", norm):
        reply = format_voice_template(
            "catalog_opened",
            language=lang,
            en_default="Opened the Signed Package Store & Catalog panel. Cloud Sync is currently {cloud_state}; no external network request was made.",
            params={"cloud_state": cloud_state_txt},
            project_root=project_root,
        )
        return _plan([{"id": "config.open_catalog", "params": {"read_only": True}}], intent_mode="show", reply=reply, extra={"cloud_enabled": cloud_enabled})

    # 4. Close Manual explicitly (UI-02: EN + ES)
    if re.search(r"\b(close|hide|cierra|cerrar|ocult\w*)\b.*\b(manual|datasheet|lightbox)\b", norm):
        reply = format_voice_template(
            "manual_closed",
            language=lang,
            en_default="Closed the manual viewer. Camera and 3D Digital Twin remain active.",
            project_root=project_root,
        )
        return _plan([{"id": "manual.close", "params": {}}], intent_mode="apply", reply=reply)

    # 5. iPadOS App Settings vs System Wi-Fi instructions (Section 1.6)
    if re.search(r"\b(wi-?fi settings|ajustes de wi-?fi|red wi-?fi en ajustes)\b", norm):
        reply = format_voice_template(
            "system_wifi_instructions",
            language=lang,
            en_default="iPadOS does not allow apps to jump directly into system Wi-Fi settings. Open iPad Settings > Wi-Fi and join USR-DR164-XXXX; I can also open FieldScan's own app settings for Local Network permission.",
            project_root=project_root,
        )
        return _plan([], intent_mode="explain", reply=reply)

    if re.search(r"\b(open|abre|abrir)\b.*\b(app settings|fieldscan settings|ipad settings|ajustes de fieldscan|ajustes de la app|permisos de red local)\b", norm):
        if is_ipad_native:
            reply = format_voice_template(
                "app_settings_opened",
                language=lang,
                en_default="Opening FieldScan's iPadOS Settings screen so you can review Local Network, Camera, Microphone, and Speech permissions.",
                project_root=project_root,
            )
            return _plan([{"id": "config.open_app_settings", "params": {}}], intent_mode="apply", reply=reply)
        reply = format_voice_template(
            "action_unavailable",
            language=lang,
            en_default="Control unavailable in the current mode: {reason}. No data was altered.",
            params={"reason": "iPadOS app settings URL requires the native iPad app shell"},
            project_root=project_root,
        )
        return _plan([{"id": "config.open_app_settings", "params": {}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)

    # 6. Open/Close Tools, Chat, Calibration, History
    if re.search(r"\b(open|show|abre|abrir|muestr\w*)\b.*\b(history|historial|previous sessions|sesiones anteriores|expediente anterior)\b", norm):
        reply = format_voice_template(
            "history_opened",
            language=lang,
            en_default="Opened the local equipment and session history log inside Tools.",
            params={"turns_count": 0, "prior_count": 0},
            project_root=project_root,
        )
        return _plan([{"id": "session.open_history", "params": {}}], intent_mode="show", reply=reply)

    if re.search(r"\b(open|abre|abrir)\b.*\b(tools|herramientas)\b", norm):
        return _plan([{"id": "config.open_tools", "params": {}}], intent_mode="show", reply="Opened Tools & Field Setup.")
    if re.search(r"\b(close|cierra|cerrar)\b.*\b(tools|herramientas)\b", norm):
        return _plan([{"id": "config.close_tools", "params": {}}], intent_mode="apply", reply="Closed Tools panel.")
    if re.search(r"\b(open|abre|abrir)\b.*\b(chat)\b", norm):
        return _plan([{"id": "config.open_chat", "params": {}}], intent_mode="show", reply="Opened AI Engineer Chat panel.")
    if re.search(r"\b(close|cierra|cerrar)\b.*\b(chat)\b", norm):
        return _plan([{"id": "config.close_chat", "params": {}}], intent_mode="apply", reply="Closed AI Engineer Chat panel.")
    if re.search(r"\b(open|abre|abrir|show|muestr\w*)\b.*\b(calibration roadmap|calibracion|hoja de ruta)\b", norm) and not re.search(r"\b(manual|datasheet|page|pagina)\b", norm):
        return _plan([{"id": "config.open_calibration", "params": {}}], intent_mode="show", reply="Opened Calibration & Verified Adjustment planned roadmap (read-only).")
    if re.search(r"\b(open|show|abre|abrir|muestr\w*)\b.*\b(escalation|outbox|email\s+manufacturer|contact\s+manufacturer)\b", norm) and not re.search(r"\b(draft|borrador|prepare|preparar)\b", norm):
        return _plan([{"id": "config.open_escalation", "params": {}}], intent_mode="show", reply="Opened the Manufacturer Engineering Escalation & Outbox panel.")

    # 7. Local Drafts (Manufacturer & Stock — strictly local, zero external send)
    if re.search(r"\b(stock|repuestos|reorder|reponer)\b", norm) and re.search(r"\b(draft|borrador|order|pedido|preparar|prepare)\b", norm):
        sku_m = re.search(r"\bsku[:\s#-]*([a-z0-9\-_]+)\b", norm)
        qty_m = re.search(r"\b(?:qty|quantity|cantidad)[:\s=]*(\d+)\b", norm)
        thr_m = re.search(r"\b(?:threshold|umbral|min)[:\s=]*(\d+)\b", norm)
        if sku_m and qty_m and thr_m:
            sku = sku_m.group(1).upper()
            qty = int(qty_m.group(1))
            thr = int(thr_m.group(1))
            reply = format_voice_template(
                "draft_stock_ready",
                language=lang,
                en_default="Prepared local stock draft for SKU {sku} (verified quantity: {qty}, threshold: {threshold}). Nothing was sent externally.",
                params={"sku": sku, "qty": qty, "threshold": thr},
                project_root=project_root,
            )
            return _plan(
                [{"id": "session.prepare_stock_draft", "params": {"sku": sku, "verified_quantity": qty, "reorder_threshold": thr}}],
                intent_mode="propose",
                reply=reply,
            )
        reply = format_voice_template(
            "draft_stock_unverified",
            language=lang,
            en_default="Cannot prepare a stock draft without an explicitly configured SKU, verified quantity, and reorder threshold. A missing sensor or lost reading does not establish low stock.",
            project_root=project_root,
        )
        return _plan(
            [{"id": "session.prepare_stock_draft", "params": {}, "status_hint": "unavailable"}],
            intent_mode="explain",
            reply=reply,
        )

    es_pack = load_spanish_voice_pack(project_root=project_root)
    es_aliases = es_pack.get("action_aliases") or {}

    def _matches_localized_alias(action_id: str) -> bool:
        return any(
            (a_norm := normalize_ascii_lower(str(al))) and (a_norm in norm)
            for al in (es_aliases.get(action_id) or [])
        )

    if (re.search(r"\b(manufacturer|oem|escalat\w*|escalamiento)\b", norm) and re.search(r"\b(draft|borrador|email|correo|prepare|preparar)\b", norm)) or _matches_localized_alias("session.prepare_manufacturer_draft"):
        reply = format_voice_template(
            "draft_manufacturer_ready",
            language=lang,
            en_default="Prepared a local manufacturer escalation draft with verified facts and open questions. Nothing is sent until you review and share it.",
            project_root=project_root,
        )
        return _plan([{"id": "session.prepare_manufacturer_draft", "params": {}}], intent_mode="propose", reply=reply)

    # 8. Unified Link Diagnostics & Read-Only Poll (Section 4)
    if re.search(r"\b(link diagnostic|diagnostico del enlace|estado del enlace|is the sensor responding|esta respondiendo|el sensor responde|modbus status|estado del pusr|como esta modbus|why.*not responding|porque no responde)\b", norm):
        diag = evaluate_unified_link_diagnostic(modbus_tel, gateway_config=gw, language=lang, project_root=project_root)
        acts: list[dict[str, Any]] = [{"id": "bench.diagnose_link", "params": {"diagnostic_state": diag["state"]}}]
        if diag.get("recommended_action") == "config.open_pusr":
            acts.append({"id": "config.open_pusr", "params": {"read_only": True}})
        return _plan(acts, intent_mode="explain", reply=diag["message"], extra={"link_diagnostic": diag})

    if re.search(r"\b(poll sensor|run readonly poll|ejecutar lectura|leer sensor ahora|hacer lectura autorizada)\b", norm):
        if not caps["bench_modbus_homologated"]:
            reply = format_voice_template(
                "action_unavailable",
                language=lang,
                en_default="Control unavailable in the current mode: {reason}. No data was altered.",
                params={"reason": "Active catalog profile is reference-only and not homologated for Modbus bus polling"},
                project_root=project_root,
            )
            return _plan([{"id": "bench.poll_readonly", "params": {}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)
        return _plan([{"id": "bench.poll_readonly", "params": {}}], intent_mode="apply", reply="Running authorized read-only Modbus Function 0x03 poll.")

    # 9. Camera controls (show live, dip macro, capture photo)
    if re.search(r"\b(capture photo|take photo|take a photo|capture evidence|tomar foto|toma una foto|capturar evidencia|guardar foto)\b", norm):
        reply = format_voice_template(
            "camera_evidence_captured",
            language=lang,
            en_default="Capturing inspection evidence photo into the active session.",
            params={"filename": "pending_capture.jpg", "evidence_origin": "camera"},
            project_root=project_root,
        )
        return _plan([{"id": "camera.capture_evidence", "params": {"manual": True}}], intent_mode="apply", reply=reply)

    if re.search(r"\b(dip macro|dip crop|recorte dip|acercamiento dip|macro dip)\b", norm):
        if not caps["supports_dip_pins"]:
            reply = format_voice_template(
                "dip_reference_only",
                language=lang,
                en_default="Active package has no verified DIP switch profile; macro DIP overlay is unavailable in reference mode.",
                project_root=project_root,
            )
            return _plan([{"id": "camera.show_dip_macro", "params": {"visible": True}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)
        src = str((vision_tel or {}).get("camera_source") or "camera")
        reply = format_voice_template(
            "camera_dip_macro_shown",
            language=lang,
            en_default="Opened the DIP-8 macro inset over the live camera view (source: {source_label}).",
            params={"source_label": src},
            project_root=project_root,
        )
        return _plan([{"id": "camera.show_dip_macro", "params": {"visible": True}}], intent_mode="show", reply=reply)

    # 10. 3D Twin Explicit Modes & Free-Form Camera Manipulation (X-Ray, Solid, Explode, Rotate, Zoom, Reset — bundled & GLB!)
    wants_xray = bool(re.search(r"\b(x-?ray|wireframe|rayos\s*x|see inside|look inside|ver por dentro|translucent|transparent)\b", norm))
    wants_solid = bool(re.search(r"\b(solid mode|solid view|normal view|vista solida|modo solido)\b", norm))
    wants_explode = bool(re.search(r"\b(explode|exploded view|open the sensor|open sensor|open housing|open the housing|disassemble|take apart|split apart|explotar|vista explotada|desarmar gemelo)\b", norm)) or _matches_localized_alias("twin.set_explode")
    wants_collapse = bool(re.search(r"\b(collapse|colapsar|close housing|close the housing|close the sensor|reassemble|put back together)\b", norm))
    wants_reset = bool(re.search(r"\b(reset view|reset 3d|reset camera|center twin|center the twin|restablecer vista|reiniciar vista|centrar gemelo|centra el gemelo|default overview|full view)\b", norm)) or _matches_localized_alias("twin.reset_view")
    wants_rotate_or_zoom = bool(
        re.search(r"\b(rotate|turn|spin|flip|orbit|zoom in|zoom out|closer|farther|back side|rear view|top view|bottom view|side view|front view)\b", norm)
    ) and not re.search(r"\b(manual|datasheet|pdf|page)\b", norm)

    if wants_xray or wants_solid:
        target_mode = "wireframe" if wants_xray else "solid"
        if not caps["supports_xray"]:
            reply = format_voice_template(
                "twin_capability_unavailable",
                language=lang,
                en_default="This 3D action ({capability}) is unavailable for the active model ({scene_origin}). Current view was not altered.",
                params={"capability": target_mode, "scene_origin": caps["scene_origin"]},
                project_root=project_root,
            )
            return _plan([{"id": "twin.set_render_mode", "params": {"mode": target_mode}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)
        reply = format_voice_template(
            "twin_xray_applied" if wants_xray else "twin_solid_applied",
            language=lang,
            en_default="Switched 3D Digital Twin to X-Ray wireframe view." if wants_xray else "Switched 3D Digital Twin to solid view.",
            project_root=project_root,
        )
        return _plan([{"id": "twin.set_render_mode", "params": {"mode": target_mode}}], intent_mode="apply", reply=reply)

    if wants_rotate_or_zoom and not wants_explode and not wants_reset and not wants_collapse:
        if not caps["supports_3d"]:
            return _plan([{"id": "twin.rotate_view", "params": {"direction": "right"}, "status_hint": "unavailable"}], intent_mode="explain", reply="No 3D Digital Twin is currently loaded to rotate or zoom.")
        if "zoom in" in norm or "closer" in norm:
            rot_dir = "zoom_in"
        elif "zoom out" in norm or "farther" in norm:
            rot_dir = "zoom_out"
        elif any(k in norm for k in ("back", "rear", "around", "flip")):
            rot_dir = "back"
        elif "front" in norm:
            rot_dir = "front"
        elif any(k in norm for k in ("top", "up", "above")):
            rot_dir = "top"
        elif any(k in norm for k in ("bottom", "under", "down")):
            rot_dir = "bottom"
        elif "left" in norm:
            rot_dir = "left"
        elif "spin" in norm:
            rot_dir = "spin"
        else:
            rot_dir = "right"
        return _plan([{"id": "twin.rotate_view", "params": {"direction": rot_dir}}], intent_mode="apply", reply=f"Adjusted the 3D Digital Twin view ({rot_dir.replace('_', ' ')}).")

    if wants_explode and not re.search(r"\b(dip|pin|pins|switch|switches|address|slave)\b", norm):
        if not caps["supports_explode"]:
            reply = format_voice_template(
                "twin_capability_unavailable",
                language=lang,
                en_default="This 3D action ({capability}) is unavailable for the active model ({scene_origin}). Current view was not altered.",
                params={"capability": "explode", "scene_origin": caps["scene_origin"]},
                project_root=project_root,
            )
            return _plan([{"id": "twin.set_explode", "params": {"exploded": True}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)
        reply = format_voice_template(
            "twin_explode_applied",
            language=lang,
            en_default="Activated exploded view on the 3D Digital Twin.",
            project_root=project_root,
        )
        return _plan([{"id": "twin.set_explode", "params": {"exploded": True}}], intent_mode="apply", reply=reply)

    if wants_collapse or wants_reset:
        if not caps["supports_3d"]:
            reply = format_voice_template(
                "twin_capability_unavailable",
                language=lang,
                en_default="This 3D action ({capability}) is unavailable for the active model ({scene_origin}).",
                params={"capability": "reset_view", "scene_origin": caps["scene_origin"]},
                project_root=project_root,
            )
            return _plan([{"id": "twin.reset_view", "params": {}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)
        reply = format_voice_template(
            "twin_reset_applied" if wants_reset else "twin_collapse_applied",
            language=lang,
            en_default="Reset 3D Digital Twin camera and restored assembled solid overview.",
            project_root=project_root,
        )
        return _plan([{"id": "twin.reset_view", "params": {}}], intent_mode="apply", reply=reply)

    # 11a. Explicit PDF / Manual / Datasheet Viewer (ANY phrasing: "show me the pdf", "open the manual", "show me the pdf where the pins are")
    asks_pdf_or_manual = bool(re.search(r"\b(pdf|manual|datasheet|spec\s*sheet|document|documentation|pinout|wiring\s*diagram|schematic)\b", norm))
    wants_action_on_pdf = asks_pdf_or_manual and bool(
        re.search(r"\b(show|open|view|display|pull\s*up|bring\s*up|go\s*to|where|page|pagina|section|seccion|see|look|read|abre|abrir|muestr\w*|ver|donde)\b", norm)
    )
    has_dip_twin_focus = bool(re.search(r"\b(digital\s*twin|3d|twin|model|explode)\b", norm))
    if wants_action_on_pdf and not has_dip_twin_focus and not re.search(r"\b(?:page|pagina|pag\.?)\s*#?\s*(\d{1,3})\b", norm):
        desc_to_use = descriptor or {"scene_origin": "bundled_parametric", "documents": [{"document_id": "tht02_manual_v1_1", "title": "TZ THT-02 User's Manual V1.1", "revision": "V1.1", "page_count": 9}]}
        if re.search(r"\b(dip|pin|pins|switch|switches|address|slave|open|unscrew)\b", norm):
            topic_q, inf_p = "dip", 5
        elif re.search(r"\b(wire|wires|wiring|cable|gland|color|power|ground|gnd|connect)\b", norm):
            topic_q, inf_p = "wiring", 4
        elif re.search(r"\b(calibr\w*|spec|specs|accuracy|range|sht30)\b", norm):
            topic_q, inf_p = "calibration", 3
        elif re.search(r"\b(crc|frame|example|command|0x03)\b", norm):
            topic_q, inf_p = "crc", 7
        elif re.search(r"\b(register|registers|modbus|7fff|baud|0x00)\b", norm):
            topic_q, inf_p = "registers", 6
        elif re.search(r"\b(dimension|size|length|diameter|mount|flange|drawing)\b", norm):
            topic_q, inf_p = "dimensions", 9
        else:
            topic_q, inf_p = "overview", 1
        hit = lookup_manual_in_descriptor("open page 1" if topic_q == "overview" else f"where in the manual is {topic_q}", desc_to_use)
        pg = int(hit.get("manual_page") or inf_p)
        doc_id = str(hit.get("document_id") or "tht02_manual_v1_1")
        doc_title = str(hit.get("document_title") or "TZ THT-02 User's Manual V1.1")
        doc_rev = str(hit.get("document_revision") or "V1.1")
        printed = str(hit.get("printed_page") or pg)
        reply = format_voice_template(
            "manual_opened",
            language=lang,
            en_default="Opened {doc_title} ({doc_rev}), page {page} (printed {printed_page}).",
            params={"doc_title": doc_title, "doc_rev": doc_rev, "page": pg, "printed_page": printed},
            project_root=project_root,
        )
        return _plan(
            [{"id": "manual.open_section", "params": {"topic": topic_q, "page": pg, "document_id": doc_id, "printed_page": printed, "open_lightbox": True}}],
            intent_mode="show",
            reply=reply,
            extra={
                "manual_page": pg,
                "printed_page": printed,
                "document_id": doc_id,
                "document_revision": doc_rev,
                "open_manual": True,
                "open_manual_lightbox": True,
                "manual_section": hit.get("manual_section"),
                "citations": hit.get("citations") or [{"page": pg, "label": f"Page {pg}"}],
            },
        )

    # 11b. DIP / Pins Configuration Guided Trio (Twin + Manual Page 5 + Live DIP Macro — NEVER mutates authorized bus target!)
    wants_dip_config = (
        bool(re.search(r"\b(dip|sw1|pin|pins|switch|switches|interruptor\w*|rocker\w*)\b", norm))
        and bool(re.search(r"\b(configure|set|setup|guide|how|show|open|move|zoom|look|see|view|address|slave|modbus|twin|3d|configur\w*|direccion|como|muestr\w*)\b", norm))
    ) or _matches_localized_alias("twin.show_dip")
    if wants_dip_config:
        # Preserve ambiguity guard (`M4-VOICE-03`): e.g. "Show me pin one" on a GLB with both dip.pin_1 & rear.pin_1 must clarify first!
        if descriptor and str(descriptor.get("scene_origin") or "") == "catalog_glb":
            ambig_check = prepare_visual_action(
                raw,
                descriptor=descriptor,
                current_dip_address=current_dip_address,
                scene_generation=scene_generation,
                turn_id=tid,
            )
            if ambig_check.get("ambiguous"):
                c_prompt = str(ambig_check.get("clarification_prompt") or "Please specify which pin or component.")
                return _plan(
                    [],
                    intent_mode="explain",
                    ambiguous=True,
                    clarification_prompt=c_prompt,
                    reply=c_prompt,
                    extra={"candidate_part_ids": ambig_check.get("candidate_part_ids") or [], "twin_action": None, "twin_action_v1": None},
                )
        # Support Spanish numeric target as well as English "address 1" / "slave 1"
        es_addr_m = re.search(r"\b(?:direccion|nodo|unidad)\s*#?\s*(\d{1,3})\b", norm)
        any_num_m = re.search(r"\b(\d{1,3})\b", norm)
        if es_addr_m and 1 <= int(es_addr_m.group(1)) <= 247:
            target_addr = int(es_addr_m.group(1))
        elif any_num_m and 1 <= int(any_num_m.group(1)) <= 247 and int(any_num_m.group(1)) not in (8, 485):
            target_addr = int(any_num_m.group(1))
        else:
            target_addr, _ = parse_requested_slave_id(norm, current_dip_address)
        if not caps["supports_dip_pins"]:
            reply = format_voice_template(
                "dip_reference_only",
                language=lang,
                en_default="Active model has no verified DIP switch pin map; remaining in reference mode without inventing pin positions.",
                project_root=project_root,
            )
            return _plan([{"id": "twin.show_dip", "params": {"slave_id": target_addr}, "status_hint": "unavailable"}], intent_mode="explain", reply=reply)
        bits = _address_to_dip_bits(target_addr)
        instr = _format_dip_instruction_en(bits)
        prep_dip = prepare_visual_action(
            f"Configure DIP switches for slave {target_addr}",
            descriptor=descriptor,
            zone_hint="upper_barrel_dip",
            current_dip_address=target_addr,
            scene_generation=scene_generation,
            turn_id=tid,
        )
        dip_man = lookup_manual_for_query("DIP switch addressing page 5")
        reply = format_voice_template(
            "dip_guide_applied",
            language=lang,
            en_default=(
                "Proposed visual DIP-8 pattern for Slave #{target_addr}: {instruction_summary}. "
                "Opened the exploded 3D twin, Manual Page 5 (Section 5.1), and live DIP macro inset. "
                "Authorized Modbus bus polling target remains unchanged at Slave #{authorized_slave}."
            ),
            params={"target_addr": target_addr, "instruction_summary": instr, "authorized_slave": authorized_bus_slave_id},
            project_root=project_root,
        )
        return _plan(
            [
                {"id": "twin.show_dip", "params": {"slave_id": target_addr, "dip_bits": bits, "explode": True}},
                {"id": "manual.open_section", "params": {"topic": "dip_switch_opening", "page": 5, "open_lightbox": False}},
                {"id": "camera.show_dip_macro", "params": {"visible": True}},
            ],
            intent_mode="propose",
            reply=reply,
            extra={
                "start_dip_guidance": True,
                "target_dip_address": target_addr,
                "dip_bits": bits,
                "simulated_visual_dip_address": target_addr,
                "twin_action": prep_dip.get("twin_action"),
                "twin_action_v1": prep_dip.get("twin_action_v1"),
                "explode_pcb": True,
                "focus_dip": True,
                "manual_page": 5,
                "open_manual": True,
                "open_manual_lightbox": False,
                "manual_section": dip_man.get("section"),
                "citations": [{"page": 5, "label": "Page 5 · 2-Step Opening & DIP-8 Switch (Ex. 176)"}],
            },
        )

    # 12. Manual Page / Topic Lookup in Spanish or Explicit Document Request (DOC-01)
    page_m = re.search(r"\b(?:page|pagina|pag\.?)\s*#?\s*(\d{1,3})\b", norm)
    if page_m:
        req_p = int(page_m.group(1))
        desc_to_use = descriptor or {"scene_origin": "bundled_parametric", "documents": [{"document_id": "tht02_manual_v1_1", "title": "TZ THT-02 User's Manual V1.1", "revision": "V1.1", "page_count": 9}]}
        hit = lookup_manual_in_descriptor(f"open page {req_p}", desc_to_use)
        if hit.get("page_out_of_range"):
            reply = format_voice_template(
                "manual_page_missing",
                language=lang,
                en_default="Page {requested_page} is outside the valid page range (1..{max_page}) of {doc_title}.",
                params={"requested_page": req_p, "max_page": hit.get("max_page", 9), "doc_title": hit.get("document_title") or hit.get("document_id") or "Manual"},
                project_root=project_root,
            )
            return _plan(
                [{"id": "manual.open_page", "params": {"page": req_p}, "status_hint": "unavailable"}],
                intent_mode="explain",
                reply=reply,
                extra={"page_out_of_range": True, "error_code": "PAGE_OUT_OF_RANGE"},
            )
        doc_id = str(hit.get("document_id") or "tht02_manual_v1_1")
        doc_title = str(hit.get("document_title") or "TZ THT-02 User's Manual V1.1")
        doc_rev = str(hit.get("document_revision") or "V1.1")
        printed = str(hit.get("printed_page") or req_p)
        reply = format_voice_template(
            "manual_opened",
            language=lang,
            en_default="Opened {doc_title} ({doc_rev}), physical page {page} (printed {printed_page}).",
            params={"doc_title": doc_title, "doc_rev": doc_rev, "page": req_p, "printed_page": printed},
            project_root=project_root,
        )
        return _plan(
            [{"id": "manual.open_page", "params": {"page": req_p, "document_id": doc_id, "printed_page": printed, "open_lightbox": True}}],
            intent_mode="show",
            reply=reply,
            extra={
                "manual_page": req_p,
                "printed_page": printed,
                "document_id": doc_id,
                "document_revision": doc_rev,
                "open_manual": True,
                "open_manual_lightbox": True,
                "manual_section": hit.get("manual_section"),
                "citations": hit.get("citations") or [],
            },
        )

    if re.search(r"\b(seccion|section|manual|datasheet)\b", norm) and re.search(r"\b(dip|calibr\w*|cable\w*|wiring|registr\w*|crc)\b", norm):
        topic_query = "dip" if "dip" in norm else ("calibration" if "calibr" in norm else ("wiring" if ("cable" in norm or "wiring" in norm) else ("crc" if "crc" in norm else "registers")))
        desc_to_use = descriptor or {"scene_origin": "bundled_parametric", "documents": [{"document_id": "tht02_manual_v1_1", "title": "TZ THT-02 User's Manual V1.1", "revision": "V1.1", "page_count": 9}]}
        hit = lookup_manual_in_descriptor(f"where in the manual is {topic_query}", desc_to_use)
        if hit.get("matched") and hit.get("manual_page"):
            pg = int(hit["manual_page"])
            doc_id = str(hit.get("document_id") or "tht02_manual_v1_1")
            doc_title = str(hit.get("document_title") or "TZ THT-02 User's Manual V1.1")
            doc_rev = str(hit.get("document_revision") or "V1.1")
            printed = str(hit.get("printed_page") or pg)
            reply = format_voice_template(
                "manual_opened",
                language=lang,
                en_default="Opened {doc_title} ({doc_rev}), physical page {page} (printed {printed_page}).",
                params={"doc_title": doc_title, "doc_rev": doc_rev, "page": pg, "printed_page": printed},
                project_root=project_root,
            )
            return _plan(
                [{"id": "manual.open_section", "params": {"topic": topic_query, "page": pg, "document_id": doc_id, "printed_page": printed, "open_lightbox": True}}],
                intent_mode="show",
                reply=reply,
                extra={
                    "manual_page": pg,
                    "printed_page": printed,
                    "document_id": doc_id,
                    "document_revision": doc_rev,
                    "open_manual": True,
                    "open_manual_lightbox": True,
                    "manual_section": hit.get("manual_section"),
                    "citations": hit.get("citations") or [],
                },
            )

    # 13. English / Spanish part focus on bundled or GLB twin
    if re.search(r"\b(show|focus|zoom|inspect|highlight|point|move|look\s+at|see|open|enfoc\w*|muestr\w*)\b", norm):
        prep = prepare_visual_action(
            raw,
            descriptor=descriptor,
            current_dip_address=current_dip_address,
            scene_generation=scene_generation,
            turn_id=tid,
        )
        if prep.get("ambiguous"):
            return _plan(
                [],
                intent_mode="explain",
                ambiguous=True,
                clarification_prompt=str(prep.get("clarification_prompt") or "Please specify which component."),
                reply=str(prep.get("clarification_prompt") or "Please specify which component."),
                extra={"candidate_part_ids": prep.get("candidate_part_ids") or []},
            )
        ta = prep.get("twin_action")
        v1 = prep.get("twin_action_v1")
        if isinstance(v1, dict) and v1.get("part_id"):
            pid = str(v1["part_id"])
            reply = format_voice_template(
                "twin_focus_applied",
                language=lang,
                en_default="Focused {part_label} on the 3D Digital Twin.",
                params={"part_label": v1.get("callout_title") or pid},
                project_root=project_root,
            )
            return _plan(
                [{"id": "twin.focus_part", "params": {"part_id": pid, "view_id": v1.get("view_id") or "isometric_home"}}],
                intent_mode="apply",
                reply=reply,
                extra={"twin_action": ta, "twin_action_v1": v1},
            )
        if isinstance(ta, dict) and ta.get("focus_zone"):
            fz = str(ta["focus_zone"])
            reply = format_voice_template(
                "twin_focus_applied",
                language=lang,
                en_default="Focused {part_label} on the 3D Digital Twin.",
                params={"part_label": ta.get("callout_title") or fz},
                project_root=project_root,
            )
            return _plan(
                [{"id": "twin.focus_part", "params": {"part_id": fz, "view_id": ta.get("camera_pose") or "overview"}}],
                intent_mode="apply",
                reply=reply,
                extra={"twin_action": ta, "twin_action_v1": v1},
            )

    if caps.get("scene_origin") == "empty_workspace":
        return _plan(
            [{"id": "catalog.identify_new_sensor", "params": {"capture_photo": False}}],
            intent_mode="explain",
            reply=(
                "No sensor is loaded on this iPad right now. Point the camera at your sensor and tell me its "
                "manufacturer and model — for example, 'This is a TZONE TZ THT-02' — to fetch its official manual "
                "and 3D Digital Twin from FieldScan Cloud."
            ),
        )

    return None


def _parse_spoken_sensor_identity(raw: str) -> tuple[str, str, str | None, bool] | None:
    """Parse spoken English sensor identification (e.g., 'This is a TZONE TZ THT-02' or 'Download manual for Siemens SITRANS')."""
    trimmed = (raw or "").strip()
    if not trimmed:
        return None
    norm = normalize_ascii_lower(trimmed)
    auto_triggers = (
        "download manual for ",
        "fetch manual for ",
        "get manual for ",
        "onboard ",
        "process sensor ",
        "load from cloud ",
        "search cloud for ",
    )
    auto_sub = False
    tail = ""
    for pfx in auto_triggers:
        idx = norm.find(pfx)
        if idx != -1:
            tail = norm[idx + len(pfx) :].strip()
            auto_sub = True
            break
    if not tail:
        m_bm = re.search(r"\b(?:brand|manufacturer)\s+([a-z0-9\-\s]{2,40})\s+model\s+([a-z0-9\-\s]{2,40})$", norm)
        if m_bm:
            tail = f"{m_bm.group(1)} {m_bm.group(2)}".strip()
        else:
            m_id = re.search(
                r"\b(?:this sensor is|this is|it is|it's|sensor is|model is|the sensor is|the model is)\s+(?:a\s+|an\s+|the\s+)?(.+)$",
                norm,
            )
            if m_id:
                tail = m_id.group(1).strip()
    if (
        not tail
        and len(norm) <= 48
        and re.search(r"\b(tzone|t-zone|tht[\s\-]?0?0?2|tht[\s\-]?0?3r?)\b", norm)
        and not re.search(r"\b(dip|pusr|page|wiring|cable|register|baud|explode|xray|x-ray|what|how|where|why)\b", norm)
    ):
        tail = norm
    if not tail:
        return None

    tail = re.sub(r"\b(sensor|transmitter|probe|please|now|in cloud|from cloud)\b", "", tail)
    tail = re.sub(r"[.,!?;:]+$", "", tail)
    tail = re.sub(r"\s+", " ", tail).strip()
    if len(tail) < 3:
        return None

    if re.search(r"\b(tht[\s\-]?0?0?2|tht\s*zero\s*two|tht\s*two)\b", tail):
        return ("TZONE", "TZ THT-02", "v1_1_rs485", auto_sub)
    if re.search(r"\b(tht[\s\-]?0?3r)\b", tail):
        return ("TZONE", "TZ THT-03R", None, auto_sub)

    tokens = tail.split()
    if len(tokens) < 2:
        return ("UNKNOWN", tail.upper(), None, auto_sub)
    mfg = tokens[0].replace("t-zone", "TZONE").upper()
    mod = " ".join(tokens[1:]).upper()
    return (mfg, mod, None, auto_sub)
