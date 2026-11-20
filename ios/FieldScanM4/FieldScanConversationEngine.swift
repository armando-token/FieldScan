import Foundation
#if canImport(UIKit)
import UIKit
#endif
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Modular English Conversational, 3D Digital Twin, Scene-Vision & Diagnostic Orchestrator for iPad Air M4.
///
/// Eliminates the "broken parrot" defect by cleanly separating:
/// 1. `generalChat` — Natural English conversation, mic checks ("can you hear me?"),
///    greetings, time/date, math, and multi-turn follow-ups with ZERO unrequested sensor telemetry.
/// 2. `sceneVision` — Real camera environment & floor/carpet/desk inspection ("can you see what is
///    on the carpet under the sensor?"), sending the raw camera frame to `Qwen3-VL-4B`
///    and combining Apple `Vision` + surface texture/color analysis.
/// 3. `manualLookup` — Datasheet & calibration section queries with automatic drawer/lightbox opening.
/// 4. `sensorDiagnostics` — Interactive 3D Digital Twin manipulation, Modbus/RS-485, DIP-8, and physical fault queries.
public enum FieldScanQueryIntent: String {
    case generalChat = "general_chat"
    case sceneVision = "scene_vision"
    case manualLookup = "manual_lookup"
    case sensorDiagnostics = "sensor_diagnostics"
}

public struct FieldScanClassifiedIntent {
    public let intent: FieldScanQueryIntent
    public let subintent: String
    public let language: String
}

public final class FieldScanConversationEngine {
    public static let shared = FieldScanConversationEngine()

    private let historyLock = NSLock()
    private var chatHistory: [[String: String]] = []
    private var lastDetectedLanguage: String = "en"

    public init() {}

    public func currentLanguage() -> String {
        historyLock.lock()
        let l = lastDetectedLanguage
        historyLock.unlock()
        return l
    }

    public func snapshotHistory(maxMessages: Int = 8) -> [[String: String]] {
        historyLock.lock()
        let slice = Array(chatHistory.suffix(maxMessages))
        historyLock.unlock()
        return slice
    }

    public func recordTurn(userQuery: String, assistantReply: String, language: String) {
        let u = userQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        let a = assistantReply.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !u.isEmpty && !a.isEmpty else { return }
        historyLock.lock()
        lastDetectedLanguage = "en"
        _ = language
        chatHistory.append(["role": "user", "content": String(u.prefix(320))])
        chatHistory.append(["role": "assistant", "content": String(a.prefix(420))])
        if chatHistory.count > 10 {
            chatHistory.removeFirst(chatHistory.count - 10)
        }
        historyLock.unlock()
    }

    public static func classifyIntent(query: String, zoneHint: String? = nil, defaultLanguage: String = "en") -> FieldScanClassifiedIntent {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let norm = FieldScanManualNavigator.stripAccentsLower(trimmed)
        _ = defaultLanguage
        let lang = "en"

        if let z = zoneHint?.trimmingCharacters(in: .whitespacesAndNewlines), !z.isEmpty {
            return FieldScanClassifiedIntent(intent: .sensorDiagnostics, subintent: "zone_hint", language: lang)
        }
        guard !norm.isEmpty else {
            return FieldScanClassifiedIntent(intent: .sensorDiagnostics, subintent: "empty_default", language: lang)
        }

        let sensorPattern = "\\b(sensor|tht|ths|thp|sht30|sht3x|modbus|rs485|rs-485|rtu|dip|switch|switches|pin|pins|rocker|rockers|slave|address|register|registers|0x[0-9a-f]+|7fff|7fffh|crc|baud|9600|4800|19200|temp|temperature|humid|humidity|rh|wire|wires|wiring|cable|cables|lead|leads|gland|back|rear|volt|voltage|power|gnd|ground|strainer|filter|sintered|probe|tip|barrel|housing|flange|bracket|mount|mounting|o-ring|oring|seal|gasket|pcb|unscrew|explode|close|xray|x-ray|wireframe|twin|digital\\s+twin|3d|cad|dxf|stl|fault|broken|damaged|failing|alarm|patch|stain|obstruction|frayed|andon|scada|plc)\\b"
        let hasSensorTerm = norm.range(of: sensorPattern, options: .regularExpression) != nil

        let hearingPattern = "\\b(can\\s+you\\s+hear\\s+me|do\\s+you\\s+hear\\s+me|are\\s+you\\s+listening|testing\\s+mic|mic\\s+check|audio\\s+check|hear\\s+me\\s+okay|hear\\s+me\\s+now)\\b"
        if norm.range(of: hearingPattern, options: .regularExpression) != nil && !hasSensorTerm {
            return FieldScanClassifiedIntent(intent: .generalChat, subintent: "hearing_check", language: lang)
        }

        let timePattern = "\\b(what\\s+time|current\\s+time|time\\s+is\\s+it|what\\s+day|what\\s+date|today's\\s+date)\\b"
        if norm.range(of: timePattern, options: .regularExpression) != nil && !hasSensorTerm {
            return FieldScanClassifiedIntent(intent: .generalChat, subintent: "time_date", language: lang)
        }

        let scenePattern = "\\b(floor|carpet|rug|mat|desk|table|background|surroundings|around\\s+the\\s+sensor|room|surface|what\\s+else\\s+do\\s+you\\s+see|what\\s+is\\s+under|underneath|color\\s+of\\s+the)\\b"
        if norm.range(of: scenePattern, options: .regularExpression) != nil {
            return FieldScanClassifiedIntent(intent: .sceneVision, subintent: "environment_detail", language: lang)
        }

        if FieldScanManualNavigator.isExplicitManualLookupQuery(trimmed) {
            let faultTerms = ["patch", "frayed", "failing", "broken", "damaged", "obstruction"]
            if faultTerms.contains(where: { norm.contains($0) }) {
                return FieldScanClassifiedIntent(intent: .sensorDiagnostics, subintent: "visual_fault", language: lang)
            }
            return FieldScanClassifiedIntent(intent: .manualLookup, subintent: "datasheet_section", language: lang)
        }

        let genericSeePattern = "\\b(what\\s+do\\s+you\\s+see|can\\s+you\\s+see|on\\s+the\\s+camera|in\\s+front\\s+of\\s+the\\s+camera)\\b"
        if norm.range(of: genericSeePattern, options: .regularExpression) != nil && !hasSensorTerm {
            return FieldScanClassifiedIntent(intent: .sceneVision, subintent: "camera_overview", language: lang)
        }

        if hasSensorTerm {
            return FieldScanClassifiedIntent(intent: .sensorDiagnostics, subintent: "technical_or_fault", language: lang)
        }

        return FieldScanClassifiedIntent(intent: .generalChat, subintent: "open_chat", language: lang)
    }

    public static func evaluateSimpleMath(_ query: String) -> String? {
        let norm = FieldScanManualNavigator.stripAccentsLower(query)
        let pattern = "(\\d+(?:\\.\\d+)?)\\s*(\\+|plus|-|minus|\\*|x|times|/|divided\\s+by)\\s*(\\d+(?:\\.\\d+)?)"
        guard let rx = try? NSRegularExpression(pattern: pattern),
              let m = rx.firstMatch(in: norm, range: NSRange(norm.startIndex..., in: norm)),
              let r1 = Range(m.range(at: 1), in: norm),
              let rOp = Range(m.range(at: 2), in: norm),
              let r2 = Range(m.range(at: 3), in: norm),
              let a = Double(norm[r1]),
              let b = Double(norm[r2]) else {
            return nil
        }
        let op = String(norm[rOp])
        let res: Double
        switch op {
        case "+", "plus": res = a + b
        case "-", "minus": res = a - b
        case "*", "x", "times": res = a * b
        default:
            guard abs(b) > 1e-9 else { return nil }
            res = a / b
        }
        if abs(res.rounded() - res) < 1e-6 {
            return "\(Int(res.rounded()))"
        }
        return String(format: "%.2f", res)
    }

    // MARK: - Full Query Execution Pipeline (iPad Air M4)

    public func executeQuery(
        query: String,
        zoneHint: String?,
        dipAddr: Int,
        visionTel: [String: Any],
        modbusTel: [String: Any],
        rawCameraJpeg: Data?,
        vlmBaseURL: String?,
        vlmRunning: Bool,
        vlmModelLabel: String,
        catalogDescriptor: [String: Any]? = nil,
        sceneGeneration: Int = 1,
        turnId: String? = nil,
        describeDipFn: (Int) -> [String: Any]
    ) -> [String: Any] {
        let classified = Self.classifyIntent(query: query, zoneHint: zoneHint, defaultLanguage: "en")
        let lang = "en"
        let history = snapshotHistory(maxMessages: 8)
        let norm = FieldScanManualNavigator.stripAccentsLower(query)

        let preparedVisual: [String: Any] = (classified.intent == .sensorDiagnostics || classified.intent == .manualLookup)
            ? FieldScanTwinController.prepareVisualAction(
                query: query,
                descriptor: catalogDescriptor,
                zoneHint: zoneHint,
                currentDipAddress: dipAddr,
                sceneGeneration: sceneGeneration,
                turnId: turnId
            )
            : [
                "ambiguous": false,
                "clarification_required": false,
                "clarification_prompt": NSNull(),
                "candidate_part_ids": [],
                "twin_action": NSNull(),
                "twin_action_v1": NSNull(),
                "turn_id": turnId ?? ("turn-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased()),
                "scene_generation": sceneGeneration,
                "manifest_sha256": (catalogDescriptor?["context"] as? [String: Any])?["manifest_sha256"] ?? "bundle-tzone-tht02-v2.1",
            ]

        // Immediate English clarification without random 3D highlight on ambiguous reference (`M4-VOICE-03`)
        if (preparedVisual["ambiguous"] as? Bool) == true,
           let prompt = preparedVisual["clarification_prompt"] as? String {
            recordTurn(userQuery: query, assistantReply: prompt, language: lang)
            return [
                "reply_text": prompt,
                "model_used": "FieldScan Deterministic Ambiguity Guard · iPad M4",
                "intent": classified.intent.rawValue,
                "query_mode": classified.intent.rawValue,
                "language": "en",
                "clarification_required": true,
                "candidate_part_ids": preparedVisual["candidate_part_ids"] ?? [],
                "probable_causes": [],
                "recommended_actions": [],
                "target_zone": NSNull(),
                "explode_pcb": false,
                "dip_bits": NSNull(),
                "twin_action": NSNull(),
                "twin_action_v1": NSNull(),
                "turn_id": preparedVisual["turn_id"] ?? "",
                "scene_generation": preparedVisual["scene_generation"] ?? sceneGeneration,
                "manifest_sha256": preparedVisual["manifest_sha256"] ?? "",
                "open_manual": false,
                "open_manual_lightbox": false,
                "manual_page": NSNull(),
                "manual_section": NSNull(),
                "citations": [],
            ]
        }

        var replyText = ""
        var modelUsed = vlmModelLabel
        var probableCauses: [String] = []
        var recommendedActions: [String] = []
        var citedPages: [Int] = []
        var primaryPage: Int? = nil
        var openManual = false
        var openManualLightbox = false
        var manualSection: [String: Any]? = nil
        var targetZone: String? = nil
        var explodePcb = false
        var dynamicCitations: [[String: Any]]? = nil
        var documentIdOut: String? = nil
        var printedPageOut: String? = nil
        let twinAction = preparedVisual["twin_action"] as? [String: Any]
        let twinActionV1 = preparedVisual["twin_action_v1"] as? [String: Any]

        switch classified.intent {
        case .generalChat:
            if let mathAns = Self.evaluateSimpleMath(query) {
                replyText = "The answer is \(mathAns). Let me know if you need anything else!"
                modelUsed = "FieldScan Conversational Core · iPad M4"
            } else if classified.subintent == "hearing_check" {
                replyText = "Yes, I can hear you loud and clear on the iPad! Ask me anything naturally—whether you want me to manipulate the 3D Digital Twin, inspect the camera feed, or open a section in the datasheet."
                modelUsed = "FieldScan Conversational Core · iPad M4"
            } else {
                let sysPrompt = """
                You are FieldScan AI, a friendly, natural, intelligent conversational assistant running locally on an iPad Air M4.
                Respond strictly in natural English in 1 to 3 concise sentences.
                Maintain continuity with the conversation history and answer ONLY what the user actually asked.
                NEVER mention sensor telemetry, Modbus registers, temperatures, or datasheet pages unless the user explicitly asks about them.
                """
                if vlmRunning, let baseURL = vlmBaseURL,
                   let out = queryOpenAICompatibleVLM(baseURL: baseURL, systemPrompt: sysPrompt, history: history, userText: query, imageJpeg: nil, maxTokens: 120) {
                    replyText = out
                } else if let appleOut = queryAppleFoundationModel(systemPrompt: sysPrompt, history: history, userText: query) {
                    replyText = appleOut
                    modelUsed = "Apple Intelligence FoundationModels · iPad M4"
                } else {
                    replyText = buildNaturalGeneralFallback(norm: norm, subintent: classified.subintent, history: history)
                    modelUsed = "FieldScan Conversational Core · iPad M4"
                }
            }

        case .sceneVision:
            let sceneDesc = FieldScanVisionDetector.shared.describeSceneEnvironment(
                jpegData: rawCameraJpeg,
                latestTelemetry: visionTel,
                language: "en"
            )
            let sysPrompt = """
            You are FieldScan AI with live camera vision on an iPad Air M4.
            Respond strictly in natural English in 1 to 3 concise sentences.
            Look directly at the scene and answer ONLY what the user asked about the floor, carpet, rug, desk, background, colors, textures, hands, or objects in view.
            Do NOT dump unrequested Modbus readings or sensor specifications unless asked.
            """
            let userWithScene = """
            Optical scene analysis cues: \(sceneDesc)
            User question: \(query)
            Answer directly and naturally in English:
            """
            if vlmRunning, let baseURL = vlmBaseURL,
               let out = queryOpenAICompatibleVLM(baseURL: baseURL, systemPrompt: sysPrompt, history: Array(history.suffix(6)), userText: userWithScene, imageJpeg: rawCameraJpeg, maxTokens: 145) {
                replyText = out
            } else if let appleOut = queryAppleFoundationModel(systemPrompt: sysPrompt, history: Array(history.suffix(6)), userText: userWithScene) {
                replyText = appleOut
                modelUsed = "Apple Vision + FoundationModels · iPad M4"
            } else {
                replyText = sceneDesc
                modelUsed = "FieldScan Optical Scene Analyzer · iPad M4"
            }

        case .manualLookup:
            let descRes = (catalogDescriptor != nil)
                ? FieldScanManualNavigator.lookupManualInDescriptor(query: query, descriptor: catalogDescriptor!)
                : nil
            if let dr = descRes, (dr["page_out_of_range"] as? Bool) == true {
                replyText = (dr["answer"] as? String) ?? "Requested manual page is out of range."
                modelUsed = "FieldScan Verified Manual Navigator · iPad M4"
                openManual = false
                openManualLightbox = false
            } else if let dr = descRes, (catalogDescriptor?["scene_origin"] as? String) != "bundled_parametric" {
                openManual = (dr["open_manual"] as? Bool) ?? false
                openManualLightbox = (dr["open_manual_lightbox"] as? Bool) ?? false
                primaryPage = dr["manual_page"] as? Int
                citedPages = (dr["cited_pages"] as? [Int]) ?? []
                manualSection = dr["manual_section"] as? [String: Any]
                dynamicCitations = dr["citations"] as? [[String: Any]]
                documentIdOut = dr["document_id"] as? String
                printedPageOut = dr["printed_page"] as? String
                replyText = (dr["answer"] as? String) ?? "Opened verified catalog manual."
                modelUsed = "FieldScan Verified Manual Navigator · iPad M4"
            } else {
                let lookup = FieldScanManualNavigator.lookupManual(for: query, language: "en")
                openManual = lookup.openManual
                openManualLightbox = lookup.openLightbox
                primaryPage = lookup.primaryPage
                citedPages = lookup.citedPages
                manualSection = lookup.sectionDict

                let sysPrompt = """
                You are FieldScan AI, an expert on the TZ THT-02 User's Manual V1.1.
                Respond strictly in clear, natural English in 2 to 4 concise sentences.
                Explicitly state the exact Page number and Section number where the topic is located, confirm that you are opening the datasheet viewer to that page right now, and summarize the verified manual facts accurately.
                Never invent unverified registers or calibration claims beyond the verified manual excerpt.
                """
                let userPrompt = """
                Verified Datasheet Lookup:
                \(lookup.localizedAnswer)

                User question: \(query)
                Answer in English citing the exact Page and Section:
                """
                if vlmRunning, let baseURL = vlmBaseURL,
                   let out = queryOpenAICompatibleVLM(baseURL: baseURL, systemPrompt: sysPrompt, history: Array(history.suffix(6)), userText: userPrompt, imageJpeg: nil, maxTokens: 165) {
                    replyText = out
                } else if let appleOut = queryAppleFoundationModel(systemPrompt: sysPrompt, history: Array(history.suffix(6)), userText: userPrompt) {
                    replyText = appleOut
                    modelUsed = "Apple Intelligence FoundationModels · iPad M4"
                } else {
                    replyText = lookup.localizedAnswer
                    modelUsed = "FieldScan Verified Manual Navigator · iPad M4"
                }
            }

        case .sensorDiagnostics:
            let lookup = FieldScanManualNavigator.lookupManual(for: query, language: "en")
            let (inferredZone, inferredExplode) = Self.inferDiagnosticZone(norm: norm, zoneHint: zoneHint, visionTel: visionTel)
            let isVisualFault = (zoneHint != nil)
                || ((visionTel["anomaly_detected"] as? Bool) == true)
                || ["inspect", "patch", "fault", "broken", "failing", "frayed", "open"].contains(where: { norm.contains($0) })

            if isVisualFault {
                targetZone = inferredZone
            }
            explodePcb = inferredExplode
            if lookup.matched {
                citedPages = lookup.citedPages
                primaryPage = lookup.primaryPage
                manualSection = lookup.sectionDict
                openManual = lookup.openManual
                openManualLightbox = lookup.openLightbox
            } else if let ta = twinAction, let taPage = ta["manual_page"] as? Int {
                citedPages = [taPage]
                primaryPage = taPage
            } else if isVisualFault {
                citedPages = explodePcb ? [5, 6] : (inferredZone == "waterproof_gland_leads" ? [4, 5] : [6, 1, 9])
                primaryPage = citedPages.first
            }

            let liveContext = Self.buildSensorContext(visionTel: visionTel, modbusTel: modbusTel, dipAddr: dipAddr, describeDipFn: describeDipFn)
            let twinHint: String
            if let ta = twinAction,
               let ct = ta["callout_title"] as? String,
               let cb = ta["callout_body"] as? String {
                twinHint = "\n3D Digital Twin Action Applied Live Now: \(ct) — \(cb)"
                if let exp = ta["explode_pcb"] as? Bool {
                    explodePcb = exp
                }
            } else {
                twinHint = ""
            }
            let manualHint = lookup.matched ? "\nVerified Manual Reference: \(lookup.localizedAnswer)" : ""
            let sysPrompt = """
            You are FieldScan AI, an interactive 3D Digital Twin & industrial field engineer for the TZ THT-02 RS-485 sensor on an iPad Air M4.
            Respond strictly in clear, natural English in 2 to 4 concise sentences answering ONLY what the operator asked.
            When a 3D Digital Twin Action is applied, briefly guide the operator through what you are showing on the 3D model so they can replicate it live on camera.
            Rely strictly on the provided live telemetry and verified datasheet facts; never invent SCADA/PLC confirmations or unverified values.
            """
            let userPrompt = """
            Live Bench Telemetry:
            \(liveContext)\(twinHint)\(manualHint)

            Operator question: \(query)
            Answer directly in English:
            """
            let attachImg = isVisualFault ? rawCameraJpeg : nil
            if vlmRunning, let baseURL = vlmBaseURL,
               let out = queryOpenAICompatibleVLM(baseURL: baseURL, systemPrompt: sysPrompt, history: Array(history.suffix(6)), userText: userPrompt, imageJpeg: attachImg, maxTokens: 155) {
                replyText = out
            } else if let appleOut = queryAppleFoundationModel(systemPrompt: sysPrompt, history: Array(history.suffix(6)), userText: userPrompt) {
                replyText = appleOut
                modelUsed = "Apple Intelligence FoundationModels · iPad M4"
            } else {
                let fb = buildSensorDiagnosticFallback(
                    norm: norm,
                    lookup: lookup,
                    twinAction: twinAction,
                    visionTel: visionTel,
                    modbusTel: modbusTel,
                    dipAddr: dipAddr,
                    explodePcb: explodePcb,
                    describeDipFn: describeDipFn
                )
                replyText = fb.answer
                probableCauses = fb.causes
                recommendedActions = fb.actions
                modelUsed = "FieldScan Deterministic Diagnostic Core · iPad M4"
            }
        }

        recordTurn(userQuery: query, assistantReply: replyText, language: lang)

        let maxPages = ((catalogDescriptor?["documents"] as? [[String: Any]])?.compactMap { $0["page_count"] as? Int }.max()) ?? 9
        let citations: [[String: Any]] = dynamicCitations ?? citedPages.filter { (1...max(9, maxPages)).contains($0) }.map { p in
            ["page": p, "label": FieldScanManualNavigator.pageTitles[p] ?? "Page \(p) · Manual V1.1"]
        }
        let dipBitsOut = twinAction?["dip_bits"] as? [Int]

        return [
            "reply_text": replyText,
            "model_used": modelUsed,
            "intent": classified.intent.rawValue,
            "query_mode": classified.intent.rawValue,
            "language": "en",
            "clarification_required": false,
            "probable_causes": probableCauses,
            "recommended_actions": recommendedActions,
            "target_zone": targetZone as Any,
            "explode_pcb": explodePcb,
            "dip_bits": dipBitsOut as Any,
            "twin_action": twinAction as Any,
            "twin_action_v1": twinActionV1 as Any,
            "turn_id": preparedVisual["turn_id"] ?? "",
            "scene_generation": preparedVisual["scene_generation"] ?? sceneGeneration,
            "manifest_sha256": preparedVisual["manifest_sha256"] ?? "",
            "document_id": documentIdOut as Any,
            "printed_page": printedPageOut as Any,
            "open_manual": openManual,
            "open_manual_lightbox": openManualLightbox,
            "manual_page": primaryPage as Any,
            "manual_section": manualSection as Any,
            "citations": citations,
        ]
    }

    // MARK: - Private LLM Transports & Deterministic English Fallbacks

    private func queryOpenAICompatibleVLM(
        baseURL: String,
        systemPrompt: String,
        history: [[String: String]],
        userText: String,
        imageJpeg: Data?,
        maxTokens: Int
    ) -> String? {
        guard let url = URL(string: "\(baseURL)/v1/chat/completions") else { return nil }
        let hasImg = (imageJpeg != nil && !(imageJpeg!.isEmpty))
        let timeoutSec: TimeInterval = hasImg ? 9.5 : 5.5

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = timeoutSec
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var messages: [[String: Any]] = [
            ["role": "system", "content": systemPrompt],
        ]
        for turn in history {
            messages.append(turn)
        }

        if let imgData = imageJpeg, let b64 = Self.downscaleJpegB64(imgData, maxDimension: 512.0) {
            messages.append([
                "role": "user",
                "content": [
                    ["type": "image_url", "image_url": ["url": "data:image/jpeg;base64,\(b64)"]],
                    ["type": "text", "text": userText],
                ],
            ])
        } else {
            messages.append(["role": "user", "content": userText])
        }

        let payload: [String: Any] = [
            "model": "Qwen3-VL-4B-Instruct",
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": maxTokens,
            "chat_template_kwargs": ["enable_thinking": false],
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        let sema = DispatchSemaphore(value: 0)
        var outText: String?
        URLSession.shared.dataTask(with: request) { data, resp, err in
            defer { sema.signal() }
            guard err == nil,
                  let http = resp as? HTTPURLResponse, http.statusCode == 200,
                  let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let msg = choices.first?["message"] as? [String: Any],
                  let content = msg["content"] as? String else {
                return
            }
            let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                outText = trimmed
            }
        }.resume()

        _ = sema.wait(timeout: .now() + timeoutSec + 0.15)
        return outText
    }

    private func queryAppleFoundationModel(
        systemPrompt: String,
        history: [[String: String]],
        userText: String
    ) -> String? {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, macOS 26.0, *) {
            guard SystemLanguageModel.default.isAvailable else { return nil }
            var historyTranscript = ""
            if !history.isEmpty {
                let lines = history.suffix(6).map { turn -> String in
                    let r = (turn["role"] == "user") ? "User" : "Assistant"
                    return "\(r): \(turn["content"] ?? "")"
                }
                historyTranscript = "\nRecent conversation context:\n" + lines.joined(separator: "\n")
            }

            final class StringBox: @unchecked Sendable {
                private let lck = NSLock()
                private var val: String?
                func set(_ s: String) { lck.lock(); val = s; lck.unlock() }
                func get() -> String? { lck.lock(); defer { lck.unlock() }; return val }
            }
            let sema = DispatchSemaphore(value: 0)
            let box = StringBox()
            let genTask = Task.detached(priority: .userInitiated) {
                defer { sema.signal() }
                do {
                    let session = LanguageModelSession(instructions: systemPrompt + historyTranscript)
                    let resp = try await session.respond(to: userText)
                    if Task.isCancelled { return }
                    let text = resp.content.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !text.isEmpty {
                        box.set(text)
                    }
                } catch {
                    // FoundationModels unavailable on this locale/state
                }
            }
            let waitRes = sema.wait(timeout: .now() + 4.2)
            if waitRes == .timedOut {
                genTask.cancel()
            }
            return box.get()
        }
        #endif
        return nil
    }

    private func buildNaturalGeneralFallback(
        norm: String,
        subintent: String,
        history: [[String: String]]
    ) -> String {
        let localTime = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .short)
        let localDate = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .none)

        if subintent == "time_date" {
            return "It is currently \(localTime) on \(localDate). How can I help you?"
        }

        if ["what did i just ask", "talking about", "previous question", "last question"].contains(where: { norm.contains($0) }) {
            if let lastUser = history.last(where: { $0["role"] == "user" })?["content"] {
                return "Right before this, you mentioned: \"\(lastUser)\". Want to continue on that?"
            }
        }

        let greetPattern = "^(hey|hi|hello|good\\s+morning|good\\s+afternoon|good\\s+evening|how\\s+are\\s+you|who\\s+are\\s+you|what\\s+can\\s+you\\s+do)\\b"
        if norm.range(of: greetPattern, options: .regularExpression) != nil {
            return "Hello! I'm FieldScan AI running locally on your iPad Air M4. Ask me in English to manipulate the 3D Digital Twin, inspect anything on the live camera, jump to a datasheet section, or check Modbus telemetry."
        }

        let trimmedNorm = norm.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedNorm.isEmpty {
            let shortEcho = String(trimmedNorm.prefix(70))
            return "I heard \"\(shortEcho)\". Tell me if you want me to open a datasheet page, inspect the camera view, rotate or explode the 3D sensor twin, or check Modbus readings."
        }
        return "I'm listening—tell me which datasheet section, 3D sensor zone, or Modbus reading you want to inspect."
    }

    private func buildSensorDiagnosticFallback(
        norm: String,
        lookup: FieldScanManualLookupResult,
        twinAction: [String: Any]?,
        visionTel: [String: Any],
        modbusTel: [String: Any],
        dipAddr: Int,
        explodePcb: Bool,
        describeDipFn: (Int) -> [String: Any]
    ) -> (answer: String, causes: [String], actions: [String]) {
        if let ta = twinAction,
           let ct = ta["callout_title"] as? String,
           let cb = ta["callout_body"] as? String {
            return (
                "I've updated the 3D Digital Twin (\(ct)): \(cb) You can replicate this step directly in front of the live camera.",
                [],
                []
            )
        }

        if lookup.matched && !norm.contains("status") && !norm.contains("reading") {
            return (lookup.localizedAnswer, [], [])
        }

        let mbHealthy = (modbusTel["healthy"] as? Bool) ?? false
        let mbFresh = (modbusTel["fresh"] as? Bool) ?? mbHealthy
        let isSim = (modbusTel["simulation"] as? Bool) ?? false
        let tempOpt = modbusTel["temp_c"] as? Double
        let humOpt = modbusTel["humidity_rh"] as? Double
        let statusLbl = (modbusTel["status_label"] as? String) ?? "NO RESPONSE"
        let sensorDet = (visionTel["detected"] as? Bool) ?? false
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false

        if explodePcb || norm.contains("dip") || norm.contains("slave") || norm.contains("pin") {
            let desc = describeDipFn(dipAddr)
            let binStr = (desc["dip_binary"] as? String) ?? "00000001"
            let instrEN = (desc["instruction_en"] as? String) ?? "Set Pins 1..7 OFF and Pin 8 ON"
            return (
                "I've opened the 3D Digital Twin to the SW1 DIP-8 PCB: for Modbus Slave #\(dipAddr) (binary \(binStr) on register 0x0004), \(instrEN.lowercased()) using weights [128, 64, 32, 16, 8, 4, 2, 1] (Page 5, Section 5.1).",
                ["Pin 1 is MSB (128) and Pin 8 is LSB (1); all OFF sets invalid address 0."],
                ["Apply \(instrEN) and cycle 5–24 V DC power."]
            )
        }

        let busPart: String
        if mbHealthy && mbFresh, let t = tempOpt, let h = humOpt {
            let prov = isSim ? " [simulation]" : " [live bench]"
            busPart = String(format: "Modbus Slave #%d%@ is reporting %.1f °C and %.1f %%RH.", dipAddr, prov, t, h)
        } else {
            busPart = "RS-485/Modbus bus has no active response (\(statusLbl), target Slave #\(dipAddr))."
        }
        let camPart = sensorDet
            ? (pcbOpen ? "Optical camera tracks the sensor with internal DIP-8 PCB exposed." : "Optical camera has a lock on the cylindrical sensor housing.")
            : "Optical camera does not currently see the sensor in frame."
        return ("\(busPart) \(camPart)", [], [])
    }

    private static func inferDiagnosticZone(norm: String, zoneHint: String?, visionTel: [String: Any]) -> (String, Bool) {
        if let h = zoneHint?.trimmingCharacters(in: .whitespacesAndNewlines), !h.isEmpty {
            let mapped = h == "seal_ring" ? "upper_seal_ring" : (h == "middle_barrel" ? "lower_barrel_rs485" : h)
            return (mapped, mapped == "upper_barrel_dip" || ((visionTel["pcb_open_detected"] as? Bool) ?? false))
        }
        if ["dip", "switch", "pin", "pins", "slave", "address", "pcb", "unscrew", "explode"].contains(where: { norm.contains($0) }) {
            return ("upper_barrel_dip", true)
        }
        if ["tip", "strainer", "filter", "sintered", "sht30", "probe", "main sensor", "7fff", "patch"].contains(where: { norm.contains($0) }) {
            return ("strainer_head", false)
        }
        if (visionTel["pcb_open_detected"] as? Bool) == true {
            return ("upper_barrel_dip", true)
        }
        if (visionTel["anomaly_detected"] as? Bool) == true,
           let az = visionTel["anomaly_zone"] as? String, !az.isEmpty {
            return (az, az == "upper_barrel_dip")
        }
        if ["cable", "wire", "wiring", "lead", "gland", "back", "rear", "gnd", "ground", "frayed"].contains(where: { norm.contains($0) }) {
            return ("waterproof_gland_leads", false)
        }
        if ["flange", "bracket", "mount", "mounting"].contains(where: { norm.contains($0) }) {
            return ("mounting_flange", false)
        }
        if ["baud", "crc", "modbus", "rs485", "rs-485"].contains(where: { norm.contains($0) }) {
            return ("lower_barrel_rs485", false)
        }
        return ("strainer_head", false)
    }

    private static func buildSensorContext(
        visionTel: [String: Any],
        modbusTel: [String: Any],
        dipAddr: Int,
        describeDipFn: (Int) -> [String: Any]
    ) -> String {
        let sensorDet = (visionTel["detected"] as? Bool) ?? false
        let angleDeg = (visionTel["angle_deg"] as? Double) ?? 0.0
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false
        let mbOnline = (modbusTel["online"] as? Bool) ?? false
        let mbHealthy = (modbusTel["healthy"] as? Bool) ?? false
        let isSim = (modbusTel["simulation"] as? Bool) ?? false
        let tempStr = (modbusTel["temp_c"] as? Double).map { String(format: "%.1f C", $0) } ?? "N/A"
        let humStr = (modbusTel["humidity_rh"] as? Double).map { String(format: "%.1f %%RH", $0) } ?? "N/A"
        let statusLbl = (modbusTel["status_label"] as? String) ?? "STANDBY"
        let dipInfo = describeDipFn(dipAddr)
        let dipBin = (dipInfo["dip_binary"] as? String) ?? "00000001"

        return """
        Camera: sensorDetected=\(sensorDet), angle=\(String(format: "%+.1f", angleDeg)) deg, pcbOpen=\(pcbOpen).
        Modbus: online=\(mbOnline), healthy=\(mbHealthy), simulation=\(isSim), temp=\(tempStr), humidity=\(humStr), targetSlave=#\(dipAddr) (DIP binary \(dipBin)), status=\(statusLbl).
        """
    }

    private static func downscaleJpegB64(_ rawData: Data, maxDimension: CGFloat) -> String? {
        guard !rawData.isEmpty else { return nil }
        #if canImport(UIKit)
        guard let img = UIImage(data: rawData) else {
            return rawData.base64EncodedString()
        }
        let w = max(1.0, img.size.width)
        let h = max(1.0, img.size.height)
        let scale = min(1.0, maxDimension / max(w, h))
        let targetSize = CGSize(width: (w * scale).rounded(), height: (h * scale).rounded())
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1.0
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: targetSize, format: format)
        let scaled = renderer.image { _ in
            img.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return (scaled.jpegData(compressionQuality: 0.84) ?? rawData).base64EncodedString()
        #else
        return rawData.base64EncodedString()
        #endif
    }
}
