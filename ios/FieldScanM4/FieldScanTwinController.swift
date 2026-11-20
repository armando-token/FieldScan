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
}
