import Foundation

/// Modular English Datasheet & Manual Section Navigator (`TZ THT-02 User's Manual V1.1`).
///
/// Pure Foundation module (compiles on both iPadOS `arm64` and macOS contract test runners)
/// providing:
/// - Exact page & section resolution across Pages 1..9 of `THT02_Users_Manual_v1.1.pdf`
/// - Auto-open (`openManual`) and full-screen viewer (`openLightbox`) flags when the operator
///   asks where calibration, wiring, DIP-8, Modbus registers, CRC-16, or specs live in the manual.
public struct FieldScanManualLookupResult {
    public let matched: Bool
    public let topicId: String?
    public let language: String
    public let openManual: Bool
    public let openLightbox: Bool
    public let primaryPage: Int?
    public let citedPages: [Int]
    public let sectionDict: [String: Any]?
    public let localizedAnswer: String
}

public enum FieldScanManualNavigator {

    public static let pageTitles: [Int: String] = [
        1: "Page 1 · THT-02 Anatomy & SHT30 Probe",
        2: "Page 2 · Specifications & HVAC Overview",
        3: "Page 3 · SHT30/SHT3X Ratings & RS-485 Bus",
        4: "Page 4 · 4-Wire Color Code & RS-485 Grounding",
        5: "Page 5 · 2-Step Opening & DIP-8 Switch (Ex. 176)",
        6: "Page 6 · Modbus Registers & 7FFFH Fault Alarm",
        7: "Page 7 · Modbus 0x03 Poll & 21-Byte RTU Frame",
        8: "Page 8 · Baud Write 0x06 & Exception Responses",
        9: "Page 9 · CRC-16 (0xA001) & 140x16 mm Blueprint",
    ]

    private struct TopicEntry {
        let topicId: String
        let primaryPage: Int
        let citedPages: [Int]
        let sectionId: String
        let headingEN: String
        let excerptEN: String
        let summaryEN: String
        let keywords: [String]
        let weight: Int
    }

    private static let catalog: [TopicEntry] = [
        TopicEntry(
            topicId: "calibration_accuracy",
            primaryPage: 3,
            citedPages: [3, 2, 6],
            sectionId: "3.1",
            headingEN: "Section 3.1 (Page 3) & Section 2.1 (Page 2) — Factory Calibration, Accuracy & Drift",
            excerptEN: "SHT30/SHT3X factory-calibrated probe: ±0.3 °C (0–60 °C), ±2 %RH (5–95 %RH), 0.1 °C / 0.1 %RH resolution, < ±0.25 %RH/yr drift. Register 0x0005 (baud rate) is the only writable register.",
            summaryEN: "In the official TZ THT-02 Manual V1.1, calibration and accuracy specifications are on Page 3 (Section 3.1 · Technical Data) and Page 2 (Section 2.1 · SHT30 CMOSens Overview): the sensor comes factory-calibrated at ±0.3 °C accuracy (0–60 °C), ±2 %RH accuracy (5–95 %RH), and < ±0.25 %RH/year drift. Pages 6 and 8 (Sections 5.2 & 5.4) also confirm that register 0x0005 (baud rate) is the only writable parameter—there are no user calibration offset registers on this unit.",
            keywords: [
                "calibration", "calibrate", "calibrated",
                "offset", "adjustment", "precision", "accuracy",
                "tolerance", "drift", "0.3", "0.25", "metrolog",
            ],
            weight: 12
        ),
        TopicEntry(
            topicId: "dip_switch_opening",
            primaryPage: 5,
            citedPages: [5, 6],
            sectionId: "5.1",
            headingEN: "Section 5.1 (Page 5) — 8-Bit DIP Switch Address Weights & 2-Step Housing Opening",
            excerptEN: "Step 1 loosen rear waterproof nut; Step 2 unscrew middle barrel. SW1 DIP-8 weights [128, 64, 32, 16, 8, 4, 2, 1] (Pin 8 ON = Slave #1; Pins 1,3,4 ON = 176).",
            summaryEN: "Located on Page 5 (Section 5.1 · 8-Bit DIP Switch Address Code & 2-Step Housing Opening): first loosen the rear waterproof gland nut so the leads do not twist, then unscrew the middle barrel to reach the SW1 DIP-8 switch with binary weights [128, 64, 32, 16, 8, 4, 2, 1] from Pin 1 to Pin 8 (Pin 8 ON = Slave #1; Pins 1,3,4 ON = 176).",
            keywords: [
                "dip", "switch", "switches", "pin", "pins", "rocker",
                "slave", "address", "176", "128",
                "unscrew", "open housing", "two step", "8n1",
            ],
            weight: 10
        ),
        TopicEntry(
            topicId: "wiring_grounding",
            primaryPage: 4,
            citedPages: [4, 1],
            sectionId: "4.1",
            headingEN: "Section 4.1 (Page 4) — 4-Lead Color Wiring, Environment & RS-485 Grounding",
            excerptEN: "Red = Power V+ (DC 5–24 V), Black = Public GND, Yellow = RS-485 A+, Green = RS-485 B-. Bond Black GND and shield to converter ground.",
            summaryEN: "Located on Page 4 (Section 4.1 · Environmental Conditions & 4-Lead Wiring Schematic): Red = Power V+ (DC 5–24 V), Black = Public GND, Yellow = RS-485 A+, and Green = RS-485 B-. Always tie Black GND and the cable shield to the RS-485 converter ground.",
            keywords: [
                "wiring", "wire", "wires", "cable", "cables",
                "lead", "leads", "color", "colors",
                "yellow", "green", "red", "black", "gnd", "ground", "grounding",
                "shield", "gland", "back", "rear",
            ],
            weight: 10
        ),
        TopicEntry(
            topicId: "registers_7fff",
            primaryPage: 6,
            citedPages: [6, 7, 8],
            sectionId: "5.2",
            headingEN: "Section 5.2 (Page 6) — Holding Register Map (0x0000..0x0007) & 0x7FFF Probe Alarm",
            excerptEN: "0x0000 Temp (0.1 °C signed), 0x0001 RH (0.1 %RH), 0x0004 DIP Address (R), 0x0005 Baud (R/W), 7FFFH = abnormal SHT30 probe.",
            summaryEN: "Located on Page 6 (Section 5.2 · RTU Timing & Holding Register Map 0x0000..0x0007): 0x0000 is Temperature (signed 0.1 °C), 0x0001 is Relative Humidity (0.1 %RH), 0x0004 is DIP Address (read-only), 0x0005 is Baud Rate (4800/9600/19200), and 7FFFH flags an abnormal SHT30 sensor element.",
            keywords: [
                "register", "registers", "holding",
                "7fff", "7fffh", "0x0000", "0x0001", "0x0004", "0000h", "0001h",
                "inter-byte", "3.5 char", "sentinel",
            ],
            weight: 10
        ),
        TopicEntry(
            topicId: "poll_0x03",
            primaryPage: 7,
            citedPages: [7, 6],
            sectionId: "5.3",
            headingEN: "Section 5.3 (Page 7) — Function Code 0x03 Read Request & 21-Byte RTU Response",
            excerptEN: "Host FC03 request for Slave 1 registers 0x0000..0x0007: 01 03 00 00 00 08 44 0C -> 21-byte response.",
            summaryEN: "Located on Page 7 (Section 5.3 · Function Code 0x03 Poll Request & 21-Byte Response): documents the master frame `01 03 00 00 00 08 44 0C` and the 21-byte response layout.",
            keywords: ["0x03", "function 03", "21-byte", "21 bytes", "44 0c", "01 03 00 00", "poll example"],
            weight: 10
        ),
        TopicEntry(
            topicId: "baud_write_decoding",
            primaryPage: 8,
            citedPages: [8, 6],
            sectionId: "5.4",
            headingEN: "Section 5.4 (Page 8) — Hex Decoding, Baud Register 0x0005 (FC 0x06) & Exceptions",
            excerptEN: "00FAH = 25.0 °C, 0258H = 60.0 %RH, 2580H = 9600 bps. FC 0x06 writes only to 0x0005; exceptions set MSB (0x83/0x86).",
            summaryEN: "Located on Page 8 (Section 5.4 · Data Decoding Example, Function 0x06 Baud Write & Abnormal Response): covers `00FAH = 25.0 °C`, `0258H = 60.0 %RH`, baud write on `0x0005` (blocked in read-only pilot mode), and exception replies `0x83`/`0x86`.",
            keywords: ["0x06", "function 06", "0x0005", "0005h", "baud", "4800", "19200", "2580h", "00fah", "decoding", "0x83", "0x86"],
            weight: 9
        ),
        TopicEntry(
            topicId: "crc_dimensions_errors",
            primaryPage: 9,
            citedPages: [9, 1],
            sectionId: "6.1",
            headingEN: "Section 6.1 (Page 9) — Exception Error Codes, CRC-16 (0xA001) & 140×16 mm Blueprint",
            excerptEN: "Exception codes 01/02/03, CRC-16 init 0xFFFF right-shift XOR 0xA001, envelope 140.0 mm × Ø16.0 mm.",
            summaryEN: "Located on Page 9 (Section 6.1 · Exception Error Codes, CRC-16 Algorithm & Mechanical Dimensions): documents error codes 01/02/03, CRC-16 (`0xA001`), and the `140.0 mm × Ø16.0 mm` housing blueprint.",
            keywords: ["crc", "crc-16", "crc16", "a001", "0xa001", "dimensions", "length", "diameter", "blueprint", "140", "16 mm", "16mm", "exception code", "error codes"],
            weight: 9
        ),
        TopicEntry(
            topicId: "power_electrical_specs",
            primaryPage: 3,
            citedPages: [3, 2],
            sectionId: "3.1",
            headingEN: "Section 3.1 (Page 3) — Power Supply (DC 5–24 V), RS-485 Distance & Sensing Range",
            excerptEN: "DC 5–24 V (5 mA), RS-485 up to 1200 m (32 nodes), Temp -40..+125 °C (±0.3 °C), RH 5..95 %RH (±2 %RH).",
            summaryEN: "Located on Page 3 (Section 3.1 · Technical Data): DC 5–24 V supply (5 mA nominal), RS-485 up to 1200 m, SHT30 temperature -40 to +125 °C (±0.3 °C), and SHT3X humidity 5–95 %RH (±2 %RH).",
            keywords: ["power", "voltage", "supply", "current", "24v", "5v", "5ma", "1200m", "range", "specifications", "specs", "technical data"],
            weight: 8
        ),
        TopicEntry(
            topicId: "anatomy_parts",
            primaryPage: 1,
            citedPages: [1, 9],
            sectionId: "1.1",
            headingEN: "Section 1.1 (Page 1) — External Physical Callouts & SHT30 Strainer Probe Anatomy",
            excerptEN: "Stainless steel strainer, SHT30 probe, mounting holes, 1 m 4-wire lead, waterproof compression terminal.",
            summaryEN: "Located on Page 1 (Section 1.1 · Physical Callouts & Probe Anatomy): labels the stainless steel strainer cap, SHT30 probe, mounting flange holes, 1 m 4-wire lead, and waterproof compression nut.",
            keywords: ["anatomy", "parts", "components", "callouts", "strainer", "filter", "mesh", "sintered", "cover", "main sensor", "probe"],
            weight: 8
        ),
        TopicEntry(
            topicId: "overview_applications",
            primaryPage: 2,
            citedPages: [2, 3],
            sectionId: "2.1",
            headingEN: "Section 2.1 (Page 2) — Product Overview, CMOSens Features & Application Areas",
            excerptEN: "Factory-calibrated SHT30/SHT3X CMOSens element, RS-485 Modbus-RTU, HVAC/cleanroom/warehouse use.",
            summaryEN: "Located on Page 2 (Section 2.1 · Product Overview & Features): describes the factory-calibrated SHT30/SHT3X CMOSens sensor, RS-485 Modbus-RTU bus, and HVAC/cleanroom applications.",
            keywords: ["applications", "hvac", "cleanroom", "overview", "features", "cmosens"],
            weight: 7
        ),
    ]

    public static func stripAccentsLower(_ raw: String) -> String {
        let folded = raw.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        return folded.lowercased()
    }

    public static func detectLanguage(_ text: String, fallback: String = "en") -> String {
        _ = (text, fallback)
        return "en"
    }

    public static func isExplicitManualLookupQuery(_ query: String) -> Bool {
        let norm = stripAccentsLower(query)
        if extractAnyPageNumber(norm) != nil {
            return true
        }
        let manualReqPattern = "\\b(manual|datasheet|bulletin|pdf|page|pag\\.?|section|where\\s+in\\s+the\\s+manual|where\\s+is\\s+the\\s+section|which\\s+page|what\\s+page|what\\s+section|open\\s+the\\s+manual|open\\s+datasheet|in\\s+the\\s+datasheet|in\\s+the\\s+manual|documentation|schematic|wiring\\s+diagram|pinout|configuration\\s+section|where\\s+do\\s+i\\s+configure|how\\s+do\\s+i\\s+configure)\\b"
        if norm.range(of: manualReqPattern, options: .regularExpression) != nil {
            return true
        }
        if ["calibration", "calibrate", "calibrated"].contains(where: { norm.contains($0) }) {
            return true
        }
        return false
    }

    public static func lookupManual(for query: String, language: String? = nil) -> FieldScanManualLookupResult {
        let norm = stripAccentsLower(query)
        _ = language
        let lang = "en"

        let manualReqPattern = "\\b(manual|datasheet|page|pag\\.?|section|where\\s+in\\s+the\\s+manual|where\\s+is\\s+the\\s+section|which\\s+page|what\\s+page|what\\s+section|open\\s+the\\s+manual|open\\s+datasheet|in\\s+the\\s+datasheet|in\\s+the\\s+manual)\\b"
        let explicitOpen = norm.range(of: manualReqPattern, options: .regularExpression) != nil

        if let reqPage = extractExplicitPageNumber(norm) {
            let pageTopic = catalog.first(where: { $0.primaryPage == reqPage })
            let secId = pageTopic?.sectionId ?? "\(reqPage).1"
            let heading = pageTopic?.headingEN ?? "Page \(reqPage) · \(pageTitles[reqPage] ?? "Manual V1.1")"
            let excerpt = pageTopic?.excerptEN ?? heading
            let answer = "Here is Page \(reqPage) (\(heading)) of the TZ THT-02 Manual V1.1: \(excerpt)"

            let sectionDict: [String: Any] = [
                "page": reqPage,
                "section_id": secId,
                "heading": heading,
                "verified_excerpt": excerpt,
                "topic_id": "explicit_page_\(reqPage)",
            ]
            return FieldScanManualLookupResult(
                matched: true,
                topicId: "explicit_page_\(reqPage)",
                language: lang,
                openManual: true,
                openLightbox: true,
                primaryPage: reqPage,
                citedPages: [reqPage],
                sectionDict: sectionDict,
                localizedAnswer: answer
            )
        }

        var bestTopic: TopicEntry?
        var bestScore = 0
        for topic in catalog {
            let hits = topic.keywords.reduce(0) { acc, kw in
                acc + (norm.contains(kw) ? 1 : 0)
            }
            if hits > 0 {
                let sc = hits * topic.weight
                if sc > bestScore {
                    bestScore = sc
                    bestTopic = topic
                }
            }
        }

        if let topic = bestTopic {
            let heading = topic.headingEN
            let excerpt = topic.excerptEN
            let answer = topic.summaryEN
            let wantsLocation = [
                "where", "page", "section", "show", "open", "manual", "datasheet", "pdf",
                "configure", "configuration", "config", "setup", "setting", "settings",
                "diagram", "schematic", "wiring", "pinout", "calibration", "spec", "specs",
                "register", "guide", "read", "find",
            ].contains(where: { norm.contains($0) })
            let shouldLightbox = explicitOpen || wantsLocation

            let sectionDict: [String: Any] = [
                "page": topic.primaryPage,
                "section_id": topic.sectionId,
                "heading": heading,
                "verified_excerpt": excerpt,
                "topic_id": topic.topicId,
            ]
            return FieldScanManualLookupResult(
                matched: true,
                topicId: topic.topicId,
                language: lang,
                openManual: true,
                openLightbox: shouldLightbox,
                primaryPage: topic.primaryPage,
                citedPages: topic.citedPages,
                sectionDict: sectionDict,
                localizedAnswer: answer
            )
        }

        if explicitOpen {
            let p = norm.contains("spec") || norm.contains("accuracy") ? 3 : 1
            let heading = "Page \(p) · Official TZ THT-02 Manual V1.1 (9 Pages)"
            let excerpt = "P1 Anatomy · P2 SHT30 · P3 Factory Calibration/Specs (±0.3°C, ±2%RH) · P4 Wiring · P5 DIP-8 · P6–P8 Registers · P9 CRC-16 & Blueprint."
            let answer = "Opening the official TZ THT-02 Manual V1.1: \(excerpt)"

            let sectionDict: [String: Any] = [
                "page": p,
                "section_id": "\(p).1",
                "heading": heading,
                "verified_excerpt": excerpt,
                "topic_id": "manual_overview",
            ]
            return FieldScanManualLookupResult(
                matched: true,
                topicId: "manual_overview",
                language: lang,
                openManual: true,
                openLightbox: true,
                primaryPage: p,
                citedPages: [p, 3, 5],
                sectionDict: sectionDict,
                localizedAnswer: answer
            )
        }

        return FieldScanManualLookupResult(
            matched: false,
            topicId: nil,
            language: lang,
            openManual: false,
            openLightbox: false,
            primaryPage: nil,
            citedPages: [],
            sectionDict: nil,
            localizedAnswer: ""
        )
    }

    private static func extractExplicitPageNumber(_ norm: String) -> Int? {
        guard let p = extractAnyPageNumber(norm), (1...9).contains(p) else {
            return nil
        }
        return p
    }

    public static func extractAnyPageNumber(_ norm: String) -> Int? {
        let pattern = "\\b(?:page|pag\\.?|p)\\s*#?\\s*(\\d{1,3})\\b"
        guard let rx = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]),
              let match = rx.firstMatch(in: norm, range: NSRange(norm.startIndex..., in: norm)),
              let r = Range(match.range(at: 1), in: norm),
              let p = Int(norm[r]) else {
            return nil
        }
        return p
    }

    /// Context-aware multi-document & 12+ page manual lookup (`M4-DOC-01..03`).
    public static func lookupManualInDescriptor(
        query: String,
        descriptor: [String: Any],
        preferredDocumentId: String? = nil
    ) -> [String: Any] {
        let docs = (descriptor["documents"] as? [[String: Any]]) ?? []
        let sceneOrigin = (descriptor["scene_origin"] as? String) ?? "bundled_parametric"
        if sceneOrigin == "bundled_parametric" && docs.count <= 1 && ((docs.first?["page_count"] as? Int) ?? 9) == 9 {
            let norm = stripAccentsLower(query)
            if let reqP = extractAnyPageNumber(norm), !(1...9).contains(reqP) {
                return [
                    "matched": false,
                    "page_out_of_range": true,
                    "error_code": "PAGE_OUT_OF_RANGE",
                    "requested_page": reqP,
                    "max_page": 9,
                    "open_manual": false,
                    "open_manual_lightbox": false,
                    "manual_page": NSNull(),
                    "cited_pages": [],
                    "citations": [],
                    "answer": "Page \(reqP) is outside the verified 9-page range (Pages 1..9) of TZ THT-02 Manual V1.1.",
                ]
            }
            let res = lookupManual(for: query, language: "en")
            let cits: [[String: Any]] = res.citedPages.map { p in
                [
                    "document_id": "tht02_manual_v1_1",
                    "page": p,
                    "printed_page": "\(p)",
                    "label": pageTitles[p] ?? "Page \(p)",
                    "image_url": "/assets/manual_pages/page_\(p).png",
                    "pdf_fallback_url": "/assets/THT02_Users_Manual_v1.1.pdf#page=\(p)",
                ]
            }
            return [
                "matched": res.matched,
                "page_out_of_range": false,
                "document_id": "tht02_manual_v1_1",
                "document_title": "TZ THT-02 User's Manual V1.1",
                "document_revision": "V1.1",
                "open_manual": res.openManual,
                "open_manual_lightbox": res.openLightbox,
                "manual_page": res.primaryPage ?? NSNull(),
                "printed_page": (res.primaryPage != nil) ? "\(res.primaryPage!)" : NSNull(),
                "cited_pages": res.citedPages,
                "citations": cits,
                "manual_section": res.sectionDict ?? NSNull(),
                "answer": res.localizedAnswer,
            ]
        }

        guard !docs.isEmpty else {
            return [
                "matched": false,
                "page_out_of_range": false,
                "error_code": "MANUAL_UNAVAILABLE",
                "open_manual": false,
                "open_manual_lightbox": false,
                "manual_page": NSNull(),
                "cited_pages": [],
                "citations": [],
                "answer": "No verified manual documents are available in the active package.",
            ]
        }

        let norm = stripAccentsLower(query)
        let targetDoc: [String: Any] = {
            if let pref = preferredDocumentId, let d = docs.first(where: { ($0["document_id"] as? String) == pref }) {
                return d
            }
            for d in docs {
                let did = ((d["document_id"] as? String) ?? "").lowercased()
                let dtitle = ((d["title"] as? String) ?? "").lowercased()
                if (!did.isEmpty && norm.contains(did.replacingOccurrences(of: "_", with: " ")))
                    || (norm.contains("bulletin") && (did.contains("bulletin") || dtitle.contains("bulletin")))
                    || (norm.contains("m12") && dtitle.contains("m12") && norm.contains("pinout")) {
                    return d
                }
            }
            return docs[0]
        }()

        let docId = (targetDoc["document_id"] as? String) ?? "doc_1"
        let docTitle = FieldScanCatalogContract.sanitizeReferenceText((targetDoc["title"] as? String) ?? docId)
        let pages = (targetDoc["pages"] as? [[String: Any]]) ?? []
        let maxPage = max(pages.count, (targetDoc["page_count"] as? Int) ?? 1)

        if let reqP = extractAnyPageNumber(norm) {
            guard reqP >= 1 && reqP <= maxPage,
                  let pg = pages.first(where: { ($0["page"] as? Int) == reqP }) else {
                return [
                    "matched": false,
                    "page_out_of_range": true,
                    "error_code": "PAGE_OUT_OF_RANGE",
                    "document_id": docId,
                    "requested_page": reqP,
                    "max_page": maxPage,
                    "open_manual": false,
                    "open_manual_lightbox": false,
                    "manual_page": NSNull(),
                    "cited_pages": [],
                    "citations": [],
                    "answer": "Page \(reqP) is out of range for \(docTitle) (valid physical pages: 1..\(maxPage)).",
                ]
            }
            return buildDescriptorPageResponse(doc: targetDoc, pageObj: pg, openLightbox: true)
        }

        // Score keyword & excerpt hits across ALL documents in the package (`M4-DOC-01`)
        var bestDoc: [String: Any]?
        var bestPage: [String: Any]?
        var bestScore = 0
        let tokens = norm.components(separatedBy: CharacterSet.alphanumerics.inverted).filter { $0.count >= 3 }
        for d in docs {
            for pg in ((d["pages"] as? [[String: Any]]) ?? []) {
                let kws = ((pg["keywords"] as? [String]) ?? []).map { $0.lowercased() }
                let titleLow = ((pg["title"] as? String) ?? "").lowercased()
                let exLow = ((pg["verified_excerpt"] as? String) ?? "").lowercased()
                var sc = 0
                for kw in kws where norm.contains(kw) { sc += 12 }
                for tok in tokens {
                    if titleLow.contains(tok) { sc += 5 }
                    if exLow.contains(tok) { sc += 3 }
                }
                if sc > bestScore {
                    bestScore = sc
                    bestDoc = d
                    bestPage = pg
                }
            }
        }

        if let bd = bestDoc, let bp = bestPage {
            let wantsManualOpen = isExplicitManualLookupQuery(query)
                || ["where", "page", "section", "show", "open", "configure", "configuration", "wiring", "diagram", "calibration", "register", "spec"].contains(where: { norm.contains($0) })
            return buildDescriptorPageResponse(doc: bd, pageObj: bp, openLightbox: wantsManualOpen)
        }

        // If a Cloud catalog package for TZ THT-02 lacks rich per-page keywords, fall back cleanly to our verified 9-page THT-02 section index
        let prodId = ((descriptor["context"] as? [String: Any])?["product_id"] as? String) ?? ""
        if prodId == "tzone_tht02" {
            let rich = lookupManual(for: query, language: "en")
            if rich.matched, let rp = rich.primaryPage {
                let cits: [[String: Any]] = rich.citedPages.map { p in
                    [
                        "document_id": docId,
                        "page": p,
                        "printed_page": "\(p)",
                        "label": pageTitles[p] ?? "Page \(p)",
                        "image_url": "/assets/manual_pages/page_\(p).png",
                        "pdf_fallback_url": "/assets/THT02_Users_Manual_v1.1.pdf#page=\(p)",
                    ]
                }
                return [
                    "matched": true,
                    "page_out_of_range": false,
                    "document_id": docId,
                    "document_title": docTitle,
                    "open_manual": true,
                    "open_manual_lightbox": rich.openLightbox,
                    "manual_page": rp,
                    "printed_page": "\(rp)",
                    "cited_pages": rich.citedPages,
                    "citations": cits,
                    "manual_section": rich.sectionDict ?? NSNull(),
                    "answer": rich.localizedAnswer,
                ]
            }
        }

        if isExplicitManualLookupQuery(query), let firstPg = pages.first {
            return buildDescriptorPageResponse(doc: targetDoc, pageObj: firstPg, openLightbox: true)
        }

        return [
            "matched": false,
            "page_out_of_range": false,
            "document_id": docId,
            "open_manual": false,
            "open_manual_lightbox": false,
            "manual_page": NSNull(),
            "cited_pages": [],
            "citations": [],
            "answer": "",
        ]
    }

    private static func buildDescriptorPageResponse(
        doc: [String: Any],
        pageObj: [String: Any],
        openLightbox: Bool
    ) -> [String: Any] {
        let docId = (doc["document_id"] as? String) ?? "doc_1"
        let docTitle = FieldScanCatalogContract.sanitizeReferenceText((doc["title"] as? String) ?? docId)
        let docRev = FieldScanCatalogContract.sanitizeReferenceText((doc["revision"] as? String) ?? "rev-1")
        let pnum = (pageObj["page"] as? Int) ?? 1
        let printed = FieldScanCatalogContract.sanitizeReferenceText("\(pageObj["printed_page"] ?? pnum)")
        let secId = FieldScanCatalogContract.sanitizeReferenceText((pageObj["section_id"] as? String) ?? "\(pnum).1")
        let pgTitle = FieldScanCatalogContract.sanitizeReferenceText((pageObj["title"] as? String) ?? "Page \(pnum)")
        let excerpt = FieldScanCatalogContract.sanitizeReferenceText((pageObj["verified_excerpt"] as? String) ?? pgTitle)
        let imgURL = pageObj["image_url"] ?? NSNull()
        let pdfFallback = pageObj["pdf_fallback_url"] ?? (doc["pdf_url"] ?? NSNull())
        let citationId = "\(docId):p\(pnum):\(secId)"
        let heading = "\(docTitle) (\(docRev)) · Page \(pnum) (Printed \(printed)) · Section \(secId) — \(pgTitle)"
        let answer = "In \(docTitle) (\(docRev)), Physical Page \(pnum) (Printed \(printed), Section \(secId) · \(pgTitle)): \(excerpt)"

        let cit: [String: Any] = [
            "citation_id": citationId,
            "document_id": docId,
            "document_title": docTitle,
            "revision": docRev,
            "page": pnum,
            "printed_page": printed,
            "section_id": secId,
            "label": "\(docTitle) · P\(pnum) (\(printed))",
            "image_url": imgURL,
            "pdf_fallback_url": pdfFallback,
        ]
        let secDict: [String: Any] = [
            "document_id": docId,
            "page": pnum,
            "printed_page": printed,
            "section_id": secId,
            "heading": heading,
            "verified_excerpt": excerpt,
            "citation_id": citationId,
            "image_url": imgURL,
            "pdf_fallback_url": pdfFallback,
        ]
        return [
            "matched": true,
            "page_out_of_range": false,
            "document_id": docId,
            "document_title": docTitle,
            "document_revision": docRev,
            "open_manual": true,
            "open_manual_lightbox": openLightbox,
            "manual_page": pnum,
            "printed_page": printed,
            "citation_id": citationId,
            "cited_pages": [pnum],
            "citations": [cit],
            "manual_section": secDict,
            "image_url": imgURL,
            "pdf_fallback_url": pdfFallback,
            "answer": answer,
        ]
    }
}
