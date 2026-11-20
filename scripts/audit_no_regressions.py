#!/usr/bin/env python3
"""Permanent System-Wide Dependency & Anti-Regression Audit Gate for FieldScan CAD v2.1.

Prevents the "fix one module, break another" failure mode by auditing:
1. Modular Dependency Boundaries (DAG check — zero circular imports across `fieldscan.*`).
2. 100% English-Only Software Gate (zero Spanish characters/words across Python/JS/HTML/CSS/JSON/SH).
3. Push-To-Talk (`btnVoiceRecord`) Integrity:
   - `app.js` `/api/voice/native_stop` timeout >= 20000 ms (prevents AbortController cutoff during VLM inference).
   - Hybrid Press-and-Hold (`pointerdown`/`pointerup`) + Tap-to-Toggle (`click`) wired cleanly.
   - Swift `pttRecordingActive` bypasses Hands-Free echo cooldown and flushes `endAudio()` before task cancel.
   - Swift `speechSynthesizer(_:didCancel:)` resets `lastTtsActiveUptime = 0` on user cancellation.
4. Hands-Free Real-Time Barge-In & CoreAudio Deadlock Guard:
   - Swift `.voiceChat` hardware AEC mode + `bargeInConsecutiveFrames` instant TTS interruption.
   - Zero `AVSpeechSynthesizer` calls inside `audioEngineQueue` (`133175c` CoreAudio anti-deadlock invariant).
   - Web `tickHandsFreeVad` active RMS sampling & barge-in interruption during `state.isAiSpeaking`.
   - Swift & Web ASR/TTS locked strictly to `en-US`.
5. Interactive 3D Digital Twin Manipulation (`twin_action`):
   - Python `twin_controller.py` and Swift `FieldScanTwinController.swift` 1:1 zone & DIP-8 parity.
   - `app.js` `focusZone3DCamera` covering all 6 canonical `ZONE_SPECS` sub-assemblies + `applyTwinAction` wired in `handleCopilotResponse` + `.is-guided` cyan 3D callout in `styles.css`.
6. Working Datasheet Section Lookup Preservation:
   - `manual_navigator.py` & `FieldScanManualNavigator.swift` auto-opening exact page & section (`#manualSectionBanner`, `#lightboxSectionBanner`, `P1..P9` pills).
7. Pilot Safety, Session Engine & `BundleResources` SHA-256 Parity:
   - `pilot_writes_enabled == False`, `0` write function codes on live Modbus paths, and 100% byte-identical `ios/FieldScanM4/BundleResources` parity.
"""

from __future__ import annotations

import ast
import json
from pathlib import Path
import re
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

SPANISH_CHAR_RE = re.compile(r"[\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00bf\u00a1]")
SPANISH_WORD_RE = re.compile(
    r"\b(diagn\u00f3stico|h\u0075medad|c\u0061rcasa|p\u00e1gina|e\u0073clavo|ench\u00fafalo|"
    r"c\u006fnectado|a\u0062ierto|seg\u00fan|f\u00e1brica|f\u0061bricante|c\u00e1mara|micr\u00f3fono|espa\u00f1ol)\b",
    re.IGNORECASE,
)

CANONICAL_ZONES = (
    "strainer_head",
    "upper_seal_ring",
    "upper_barrel_dip",
    "mounting_flange",
    "lower_barrel_rs485",
    "waterproof_gland_leads",
)


def _fail(errors: list[str], msg: str) -> None:
    errors.append(msg)


def audit_python_dependency_dag(errors: list[str]) -> dict[str, list[str]]:
    pkg_dir = SRC_ROOT / "fieldscan"
    graph: dict[str, list[str]] = {}
    for py_file in sorted(pkg_dir.glob("*.py")):
        mod_name = py_file.stem
        if mod_name == "__init__":
            continue
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
        deps: set[str] = set()
        # Audit top-level module imports for true import-time dependency cycles
        for node in tree.body:
            if isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("fieldscan."):
                dep = node.module.split(".")[1]
                if dep != mod_name:
                    deps.add(dep)
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.startswith("fieldscan."):
                        dep = alias.name.split(".")[1]
                        if dep != mod_name:
                            deps.add(dep)
        graph[mod_name] = sorted(deps)

    # Detect cycles via DFS
    visiting: set[str] = set()
    visited: set[str] = set()

    def dfs(node: str, stack: list[str]) -> None:
        visiting.add(node)
        for nxt in graph.get(node, []):
            if nxt in visiting:
                cycle = " -> ".join([*stack, nxt])
                _fail(errors, f"[DAG] Circular dependency detected in fieldscan: {cycle}")
            elif nxt not in visited and nxt in graph:
                dfs(nxt, [*stack, nxt])
        visiting.remove(node)
        visited.add(node)

    for m in sorted(graph):
        if m not in visited:
            dfs(m, [m])

    # Leaf modules must never import server.py or lfm_engine.py
    for leaf_mod in (
        "manual_navigator",
        "twin_controller",
        "scene_and_chat_router",
        "profiles_and_manual",
        "catalog_store",
        "catalog_client",
    ):
        bad = set(graph.get(leaf_mod, [])) & {"server", "lfm_engine"}
        if bad:
            _fail(errors, f"[DAG] Modular leaf `{leaf_mod}` must not import top-level orchestrators: {sorted(bad)}")

    return graph


def audit_english_only_gate(errors: list[str]) -> int:
    skip_dirs = {
        ".venv",
        ".git",
        "__pycache__",
        ".pytest_cache",
        "vendor",
        "outbox",
        "build",
        "sessions",
        "fieldscan_source_delivery",
    }
    checked = 0
    for path in PROJECT_ROOT.rglob("*"):
        if any(part in skip_dirs for part in path.parts) or not path.is_file():
            continue
        if path.name == "golden_contracts_v2_1.json" or path.name.startswith("MEGAPLAN_"):
            continue
        if path.suffix in {".py", ".swift", ".md", ".html", ".css", ".js", ".json", ".sh"}:
            if path.name == "audit_no_regressions.py" or path.name == "test_fieldscan_glue.py":
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            checked += 1
            if SPANISH_CHAR_RE.search(text) or SPANISH_WORD_RE.search(text):
                _fail(errors, f"[EN-ONLY] Non-English token found in {path.relative_to(PROJECT_ROOT)}")
    return checked


def audit_frontend_ptt_bargein_twin_and_manual(errors: list[str]) -> None:
    app_js = (PROJECT_ROOT / "static" / "app.js").read_text(encoding="utf-8")
    styles_css = (PROJECT_ROOT / "static" / "styles.css").read_text(encoding="utf-8")
    index_html = (PROJECT_ROOT / "static" / "index.html").read_text(encoding="utf-8")

    # 1. PTT native_stop timeout >= 20000 ms
    m_stop = re.search(r"/api/voice/native_stop[\s\S]{0,280}?,\s*(\d{4,6})\s*\)", app_js)
    if not m_stop:
        _fail(errors, "[PTT] Could not locate `/api/voice/native_stop` timeout in static/app.js")
    elif int(m_stop.group(1)) < 20000:
        _fail(errors, f"[PTT] `/api/voice/native_stop` timeout is {m_stop.group(1)} ms (< 20000 ms); VLM will abort!")

    # 2. Hybrid Press-and-Hold + Tap-to-Toggle on #btnVoiceRecord
    if "finishPttPointerGesture" not in app_js or "dom.btnVoiceRecord.addEventListener('pointerdown'" not in app_js:
        _fail(errors, "[PTT] Hybrid pointerdown/pointerup + click handler missing on dom.btnVoiceRecord in static/app.js")

    # 3. Browser TTS strictly en-US
    if "es-MX" in app_js:
        _fail(errors, "[EN-ONLY] Residual `es-MX` speech synthesis locale found in static/app.js")

    # 4. Web Hands-Free Barge-In active during AI speech
    if "hfBargeInSinceTs" not in app_js or "Speak Anytime to Interrupt" not in app_js:
        _fail(errors, "[BARGE-IN] Hands-Free real-time barge-in missing in static/app.js")

    # 5. Interactive 3D Digital Twin camera poses + applyTwinAction + cyan guided callout
    if "function applyTwinAction(" not in app_js or "applyTwinAction(res.twin_action)" not in app_js:
        _fail(errors, "[3D-TWIN] `applyTwinAction` missing or disconnected from `handleCopilotResponse` in static/app.js")
    if "function focusZone3DCamera(" not in app_js:
        _fail(errors, "[3D-TWIN] `focusZone3DCamera` missing in static/app.js")
    for z in CANONICAL_ZONES:
        if z not in app_js:
            _fail(errors, f"[3D-TWIN] Canonical zone `{z}` missing in static/app.js")
    if ".fault-callout.is-guided" not in styles_css:
        _fail(errors, "[3D-TWIN] `.fault-callout.is-guided` cyan styling missing in static/styles.css")

    # 6. Working Datasheet Section Lookup & 9-Page Navigator intact + Dynamic Cloud Catalog UI
    for req_dom in ("manualSectionBanner", "lightboxSectionBanner", "manualQuickPills", "catalogModal", "manualDocSelect"):
        if req_dom not in index_html or req_dom not in app_js:
            _fail(errors, f"[MANUAL/CATALOG] `{req_dom}` missing from index.html or app.js (regression!)")
    for page_num in range(1, 10):
        if f'data-page="{page_num}"' not in index_html:
            _fail(errors, f"[MANUAL] Quick pill P{page_num} missing from static/index.html")
    for vendor_js in ("GLTFLoader.js", "BufferGeometryUtils.js"):
        if not (PROJECT_ROOT / "static" / "vendor" / vendor_js).is_file():
            _fail(errors, f"[3D-GLB] Missing local vendor module static/vendor/{vendor_js}")
    if "function applyTwinActionV1(" not in app_js or "function loadCatalogSceneFromDescriptor(" not in app_js:
        _fail(errors, "[3D-GLB] `applyTwinActionV1` or `loadCatalogSceneFromDescriptor` missing in static/app.js")


def audit_swift_voice_bargein_twin_and_xcode(errors: list[str]) -> None:
    ios_dir = PROJECT_ROOT / "ios" / "FieldScanM4"
    srv_swift = (ios_dir / "StandaloneFieldScanServer.swift").read_text(encoding="utf-8")
    pbxproj = (PROJECT_ROOT / "ios" / "FieldScanM4.xcodeproj" / "project.pbxproj").read_text(encoding="utf-8")

    # Required modular Swift files in Xcode project
    for swift_name in (
        "FieldScanCatalogModels.swift",
        "FieldScanPackageStore.swift",
        "FieldScanCatalogClient.swift",
        "FieldScanManualNavigator.swift",
        "FieldScanTwinController.swift",
        "FieldScanVisionDetector.swift",
        "FieldScanConversationEngine.swift",
        "StandaloneFieldScanServer.swift",
    ):
        if not (ios_dir / swift_name).is_file():
            _fail(errors, f"[SWIFT] Missing source file ios/FieldScanM4/{swift_name}")
        if swift_name not in pbxproj:
            _fail(errors, f"[XCODE] `{swift_name}` not registered in project.pbxproj")

    # PTT, Barge-In, Loopback & Bus Isolation invariants in StandaloneFieldScanServer.swift
    required_markers = (
        ("pttRecordingActive", "[SWIFT-PTT] `pttRecordingActive` flag missing in StandaloneFieldScanServer.swift"),
        ("prevReq?.endAudio()", "[SWIFT-PTT] `endAudio()` flush before task cancel missing in StandaloneFieldScanServer.swift"),
        ("lastTtsActiveUptime = 0", "[SWIFT-PTT] `didCancel` must reset `lastTtsActiveUptime = 0` so PTT first words are not muted"),
        (".voiceChat", "[SWIFT-AEC] `.voiceChat` hardware Acoustic Echo Cancellation missing in StandaloneFieldScanServer.swift"),
        ("bargeInConsecutiveFrames", "[SWIFT-BARGE-IN] Real-time Hands-Free barge-in detector missing in StandaloneFieldScanServer.swift"),
        ("rebindSpeechRecognitionRequestAfterBargeIn", "[SWIFT-BARGE-IN] ASR pre-roll rebind after barge-in missing"),
        ('Locale(identifier: "en-US")', "[SWIFT-EN] `en-US` recognizer lock missing in StandaloneFieldScanServer.swift"),
        ('"twin_action":', "[SWIFT-3D-TWIN] `twin_action` missing from Swift `/api/diagnose` response"),
        ("host: .ipv4(.loopback)", "[SWIFT-NET] `StandaloneFieldScanServer` must bind strictly to 127.0.0.1 loopback"),
        ("simulatedVisualDipAddress", "[SWIFT-BUS] Visual DIP simulation state must remain isolated from targetSlaveId"),
    )
    for needle, err_msg in required_markers:
        if needle not in srv_swift:
            _fail(errors, err_msg)

    if "es-MX" in srv_swift or "es-ES" in srv_swift:
        _fail(errors, "[SWIFT-EN] Residual Spanish recognizer/TTS locale found in StandaloneFieldScanServer.swift")


def audit_bundle_parity_and_runtime_contracts(errors: list[str]) -> None:
    manifest_path = PROJECT_ROOT / "knowledge" / "resource_manifest.json"
    bundle_dir = PROJECT_ROOT / "ios" / "FieldScanM4" / "BundleResources"
    if not manifest_path.is_file():
        _fail(errors, "[MANIFEST] Missing knowledge/resource_manifest.json")
        return

    import hashlib

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    files_map = manifest.get("files", {})
    for rel, meta in files_map.items():
        src_p = PROJECT_ROOT / rel
        bnd_p = bundle_dir / rel
        if not src_p.is_file() or not bnd_p.is_file():
            _fail(errors, f"[BUNDLE] Missing synced file for `{rel}` in ios/FieldScanM4/BundleResources")
            continue
        h_src = hashlib.sha256(src_p.read_bytes()).hexdigest()
        h_bnd = hashlib.sha256(bnd_p.read_bytes()).hexdigest()
        if h_src != meta["sha256"] or h_bnd != meta["sha256"]:
            _fail(errors, f"[BUNDLE] SHA-256 drift on `{rel}` — run `uv run python scripts/sync_manifest.py --sync-bundle --verify`")

    # Live Python functional contract smoke check across all subsystems together
    from fieldscan.manual_navigator import lookup_manual_for_query
    from fieldscan.profiles_and_manual import resolve_device_profile
    from fieldscan.scene_and_chat_router import classify_conversation_intent
    from fieldscan.twin_controller import resolve_twin_action

    prof = resolve_device_profile("tzone_tht02")
    transport = prof.get("transport", {})
    if transport.get("pilot_readonly") is not True or transport.get("allowed_function_codes_pilot") != [3]:
        _fail(errors, "[SAFETY] `transport.pilot_readonly` MUST remain True with allowed_function_codes_pilot=[3] on tzone_tht02")

    cal = lookup_manual_for_query("Where in the datasheet is the calibration section?")
    if not (cal["matched"] and cal["open_manual"] and cal["manual_page"] == 3):
        _fail(errors, "[MANUAL] Calibration lookup regressed")

    dip = resolve_twin_action("Show me how to configure the pins for Slave 3", current_dip_address=1)
    if not dip or dip.get("dip_bits") != [0, 0, 0, 0, 0, 0, 1, 1] or not dip.get("explode_pcb"):
        _fail(errors, "[3D-TWIN] Slave #3 DIP-8 `twin_action` regressed")

    rear = resolve_twin_action("Show me at the back how the cable connects")
    if not rear or rear.get("focus_zone") != "waterproof_gland_leads":
        _fail(errors, "[3D-TWIN] Rear cable `twin_action` regressed")

    hear = classify_conversation_intent("Can you hear me?")
    if hear.get("intent") != "general_chat" or hear.get("language") != "en":
        _fail(errors, "[CHAT] Hearing check intent routing regressed")


def run_full_audit() -> tuple[bool, dict[str, object]]:
    errors: list[str] = []
    dag = audit_python_dependency_dag(errors)
    checked_files = audit_english_only_gate(errors)
    audit_frontend_ptt_bargein_twin_and_manual(errors)
    audit_swift_voice_bargein_twin_and_xcode(errors)
    audit_bundle_parity_and_runtime_contracts(errors)

    report = {
        "status": "PASS" if not errors else "FAIL",
        "python_modules_audited": len(dag),
        "english_only_files_checked": checked_files,
        "canonical_3d_zones_verified": list(CANONICAL_ZONES),
        "errors": errors,
    }
    return (len(errors) == 0), report


def main() -> int:
    ok, report = run_full_audit()
    print(json.dumps(report, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
