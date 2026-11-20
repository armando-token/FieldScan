import Foundation

/// Bounded Executable Copilot Action Registry, Complete Screen Inventory, Unified Link Diagnostics,
/// and 8-State Physical Guidance Tracker (`Contract v2.1.0`) for iPad Air M4.
///
/// Pure Foundation leaf module (100% English source). Localized Spanish voice aliases, speech/TTS
/// locales, and response templates are loaded strictly from the audited bundle resource
/// `knowledge/localization/copilot_voice_es.json`.
public final class FieldScanCopilotRegistry {
    public static let shared = FieldScanCopilotRegistry()

    public static let guidanceStates: [String] = [
        "preparing",
        "showing_instruction",
        "waiting_for_operator",
        "waiting_for_clear_frame",
        "observed",
        "needs_review",
        "confirmed",
        "complete",
    ]

    private let lock = NSLock()
    private var cachedSpanishPack: [String: Any]?

    // Guidance state machine
    private var guidanceActive: Bool = false
    private var guidanceId: String?
    private var guidanceSessionId: String?
    private var guidanceState: String = "preparing"
    private var guidanceProfileId: String = "tzone_tht02"
    private var guidanceTargetSlaveId: Int = 1
    private var guidanceExpectedBits: [Int] = [0, 0, 0, 0, 0, 0, 0, 1]
    private var guidanceStepOrder: [Int] = [8, 1, 2, 3, 4, 5, 6, 7]
    private var guidanceStepCursor: Int = 0
    private var guidanceReferenceOnly: Bool = false
    private var occlusionStreak: Int = 0
    private var clearStreak: Int = 0
    private var lastAngleDeg: Double?
    private var confirmedOrigin: String?
    private var guidanceTransitions: [[String: Any]] = []
    private var lastCameraEval: [String: Any] = [:]

    // Telemetry / Latency metrics per mode (`text`, `ptt`, `handsfree`, `touch`)
    private var deterministicAckLatenciesMs: [String: [Double]] = [:]
    private var deterministicTtsLatenciesMs: [String: [Double]] = [:]

    public init() {}

    // MARK: - Audited Spanish Localization Pack Loader

    public func loadSpanishVoicePack(rootOverride: URL? = nil) -> [String: Any] {
        lock.lock()
        if let cached = cachedSpanishPack, rootOverride == nil {
            lock.unlock()
            return cached
        }
        lock.unlock()

        var candidates: [URL] = []
        if let ov = rootOverride {
            candidates.append(ov.appendingPathComponent("knowledge/localization/copilot_voice_es.json"))
        }
        if let res = Bundle.main.resourceURL {
            candidates.append(res.appendingPathComponent("BundleResources/knowledge/localization/copilot_voice_es.json"))
            candidates.append(res.appendingPathComponent("knowledge/localization/copilot_voice_es.json"))
        }
        let cwd = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
        candidates.append(cwd.appendingPathComponent("knowledge/localization/copilot_voice_es.json"))

        for url in candidates {
            if let data = try? Data(contentsOf: url),
               let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
                if rootOverride == nil {
                    lock.lock()
                    cachedSpanishPack = obj
                    lock.unlock()
                }
                return obj
            }
        }
        return [
            "speech_locales": [],
            "tts_locales": [],
            "language_cues": [],
            "action_aliases": [:],
            "responses": [:],
        ]
    }

    public func spanishSpeechLocales(rootOverride: URL? = nil) -> [String] {
        let pack = loadSpanishVoicePack(rootOverride: rootOverride)
        return (pack["speech_locales"] as? [String]) ?? []
    }

    public func spanishTTSLocales(rootOverride: URL? = nil) -> [String] {
        let pack = loadSpanishVoicePack(rootOverride: rootOverride)
        return (pack["tts_locales"] as? [String]) ?? []
    }

    public static func normalizeASCIILower(_ raw: String) -> String {
        let folded = raw.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        return folded.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ").lowercased()
    }

    private static func utcNowISO() -> String {
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return fmt.string(from: Date())
    }

    public func detectCopilotLanguage(_ query: String, preferredLanguage: String = "en", rootOverride: URL? = nil) -> String {
        let norm = Self.normalizeASCIILower(query)
        guard !norm.isEmpty else { return preferredLanguage == "es" ? "es" : "en" }
        if norm.range(of: "\\b(switch to english|english mode|speak english)\\b", options: .regularExpression) != nil {
            return "en"
        }
        if norm.range(of: "\\b(switch to spanish|spanish mode|speak spanish|cambiar a espan\\w*|hablar en espan\\w*|modo espan\\w*)\\b", options: .regularExpression) != nil {
            return "es"
        }

        let pack = loadSpanishVoicePack(rootOverride: rootOverride)
        let esCues = ((pack["language_cues"] as? [String]) ?? []).map { Self.normalizeASCIILower($0) }.filter { !$0.isEmpty }
        let padded = " \(norm) "
        var esHits = 0
        for cue in esCues {
            if padded.contains(" \(cue) ") || (cue.count >= 6 && norm.contains(cue)) {
                esHits += 1
            }
        }
        let enCues = [
            "open ", "close ", "show ", "where ", "what ", "which ", "how ", "configure ",
            "settings", "catalog", "manual", "page ", "port", "host", "explode", "x-ray",
            "xray", "solid", "reset", "focus", "capture", "photo", "help", "history", "draft",
            "stock", "manufacturer", "responding", "switch to", "temperature", "humidity",
        ]
        var enHits = 0
        for cue in enCues {
            if padded.contains(cue) { enHits += 1 }
        }
        if esHits > enHits && esHits >= 1 { return "es" }
        if enHits > esHits && enHits >= 1 { return "en" }
        return preferredLanguage == "es" ? "es" : "en"
    }

    public func formatTemplate(
        key: String,
        language: String,
        enDefault: String,
        params: [String: String] = [:],
        rootOverride: URL? = nil
    ) -> String {
        var out = enDefault
        if language == "es" {
            let pack = loadSpanishVoicePack(rootOverride: rootOverride)
            if let responses = pack["responses"] as? [String: String],
               let esTpl = responses[key], !esTpl.isEmpty {
                out = esTpl
            }
        }
        for (k, v) in params {
            out = out.replacingOccurrences(of: "{\(k)}", with: v)
        }
        return out
    }

    // MARK: - Complete Screen Inventory & Bounded Action Registry

    public static func buildScreenInventory() -> [[String: Any]] {
        return [
            ["screen_id": "main_workspace", "title": "Main Dual Viewport Workspace", "surface": "web", "dom_id": "videoFrame,canvasStage", "route": "/", "availability": "always"],
            ["screen_id": "camera_viewport", "title": "Live Optical Camera Viewport", "surface": "web", "dom_id": "videoFrame", "route": "/#videoFrame", "availability": "always"],
            ["screen_id": "dip_macro_pip", "title": "SW1 DIP-8 Macro Picture-in-Picture", "surface": "web", "dom_id": "dipMacroPip", "route": "/#dipMacroPip", "availability": "requires_dip_profile"],
            ["screen_id": "twin_viewport", "title": "Interactive 3D Digital Twin Stage", "surface": "web", "dom_id": "canvasStage", "route": "/#canvasStage", "availability": "requires_3d_scene"],
            ["screen_id": "chat_panel", "title": "AI Engineer Slide-Over Chat Panel", "surface": "web", "dom_id": "chatPage", "route": "/#chatPage", "availability": "always"],
            ["screen_id": "tools_panel", "title": "Tools, SCADA, Manual & Field Setup Slide-Over", "surface": "web", "dom_id": "toolsPage", "route": "/#toolsPage", "availability": "always"],
            ["screen_id": "manual_drawer", "title": "Embedded 2D Technical Manual Drawer", "surface": "web", "dom_id": "manualDrawer", "route": "/#manualDrawer", "availability": "requires_documentation"],
            ["screen_id": "manual_lightbox", "title": "Fullscreen OEM Datasheet Lightbox", "surface": "web", "dom_id": "manualModal", "route": "/#manualModal", "availability": "requires_documentation"],
            ["screen_id": "pusr_gateway_modal", "title": "PUSR USR-DR164 Direct AP Gateway Setup", "surface": "web", "dom_id": "pusrGatewayModal", "route": "/#pusrGatewayModal", "availability": "always"],
            ["screen_id": "catalog_modal", "title": "Signed Package Store & Cloud Catalog Modal", "surface": "web", "dom_id": "catalogModal", "route": "/#catalogModal", "availability": "always"],
            ["screen_id": "calibration_modal", "title": "Calibration & Verified Adjustment Roadmap Modal", "surface": "web", "dom_id": "calibrationPlannedModal", "route": "/#calibrationPlannedModal", "availability": "always"],
            ["screen_id": "escalation_modal", "title": "Manufacturer Engineering Dossier & Outbox Modal", "surface": "web", "dom_id": "escalationModal", "route": "/#escalationModal", "availability": "always"],
            ["screen_id": "native_operator_sheet", "title": "iPadOS Native Bench Control Action Sheet", "surface": "native_ios", "dom_id": "fieldscanNativeBridge.presentOperatorControlSheet", "route": "native://operator_sheet", "availability": "ipad_native_only"],
            ["screen_id": "native_pusr_sheet", "title": "iPadOS Native PUSR Gateway Selector Sheet", "surface": "native_ios", "dom_id": "fieldscanNativeBridge.presentPusrGatewayConfig", "route": "native://pusr_sheet", "availability": "ipad_native_only"],
            ["screen_id": "native_package_picker", "title": "iPadOS Files Signed Package Document Picker", "surface": "native_ios", "dom_id": "fieldscanNativeBridge.presentPackageImporter", "route": "native://package_picker", "availability": "ipad_native_only"],
            ["screen_id": "ipad_app_settings", "title": "iPadOS FieldScan App Settings", "surface": "native_ios", "dom_id": "fieldscanNativeBridge.openAppSettings", "route": "app-settings:", "availability": "ipad_native_only"],
        ]
    }

    public func buildActionRegistry(rootOverride: URL? = nil) -> [[String: Any]] {
        let pack = loadSpanishVoicePack(rootOverride: rootOverride)
        let esMap = (pack["action_aliases"] as? [String: [String]]) ?? [:]
        let defs: [(String, String, String, String, String, [String])] = [
            ("config.open_pusr", "config", "show", "pusrGatewayModal", "always", ["open pusr settings", "open pusr", "open gateway settings"]),
            ("config.show_pusr_field", "config", "show", "pusrGatewayModal", "always", ["show me the port", "show gateway address", "show gateway host"]),
            ("config.open_catalog", "config", "show", "catalogModal", "always", ["open catalog", "show catalog", "open packages"]),
            ("config.show_cloud_settings", "config", "show", "catalogModal#toggleCloudSync", "always", ["show cloud settings", "where is cloud configured"]),
            ("config.open_tools", "config", "show", "toolsPage", "always", ["open tools", "open settings"]),
            ("config.close_tools", "config", "apply", "toolsPage", "always", ["close tools"]),
            ("config.open_chat", "config", "show", "chatPage", "always", ["open chat"]),
            ("config.close_chat", "config", "apply", "chatPage", "always", ["close chat"]),
            ("config.open_calibration", "config", "show", "calibrationPlannedModal", "always", ["open calibration"]),
            ("config.open_escalation", "config", "show", "escalationModal", "always", ["open escalation", "email manufacturer", "open outbox", "contact manufacturer"]),
            ("config.open_sensor_spec", "config", "show", "manualModal", "requires_documentation", ["open sensor spec"]),
            ("config.open_app_settings", "config", "apply", "native://app_settings", "ipad_native_only", ["open app settings", "open ipad permissions"]),
            ("twin.reset_view", "twin", "apply", "canvasStage", "requires_3d_scene", ["reset view", "close housing", "center twin"]),
            ("twin.set_render_mode", "twin", "apply", "canvasStage", "requires_3d_scene", ["x-ray", "xray", "wireframe", "solid mode"]),
            ("twin.set_explode", "twin", "apply", "canvasStage", "requires_3d_explode", ["explode", "exploded view"]),
            ("twin.rotate_view", "twin", "apply", "canvasStage", "requires_3d_scene", ["rotate twin", "turn around", "zoom in", "zoom out", "show back", "show top", "spin model"]),
            ("twin.focus_part", "twin", "apply", "canvasStage", "requires_3d_scene", ["focus part", "show strainer", "show rear cable"]),
            ("twin.show_dip", "twin", "propose", "canvasStage#upper_barrel_dip", "requires_dip_profile", ["show dip switches", "configure dip", "dip for address"]),
            ("manual.open_page", "manual", "show", "manualModal", "requires_documentation", ["open page", "go to page"]),
            ("manual.open_section", "manual", "show", "manualModal", "requires_documentation", ["open manual", "show dip section", "show calibration section"]),
            ("manual.close", "manual", "apply", "manualModal", "always", ["close manual", "hide manual"]),
            ("camera.show_live", "camera", "show", "videoFrame", "always", ["show live camera", "show camera"]),
            ("camera.show_dip_macro", "camera", "show", "dipMacroPip", "requires_dip_profile", ["open dip macro", "show dip crop"]),
            ("camera.highlight_region", "camera", "show", "cvSpatialHudCanvas", "always", ["highlight region"]),
            ("camera.capture_evidence", "camera", "apply", "btnCaptureManualPhoto", "always", ["capture photo", "take photo", "capture evidence"]),
            ("bench.diagnose_link", "bench_session", "explain", "systemStateBanner", "always", ["link diagnostic", "is the sensor responding", "modbus status"]),
            ("bench.poll_readonly", "bench_session", "apply", "btnPollReadonly", "requires_homologated_bus", ["poll sensor", "run readonly poll"]),
            ("session.open_history", "bench_session", "show", "toolsPage#sessionEventLog", "always", ["open history", "show history", "previous sessions"]),
            ("session.prepare_dossier", "bench_session", "propose", "btnExportSessionDossier", "always", ["prepare dossier", "export dossier"]),
            ("session.prepare_manufacturer_draft", "bench_session", "propose", "escalationModal", "always", ["manufacturer draft", "prepare escalation"]),
            ("session.prepare_stock_draft", "bench_session", "propose", "toolsPage#sessionEventLog", "requires_verified_stock_data", ["stock draft", "reorder stock"]),
            ("catalog.clear_sensor", "config", "apply", "catalogModal", "always", ["clear sensor", "reset sensor", "wipe sensor", "clear sensor workspace"]),
            ("catalog.identify_new_sensor", "config", "show", "sensorOnboardModal", "always", ["new sensor", "identify new sensor", "identify this sensor", "scan new sensor"]),
            ("catalog.onboard_sensor", "config", "apply", "sensorOnboardModal", "always", ["this is a", "this sensor is", "onboard sensor", "process in cloud", "download manual for"]),
            ("help.list_actions", "help", "explain", "chatPage", "always", ["help", "what can you do", "list actions"]),
        ]
        return defs.map { d in
            [
                "id": d.0,
                "category": d.1,
                "intent_mode": d.2,
                "target_surface": d.3,
                "availability": d.4,
                "aliases_en": d.5,
                "aliases_es": esMap[d.0] ?? [],
            ]
        }
    }

    public static func computeSceneCapabilities(descriptor: [String: Any]?) -> [String: Any] {
        let desc = descriptor ?? [:]
        let origin = (desc["scene_origin"] as? String) ?? "bundled_parametric"
        let ctx = (desc["context"] as? [String: Any]) ?? [:]
        let docs = (desc["documents"] as? [[String: Any]]) ?? []
        let homologated = (ctx["bench_modbus_homologated"] as? Bool) ?? (origin == "bundled_parametric")

        if origin == "bundled_parametric" {
            return [
                "scene_origin": origin,
                "supports_3d": true,
                "supports_xray": true,
                "supports_explode": true,
                "supports_dip_pins": true,
                "supports_documentation": true,
                "bench_modbus_homologated": homologated,
                "part_ids": ["strainer_head", "upper_seal_ring", "upper_barrel_dip", "mounting_flange", "lower_barrel_rs485", "waterproof_gland_leads"],
                "view_ids": ["isometric_home", "dip_closeup", "rear_wiring", "tip_closeup", "flange_closeup"],
                "document_count": max(1, docs.count),
            ]
        }
        if origin == "empty_workspace" {
            return [
                "scene_origin": origin,
                "supports_3d": false,
                "supports_xray": false,
                "supports_explode": false,
                "supports_dip_pins": false,
                "supports_documentation": false,
                "bench_modbus_homologated": false,
                "part_ids": [],
                "view_ids": [],
                "document_count": 0,
            ]
        }
        if origin == "docs_only_no_3d" {
            return [
                "scene_origin": origin,
                "supports_3d": false,
                "supports_xray": false,
                "supports_explode": false,
                "supports_dip_pins": false,
                "supports_documentation": !docs.isEmpty,
                "bench_modbus_homologated": homologated,
                "part_ids": [],
                "view_ids": [],
                "document_count": docs.count,
            ]
        }
        let twin = (desc["twin"] as? [String: Any]) ?? [:]
        let parts = (twin["parts"] as? [[String: Any]]) ?? []
        let views = (twin["views"] as? [[String: Any]]) ?? []
        let partIds = parts.compactMap { $0["part_id"] as? String }.filter { !$0.isEmpty }
        let viewIds = views.compactMap { $0["view_id"] as? String }.filter { !$0.isEmpty }
        let hasGlb = !((twin["glb_url"] as? String) ?? "").isEmpty
        let hasExplode = parts.contains(where: { (($0["explode_offset_m"] as? [Any])?.count ?? 0) == 3 })
            || views.contains(where: { !(($0["exploded_offsets_m"] as? [String: Any])?.isEmpty ?? true) })
        // Visual DIP pin display is a 3D geometry capability (separate from Modbus bus homologation)
        let hasDipPins = partIds.contains(where: { $0.lowercased().contains("dip") })
        return [
            "scene_origin": origin,
            "supports_3d": hasGlb,
            "supports_xray": hasGlb,
            "supports_explode": hasGlb && hasExplode,
            "supports_dip_pins": hasDipPins,
            "supports_documentation": !docs.isEmpty,
            "bench_modbus_homologated": homologated,
            "part_ids": partIds,
            "view_ids": viewIds,
            "document_count": docs.count,
        ]
    }

    // MARK: - Unified Single-Source Link Diagnostics (Section 4)

    public func evaluateUnifiedLinkDiagnostic(
        modbusTel: [String: Any]?,
        gatewayHost: String = "",
        gatewayPort: Int = 502,
        language: String = "en",
        ssidVerified: Bool = false,
        previousOnline: Bool? = nil,
        rootOverride: URL? = nil
    ) -> [String: Any] {
        let mb = modbusTel ?? [:]
        let online = (mb["online"] as? Bool) ?? false
        let fresh = (mb["fresh"] as? Bool) ?? online
        let srcStr = (mb["source"] as? String) ?? ""
        let isSim = ((mb["simulation"] as? Bool) ?? false) || srcStr.hasPrefix("simulator")
        let gwConnected = (mb["gateway_connected"] as? Bool) ?? false
        let errCode = (mb["error_code"] as? String) ?? ""
        let errDetail = (mb["error_detail"] as? String) ?? (mb["status_label"] as? String) ?? errCode
        let targetSlave = (mb["target_slave_id"] as? Int) ?? (mb["slave_id"] as? Int) ?? 1
        let cleanHost = gatewayHost.trimmingCharacters(in: .whitespacesAndNewlines)
        let gwLabel = !cleanHost.isEmpty ? "\(cleanHost):\(gatewayPort)" : ((mb["port"] as? String) ?? "PUSR :502")
        let sourceLabel = !srcStr.isEmpty ? srcStr : (isSim ? "simulation" : "modbus_tcp_mbap")
        let proto = (mb["protocol"] as? String) ?? (isSim ? "simulation" : "modbus_tcp_mbap")

        let tempC = (mb["temp_c"] as? Double) ?? (mb["temp_c"] as? NSNumber)?.doubleValue
        let humRH = (mb["humidity_rh"] as? Double) ?? (mb["humidity_rh"] as? NSNumber)?.doubleValue
        let tempQ = (mb["temp_quality"] as? String) ?? (tempC != nil ? "valid" : "unavailable")
        let humQ = (mb["humidity_quality"] as? String) ?? (humRH != nil ? "valid" : "unavailable")
        let abn7fff = ((mb["sensor_abnormal_7fff"] as? Bool) ?? false) || tempQ == "invalid_sentinel_7fff" || humQ == "invalid_sentinel_7fff"
        let histSample = mb["historical_sample"] as? [String: Any]
        let historyRows = (mb["history"] as? [[String: Any]]) ?? []

        let ssidNote = ssidVerified ? "" : (language == "es" ? "SSID no comprobado." : "SSID not verified (iPadOS does not expose Wi-Fi SSID).")

        if online && abn7fff {
            var faultParts: [String] = []
            var validParts: [String] = []
            if tempQ == "invalid_sentinel_7fff" { faultParts.append("Temperature=0x7FFF") }
            else if let t = tempC, tempQ == "valid" { validParts.append(String(format: "Temperature=%.1f degC (valid)", t)) }
            if humQ == "invalid_sentinel_7fff" { faultParts.append("Humidity=0x7FFF") }
            else if let h = humRH, humQ == "valid" { validParts.append(String(format: "Humidity=%.1f %%RH (valid)", h)) }
            let faultDetail = faultParts.isEmpty ? "0x7FFF" : faultParts.joined(separator: ", ")
            let validSibling = validParts.isEmpty ? "Both sensing channels returned 0x7FFF." : "Other channel preserved: \(validParts.joined(separator: ", "))."
            let msg = formatTemplate(
                key: "link_channel_fault",
                language: language,
                enDefault: "The transmitter responds on Slave #{slave_id}, but that channel reports a probe fault ({fault_detail}). {valid_sibling}",
                params: ["slave_id": "\(targetSlave)", "fault_detail": faultDetail, "valid_sibling": validSibling],
                rootOverride: rootOverride
            )
            return [
                "state": "channel_fault_7fff",
                "severity": "red",
                "mode": isSim ? "simulation" : "physical",
                "gateway_connected": true,
                "sensor_responded": true,
                "fresh": fresh,
                "temp_quality": tempQ,
                "humidity_quality": humQ,
                "hypotheses": ["SHT30 sensing element fault, condensation, or open probe connection (Manual Page 6)."],
                "recommended_action": "twin.focus_part:strainer_head",
                "message": msg,
                "ssid_verified": ssidVerified,
            ]
        }

        if online && fresh {
            let tempStr = tempC.map { String(format: "%.1f degC", $0) } ?? "N/A"
            let humStr = humRH.map { String(format: "%.1f %%RH", $0) } ?? "N/A"

            var validTemps: [Double] = []
            for row in historyRows.suffix(6) {
                let rowSim = (row["simulation"] as? Bool) ?? isSim
                if rowSim != isSim { continue }
                if let rSrc = row["source"] as? String, !rSrc.isEmpty, rSrc != sourceLabel { continue }
                if let rUnit = row["unit"] as? String, !["Cel", "degC", "C"].contains(rUnit) { continue }
                if ((row["temp_quality"] as? String) ?? "valid") != "valid" { continue }
                if let tv = (row["temp_c"] as? Double) ?? (row["temp_c"] as? NSNumber)?.doubleValue {
                    validTemps.append(tv)
                }
            }
            if let t = tempC, tempQ == "valid" {
                if validTemps.isEmpty || abs(validTemps.last! - t) > 1e-6 {
                    validTemps.append(t)
                }
            }

            var tempFalling = false
            var deltaT = 0.0
            if validTemps.count >= 2 {
                deltaT = ((validTemps.last! - validTemps.first!) * 100.0).rounded() / 100.0
                var mono = true
                for idx in 0..<(validTemps.count - 1) {
                    if validTemps[idx + 1] > validTemps[idx] + 0.05 { mono = false; break }
                }
                if deltaT <= -0.4 && mono { tempFalling = true }
            }

            let recovered = (previousOnline == false)
            let stateName: String
            let msg: String
            if recovered {
                stateName = "link_recovered"
                msg = formatTemplate(
                    key: "link_recovered",
                    language: language,
                    enDefault: "Modbus link recovered after a new valid reading on Slave #{slave_id}: {temp_str}, {hum_str}.",
                    params: ["slave_id": "\(targetSlave)", "temp_str": tempStr, "hum_str": humStr],
                    rootOverride: rootOverride
                )
            } else if tempFalling {
                stateName = "online_temp_falling"
                msg = formatTemplate(
                    key: "link_temp_falling",
                    language: language,
                    enDefault: "Observed across {sample_count} fresh valid samples from the same source: temperature decreased from {first_temp} to {last_temp} degC ({delta_temp} degC).",
                    params: [
                        "sample_count": "\(validTemps.count)",
                        "first_temp": String(format: "%.1f", validTemps.first!),
                        "last_temp": String(format: "%.1f", validTemps.last!),
                        "delta_temp": String(format: "%+.1f", deltaT),
                    ],
                    rootOverride: rootOverride
                )
            } else {
                stateName = isSim ? "simulation_mode" : "online_nominal"
                msg = formatTemplate(
                    key: "link_online_ok",
                    language: language,
                    enDefault: "Transmitter responded on Slave #{slave_id} ({protocol}, source: {source_label}): Temperature {temp_str}, Humidity {hum_str}.",
                    params: ["slave_id": "\(targetSlave)", "protocol": proto, "source_label": sourceLabel, "temp_str": tempStr, "hum_str": humStr],
                    rootOverride: rootOverride
                )
            }

            return [
                "state": stateName,
                "severity": "green",
                "mode": isSim ? "simulation" : "physical",
                "gateway_connected": true,
                "sensor_responded": true,
                "fresh": true,
                "recovered": recovered,
                "temperature_trend": tempFalling ? "falling" : "stable",
                "trend_sample_count": validTemps.count,
                "trend_delta_c": deltaT,
                "temp_quality": tempQ,
                "humidity_quality": humQ,
                "hypotheses": [],
                "recommended_action": NSNull(),
                "message": msg,
                "ssid_verified": ssidVerified,
            ]
        }

        if let hs = histSample {
            let lastTs = (hs["captured_at_utc"] as? String) ?? "earlier"
            let ht = (hs["temp_c"] as? Double).map { String(format: "%.1f", $0) } ?? "--"
            let hh = (hs["humidity_rh"] as? Double).map { String(format: "%.1f", $0) } ?? "--"
            let lastVals = "\(ht) degC / \(hh) %RH"
            let msg = formatTemplate(
                key: "link_lost_historical",
                language: language,
                enDefault: "Last valid reading at {last_ts} ({last_values}); there is no recent data now ({error_code}). Displayed strictly as historical.",
                params: ["last_ts": lastTs, "last_values": lastVals, "error_code": errCode.isEmpty ? "READ_TIMEOUT" : errCode],
                rootOverride: rootOverride
            )
            return [
                "state": "link_lost_historical",
                "severity": gwConnected ? "amber" : "red",
                "mode": isSim ? "simulation" : "physical",
                "gateway_connected": gwConnected,
                "sensor_responded": false,
                "fresh": false,
                "historical_sample": hs,
                "temperature_trend": "no_recent_data",
                "hypotheses": ["Link dropped after prior valid sample; check power, RS-485 wiring, or Wi-Fi AP association (unverified hypotheses)."],
                "recommended_action": gwConnected ? "bench.poll_readonly" : "config.open_pusr",
                "message": msg,
                "ssid_verified": ssidVerified,
            ]
        }

        if gwConnected {
            let msg = formatTemplate(
                key: "link_gateway_no_sensor",
                language: language,
                enDefault: "The gateway responds ({gateway}), but the Modbus transmitter did not answer this query ({error_code}). Bench hypotheses to check (not confirmed faults): 5-24V DC power, RS-485 A+/B- polarity, 9600 8N1 baud, and Slave #{target_slave} DIP address.",
                params: ["gateway": gwLabel, "error_code": errCode.isEmpty ? "READ_TIMEOUT" : errCode, "target_slave": "\(targetSlave)"],
                rootOverride: rootOverride
            )
            return [
                "state": "gateway_connected_no_sensor_reply",
                "severity": "amber",
                "mode": "physical",
                "gateway_connected": true,
                "sensor_responded": false,
                "fresh": false,
                "hypotheses": [
                    "Sensor 5-24V DC power supply not energized (hypothesis — not measured by iPad)",
                    "RS-485 Yellow (A+) / Green (B-) polarity swapped or missing common Black GND (Manual Page 4)",
                    "Baud rate mismatch (9600 8N1 expected) or SW1 DIP-8 address differs from authorized target #\(targetSlave) (Manual Page 5)",
                ],
                "recommended_action": "manual.open_section:wiring_grounding",
                "message": msg,
                "ssid_verified": ssidVerified,
            ]
        }

        let reasonKind = errCode == "LOCAL_NETWORK_DENIED"
            ? "iPadOS Local Network permission denied"
            : (cleanHost.isEmpty ? "No PUSR gateway host configured" : "Route unreachable (\(errDetail))")
        let msg = formatTemplate(
            key: "link_local_blocked",
            language: language,
            enDefault: "The iPad cannot reach the gateway yet ({detail}). {ssid_note} Check Local Network permission or open the PUSR setup panel.",
            params: ["detail": reasonKind, "ssid_note": ssidNote],
            rootOverride: rootOverride
        )
        return [
            "state": "local_network_or_permission_unconfirmed",
            "severity": "red",
            "mode": isSim ? "simulation" : "physical",
            "gateway_connected": false,
            "sensor_responded": false,
            "fresh": false,
            "hypotheses": [reasonKind],
            "recommended_action": errCode == "LOCAL_NETWORK_DENIED" ? "config.open_app_settings" : "config.open_pusr",
            "message": msg,
            "ssid_verified": ssidVerified,
        ]
    }

    // MARK: - 8-State Synchronized Guidance Tracker (Section 3)

    public func startDipGuidance(
        targetSlaveId: Int,
        sessionId: String?,
        profileId: String,
        supportsDipPins: Bool,
        authorizedBusSlaveId: Int,
        turnId: String? = nil
    ) -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        guidanceActive = true
        guidanceId = "guid-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased()
        guidanceSessionId = sessionId
        guidanceProfileId = profileId
        guidanceTargetSlaveId = max(1, min(247, targetSlaveId))
        guidanceExpectedBits = FieldScanTwinController.addressToDipBits(guidanceTargetSlaveId)
        guidanceReferenceOnly = !supportsDipPins
        occlusionStreak = 0
        clearStreak = 0
        confirmedOrigin = nil
        guidanceTransitions.removeAll()
        let onPins = guidanceExpectedBits.enumerated().compactMap { $0.element == 1 ? ($0.offset + 1) : nil }
        let offPins = guidanceExpectedBits.enumerated().compactMap { $0.element == 0 ? ($0.offset + 1) : nil }
        guidanceStepOrder = onPins + offPins
        guidanceStepCursor = 0

        recordGuidanceTransitionUnlocked("preparing", reason: "guidance_initialized", turnId: turnId)
        if guidanceReferenceOnly {
            recordGuidanceTransitionUnlocked("needs_review", reason: "profile_reference_only_no_verified_dip_geometry", turnId: turnId)
        } else {
            recordGuidanceTransitionUnlocked("showing_instruction", reason: "dip_pattern_displayed", turnId: turnId)
            recordGuidanceTransitionUnlocked("waiting_for_operator", reason: "awaiting_physical_switch_setup", turnId: turnId)
        }
        return guidanceSnapshotUnlocked(authorizedBusSlaveId: authorizedBusSlaveId)
    }

    public func evaluateGuidanceCamera(
        visionTel: [String: Any],
        authorizedBusSlaveId: Int,
        language: String = "en",
        turnId: String? = nil,
        rootOverride: URL? = nil
    ) -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        guard guidanceActive else { return guidanceSnapshotUnlocked(authorizedBusSlaveId: authorizedBusSlaveId) }

        let camSrc = ((visionTel["camera_source"] as? String) ?? (visionTel["mode"] as? String) ?? "unknown").lowercased()
        let isSim = camSrc.hasPrefix("sim") || camSrc.contains("simulator")
        let isUpload = camSrc.contains("upload") || camSrc.contains("custom") || camSrc.contains("file")
        let isCad = camSrc.contains("cad") || camSrc.contains("blueprint")
        let frameOrigin = isSim ? "simulation" : (isUpload ? "uploaded_file" : (isCad ? "cad_blueprint" : "live_physical_camera"))

        let frameAgeS = (visionTel["frame_age_s"] as? Double) ?? 0.0
        let handOrTool = ((visionTel["hand_detected"] as? Bool) ?? false)
            || ((visionTel["tool_detected"] as? Bool) ?? false)
            || ((visionTel["occlusion_filtered"] as? Bool) ?? false)
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false
        let dipConf = (visionTel["dip_confidence"] as? Double) ?? 0.0
        let orientConfirmed = (visionTel["dip_orientation_confirmed"] as? Bool) ?? true
        let orientInverted = (visionTel["dip_orientation_inverted"] as? Bool) ?? false
        var rapidMotion = false
        if let ang = visionTel["angle_deg"] as? Double {
            if let prev = lastAngleDeg, abs(ang - prev) > 12.0 { rapidMotion = true }
            lastAngleDeg = ang
        }

        let activePin = guidanceStepCursor < guidanceStepOrder.count ? guidanceStepOrder[guidanceStepCursor] : 8
        var alertMsg: String? = nil

        if guidanceReferenceOnly {
            recordGuidanceTransitionUnlocked("needs_review", reason: "reference_only_profile", turnId: turnId)
            alertMsg = formatTemplate(key: "dip_reference_only", language: language, enDefault: "Active package has no verified DIP switch geometry; staying in reference mode.", rootOverride: rootOverride)
        } else if frameOrigin != "live_physical_camera" {
            recordGuidanceTransitionUnlocked("needs_review", reason: "non_live_source:\(frameOrigin)", turnId: turnId)
            alertMsg = formatTemplate(key: "dip_low_confidence", language: language, enDefault: "Cannot confirm switch {switch_num} yet ({reason}). Show a live camera view or confirm manually.", params: ["switch_num": "\(activePin)", "reason": "source=\(frameOrigin)"], rootOverride: rootOverride)
        } else if frameAgeS > 3.0 {
            recordGuidanceTransitionUnlocked("needs_review", reason: "stale_camera_frame", turnId: turnId)
            alertMsg = formatTemplate(key: "dip_low_confidence", language: language, enDefault: "Cannot confirm switch {switch_num} yet ({reason}).", params: ["switch_num": "\(activePin)", "reason": String(format: "frame_age=%.1fs", frameAgeS)], rootOverride: rootOverride)
        } else if handOrTool {
            occlusionStreak += 1
            clearStreak = 0
            if occlusionStreak >= 2 || guidanceState != "waiting_for_clear_frame" {
                recordGuidanceTransitionUnlocked("waiting_for_clear_frame", reason: "hand_or_tool_occluding_dip", turnId: turnId)
                alertMsg = formatTemplate(key: "dip_occlusion", language: language, enDefault: "Your hand or tool is covering the DIP block. Please move it aside briefly so I can verify the position.", rootOverride: rootOverride)
            }
        } else if rapidMotion {
            clearStreak = 0
            recordGuidanceTransitionUnlocked("waiting_for_clear_frame", reason: "camera_in_motion_throttled", turnId: turnId)
        } else if orientInverted || !orientConfirmed {
            clearStreak = 0
            recordGuidanceTransitionUnlocked("needs_review", reason: "dip_orientation_unconfirmed_or_inverted", turnId: turnId)
            alertMsg = formatTemplate(key: "dip_low_confidence", language: language, enDefault: "Cannot confirm switch {switch_num} yet ({reason}). Align Pin 1..8 orientation clearly or confirm manually.", params: ["switch_num": "\(activePin)", "reason": "inverted_or_unconfirmed_orientation"], rootOverride: rootOverride)
        } else if !pcbOpen || dipConf < 0.55 {
            clearStreak = 0
            recordGuidanceTransitionUnlocked("needs_review", reason: "low_dip_optical_confidence", turnId: turnId)
            alertMsg = formatTemplate(key: "dip_low_confidence", language: language, enDefault: "Cannot confirm switch {switch_num} yet ({reason}).", params: ["switch_num": "\(activePin)", "reason": String(format: "confidence=%.2f", dipConf)], rootOverride: rootOverride)
        } else {
            occlusionStreak = 0
            clearStreak += 1
            if let obsBits = visionTel["observed_dip_bits"] as? [Int], obsBits.count == 8, obsBits != guidanceExpectedBits {
                let mismatched = (0..<8).filter { obsBits[$0] != guidanceExpectedBits[$0] }.map { $0 + 1 }
                recordGuidanceTransitionUnlocked("needs_review", reason: "dip_pattern_discrepancy", turnId: turnId)
                alertMsg = formatTemplate(
                    key: "dip_low_confidence",
                    language: language,
                    enDefault: "Discrepancy detected on switch {switch_num} ({reason}). Expected {expected_pattern}.",
                    params: [
                        "switch_num": "\(mismatched.first ?? activePin)",
                        "reason": "pins_differ:\(mismatched)",
                        "expected_pattern": FieldScanTwinController.formatDipInstructionEN(guidanceExpectedBits),
                    ],
                    rootOverride: rootOverride
                )
            } else if clearStreak >= 2 {
                recordGuidanceTransitionUnlocked("observed", reason: "multi_frame_clear_optical_observation", turnId: turnId)
                alertMsg = formatTemplate(
                    key: "dip_observed",
                    language: language,
                    enDefault: "Clear optical view observed ({source_label}). Expected pattern: {expected_pattern}. Optical view credits visible position only; Modbus operation requires a fresh physical bus read.",
                    params: [
                        "source_label": frameOrigin,
                        "expected_pattern": FieldScanTwinController.formatDipInstructionEN(guidanceExpectedBits),
                    ],
                    rootOverride: rootOverride
                )
            }
        }

        lastCameraEval = [
            "frame_origin": frameOrigin,
            "frame_age_s": (frameAgeS * 1000.0).rounded() / 1000.0,
            "hand_or_tool_occluded": handOrTool,
            "rapid_motion": rapidMotion,
            "orientation_confirmed": orientConfirmed && !orientInverted,
            "dip_confidence": (dipConf * 1000.0).rounded() / 1000.0,
            "can_credit_physical_position": guidanceState == "observed",
            "can_credit_modbus_operation": false,
            "alert_message": alertMsg ?? NSNull(),
        ]
        return guidanceSnapshotUnlocked(authorizedBusSlaveId: authorizedBusSlaveId)
    }

    public func confirmGuidanceStep(
        manual: Bool = true,
        authorizedBusSlaveId: Int = 1,
        complete: Bool = false,
        turnId: String? = nil
    ) -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        guard guidanceActive else { return guidanceSnapshotUnlocked(authorizedBusSlaveId: authorizedBusSlaveId) }
        confirmedOrigin = manual ? "manual_operator_confirmation" : "optical_plus_operator_confirmation"
        recordGuidanceTransitionUnlocked("confirmed", reason: confirmedOrigin!, turnId: turnId)
        if complete || guidanceStepCursor + 1 >= guidanceStepOrder.count {
            recordGuidanceTransitionUnlocked("complete", reason: "guidance_steps_completed", turnId: turnId)
        } else {
            guidanceStepCursor += 1
            recordGuidanceTransitionUnlocked("showing_instruction", reason: "next_switch_step", turnId: turnId)
        }
        return guidanceSnapshotUnlocked(authorizedBusSlaveId: authorizedBusSlaveId)
    }

    public func guidanceSnapshot(authorizedBusSlaveId: Int) -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        return guidanceSnapshotUnlocked(authorizedBusSlaveId: authorizedBusSlaveId)
    }

    private func recordGuidanceTransitionUnlocked(_ nextState: String, reason: String, turnId: String?) {
        guard Self.guidanceStates.contains(nextState) else { return }
        guidanceState = nextState
        guidanceTransitions.append([
            "state": nextState,
            "reason": reason,
            "at_utc": Self.utcNowISO(),
            "turn_id": turnId ?? NSNull(),
        ])
        if guidanceTransitions.count > 40 {
            guidanceTransitions.removeFirst(guidanceTransitions.count - 40)
        }
    }

    private func guidanceSnapshotUnlocked(authorizedBusSlaveId: Int) -> [String: Any] {
        let activePin = guidanceStepCursor < guidanceStepOrder.count ? guidanceStepOrder[guidanceStepCursor] : 8
        let wantState = (activePin >= 1 && activePin <= guidanceExpectedBits.count && guidanceExpectedBits[activePin - 1] == 1) ? "ON" : "OFF"
        return [
            "active": guidanceActive,
            "guidance_id": guidanceId ?? NSNull(),
            "session_id": guidanceSessionId ?? NSNull(),
            "state": guidanceState,
            "profile_id": guidanceProfileId,
            "reference_only": guidanceReferenceOnly,
            "expected_dip_address": guidanceTargetSlaveId,
            "expected_dip_bits": guidanceExpectedBits,
            "expected_pattern_summary": FieldScanTwinController.formatDipInstructionEN(guidanceExpectedBits),
            "active_switch_number": activePin,
            "active_switch_instruction": "Switch \(activePin) -> \(wantState)",
            "authorized_bus_slave_id": authorizedBusSlaveId,
            "bus_target_mutated": false,
            "confirmed_origin": confirmedOrigin ?? NSNull(),
            "camera_observation": lastCameraEval,
            "transitions": Array(guidanceTransitions.suffix(12)),
        ]
    }

    // MARK: - Deterministic Latency Recording

    public func recordActionLatency(mode: String, ackMs: Double?, ttsStartMs: Double?) {
        let cleanMode = mode.isEmpty ? "unknown" : mode
        lock.lock()
        if let a = ackMs, a >= 0 {
            var arr = deterministicAckLatenciesMs[cleanMode] ?? []
            arr.append(a)
            if arr.count > 200 { arr.removeFirst(arr.count - 200) }
            deterministicAckLatenciesMs[cleanMode] = arr
        }
        if let t = ttsStartMs, t >= 0 {
            var arr = deterministicTtsLatenciesMs[cleanMode] ?? []
            arr.append(t)
            if arr.count > 200 { arr.removeFirst(arr.count - 200) }
            deterministicTtsLatenciesMs[cleanMode] = arr
        }
        lock.unlock()
    }

    public func latencyMetricsSummary() -> [String: Any] {
        func stats(_ values: [Double]) -> [String: Any] {
            guard !values.isEmpty else { return ["n": 0, "median_ms": NSNull(), "p95_ms": NSNull()] }
            let s = values.sorted()
            let med = s[s.count / 2]
            let p95 = s[min(s.count - 1, Int(Double(s.count - 1) * 0.95))]
            return ["n": s.count, "median_ms": (med * 10.0).rounded() / 10.0, "p95_ms": (p95 * 10.0).rounded() / 10.0]
        }
        lock.lock()
        let ackCopy = deterministicAckLatenciesMs
        let ttsCopy = deterministicTtsLatenciesMs
        lock.unlock()
        var out: [String: Any] = [:]
        let allModes = Set(ackCopy.keys).union(ttsCopy.keys)
        for m in allModes.sorted() {
            out[m] = [
                "ui_ack": stats(ackCopy[m] ?? []),
                "tts_start": stats(ttsCopy[m] ?? []),
            ]
        }
        return out
    }

    // MARK: - Unified EN/ES Action Plan Resolver

    public func resolveCopilotActionPlan(
        query: String,
        descriptor: [String: Any]?,
        modbusTel: [String: Any]?,
        visionTel: [String: Any]?,
        gatewayHost: String = "",
        gatewayPort: Int = 502,
        cloudSyncEnabled: Bool = false,
        authorizedBusSlaveId: Int = 1,
        currentDipAddress: Int = 1,
        sessionId: String? = nil,
        sceneGeneration: Int = 1,
        turnId: String? = nil,
        preferredLanguage: String = "en",
        isIpadNative: Bool = true,
        rootOverride: URL? = nil
    ) -> [String: Any]? {
        let raw = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { return nil }
        let norm = Self.normalizeASCIILower(raw)
        let lang = detectCopilotLanguage(raw, preferredLanguage: preferredLanguage, rootOverride: rootOverride)
        let tid = turnId ?? ("turn-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased())
        let ctx = (descriptor?["context"] as? [String: Any]) ?? [:]
        let manifestSha = (ctx["manifest_sha256"] as? String) ?? "bundle-tzone-tht02-v2.1"
        let caps = Self.computeSceneCapabilities(descriptor: descriptor)
        let cloudStateTxt = lang == "es" ? (cloudSyncEnabled ? "habilitado" : "deshabilitado") : (cloudSyncEnabled ? "enabled" : "disabled")
        let cleanHost = gatewayHost.trimmingCharacters(in: .whitespacesAndNewlines)
        let hostDisplay = cleanHost.isEmpty ? (lang == "es" ? "Sin configurar" : "Not configured") : cleanHost

        func makePlan(
            actions: [[String: Any]],
            intentMode: String,
            reply: String,
            confirmation: String = "none",
            ambiguous: Bool = false,
            clarificationPrompt: String? = nil,
            extra: [String: Any] = [:]
        ) -> [String: Any] {
            var out: [String: Any] = [
                "schema": "copilot_action_plan_v1",
                "turn_id": tid,
                "session_id": sessionId ?? NSNull(),
                "scene_generation": sceneGeneration,
                "manifest_sha256": manifestSha,
                "language": lang,
                "intent_mode": intentMode,
                "confirmation": confirmation,
                "ambiguous": ambiguous,
                "clarification_prompt": clarificationPrompt ?? NSNull(),
                "actions": actions,
                "reply_text": reply,
                "authorized_bus_slave_id": authorizedBusSlaveId,
                "bus_target_mutated": false,
                "scene_capabilities": caps,
            ]
            for (k, v) in extra { out[k] = v }
            return out
        }

        // 0a. Clear Sensor Workspace (preserves fixed PUSR gateway 100%)
        if norm.range(of: "\\b(clear|reset|wipe|unload|remove)\\b.*\\b(sensor|workspace|twin|profile|device)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(3d|view|camera|pusr|gateway)\\b", options: .regularExpression) == nil {
            return makePlan(
                actions: [["id": "catalog.clear_sensor", "params": ["clear_installed_packages": true]]],
                intentMode: "apply",
                reply: "Sensor workspace cleared. No sensor profile is loaded on this iPad. Your PUSR RS-485 gateway connection remains active. Point the camera at a sensor and say 'Identify this sensor' or tell me its manufacturer and model."
            )
        }

        // 0b. Identify New Sensor (live camera snapshot + ask for brand & model)
        if norm.range(of: "\\b(identify|scan|add|onboard|register|detect)\\b.*\\b(new|this|unknown|different)?\\s*(sensor|device|equipment)\\b", options: .regularExpression) != nil
            || norm.range(of: "^(new sensor|i have a new sensor|different sensor|unknown sensor)$", options: .regularExpression) != nil {
            return makePlan(
                actions: [["id": "catalog.identify_new_sensor", "params": ["capture_photo": true]]],
                intentMode: "show",
                reply: "Photo captured from the live camera. No matching sensor profile is loaded yet. What manufacturer and model is this sensor?"
            )
        }

        // 0c. Spoken Brand & Model Identification or Cloud Onboarding Confirmation (100% English, any sensor)
        if let parsedSensor = Self.parseSpokenSensorIdentity(raw) {
            let mfg = parsedSensor.manufacturer
            let mod = parsedSensor.model
            let variant = parsedSensor.variant
            var actParams: [String: Any] = [
                "manufacturer": mfg,
                "model": mod,
                "auto_submit": parsedSensor.autoSubmit,
                "force_refresh": true,
            ]
            if let v = variant, !v.isEmpty { actParams["variant"] = v }
            let spokenName = mfg == "UNKNOWN" ? mod : "\(mfg) \(mod)"
            let reply = parsedSensor.autoSubmit
                ? "Got it — \(spokenName). Submitting your request to FieldScan Cloud now to fetch the latest official datasheet and build the 3D Digital Twin."
                : "Captured \(spokenName) with the live camera photo. Say 'Process in cloud' or tap Request from FieldScan Cloud to fetch the official manual and 3D Digital Twin."
            return makePlan(
                actions: [["id": "catalog.onboard_sensor", "params": actParams]],
                intentMode: "apply",
                reply: reply
            )
        }
        if norm.range(of: "\\b(process in cloud|send to cloud|download from cloud|fetch from cloud|yes download|yes process|download the manual and twin)\\b", options: .regularExpression) != nil {
            return makePlan(
                actions: [["id": "catalog.onboard_sensor", "params": ["confirm_pending": true, "auto_submit": true, "force_refresh": true]]],
                intentMode: "apply",
                reply: "Confirmed. Submitting the sensor request to FieldScan Cloud now."
            )
        }

        // 0. Help / list actions from registry
        if norm.range(of: "\\b(list actions|available actions|what actions|help me|ayuda|lista de acciones|acciones disponibles)\\b", options: .regularExpression) != nil
            || ["help", "commands", "ayuda"].contains(norm) {
            let reg = buildActionRegistry(rootOverride: rootOverride)
            let cats = Array(Set(reg.compactMap { $0["category"] as? String })).sorted()
            let summary = cats.map { c in "\(c): \(reg.filter { ($0["category"] as? String) == c }.count)" }.joined(separator: ", ")
            let reply = formatTemplate(
                key: "help_intro",
                language: lang,
                enDefault: "Available FieldScan copilot actions ({count} registered across categories): {summary}.",
                params: ["count": "\(reg.count)", "summary": summary],
                rootOverride: rootOverride
            )
            return makePlan(actions: [["id": "help.list_actions", "params": ["categories": cats, "count": reg.count]]], intentMode: "explain", reply: reply, extra: ["registry_count": reg.count])
        }

        // 1. Mutation guard (never silently edit network/bus/cloud settings via voice)
        if norm.range(of: "\\b(change|set|modify|save|write|cambiar|guardar|modificar)\\b.*\\b(target slave|bus slave|modbus target|pusr ip|gateway ip|cloud sync|habilitar cloud|enable cloud)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(
                key: "confirmation_required",
                language: lang,
                enDefault: "This action ({action_id}) requires explicit operator confirmation in the UI control. No settings were modified.",
                params: ["action_id": "configuration_mutation"],
                rootOverride: rootOverride
            )
            let targetAct = (norm.contains("pusr") || norm.contains("gateway")) ? "config.open_pusr" : "config.open_catalog"
            return makePlan(
                actions: [["id": targetAct, "params": ["read_only_preview": true], "status_hint": "requires_confirmation"]],
                intentMode: "propose",
                reply: reply,
                confirmation: "required"
            )
        }

        // 2. PUSR Gateway Config & Field Locator (UI-01: EN + ES)
        let wantsPusr = norm.range(of: "\\b(pusr|usr-?dr164|gateway)\\b", options: .regularExpression) != nil
        let wantsPusrOpen = wantsPusr
            && norm.range(of: "\\b(open|show|where|config|setup|settings|port|host|ip|address|abre|abrir|muestr\\w*|donde|configur\\w*|puerto|direccion|panel)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(diagnos\\w*|status|respondiendo|respond|estado del enlace|link)\\b", options: .regularExpression) == nil
        if wantsPusrOpen {
            let wantsPort = norm.range(of: "\\b(port|puerto)\\b", options: .regularExpression) != nil
            let wantsHost = norm.range(of: "\\b(host|ip|ipv4)\\b", options: .regularExpression) != nil
            let wantsAddr = norm.range(of: "\\b(address|direccion)\\b", options: .regularExpression) != nil
            var acts: [[String: Any]] = [["id": "config.open_pusr", "params": ["read_only": true]]]
            let reply: String
            if wantsPort {
                acts.append(["id": "config.show_pusr_field", "params": ["field": "port", "unit": "TCP port", "example": "502", "source": "PUSR USR-DR164 MBAP"]])
                reply = formatTemplate(key: "pusr_opened_port", language: lang, enDefault: "Opened PUSR Gateway configuration and highlighted the Modbus TCP Port field (standard value 502; never 5502). Current port: {port}. No values were changed.", params: ["port": "\(gatewayPort)"], rootOverride: rootOverride)
            } else if wantsHost {
                acts.append(["id": "config.show_pusr_field", "params": ["field": "host", "unit": "IPv4", "example": "10.10.100.254", "source": "PUSR Direct AP"]])
                reply = formatTemplate(key: "pusr_opened_host", language: lang, enDefault: "Opened PUSR Gateway configuration and highlighted the IPv4 Host field (read-only; no values changed). Currently configured: {host_display}.", params: ["host_display": hostDisplay], rootOverride: rootOverride)
            } else if wantsAddr {
                acts.append(["id": "config.show_pusr_field", "params": ["field": "address", "unit": "IPv4:Port", "example": "10.10.100.254:502", "source": "PUSR Direct AP"]])
                reply = formatTemplate(key: "pusr_opened_address", language: lang, enDefault: "Opened PUSR Gateway configuration and focused the gateway address ({host_display}:{port}). Authorized Modbus polling target remains Slave #{authorized_slave}.", params: ["host_display": hostDisplay, "port": "\(gatewayPort)", "authorized_slave": "\(authorizedBusSlaveId)"], rootOverride: rootOverride)
            } else {
                reply = formatTemplate(key: "pusr_opened_generic", language: lang, enDefault: "Opened the PUSR Gateway setup panel (read-only preview; no parameters saved or connected automatically).", rootOverride: rootOverride)
            }
            return makePlan(actions: acts, intentMode: "show", reply: reply)
        }

        // 3. Cloud Settings & Catalog Modal (UI-02: zero WAN)
        if norm.range(of: "\\b(cloud|nube)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(show|where|config|setup|settings|enabled|status|muestr\\w*|donde|configur\\w*|habilitad\\w*|estado|abre|abrir)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(
                key: "cloud_settings_shown",
                language: lang,
                enDefault: "Opened the Catalog panel and highlighted the Cloud configuration controls. Cloud Sync remains {cloud_state}, tokens stay masked, and zero external requests were emitted.",
                params: ["cloud_state": cloudStateTxt],
                rootOverride: rootOverride
            )
            return makePlan(
                actions: [
                    ["id": "config.open_catalog", "params": ["read_only": true]],
                    ["id": "config.show_cloud_settings", "params": ["highlight_controls": ["toggleCloudSync", "inputCloudEndpoint"], "cloud_enabled": cloudSyncEnabled]],
                ],
                intentMode: "show",
                reply: reply,
                extra: ["cloud_enabled": cloudSyncEnabled]
            )
        }

        if norm.range(of: "\\b(open|show|abre|abrir|muestr\\w*)\\b.*\\b(catalog|catalogo|package store|paquetes)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(
                key: "catalog_opened",
                language: lang,
                enDefault: "Opened the Signed Package Store & Catalog panel. Cloud Sync is currently {cloud_state}; no external network request was made.",
                params: ["cloud_state": cloudStateTxt],
                rootOverride: rootOverride
            )
            return makePlan(actions: [["id": "config.open_catalog", "params": ["read_only": true]]], intentMode: "show", reply: reply, extra: ["cloud_enabled": cloudSyncEnabled])
        }

        // 4. Close Manual
        if norm.range(of: "\\b(close|hide|cierra|cerrar|ocult\\w*)\\b.*\\b(manual|datasheet|lightbox)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(key: "manual_closed", language: lang, enDefault: "Closed the manual viewer. Camera and 3D Digital Twin remain active.", rootOverride: rootOverride)
            return makePlan(actions: [["id": "manual.close", "params": [:]]], intentMode: "apply", reply: reply)
        }

        // 5. iPadOS App Settings vs System Wi-Fi guidance
        if norm.range(of: "\\b(wi-?fi settings|ajustes de wi-?fi|red wi-?fi en ajustes)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(key: "system_wifi_instructions", language: lang, enDefault: "iPadOS does not allow apps to jump directly into system Wi-Fi settings. Open iPad Settings > Wi-Fi and join USR-DR164-XXXX.", rootOverride: rootOverride)
            return makePlan(actions: [], intentMode: "explain", reply: reply)
        }
        if norm.range(of: "\\b(open|abre|abrir)\\b.*\\b(app settings|fieldscan settings|ipad settings|ajustes de fieldscan|ajustes de la app|permisos de red local)\\b", options: .regularExpression) != nil {
            if isIpadNative {
                let reply = formatTemplate(key: "app_settings_opened", language: lang, enDefault: "Opening FieldScan's iPadOS Settings screen so you can review Local Network, Camera, Microphone, and Speech permissions.", rootOverride: rootOverride)
                return makePlan(actions: [["id": "config.open_app_settings", "params": [:]]], intentMode: "apply", reply: reply)
            }
            let reply = formatTemplate(key: "action_unavailable", language: lang, enDefault: "Control unavailable in the current mode: {reason}.", params: ["reason": "requires native iPad app"], rootOverride: rootOverride)
            return makePlan(actions: [["id": "config.open_app_settings", "params": [:], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
        }

        // 6. History, Tools, Chat, Calibration
        if norm.range(of: "\\b(open|show|abre|abrir|muestr\\w*)\\b.*\\b(history|historial|previous sessions|sesiones anteriores)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(key: "history_opened", language: lang, enDefault: "Opened the local equipment and session history log inside Tools.", params: ["turns_count": "0", "prior_count": "0"], rootOverride: rootOverride)
            return makePlan(actions: [["id": "session.open_history", "params": [:]]], intentMode: "show", reply: reply)
        }
        if norm.range(of: "\\b(open|abre|abrir)\\b.*\\b(tools|herramientas)\\b", options: .regularExpression) != nil {
            return makePlan(actions: [["id": "config.open_tools", "params": [:]]], intentMode: "show", reply: "Opened Tools & Field Setup.")
        }
        if norm.range(of: "\\b(close|cierra|cerrar)\\b.*\\b(tools|herramientas)\\b", options: .regularExpression) != nil {
            return makePlan(actions: [["id": "config.close_tools", "params": [:]]], intentMode: "apply", reply: "Closed Tools panel.")
        }
        if norm.range(of: "\\b(open|abre|abrir)\\b.*\\b(chat)\\b", options: .regularExpression) != nil {
            return makePlan(actions: [["id": "config.open_chat", "params": [:]]], intentMode: "show", reply: "Opened AI Engineer Chat panel.")
        }
        if norm.range(of: "\\b(close|cierra|cerrar)\\b.*\\b(chat)\\b", options: .regularExpression) != nil {
            return makePlan(actions: [["id": "config.close_chat", "params": [:]]], intentMode: "apply", reply: "Closed AI Engineer Chat panel.")
        }
        if norm.range(of: "\\b(open|abre|abrir|show|muestr\\w*|go to|pull up)\\b.*\\b(calibration roadmap|calibration|calibracion|hoja de ruta)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(manual|datasheet|pdf|page|pagina)\\b", options: .regularExpression) == nil {
            return makePlan(actions: [["id": "config.open_calibration", "params": [:]]], intentMode: "show", reply: "Opened the Calibration & Verified Adjustment panel (read-only).")
        }
        if norm.range(of: "\\b(open|show|go to|pull up)\\b.*\\b(escalation|email manufacturer|manufacturer email|outbox|contact manufacturer|report modal)\\b", options: .regularExpression) != nil {
            return makePlan(actions: [["id": "config.open_escalation", "params": [:]]], intentMode: "show", reply: "Opened the Manufacturer Escalation & Outbox panel.")
        }

        // 7. Local Drafts (Stock & Manufacturer)
        if norm.range(of: "\\b(stock|repuestos|reorder|reponer)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(draft|borrador|order|pedido|preparar|prepare)\\b", options: .regularExpression) != nil {
            let skuRx = try? NSRegularExpression(pattern: "\\bsku[:\\s#-]*([a-z0-9\\-_]+)\\b")
            let qtyRx = try? NSRegularExpression(pattern: "\\b(?:qty|quantity|cantidad)[:\\s=]*(\\d+)\\b")
            let thrRx = try? NSRegularExpression(pattern: "\\b(?:threshold|umbral|min)[:\\s=]*(\\d+)\\b")
            let nsRange = NSRange(norm.startIndex..., in: norm)
            if let sm = skuRx?.firstMatch(in: norm, range: nsRange), let sr = Range(sm.range(at: 1), in: norm),
               let qm = qtyRx?.firstMatch(in: norm, range: nsRange), let qr = Range(qm.range(at: 1), in: norm),
               let tm = thrRx?.firstMatch(in: norm, range: nsRange), let tr = Range(tm.range(at: 1), in: norm),
               let qty = Int(norm[qr]), let thr = Int(norm[tr]) {
                let sku = String(norm[sr]).uppercased()
                let reply = formatTemplate(key: "draft_stock_ready", language: lang, enDefault: "Prepared local stock draft for SKU {sku} (verified quantity: {qty}, threshold: {threshold}). Nothing was sent externally.", params: ["sku": sku, "qty": "\(qty)", "threshold": "\(thr)"], rootOverride: rootOverride)
                return makePlan(actions: [["id": "session.prepare_stock_draft", "params": ["sku": sku, "verified_quantity": qty, "reorder_threshold": thr]]], intentMode: "propose", reply: reply)
            }
            let reply = formatTemplate(key: "draft_stock_unverified", language: lang, enDefault: "Cannot prepare a stock draft without an explicitly configured SKU, verified quantity, and reorder threshold. A missing sensor or lost reading does not establish low stock.", rootOverride: rootOverride)
            return makePlan(actions: [["id": "session.prepare_stock_draft", "params": [:], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
        }

        let esPackNow = loadSpanishVoicePack(rootOverride: rootOverride)
        let esAliasesNow = (esPackNow["action_aliases"] as? [String: [String]]) ?? [:]
        func matchesLocalizedAlias(_ actionId: String) -> Bool {
            let list = esAliasesNow[actionId] ?? []
            return list.contains { alias in
                let a = Self.normalizeASCIILower(alias)
                return !a.isEmpty && norm.contains(a)
            }
        }

        if norm.range(of: "\\b(manufacturer|oem|escalat\\w*|escalamiento)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(draft|borrador|email|correo|prepare|preparar)\\b", options: .regularExpression) != nil
            || matchesLocalizedAlias("session.prepare_manufacturer_draft") {
            let reply = formatTemplate(key: "draft_manufacturer_ready", language: lang, enDefault: "Prepared a local manufacturer escalation draft with verified facts and open questions. Nothing is sent until you review and share it.", rootOverride: rootOverride)
            return makePlan(actions: [["id": "session.prepare_manufacturer_draft", "params": [:]]], intentMode: "propose", reply: reply)
        }

        // 8. Link Diagnostics & Read-Only Poll
        if norm.range(of: "\\b(link diagnostic|diagnostico del enlace|estado del enlace|is the sensor responding|esta respondiendo|el sensor responde|modbus status|estado del pusr|como esta modbus|why.*not responding|porque no responde)\\b", options: .regularExpression) != nil {
            let diag = evaluateUnifiedLinkDiagnostic(modbusTel: modbusTel, gatewayHost: gatewayHost, gatewayPort: gatewayPort, language: lang, rootOverride: rootOverride)
            var acts: [[String: Any]] = [["id": "bench.diagnose_link", "params": ["diagnostic_state": diag["state"] ?? "unknown"]]]
            if (diag["recommended_action"] as? String) == "config.open_pusr" {
                acts.append(["id": "config.open_pusr", "params": ["read_only": true]])
            }
            return makePlan(actions: acts, intentMode: "explain", reply: (diag["message"] as? String) ?? "", extra: ["link_diagnostic": diag])
        }

        if norm.range(of: "\\b(poll sensor|run readonly poll|ejecutar lectura|leer sensor ahora|hacer lectura autorizada)\\b", options: .regularExpression) != nil {
            if (caps["bench_modbus_homologated"] as? Bool) != true {
                let reply = formatTemplate(key: "action_unavailable", language: lang, enDefault: "Control unavailable in the current mode: {reason}.", params: ["reason": "Active catalog profile is reference-only and not homologated for Modbus polling"], rootOverride: rootOverride)
                return makePlan(actions: [["id": "bench.poll_readonly", "params": [:], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
            }
            return makePlan(actions: [["id": "bench.poll_readonly", "params": [:]]], intentMode: "apply", reply: "Running authorized read-only Modbus Function 0x03 poll.")
        }

        // 9. Camera controls
        if norm.range(of: "\\b(capture photo|take photo|take a photo|capture evidence|tomar foto|toma una foto|capturar evidencia|guardar foto)\\b", options: .regularExpression) != nil {
            let reply = formatTemplate(key: "camera_evidence_captured", language: lang, enDefault: "Capturing inspection evidence photo into the active session.", params: ["filename": "pending_capture.jpg", "evidence_origin": "camera"], rootOverride: rootOverride)
            return makePlan(actions: [["id": "camera.capture_evidence", "params": ["manual": true]]], intentMode: "apply", reply: reply)
        }
        if norm.range(of: "\\b(dip macro|dip crop|recorte dip|acercamiento dip|macro dip)\\b", options: .regularExpression) != nil {
            if (caps["supports_dip_pins"] as? Bool) != true {
                let reply = formatTemplate(key: "dip_reference_only", language: lang, enDefault: "Active package has no verified DIP switch profile; macro DIP overlay is unavailable in reference mode.", rootOverride: rootOverride)
                return makePlan(actions: [["id": "camera.show_dip_macro", "params": ["visible": true], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
            }
            let src = (visionTel?["camera_source"] as? String) ?? "camera"
            let reply = formatTemplate(key: "camera_dip_macro_shown", language: lang, enDefault: "Opened the DIP-8 macro inset over the live camera view (source: {source_label}).", params: ["source_label": src], rootOverride: rootOverride)
            return makePlan(actions: [["id": "camera.show_dip_macro", "params": ["visible": true]]], intentMode: "show", reply: reply)
        }

        // 10. 3D Twin Modes & Free-Form Camera Manipulation (X-Ray, Solid, Explode, Rotate, Zoom, Reset — Bundled + GLB!)
        let wantsXray = norm.range(of: "\\b(x-?ray|wireframe|rayos\\s*x|see inside|look inside|ver por dentro|translucent|transparent)\\b", options: .regularExpression) != nil
        let wantsSolid = norm.range(of: "\\b(solid mode|solid view|normal view|vista solida|modo solido)\\b", options: .regularExpression) != nil
        let wantsExplode = norm.range(of: "\\b(explode|exploded view|open the sensor|open sensor|open housing|open the housing|disassemble|take apart|split apart|explotar|vista explotada|desarmar gemelo)\\b", options: .regularExpression) != nil || matchesLocalizedAlias("twin.set_explode")
        let wantsCollapse = norm.range(of: "\\b(collapse|colapsar|close housing|close the housing|close the sensor|reassemble|put back together)\\b", options: .regularExpression) != nil
        let wantsReset = norm.range(of: "\\b(reset view|reset 3d|reset camera|center twin|center the twin|restablecer vista|reiniciar vista|centrar gemelo|centra el gemelo|default overview|full view)\\b", options: .regularExpression) != nil || matchesLocalizedAlias("twin.reset_view")
        let wantsRotateOrZoom = norm.range(of: "\\b(rotate|turn|spin|flip|orbit|zoom in|zoom out|closer|farther|back side|rear view|top view|bottom view|side view|front view)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(manual|datasheet|pdf|page)\\b", options: .regularExpression) == nil

        if wantsXray || wantsSolid {
            let targetMode = wantsXray ? "wireframe" : "solid"
            if (caps["supports_xray"] as? Bool) != true {
                let reply = formatTemplate(key: "twin_capability_unavailable", language: lang, enDefault: "This 3D action ({capability}) is unavailable for the active model ({scene_origin}). Current view was not altered.", params: ["capability": targetMode, "scene_origin": (caps["scene_origin"] as? String) ?? "unknown"], rootOverride: rootOverride)
                return makePlan(actions: [["id": "twin.set_render_mode", "params": ["mode": targetMode], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
            }
            let reply = formatTemplate(key: wantsXray ? "twin_xray_applied" : "twin_solid_applied", language: lang, enDefault: wantsXray ? "Switched 3D Digital Twin to X-Ray wireframe view." : "Switched 3D Digital Twin to solid view.", rootOverride: rootOverride)
            return makePlan(actions: [["id": "twin.set_render_mode", "params": ["mode": targetMode]]], intentMode: "apply", reply: reply)
        }
        if wantsRotateOrZoom && !wantsExplode && !wantsReset && !wantsCollapse {
            if (caps["supports_3d"] as? Bool) != true {
                return makePlan(actions: [["id": "twin.rotate_view", "params": ["direction": "right"], "status_hint": "unavailable"]], intentMode: "explain", reply: "No 3D Digital Twin is currently loaded to rotate or zoom.")
            }
            let dir: String
            if norm.contains("zoom in") || norm.contains("closer") { dir = "zoom_in" }
            else if norm.contains("zoom out") || norm.contains("farther") { dir = "zoom_out" }
            else if norm.contains("back") || norm.contains("rear") || norm.contains("around") || norm.contains("flip") { dir = "back" }
            else if norm.contains("front") { dir = "front" }
            else if norm.contains("top") || norm.contains("up") || norm.contains("above") { dir = "top" }
            else if norm.contains("bottom") || norm.contains("under") || norm.contains("down") { dir = "bottom" }
            else if norm.contains("left") { dir = "left" }
            else if norm.contains("spin") { dir = "spin" }
            else { dir = "right" }
            return makePlan(
                actions: [["id": "twin.rotate_view", "params": ["direction": dir]]],
                intentMode: "apply",
                reply: "Adjusted the 3D Digital Twin view (\(dir.replacingOccurrences(of: "_", with: " ")))."
            )
        }
        if wantsExplode && norm.range(of: "\\b(dip|pin|pins|switch|switches|address|slave)\\b", options: .regularExpression) == nil {
            if (caps["supports_explode"] as? Bool) != true {
                let reply = formatTemplate(key: "twin_capability_unavailable", language: lang, enDefault: "This 3D action ({capability}) is unavailable for the active model ({scene_origin}). Current view was not altered.", params: ["capability": "explode", "scene_origin": (caps["scene_origin"] as? String) ?? "unknown"], rootOverride: rootOverride)
                return makePlan(actions: [["id": "twin.set_explode", "params": ["exploded": true], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
            }
            let reply = formatTemplate(key: "twin_explode_applied", language: lang, enDefault: "Activated exploded view on the 3D Digital Twin.", rootOverride: rootOverride)
            return makePlan(actions: [["id": "twin.set_explode", "params": ["exploded": true]]], intentMode: "apply", reply: reply)
        }
        if wantsCollapse || wantsReset {
            if (caps["supports_3d"] as? Bool) != true {
                let reply = formatTemplate(key: "twin_capability_unavailable", language: lang, enDefault: "This 3D action ({capability}) is unavailable for the active model ({scene_origin}).", params: ["capability": "reset_view", "scene_origin": (caps["scene_origin"] as? String) ?? "unknown"], rootOverride: rootOverride)
                return makePlan(actions: [["id": "twin.reset_view", "params": [:], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
            }
            let reply = formatTemplate(key: wantsReset ? "twin_reset_applied" : "twin_collapse_applied", language: lang, enDefault: "Reset 3D Digital Twin camera and restored assembled solid overview.", rootOverride: rootOverride)
            return makePlan(actions: [["id": "twin.reset_view", "params": [:]]], intentMode: "apply", reply: reply)
        }

        // 11. Explicit PDF / Manual / Datasheet Viewer (ANY phrasing: "show me the pdf", "open the manual", "show me the pdf on the pins page")
        let asksForPdfOrManual = norm.range(of: "\\b(pdf|manual|datasheet|spec\\s*sheet|document|documentation|pinout|wiring\\s*diagram|schematic)\\b", options: .regularExpression) != nil
        let wantsActionOnPdf = asksForPdfOrManual && norm.range(of: "\\b(show|open|view|display|pull\\s*up|bring\\s*up|go\\s*to|where|page|pagina|section|seccion|see|look|read|abre|abrir|muestr\\w*|ver|donde)\\b", options: .regularExpression) != nil
        let hasDipTwinFocus = norm.range(of: "\\b(digital\\s*twin|3d|twin|model|explode)\\b", options: .regularExpression) != nil
        if wantsActionOnPdf && !hasDipTwinFocus && norm.range(of: "\\b(?:page|pagina|pag\\.?)\\s*#?\\s*(\\d{1,3})\\b", options: .regularExpression) == nil {
            let descToUse = descriptor ?? ["scene_origin": "bundled_parametric", "documents": [["document_id": "tht02_manual_v1_1", "title": "TZ THT-02 User's Manual V1.1", "revision": "V1.1", "page_count": 9]]]
            let topicQuery: String
            let inferredPage: Int
            if norm.range(of: "\\b(dip|pin|pins|switch|switches|address|slave|open|unscrew)\\b", options: .regularExpression) != nil {
                topicQuery = "dip"; inferredPage = 5
            } else if norm.range(of: "\\b(wire|wires|wiring|cable|gland|color|power|ground|gnd|connect)\\b", options: .regularExpression) != nil {
                topicQuery = "wiring"; inferredPage = 4
            } else if norm.range(of: "\\b(calibr\\w*|spec|specs|accuracy|range|sht30)\\b", options: .regularExpression) != nil {
                topicQuery = "calibration"; inferredPage = 3
            } else if norm.range(of: "\\b(crc|frame|example|command|0x03)\\b", options: .regularExpression) != nil {
                topicQuery = "crc"; inferredPage = 7
            } else if norm.range(of: "\\b(register|registers|modbus|7fff|baud|0x00)\\b", options: .regularExpression) != nil {
                topicQuery = "registers"; inferredPage = 6
            } else if norm.range(of: "\\b(dimension|size|length|diameter|mount|flange|drawing)\\b", options: .regularExpression) != nil {
                topicQuery = "dimensions"; inferredPage = 9
            } else {
                topicQuery = "overview"; inferredPage = 1
            }
            let hit = FieldScanManualNavigator.lookupManualInDescriptor(query: topicQuery == "overview" ? "open page 1" : "where in the manual is \(topicQuery)", descriptor: descToUse)
            let pg = (hit["manual_page"] as? Int) ?? inferredPage
            let docId = (hit["document_id"] as? String) ?? "tht02_manual_v1_1"
            let docTitle = (hit["document_title"] as? String) ?? "TZ THT-02 User's Manual V1.1"
            let docRev = (hit["document_revision"] as? String) ?? "V1.1"
            let printed = (hit["printed_page"] as? String) ?? "\(pg)"
            let reply = formatTemplate(key: "manual_opened", language: lang, enDefault: "Opened {doc_title} ({doc_rev}), page {page} (printed {printed_page}).", params: ["doc_title": docTitle, "doc_rev": docRev, "page": "\(pg)", "printed_page": printed], rootOverride: rootOverride)
            return makePlan(
                actions: [["id": "manual.open_section", "params": ["topic": topicQuery, "page": pg, "document_id": docId, "printed_page": printed, "open_lightbox": true]]],
                intentMode: "show",
                reply: reply,
                extra: [
                    "manual_page": pg,
                    "printed_page": printed,
                    "document_id": docId,
                    "document_revision": docRev,
                    "open_manual": true,
                    "open_manual_lightbox": true,
                    "manual_section": hit["manual_section"] ?? NSNull(),
                    "citations": hit["citations"] ?? [["page": pg, "label": "Page \(pg)"]],
                ]
            )
        }

        // 11b. DIP / Pins Configuration & 3D Digital Twin Access (Twin + Manual Page 5 + Live DIP Macro — never mutates bus target)
        let wantsDipConfig = (norm.range(of: "\\b(dip|sw1|pin|pins|switch|switches|interruptor\\w*|rocker\\w*)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(configure|set|setup|guide|how|show|open|move|zoom|look|see|view|address|slave|modbus|twin|3d|configur\\w*|direccion|como|muestr\\w*)\\b", options: .regularExpression) != nil)
            || matchesLocalizedAlias("twin.show_dip")
        if wantsDipConfig {
            if let desc = descriptor, (desc["scene_origin"] as? String) == "catalog_glb" {
                let ambigCheck = FieldScanTwinController.prepareVisualAction(
                    query: raw,
                    descriptor: desc,
                    currentDipAddress: currentDipAddress,
                    sceneGeneration: sceneGeneration,
                    turnId: tid
                )
                if (ambigCheck["ambiguous"] as? Bool) == true {
                    let cPrompt = (ambigCheck["clarification_prompt"] as? String) ?? "Please specify which pin or component."
                    return makePlan(
                        actions: [],
                        intentMode: "explain",
                        reply: cPrompt,
                        ambiguous: true,
                        clarificationPrompt: cPrompt,
                        extra: ["candidate_part_ids": ambigCheck["candidate_part_ids"] ?? [], "twin_action": NSNull(), "twin_action_v1": NSNull()]
                    )
                }
            }
            var targetAddr = currentDipAddress
            if let rx = try? NSRegularExpression(pattern: "\\b(?:direccion|nodo|unidad)\\s*#?\\s*(\\d{1,3})\\b"),
               let m = rx.firstMatch(in: norm, range: NSRange(norm.startIndex..., in: norm)),
               let r = Range(m.range(at: 1), in: norm),
               let v = Int(norm[r]), (1...247).contains(v) {
                targetAddr = v
            } else if let rx2 = try? NSRegularExpression(pattern: "\\b(\\d{1,3})\\b"),
                      let m2 = rx2.firstMatch(in: norm, range: NSRange(norm.startIndex..., in: norm)),
                      let r2 = Range(m2.range(at: 1), in: norm),
                      let v2 = Int(norm[r2]), (1...247).contains(v2), v2 != 8, v2 != 485 {
                targetAddr = v2
            } else {
                targetAddr = FieldScanTwinController.parseRequestedSlaveId(query: norm, defaultSlaveId: currentDipAddress).slaveId
            }
            if (caps["supports_dip_pins"] as? Bool) != true {
                let reply = formatTemplate(key: "dip_reference_only", language: lang, enDefault: "Active model has no verified DIP switch pin map; remaining in reference mode without inventing pin positions.", rootOverride: rootOverride)
                return makePlan(actions: [["id": "twin.show_dip", "params": ["slave_id": targetAddr], "status_hint": "unavailable"]], intentMode: "explain", reply: reply)
            }
            let bits = FieldScanTwinController.addressToDipBits(targetAddr)
            let instr = FieldScanTwinController.formatDipInstructionEN(bits)
            let prepDip = FieldScanTwinController.prepareVisualAction(
                query: "Configure DIP switches for slave \(targetAddr)",
                descriptor: descriptor,
                zoneHint: "upper_barrel_dip",
                currentDipAddress: targetAddr,
                sceneGeneration: sceneGeneration,
                turnId: tid
            )
            let dipLookup = FieldScanManualNavigator.lookupManual(for: "DIP switch addressing page 5", language: "en")
            let openManualLb = asksForPdfOrManual
            let reply = formatTemplate(
                key: "dip_guide_applied",
                language: lang,
                enDefault: "Opened the 3D Digital Twin to the internal SW1 DIP-8 pins for Slave #{target_addr} ({instruction_summary}), loaded Manual Page 5, and opened the DIP macro view. Authorized Modbus polling target remains Slave #{authorized_slave}.",
                params: ["target_addr": "\(targetAddr)", "instruction_summary": instr, "authorized_slave": "\(authorizedBusSlaveId)"],
                rootOverride: rootOverride
            )
            return makePlan(
                actions: [
                    ["id": "twin.show_dip", "params": ["slave_id": targetAddr, "dip_bits": bits, "explode": true]],
                    ["id": "manual.open_section", "params": ["topic": "dip_switch_opening", "page": 5, "open_lightbox": openManualLb]],
                    ["id": "camera.show_dip_macro", "params": ["visible": true]],
                ],
                intentMode: "propose",
                reply: reply,
                extra: [
                    "start_dip_guidance": true,
                    "target_dip_address": targetAddr,
                    "dip_bits": bits,
                    "simulated_visual_dip_address": targetAddr,
                    "twin_action": prepDip["twin_action"] ?? NSNull(),
                    "twin_action_v1": prepDip["twin_action_v1"] ?? NSNull(),
                    "explode_pcb": true,
                    "focus_dip": true,
                    "manual_page": 5,
                    "open_manual": true,
                    "open_manual_lightbox": openManualLb,
                    "manual_section": dipLookup.sectionDict ?? NSNull(),
                    "citations": [["page": 5, "label": "Page 5 · 2-Step Opening & DIP-8 Switch (Ex. 176)"]],
                ]
            )
        }

        // 12. Manual Page / Topic Lookup (EN + ES)
        if let rx = try? NSRegularExpression(pattern: "\\b(?:page|pagina|pag\\.?)\\s*#?\\s*(\\d{1,3})\\b"),
           let m = rx.firstMatch(in: norm, range: NSRange(norm.startIndex..., in: norm)),
           let r = Range(m.range(at: 1), in: norm),
           let reqP = Int(norm[r]) {
            let descToUse = descriptor ?? ["scene_origin": "bundled_parametric", "documents": [["document_id": "tht02_manual_v1_1", "title": "TZ THT-02 User's Manual V1.1", "revision": "V1.1", "page_count": 9]]]
            let hit = FieldScanManualNavigator.lookupManualInDescriptor(query: "open page \(reqP)", descriptor: descToUse)
            if (hit["page_out_of_range"] as? Bool) == true {
                let maxP = (hit["max_page"] as? Int) ?? 9
                let docTitle = (hit["document_title"] as? String) ?? (hit["document_id"] as? String) ?? "Manual"
                let reply = formatTemplate(key: "manual_page_missing", language: lang, enDefault: "Page {requested_page} is outside the valid page range (1..{max_page}) of {doc_title}.", params: ["requested_page": "\(reqP)", "max_page": "\(maxP)", "doc_title": docTitle], rootOverride: rootOverride)
                return makePlan(actions: [["id": "manual.open_page", "params": ["page": reqP], "status_hint": "unavailable"]], intentMode: "explain", reply: reply, extra: ["page_out_of_range": true, "error_code": "PAGE_OUT_OF_RANGE"])
            }
            let docId = (hit["document_id"] as? String) ?? "tht02_manual_v1_1"
            let docTitle = (hit["document_title"] as? String) ?? "TZ THT-02 User's Manual V1.1"
            let docRev = (hit["document_revision"] as? String) ?? "V1.1"
            let printed = (hit["printed_page"] as? String) ?? "\(reqP)"
            let reply = formatTemplate(key: "manual_opened", language: lang, enDefault: "Opened {doc_title} ({doc_rev}), physical page {page} (printed {printed_page}).", params: ["doc_title": docTitle, "doc_rev": docRev, "page": "\(reqP)", "printed_page": printed], rootOverride: rootOverride)
            return makePlan(
                actions: [["id": "manual.open_page", "params": ["page": reqP, "document_id": docId, "printed_page": printed, "open_lightbox": true]]],
                intentMode: "show",
                reply: reply,
                extra: [
                    "manual_page": reqP,
                    "printed_page": printed,
                    "document_id": docId,
                    "document_revision": docRev,
                    "open_manual": true,
                    "open_manual_lightbox": true,
                    "manual_section": hit["manual_section"] ?? NSNull(),
                    "citations": hit["citations"] ?? [],
                ]
            )
        }

        if norm.range(of: "\\b(seccion|section|manual|datasheet)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(dip|calibr\\w*|cable\\w*|wiring|registr\\w*|crc)\\b", options: .regularExpression) != nil {
            let topicQuery = norm.contains("dip") ? "dip" : (norm.contains("calibr") ? "calibration" : ((norm.contains("cable") || norm.contains("wiring")) ? "wiring" : (norm.contains("crc") ? "crc" : "registers")))
            let descToUse = descriptor ?? ["scene_origin": "bundled_parametric", "documents": [["document_id": "tht02_manual_v1_1", "title": "TZ THT-02 User's Manual V1.1", "revision": "V1.1", "page_count": 9]]]
            let hit = FieldScanManualNavigator.lookupManualInDescriptor(query: "where in the manual is \(topicQuery)", descriptor: descToUse)
            if (hit["matched"] as? Bool) == true, let pg = hit["manual_page"] as? Int {
                let docId = (hit["document_id"] as? String) ?? "tht02_manual_v1_1"
                let docTitle = (hit["document_title"] as? String) ?? "TZ THT-02 User's Manual V1.1"
                let docRev = (hit["document_revision"] as? String) ?? "V1.1"
                let printed = (hit["printed_page"] as? String) ?? "\(pg)"
                let reply = formatTemplate(key: "manual_opened", language: lang, enDefault: "Opened {doc_title} ({doc_rev}), physical page {page} (printed {printed_page}).", params: ["doc_title": docTitle, "doc_rev": docRev, "page": "\(pg)", "printed_page": printed], rootOverride: rootOverride)
                return makePlan(
                    actions: [["id": "manual.open_section", "params": ["topic": topicQuery, "page": pg, "document_id": docId, "printed_page": printed, "open_lightbox": true]]],
                    intentMode: "show",
                    reply: reply,
                    extra: [
                        "manual_page": pg,
                        "printed_page": printed,
                        "document_id": docId,
                        "document_revision": docRev,
                        "open_manual": true,
                        "open_manual_lightbox": true,
                        "manual_section": hit["manual_section"] ?? NSNull(),
                        "citations": hit["citations"] ?? [],
                    ]
                )
            }
        }

        // 13. Part Focus on Bundled or GLB Twin (natural English verbs: show, focus, zoom, inspect, highlight, point to, move to)
        if norm.range(of: "\\b(show|focus|zoom|inspect|highlight|point|move|look\\s+at|see|open|enfoc\\w*|muestr\\w*)\\b", options: .regularExpression) != nil {
            let prep = FieldScanTwinController.prepareVisualAction(
                query: raw,
                descriptor: descriptor,
                currentDipAddress: currentDipAddress,
                sceneGeneration: sceneGeneration,
                turnId: tid
            )
            if (prep["ambiguous"] as? Bool) == true {
                let prompt = (prep["clarification_prompt"] as? String) ?? "Please specify which component."
                return makePlan(actions: [], intentMode: "explain", reply: prompt, ambiguous: true, clarificationPrompt: prompt, extra: ["candidate_part_ids": prep["candidate_part_ids"] ?? []])
            }
            if let v1 = prep["twin_action_v1"] as? [String: Any], let pid = v1["part_id"] as? String {
                let lbl = (v1["callout_title"] as? String) ?? pid
                let reply = formatTemplate(key: "twin_focus_applied", language: lang, enDefault: "Focused {part_label} on the 3D Digital Twin.", params: ["part_label": lbl], rootOverride: rootOverride)
                return makePlan(actions: [["id": "twin.focus_part", "params": ["part_id": pid, "view_id": (v1["view_id"] as? String) ?? "isometric_home"]]], intentMode: "apply", reply: reply, extra: ["twin_action": prep["twin_action"] ?? NSNull(), "twin_action_v1": v1])
            }
            if let ta = prep["twin_action"] as? [String: Any], let fz = ta["focus_zone"] as? String {
                let lbl = (ta["callout_title"] as? String) ?? fz
                let reply = formatTemplate(key: "twin_focus_applied", language: lang, enDefault: "Focused {part_label} on the 3D Digital Twin.", params: ["part_label": lbl], rootOverride: rootOverride)
                return makePlan(actions: [["id": "twin.focus_part", "params": ["part_id": fz, "view_id": (ta["camera_pose"] as? String) ?? "overview"]]], intentMode: "apply", reply: reply, extra: ["twin_action": ta, "twin_action_v1": prep["twin_action_v1"] ?? NSNull()])
            }
        }

        // If workspace was explicitly cleared to empty_workspace, stay honest rather than inventing sensor data
        if (caps["scene_origin"] as? String) == "empty_workspace" {
            return makePlan(
                actions: [["id": "catalog.identify_new_sensor", "params": ["capture_photo": false]]],
                intentMode: "explain",
                reply: "No sensor is loaded on this iPad right now. Point the camera at your sensor and tell me its manufacturer and model — for example, 'This is a TZONE TZ THT-02' — to fetch its official manual and 3D Digital Twin from FieldScan Cloud."
            )
        }

        return nil
    }

    /// Parses spoken sensor identification phrases like "This is a TZONE TZ THT-02" or "Download manual for TZONE THT-002".
    private static func parseSpokenSensorIdentity(_ raw: String) -> (manufacturer: String, model: String, variant: String?, autoSubmit: Bool)? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let norm = normalizeASCIILower(trimmed)

        let autoTriggers = [
            "download manual for ", "fetch manual for ", "get manual for ",
            "onboard ", "process sensor ", "load from cloud ", "search cloud for ",
        ]
        var autoSubmit = false
        var tail = ""
        for pfx in autoTriggers {
            if let r = norm.range(of: pfx) {
                tail = String(norm[r.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
                autoSubmit = true
                break
            }
        }
        if tail.isEmpty {
            let idPatterns = [
                "\\b(?:this sensor is|this is|it is|it's|sensor is|model is|the sensor is|the model is)\\s+(?:a\\s+|an\\s+|the\\s+)?(.+)$",
                "\\b(?:brand|manufacturer)\\s+([a-z0-9\\-\\s]{2,40})\\s+(?:model)\\s+([a-z0-9\\-\\s]{2,40})$",
            ]
            for pat in idPatterns {
                if let rx = try? NSRegularExpression(pattern: pat, options: [.caseInsensitive]),
                   let m = rx.firstMatch(in: norm, range: NSRange(norm.startIndex..., in: norm)) {
                    if m.numberOfRanges >= 3,
                       let r1 = Range(m.range(at: 1), in: norm),
                       let r2 = Range(m.range(at: 2), in: norm) {
                        tail = "\(norm[r1]) \(norm[r2])"
                    } else if let r1 = Range(m.range(at: 1), in: norm) {
                        tail = String(norm[r1]).trimmingCharacters(in: .whitespacesAndNewlines)
                    }
                    break
                }
            }
        }
        // Also recognize direct spoken THT-02 / THT-002 / THT-03R identification phrases when short
        if tail.isEmpty && norm.range(of: "\\b(tzone|t-zone|tht[\\s\\-]?0?0?2|tht[\\s\\-]?0?3r?)\\b", options: .regularExpression) != nil
            && norm.range(of: "\\b(dip|pusr|page|wiring|cable|register|baud|explode|xray|x-ray|what|how|where|why)\\b", options: .regularExpression) == nil
            && norm.count <= 48 {
            tail = norm
        }
        guard !tail.isEmpty else { return nil }

        // Strip trailing conversational filler words
        tail = tail.replacingOccurrences(of: "\\b(sensor|transmitter|probe|please|now|in cloud|from cloud)\\b", with: "", options: .regularExpression)
            .replacingOccurrences(of: "[.,!?;:]+$", with: "", options: .regularExpression)
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard tail.count >= 3 else { return nil }

        // Normalize common spoken ASR variants for TZONE THT-02 cleanly while remaining 100% generic for all other brands/models
        if tail.range(of: "\\b(tht[\\s\\-]?0?0?2|tht\\s*zero\\s*two|tht\\s*two)\\b", options: .regularExpression) != nil {
            return (manufacturer: "TZONE", model: "TZ THT-02", variant: "v1_1_rs485", autoSubmit: autoSubmit)
        }
        if tail.range(of: "\\b(tht[\\s\\-]?0?3r)\\b", options: .regularExpression) != nil {
            return (manufacturer: "TZONE", model: "TZ THT-03R", variant: nil, autoSubmit: autoSubmit)
        }

        // Generic split: first token = manufacturer, remaining tokens = model
        let tokens = tail.split(separator: " ").map(String.init)
        guard tokens.count >= 2 else {
            return (manufacturer: "UNKNOWN", model: tail.uppercased(), variant: nil, autoSubmit: autoSubmit)
        }
        let mfg = tokens[0].replacingOccurrences(of: "t-zone", with: "TZONE").uppercased()
        let mod = tokens.dropFirst().joined(separator: " ").uppercased()
        return (manufacturer: mfg, model: mod, variant: nil, autoSubmit: autoSubmit)
    }

    // MARK: - Live LLM Tool-Calling Bridge (`[[ACTION:action_id|{json}]]`)

    /// Builds a compact live tool manifest injected into the local LLM system prompt so the model
    /// can trigger ANY registered UI screen, PDF page, or 3D Digital Twin movement for ANY phrasing.
    public func buildLLMToolPromptBlock(descriptor: [String: Any]?) -> String {
        let caps = Self.computeSceneCapabilities(descriptor: descriptor)
        let partIds = (caps["part_ids"] as? [String]) ?? ["strainer_head", "upper_seal_ring", "upper_barrel_dip", "mounting_flange", "lower_barrel_rs485", "waterproof_gland_leads"]
        let maxPages = ((descriptor?["documents"] as? [[String: Any]])?.compactMap { $0["page_count"] as? Int }.max()) ?? 9
        return """
        DIRECT UI, PDF & 3D DIGITAL TWIN CONTROL:
        You directly control the FieldScan iPad interface, 3D Digital Twin, live camera, and OEM PDF manual.
        NEVER tell the user "I cannot open screens", "I cannot show the PDF", or "I cannot move the 3D model".
        Whenever the user asks to show, open, view, move, zoom, rotate, explode, X-ray, inspect a part, open the PDF/manual, or navigate to any screen, put one or more directives at the START of your reply:
        [[ACTION:<action_id>|<json_params>]]
        Allowed actions:
        - manual.open_page {"page":1..\(maxPages),"open_lightbox":true} (P1 overview, P3 specs/cal, P4 wiring, P5 DIP-8 pins, P6 Modbus regs, P7 CRC/0x03, P9 dimensions)
        - manual.close {}
        - twin.show_dip {"slave_id":1} (opens 3D housing and zooms into DIP-8 pins)
        - twin.focus_part {"part_id":"<one of: \(partIds.joined(separator: ", "))>"}
        - twin.set_explode {"exploded":true|false}
        - twin.set_render_mode {"mode":"wireframe"|"solid"}
        - twin.rotate_view {"direction":"left"|"right"|"front"|"back"|"top"|"bottom"|"zoom_in"|"zoom_out"|"spin"}
        - twin.reset_view {}
        - config.open_pusr {} | config.show_pusr_field {"field":"host"|"port"|"address"}
        - config.open_catalog {} | config.show_cloud_settings {} | config.open_tools {} | config.open_chat {}
        - config.open_calibration {} | config.open_escalation {} | config.open_app_settings {}
        - camera.show_live {} | camera.show_dip_macro {"visible":true} | camera.capture_evidence {}
        - session.open_history {} | session.prepare_dossier {}
        - catalog.identify_new_sensor {"capture_photo":true} | catalog.clear_sensor {}
        After the [[ACTION:...]] tag(s), write 1 to 2 concise natural English sentences confirming what you did.
        """
    }

    /// Parses and validates `[[ACTION:action_id|{...}]]` directives emitted by the local LLM.
    /// Rejects any unregistered action ID and returns clean spoken/displayed text + validated actions.
    public func parseLLMActionDirectives(from rawReply: String) -> (cleanText: String, actions: [[String: Any]]) {
        let allowedIds = Set(buildActionRegistry().compactMap { $0["id"] as? String })
        let pattern = "\\[\\[ACTION:([a-z0-9_\\.]+)(?:\\|(\\{[^\\]]*\\}))?\\]\\]"
        guard let rx = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return (rawReply.trimmingCharacters(in: .whitespacesAndNewlines), [])
        }
        let nsRange = NSRange(rawReply.startIndex..., in: rawReply)
        let matches = rx.matches(in: rawReply, range: nsRange)
        var actions: [[String: Any]] = []
        for m in matches {
            guard let idRange = Range(m.range(at: 1), in: rawReply) else { continue }
            let aid = String(rawReply[idRange]).lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            guard allowedIds.contains(aid) else { continue }
            var params: [String: Any] = [:]
            if m.range(at: 2).location != NSNotFound,
               let pRange = Range(m.range(at: 2), in: rawReply) {
                let pStr = String(rawReply[pRange])
                if let pData = pStr.data(using: .utf8),
                   let pObj = (try? JSONSerialization.jsonObject(with: pData)) as? [String: Any] {
                    params = pObj
                }
            }
            if aid == "manual.open_page" || aid == "manual.open_section" {
                params["open_lightbox"] = true
            }
            actions.append(["id": aid, "params": params])
        }
        let stripped = rx.stringByReplacingMatches(in: rawReply, range: nsRange, withTemplate: "")
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return (stripped.isEmpty ? "Done — updated the display." : stripped, actions)
    }
}
