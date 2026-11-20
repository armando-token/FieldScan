import Foundation

/// Modular 3D Digital Twin Interactive Controller (`twin_action` Contract) for iPad Air M4.
///
/// Translates natural English voice/chat requests ("show me the pins", "show me how the cable connects
/// at the back", "show me the main sensor probe", "configure DIP switches for slave 3", "show X-ray view")
/// into deterministic Three.js 3D Digital Twin camera, explosion, pin-rocker, and callout commands.
public enum FieldScanTwinController {

    private static let dipWeights = [128, 64, 32, 16, 8, 4, 2, 1]

    public static func addressToDipBits(_ address: Int) -> [Int] {
        let clamped = max(0, min(255, address))
        return dipWeights.map { (clamped & $0) != 0 ? 1 : 0 }
    }

    public static func parseRequestedSlaveId(query: String, defaultSlaveId: Int = 1) -> (slaveId: Int, explicit: Bool) {
        let q = query.lowercased()
        let pattern = "\\b(?:slave|address|id|node)\\s*#?\\s*(\\d{1,3})\\b|\\bto\\s+(\\d{1,3})\\b"
        if let rx = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) {
            let matches = rx.matches(in: q, range: NSRange(q.startIndex..., in: q))
            for m in matches {
                for grp in [1, 2] {
                    if m.range(at: grp).location != NSNotFound,
                       let r = Range(m.range(at: grp), in: q),
                       let v = Int(q[r]), (1...247).contains(v) {
                        return (v, true)
                    }
                }
            }
        }
        if q.contains("176") {
            return (176, true)
        }
        return (max(1, min(247, defaultSlaveId)), false)
    }

    public static func formatDipInstructionEN(_ bits: [Int]) -> String {
        let onPins = bits.enumerated().compactMap { $0.element == 1 ? "\($0.offset + 1)" : nil }
        let offPins = bits.enumerated().compactMap { $0.element == 0 ? "\($0.offset + 1)" : nil }
        if onPins.isEmpty { return "Set all Pins 1..8 OFF" }
        if offPins.isEmpty { return "Set all Pins 1..8 ON" }
        return "Set Pin \(onPins.joined(separator: ", ")) ON and Pin \(offPins.joined(separator: ", ")) OFF"
    }

    public static func resolveTwinAction(
        query: String,
        zoneHint: String? = nil,
        currentDipAddress: Int = 1
    ) -> [String: Any]? {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if q.isEmpty && (zoneHint == nil || zoneHint!.isEmpty) {
            return nil
        }

        // 1. Close / reassemble / reset 3D view
        let resetPhrases = [
            "close the housing", "close housing", "close the sensor", "reassemble",
            "reset 3d", "reset view", "full view", "overview of the sensor",
        ]
        if resetPhrases.contains(where: { q.contains($0) }) {
            return [
                "action": "reset_view",
                "focus_zone": NSNull(),
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "solid",
                "camera_pose": "overview",
                "callout_title": "1:1 PARAMETRIC DIGITAL TWIN (140.0 × Ø16.0 mm)",
                "callout_body": "Housing closed in nominal isometric pose. Ask to inspect any sub-assembly, rear wiring, or DIP-8 pins.",
            ]
        }

        // 2. X-Ray / translucent internal view
        if ["x-ray", "xray", "wireframe", "see inside", "translucent", "internal layout"].contains(where: { q.contains($0) }) {
            return [
                "action": "xray_view",
                "focus_zone": "lower_barrel_rs485",
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "wireframe",
                "camera_pose": "overview",
                "callout_title": "X-RAY INTERNAL INSPECTION MODE",
                "callout_body": "Translucent housing active: showing internal SHT30 probe tip, SW1 DIP-8 PCB, and RS-485 transceiver stage.",
            ]
        }

        // 3. SW1 DIP-8 switches / pins / Slave ID configuration
        let dipTerms = [
            "pin", "pins", "dip", "switch", "switches", "rocker", "rockers",
            "slave", "address", "unscrew", "open the sensor", "open the housing",
            "open housing", "expose pcb", "pcb",
        ]
        if zoneHint == "upper_barrel_dip" || dipTerms.contains(where: { q.contains($0) }) {
            let (targetAddr, _) = parseRequestedSlaveId(query: q, defaultSlaveId: currentDipAddress)
            let bits = addressToDipBits(targetAddr)
            let onPins = bits.enumerated().compactMap { $0.element == 1 ? "\($0.offset + 1)" : nil }
            let pinsStr = onPins.isEmpty ? "All OFF" : "Pin \(onPins.joined(separator: ", ")) ON"
            let instr = formatDipInstructionEN(bits)
            return [
                "action": "configure_dip",
                "focus_zone": "upper_barrel_dip",
                "explode_pcb": true,
                "open_dip_pip": true,
                "render_mode": "solid",
                "camera_pose": "dip_closeup",
                "target_slave_id": targetAddr,
                "dip_bits": bits,
                "manual_page": 5,
                "callout_title": "SW1 DIP-8 INTERACTIVE GUIDE · SLAVE #\(targetAddr) (\(pinsStr))",
                "callout_body": "\(instr) (Page 5). Step 1: loosen rear gland nut first. Step 2: unscrew middle barrel.",
            ]
        }

        // 4. Rear cable / 4-wire connection / waterproof gland
        let rearTerms = [
            "cable", "wire", "wires", "wiring", "lead", "leads", "gland",
            "back of the sensor", "at the back", "rear", "connect the sensor",
            "how it connects", "how to connect", "cable connects", "color code",
            "power wire", "gnd", "rs-485 a", "rs485 a", "terminal", "frayed",
        ]
        if zoneHint == "waterproof_gland_leads" || rearTerms.contains(where: { q.contains($0) }) {
            return [
                "action": "focus_zone",
                "focus_zone": "waterproof_gland_leads",
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "solid",
                "camera_pose": "rear_wiring",
                "callout_title": "REAR GLAND & 4-WIRE RS-485 CONNECTION (Page 4)",
                "callout_body": "Red = V+ (5–24V DC) · Black = Common GND · Yellow = RS-485 A+ · Green = RS-485 B-. Bond Black GND & shield to converter ground; tighten dome nut last.",
            ]
        }

        // 5. Main sensing head / SHT30 probe / strainer tip
        let tipTerms = [
            "main sensor", "sensing element", "probe", "tip", "front",
            "head", "strainer", "filter", "sintered", "sht30", "sht3x", "7fff", "patch",
        ]
        if zoneHint == "strainer_head" || tipTerms.contains(where: { q.contains($0) }) {
            return [
                "action": "focus_zone",
                "focus_zone": "strainer_head",
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "solid",
                "camera_pose": "tip_closeup",
                "callout_title": "MAIN SHT30 SENSING PROBE & SS316L STRAINER (Pages 1 & 3)",
                "callout_body": "Slotted stainless steel cap protecting the sintered filter and SHT30 CMOSens die (±0.3 °C, ±2 %RH). Orient tip into airflow away from direct water spray.",
            ]
        }

        // 6. Mounting bracket / flange / installation
        let mountTerms = [
            "mount", "mounting", "install", "placed", "place it", "bracket",
            "flange", "clip", "ear", "screw", "hole", "wall", "duct",
        ]
        if zoneHint == "mounting_flange" || mountTerms.contains(where: { q.contains($0) }) {
            return [
                "action": "focus_zone",
                "focus_zone": "mounting_flange",
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "solid",
                "camera_pose": "flange_closeup",
                "callout_title": "SNAP-ON MOUNTING FLANGE (2× Ø4.2 mm Holes · 32 mm Pitch)",
                "callout_body": "Snap saddle bracket onto the Ø16.0 mm barrel and fasten with M4 screws on 32.0 mm centers (Pages 1 & 9).",
            ]
        }

        // 7. Upper O-ring environmental seal
        if zoneHint == "upper_seal_ring" || zoneHint == "seal_ring" || ["o-ring", "oring", "seal", "gasket", "collar", "elastomer"].contains(where: { q.contains($0) }) {
            return [
                "action": "focus_zone",
                "focus_zone": "upper_seal_ring",
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "solid",
                "camera_pose": "seal_closeup",
                "callout_title": "UPPER ELASTOMER O-RING SEAL (z = +40 mm)",
                "callout_body": "Weatherproof perimeter O-ring isolating internal PCB electronics from duct moisture (-40..+85 °C).",
            ]
        }

        // 8. Lower barrel / RS-485 transceiver stage
        if zoneHint == "lower_barrel_rs485" || zoneHint == "middle_barrel" || ["transceiver", "lower barrel", "middle barrel", "regulator"].contains(where: { q.contains($0) }) {
            return [
                "action": "focus_zone",
                "focus_zone": "lower_barrel_rs485",
                "explode_pcb": false,
                "open_dip_pip": false,
                "render_mode": "solid",
                "camera_pose": "barrel_closeup",
                "callout_title": "LOWER BARREL & RS-485 TRANSCEIVER STAGE",
                "callout_body": "Houses the 5–24V DC regulator and half-duplex Modbus-RTU transceiver (9600 bps 8N1 default).",
            ]
        }

        return nil
    }

    private static let wordPinNumberMap: [String: Int] = [
        "1": 1, "one": 1, "2": 2, "two": 2, "3": 3, "three": 3, "4": 4, "four": 4,
        "5": 5, "five": 5, "6": 6, "six": 6, "7": 7, "seven": 7, "8": 8, "eight": 8,
    ]

    private static func extractSinglePinReference(_ query: String) -> Int? {
        let pattern = "\\bpin\\s*#?\\s*(1|2|3|4|5|6|7|8|one|two|three|four|five|six|seven|eight)\\b"
        guard let rx = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]),
              let m = rx.firstMatch(in: query, range: NSRange(query.startIndex..., in: query)),
              let r = Range(m.range(at: 1), in: query) else {
            return nil
        }
        return wordPinNumberMap[String(query[r]).lowercased()]
    }

    /// Context-aware `twin_action_v1` & ambiguity resolver (`M4-VOICE-01..03`, `Section 5.4`).
    public static func prepareVisualAction(
        query: String,
        descriptor: [String: Any]?,
        zoneHint: String? = nil,
        currentDipAddress: Int = 1,
        sceneGeneration: Int = 1,
        turnId: String? = nil
    ) -> [String: Any] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let tid = turnId ?? ("turn-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased())
        let ctx = (descriptor?["context"] as? [String: Any]) ?? [:]
        let manifestSha = (ctx["manifest_sha256"] as? String) ?? "bundle-tzone-tht02-v2.1"
        let sceneOrigin = (descriptor?["scene_origin"] as? String) ?? "bundled_parametric"

        if sceneOrigin == "docs_only_no_3d" {
            return [
                "ambiguous": false,
                "clarification_required": false,
                "clarification_prompt": NSNull(),
                "candidate_part_ids": [],
                "twin_action": NSNull(),
                "twin_action_v1": NSNull(),
                "turn_id": tid,
                "scene_generation": sceneGeneration,
                "manifest_sha256": manifestSha,
            ]
        }

        let hasDipQualifier = ["dip", "switch", "switches", "sw1", "rocker", "slave", "address", "binary"].contains(where: { q.contains($0) })
        let hasRearQualifier = ["rear", "connector", "m12", "plug", "cable", "wire", "wiring", "terminal", "gland", "back"].contains(where: { q.contains($0) })

        if sceneOrigin == "catalog_glb", let twin = descriptor?["twin"] as? [String: Any] {
            let parts = (twin["parts"] as? [[String: Any]]) ?? []
            let actions = (twin["actions"] as? [[String: Any]]) ?? []

            // 1. Ambiguous single-pin check (`M4-VOICE-03`: e.g. `dip.pin_1` vs `rear.pin_1`)
            if let pinNum = extractSinglePinReference(q) {
                let groupKey = "pin_\(pinNum)"
                let matchingPinParts = parts.filter {
                    (($0["ambiguous_group"] as? String) == groupKey)
                        || ((($0["part_id"] as? String) ?? "").hasSuffix(".pin_\(pinNum)"))
                }
                if matchingPinParts.count > 1 && !hasDipQualifier && !hasRearQualifier {
                    let labels = matchingPinParts.map {
                        "\(($0["label"] as? String) ?? "") (\(($0["part_id"] as? String) ?? ""))"
                    }
                    let cands = matchingPinParts.compactMap { $0["part_id"] as? String }
                    return [
                        "ambiguous": true,
                        "clarification_required": true,
                        "clarification_prompt": "Ambiguous component reference for Pin \(pinNum). Please specify which Pin \(pinNum) to highlight: \(labels.joined(separator: " or "))?",
                        "candidate_part_ids": cands,
                        "twin_action": NSNull(),
                        "twin_action_v1": NSNull(),
                        "turn_id": tid,
                        "scene_generation": sceneGeneration,
                        "manifest_sha256": manifestSha,
                    ]
                }
                if matchingPinParts.count >= 1 {
                    let chosen: [String: Any]? = {
                        if hasDipQualifier {
                            return matchingPinParts.first(where: { (($0["part_id"] as? String) ?? "").contains("dip") }) ?? matchingPinParts.first
                        }
                        if hasRearQualifier {
                            return matchingPinParts.first(where: { (($0["part_id"] as? String) ?? "").contains("rear") }) ?? matchingPinParts.first
                        }
                        return matchingPinParts.count == 1 ? matchingPinParts.first : nil
                    }()
                    if let cp = chosen, let pid = cp["part_id"] as? String {
                        let lbl = (cp["label"] as? String) ?? pid
                        let sum = (cp["summary"] as? String) ?? ""
                        let cit = cp["citation_id"] as? String
                        let viewId = pid.contains("dip") ? "open_dip" : (pid.contains("rear") ? "rear_connector" : "isometric_home")
                        let v1: [String: Any] = [
                            "schema": "twin_action_v1",
                            "kind": "highlight_part",
                            "part_id": pid,
                            "view_id": viewId,
                            "citation_id": cit ?? NSNull(),
                            "simulated_state": NSNull(),
                            "callout_title": lbl.uppercased(),
                            "callout_body": sum,
                            "turn_id": tid,
                            "scene_generation": sceneGeneration,
                            "manifest_sha256": manifestSha,
                            "requires_scene_ready": true,
                        ]
                        let legacy: [String: Any] = [
                            "action": "focus_part",
                            "part_id": pid,
                            "view_id": viewId,
                            "explode_pcb": viewId == "open_dip",
                            "callout_title": lbl.uppercased(),
                            "callout_body": sum,
                        ]
                        return [
                            "ambiguous": false,
                            "clarification_required": false,
                            "clarification_prompt": NSNull(),
                            "candidate_part_ids": [],
                            "twin_action": legacy,
                            "twin_action_v1": v1,
                            "turn_id": tid,
                            "scene_generation": sceneGeneration,
                            "manifest_sha256": manifestSha,
                        ]
                    }
                }
            }

            // 2. Match explicit `twin.actions.json` triggers OR linked part aliases/labels (`PR #4` & `PR #5` parity)
            let resetPhrasesV1 = ["reset view", "reset 3d", "close housing", "close the housing", "close the sensor", "reassemble", "default overview", "full view"]
            if resetPhrasesV1.contains(where: { q.contains($0) }),
               let resetAct = actions.first(where: { ($0["kind"] as? String) == "reset_view" }) {
                let vid = (resetAct["view_id"] as? String) ?? "default_overview"
                let v1: [String: Any] = [
                    "schema": "twin_action_v1",
                    "kind": "reset_view",
                    "part_id": resetAct["part_id"] ?? NSNull(),
                    "view_id": vid,
                    "citation_id": resetAct["citation_id"] ?? NSNull(),
                    "simulated_state": NSNull(),
                    "callout_title": "ASSEMBLED OVERVIEW",
                    "callout_body": "Resetting verified 3D Digital Twin to assembled overview.",
                    "turn_id": tid,
                    "scene_generation": sceneGeneration,
                    "manifest_sha256": manifestSha,
                    "requires_scene_ready": true,
                ]
                let legacy: [String: Any] = [
                    "action": "reset_view",
                    "part_id": resetAct["part_id"] ?? NSNull(),
                    "view_id": vid,
                    "explode_pcb": false,
                    "callout_title": "ASSEMBLED OVERVIEW",
                    "callout_body": "Resetting verified 3D Digital Twin to assembled overview.",
                ]
                return [
                    "ambiguous": false,
                    "clarification_required": false,
                    "clarification_prompt": NSNull(),
                    "candidate_part_ids": [],
                    "twin_action": legacy,
                    "twin_action_v1": v1,
                    "turn_id": tid,
                    "scene_generation": sceneGeneration,
                    "manifest_sha256": manifestSha,
                ]
            }

            for act in actions {
                let kind = (act["kind"] as? String) ?? "focus_part"
                let triggers = ((act["triggers"] as? [String]) ?? []).map { $0.lowercased() }.filter { !$0.isEmpty }
                if kind == "reset_view" && triggers.isEmpty {
                    continue
                }
                let pid = act["part_id"] as? String
                let matchedPart = parts.first(where: { ($0["part_id"] as? String) == pid })
                var partTerms: [String] = []
                if let mp = matchedPart {
                    for al in ((mp["aliases"] as? [String]) ?? []) {
                        let clean = al.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                        if !clean.isEmpty { partTerms.append(clean) }
                    }
                    for key in ["label", "legacy_zone_id"] {
                        if let v = (mp[key] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(), !v.isEmpty {
                            partTerms.append(v)
                        }
                    }
                }
                if triggers.contains(where: { q.contains($0) })
                    || (pid != nil && q.contains(pid!.lowercased()))
                    || partTerms.contains(where: { q.contains($0) }) {
                    let vid = (act["view_id"] as? String) ?? "isometric_home"
                    let cit = act["citation_id"] as? String
                    let lbl = (matchedPart?["label"] as? String) ?? (pid ?? vid)
                    let sum = (matchedPart?["summary"] as? String) ?? "Verified 3D catalog twin inspection view."
                    let v1: [String: Any] = [
                        "schema": "twin_action_v1",
                        "kind": kind,
                        "part_id": pid ?? NSNull(),
                        "view_id": vid,
                        "citation_id": cit ?? NSNull(),
                        "simulated_state": NSNull(),
                        "callout_title": lbl.uppercased(),
                        "callout_body": sum,
                        "turn_id": tid,
                        "scene_generation": sceneGeneration,
                        "manifest_sha256": manifestSha,
                        "requires_scene_ready": true,
                    ]
                    let legacy: [String: Any] = [
                        "action": kind == "reset_view" ? "reset_view" : "focus_part",
                        "part_id": pid ?? NSNull(),
                        "view_id": vid,
                        "explode_pcb": vid == "open_dip",
                        "callout_title": lbl.uppercased(),
                        "callout_body": sum,
                    ]
                    return [
                        "ambiguous": false,
                        "clarification_required": false,
                        "clarification_prompt": NSNull(),
                        "candidate_part_ids": [],
                        "twin_action": legacy,
                        "twin_action_v1": v1,
                        "turn_id": tid,
                        "scene_generation": sceneGeneration,
                        "manifest_sha256": manifestSha,
                    ]
                }
            }

            // 3. Direct part_id / label / aliases match in `twin.parts.json`
            for p in parts {
                let pid = (p["part_id"] as? String) ?? ""
                let lbl = (p["label"] as? String) ?? pid
                let aliases = ((p["aliases"] as? [String]) ?? []).map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty }
                let legacyZ = ((p["legacy_zone_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                if !pid.isEmpty && (
                    q.contains(pid.lowercased())
                    || q.contains(lbl.lowercased())
                    || (!legacyZ.isEmpty && q.contains(legacyZ))
                    || aliases.contains(where: { q.contains($0) })
                ) {
                    let vid = pid.contains("dip") ? "open_dip" : (pid.contains("rear") ? "rear_connector" : (pid.contains("probe") ? "probe_tip" : "isometric_home"))
                    let sum = (p["summary"] as? String) ?? ""
                    let v1: [String: Any] = [
                        "schema": "twin_action_v1",
                        "kind": "focus_part",
                        "part_id": pid,
                        "view_id": vid,
                        "citation_id": p["citation_id"] ?? NSNull(),
                        "simulated_state": NSNull(),
                        "callout_title": lbl.uppercased(),
                        "callout_body": sum,
                        "turn_id": tid,
                        "scene_generation": sceneGeneration,
                        "manifest_sha256": manifestSha,
                        "requires_scene_ready": true,
                    ]
                    let legacy: [String: Any] = [
                        "action": "focus_part",
                        "part_id": pid,
                        "view_id": vid,
                        "explode_pcb": vid == "open_dip",
                        "callout_title": lbl.uppercased(),
                        "callout_body": sum,
                    ]
                    return [
                        "ambiguous": false,
                        "clarification_required": false,
                        "clarification_prompt": NSNull(),
                        "candidate_part_ids": [],
                        "twin_action": legacy,
                        "twin_action_v1": v1,
                        "turn_id": tid,
                        "scene_generation": sceneGeneration,
                        "manifest_sha256": manifestSha,
                    ]
                }
            }
        }

        // Bundled parametric `TZ THT-02` path: check ambiguous single-pin ("show me pin one") first (`M4-VOICE-03`)
        if let pinNum = extractSinglePinReference(q), (1...4).contains(pinNum), !hasDipQualifier && !hasRearQualifier {
            return [
                "ambiguous": true,
                "clarification_required": true,
                "clarification_prompt": "Ambiguous reference for Pin \(pinNum). Do you want to highlight SW1 DIP-8 Switch Pin \(pinNum) (dip.pin_\(pinNum)) or Rear 4-Wire Lead #\(pinNum) (rear.pin_\(pinNum))?",
                "candidate_part_ids": ["dip.pin_\(pinNum)", "rear.pin_\(pinNum)"],
                "twin_action": NSNull(),
                "twin_action_v1": NSNull(),
                "turn_id": tid,
                "scene_generation": sceneGeneration,
                "manifest_sha256": manifestSha,
            ]
        }

        guard let legacy = resolveTwinAction(query: query, zoneHint: zoneHint, currentDipAddress: currentDipAddress) else {
            return [
                "ambiguous": false,
                "clarification_required": false,
                "clarification_prompt": NSNull(),
                "candidate_part_ids": [],
                "twin_action": NSNull(),
                "twin_action_v1": NSNull(),
                "turn_id": tid,
                "scene_generation": sceneGeneration,
                "manifest_sha256": manifestSha,
            ]
        }

        let actType = (legacy["action"] as? String) ?? "focus_zone"
        let kind: String = {
            if actType == "reset_view" { return "reset_view" }
            if actType == "configure_dip" { return "simulate_state" }
            if actType == "xray_view" { return "show_view" }
            return "focus_part"
        }()
        let fz = legacy["focus_zone"] as? String
        let mp = legacy["manual_page"] as? Int
        let simState: Any = (actType == "configure_dip")
            ? ["visual_dip_address": legacy["target_slave_id"] ?? currentDipAddress, "dip_bits": legacy["dip_bits"] ?? [], "bus_target_mutated": false]
            : NSNull()
        let v1: [String: Any] = [
            "schema": "twin_action_v1",
            "kind": kind,
            "part_id": fz ?? NSNull(),
            "view_id": (legacy["camera_pose"] as? String) ?? "overview",
            "citation_id": (mp != nil) ? "tht02_manual_v1_1:p\(mp!):\(mp!).1" : NSNull(),
            "simulated_state": simState,
            "callout_title": legacy["callout_title"] ?? "",
            "callout_body": legacy["callout_body"] ?? "",
            "turn_id": tid,
            "scene_generation": sceneGeneration,
            "manifest_sha256": manifestSha,
            "requires_scene_ready": false,
        ]
        return [
            "ambiguous": false,
            "clarification_required": false,
            "clarification_prompt": NSNull(),
            "candidate_part_ids": [],
            "twin_action": legacy,
            "twin_action_v1": v1,
            "turn_id": tid,
            "scene_generation": sceneGeneration,
            "manifest_sha256": manifestSha,
        ]
    }
}
