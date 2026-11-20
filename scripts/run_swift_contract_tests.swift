import Foundation
import CoreGraphics

// ============================================================================
// FieldScan CAD v2.1 — Native Swift Contract & Parity Verification Runner
// Compiles directly against `ModbusTCPClient.swift` and `FieldScanSessionEngine.swift`
// to validate `DAT-01..09`, `BUS-02..08`, `BUS-12`, `VOZ-01..07`, `EXP-01..06`, `CAL-00..09`.
// ============================================================================

@inline(__always)
func check(_ cond: Bool, _ msg: String, file: String = #file, line: Int = #line) {
    if !cond {
        fputs("[SWIFT_CONTRACT_FAIL] \(file):\(line) — \(msg)\n", stderr)
        exit(1)
    }
}

func runSwiftContractSuite() throws {
    let fm = FileManager.default
    let tmpDir = fm.temporaryDirectory.appendingPathComponent("fieldscan_swift_test_\(UUID().uuidString)", isDirectory: true)
    try fm.createDirectory(at: tmpDir, withIntermediateDirectories: true)
    defer { try? fm.removeItem(at: tmpDir) }

    // Create orphan .tmp file before booting engine (`DAT-07`)
    let exportsDir = tmpDir.appendingPathComponent("exports", isDirectory: true)
    try fm.createDirectory(at: exportsDir, withIntermediateDirectories: true)
    let orphanTmp = exportsDir.appendingPathComponent("crash_leftover.pdf.tmp")
    try Data("partial".utf8).write(to: orphanTmp)

    let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
    let engine = FieldScanSessionEngine(baseDirectory: tmpDir, bundleRoot: repoRoot)

    check(!fm.fileExists(atPath: orphanTmp.path), "DAT-07: Orphan .tmp file must be cleaned on engine init")

    // 1. Resource manifest & manual citation verification (`OFF-08`, `VIS-10`)
    let manifestCheck = engine.verifyResourceManifest()
    check((manifestCheck["verified"] as? Bool) == true, "OFF-08: Bundle resource manifest must verify cleanly: \(manifestCheck)")

    let tht02Prof = engine.resolveDeviceProfile("TZ THT-02")
    check((tht02Prof["profile_id"] as? String) == "tzone_tht02", "Profile resolution for TZ THT-02")
    let citValid = engine.verifyAndResolveCitations(profile: tht02Prof, requestedPages: [4, 5, 9])
    check((citValid["verified"] as? Bool) == true, "VIS-10: Valid manual pages 4,5,9 must verify SHA-256")
    let citInvalid = engine.verifyAndResolveCitations(profile: tht02Prof, requestedPages: [99])
    check((citInvalid["instruction_blocked"] as? Bool) == true, "VIS-10: Missing page 99 must block instruction")

    // 2. Unverified / unknown device profile gate (`FLU-04`)
    let tht03Prof = engine.resolveDeviceProfile("THT03R")
    check((tht03Prof["identity_pending"] as? Bool) == true, "FLU-04: THT03R must remain identity_pending until bench-verified")
    let unkSession = try engine.createSession(payload: ["model": "Unknown Sensor X900"])
    let unkId = unkSession["session_id"] as! String
    var blockedDecode = false
    do {
        _ = try engine.recordModbusObservation(sessionId: unkId, modbusTel: ["online": true, "temp_c": 24.5, "humidity_rh": 50.0])
    } catch let err as FieldScanDomainError {
        blockedDecode = (err.code == "PROFILE_MISMATCH")
    }
    check(blockedDecode, "FLU-04: Unknown profile must block automatic register scaling")

    // 3. Modbus TCP MBAP framing: split header, concatenated frames, raw-RTU guard, per-channel 0x7FFF, pilot write block (`BUS-02..08`, `BUS-12`)
    let reqFrame = try ModbusTCPStreamParser.buildMBAPReadHoldingRequest(transactionId: 0x0042, unitId: 1, startReg: 0, count: 8)
    check(reqFrame.count == 12, "BUS-02: MBAP FC03 request must be 12 bytes (no RTU CRC)")

    var writeBlocked = false
    do {
        _ = try ModbusTCPStreamParser.buildMBAPReadHoldingRequest(transactionId: 1, unitId: 1, startReg: 5, count: 1, pilotReadonly: true, functionCode: 0x06)
    } catch let fe as ModbusTCPFramingError {
        writeBlocked = (fe.errorCode == "PILOT_WRITE_BLOCKED")
    }
    check(writeBlocked, "BUS-12: Function 0x06 must be blocked in pilot read-only mode")

    let port5502Client = ModbusTCPClient(host: "127.0.0.1", port: 5502)
    let p5502Res = port5502Client.readTHT02Holding(unitId: 1)
    check((p5502Res["error_code"] as? String) == "PROTOCOL_MISMATCH", "BUS-03: Port 5502 must be refused with PROTOCOL_MISMATCH")

    // Build two valid MBAP responses: Frame 1 = (25.0 C, 60.0 %RH), Frame 2 = Exception 0x02
    let f1Payload: [UInt8] = [
        0x00, 0x42, 0x00, 0x00, 0x00, 0x13, 0x01, 0x03, 0x10,
        0x00, 0xFA, // 25.0 C
        0x02, 0x58, // 60.0 %RH
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x25, 0x80, 0x06, 0x00, 0x00, 0x0B
    ]
    let f2Exc: [UInt8] = [0x00, 0x43, 0x00, 0x00, 0x00, 0x03, 0x01, 0x83, 0x02]

    let parser = ModbusTCPStreamParser()
    // BUS-04: Split 7-byte MBAP header across 3 chunks
    let partA = try parser.feed(Data(f1Payload[0..<3]))
    check(partA.isEmpty, "BUS-04: Partial 3-byte MBAP header should buffer without emitting")
    let partB = try parser.feed(Data(f1Payload[3..<7]))
    check(partB.isEmpty, "BUS-04: 7-byte header without PDU should wait for payload")
    let partC = try parser.feed(Data(f1Payload[7..<f1Payload.count]))
    check(partC.count == 1 && partC[0].transactionId == 0x0042 && !partC[0].isException, "BUS-04: Split MBAP frame reassembled")
    let dec1 = try ModbusTCPStreamParser.decodeTHT02PDURegisters(unitId: 1, pduPayload: partC[0].pduPayload)
    check((dec1["temp_c"] as? Double) == 25.0 && (dec1["humidity_rh"] as? Double) == 60.0, "BUS-04: Register decode 25.0C / 60.0%RH")

    // BUS-05: Two concatenated MBAP frames in a single read
    let combined = Data(f1Payload + f2Exc)
    let multi = try parser.feed(combined)
    check(multi.count == 2 && !multi[0].isException && multi[1].isException && multi[1].exceptionCode == 0x02, "BUS-05/BUS-07: Multi-frame + exception 0x02")

    // BUS-08: Per-channel 0x7FFF sentinel
    let partial7fffPDU = Data([
        0x10,
        0x7F, 0xFF, // Temp = 0x7FFF sentinel
        0x02, 0x00, // RH = 51.2 %RH valid
        0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x25, 0x80, 0x06, 0x00, 0x00, 0x0B
    ])
    let dec7fff = try ModbusTCPStreamParser.decodeTHT02PDURegisters(unitId: 1, pduPayload: partial7fffPDU)
    check((dec7fff["temp_quality"] as? String) == "invalid_sentinel_7fff" && (dec7fff["humidity_rh"] as? Double) == 51.2, "BUS-08: Per-channel 0x7FFF quality")

    // 4. Authoritative Session Lifecycle, Idempotency, Bilingual Voice, Grounding & Export (`DAT-01..09`, `VOZ-01..07`, `EXP-01..06`)
    let s1 = try engine.createSession(payload: [
        "profile_id": "tzone_tht02",
        "serial_number": "THT02-SN998877",
        "transport_mode": "pusr_tcp",
        "idempotency_key": "swift-create-1"
    ])
    let s1Replay = try engine.createSession(payload: [
        "profile_id": "tzone_tht02",
        "serial_number": "THT02-SN998877",
        "transport_mode": "pusr_tcp",
        "idempotency_key": "swift-create-1"
    ])
    let sid = s1["session_id"] as! String
    check((s1Replay["session_id"] as? String) == sid && (s1Replay["idempotent_replay"] as? Bool) == true, "DAT-08: Idempotent session creation replay")

    var conflictCaught = false
    do {
        _ = try engine.createSession(payload: [
            "profile_id": "tzone_tht02",
            "serial_number": "DIFFERENT-SN",
            "transport_mode": "pusr_tcp",
            "idempotency_key": "swift-create-1"
        ])
    } catch let err as FieldScanDomainError {
        conflictCaught = (err.code == "IDEMPOTENCY_CONFLICT" && err.statusCode == 409)
    }
    check(conflictCaught, "DAT-08: Reusing idempotency key with different payload must return 409 IDEMPOTENCY_CONFLICT")

    // Bilingual Spanish utterance with Unicode escapes (`VOZ-01`, `VOZ-02`)
    let esPage4 = "Mu\u{00E9}strame la p\u{00E1}gina 4"
    let parsedEs = FieldScanSessionEngine.classifyBilingualVoiceIntent(esPage4, currentLanguage: "en")
    check((parsedEs["intent"] as? String) == "show_manual" && (parsedEs["page"] as? Int) == 4 && (parsedEs["detected_language"] as? String) == "es", "VOZ-01/02: Spanish page 4 intent")

    let ambNum = FieldScanSessionEngine.classifyBilingualVoiceIntent("25", currentLanguage: "en")
    check((ambNum["ambiguous"] as? Bool) == true, "VOZ-04: Bare number without unit must require clarification")

    // TTS echo rejection (`VOZ-06`)
    engine.registerTTSPlayback("Sensor communication observed on Slave Address 1", estimatedDurationS: 1.5)
    let echoRes = try engine.applyAction(sessionId: sid, payload: [
        "action": "voice_utterance",
        "utterance": "Sensor communication observed on Slave Address 1"
    ])
    check((echoRes["ignored"] as? Bool) == true, "VOZ-06: TTS acoustic echo must be ignored")
    engine.setAudioState("idle")

    // Grounding filter (`IA-04`)
    let grounded = engine.applyDeterministicGroundingFilter(
        candidateText: "SCADA online verified calibrated values per Page 14.",
        profile: tht02Prof,
        verifiedTelemetry: ["online": false]
    )
    check((grounded["grounding_corrected"] as? Bool) == true, "IA-04: Hallucinated Page 14 and SCADA/calibrated claims must be blocked")

    // Unconfirmed observation -> 0 confirmed changes (`DAT-03`)
    _ = try engine.applyAction(sessionId: sid, payload: ["action": "confirm_identity"])
    _ = try engine.applyAction(sessionId: sid, payload: ["action": "record_as_found", "communication": "responded"])
    _ = try engine.applyAction(sessionId: sid, payload: ["action": "record_observation", "note_text": "Suggested inspecting DIP-8 pin 8"])
    _ = try engine.recordModbusObservation(sessionId: sid, modbusTel: [
        "online": true,
        "temp_c": 24.8,
        "humidity_rh": 53.4,
        "temp_quality": "valid",
        "humidity_quality": "valid",
        "slave_id": 1,
        "protocol": "modbus_tcp_mbap",
        "source": "hardware:pusr_tcp:192.168.0.7:502",
        "simulation": false
    ])

    // Public demo export masks serial (`EXP-04`) & 0 confirmed changes (`DAT-03`)
    let expDemo = try engine.exportSessionDossier(sessionId: sid, payload: ["audience": "public_demo"])
    check((expDemo["confirmed_changes_count"] as? Int) == 0, "DAT-03: Unconfirmed observation must have 0 confirmed changes")
    let jsonURL = URL(fileURLWithPath: expDemo["json_path"] as! String)
    let jsonObj = try JSONSerialization.jsonObject(with: Data(contentsOf: jsonURL)) as! [String: Any]
    let devObj = jsonObj["device"] as! [String: Any]
    check((devObj["serial_number"] as? String) == "**********8877", "EXP-04: Public demo audience must mask serial number")

    // Canonical share path (`EXP-05`)
    check(engine.resolveAuthorizedExportFile(named: "../Info.plist") == nil, "EXP-05: Path traversal must be rejected")
    check(engine.resolveAuthorizedExportFile(named: jsonURL.lastPathComponent) != nil, "EXP-05: Authorized export file must resolve")

    // Planned calibration extension (`CAL-00..09`)
    let calTzone = FieldScanSessionEngine.evaluateCalibrationComparisonContract(payload: [
        "profile_id": "tzone_tht02",
        "quantity": "temperature",
        "evaluated_at_utc": "2026-11-19T00:00:00Z",
        "reference": [
            "instrument_id": "FLUKE-971",
            "certificate_id": "CERT-2026-01",
            "valid_until_utc": "2027-06-01T00:00:00Z",
            "uncertainty": 0.1,
            "unit": "Cel",
            "samples": [["value": 25.0, "ts_s": 1.0], ["value": 25.02, "ts_s": 2.0]]
        ],
        "uut": [
            "unit": "Cel",
            "samples": [["value": 25.3, "ts_s": 1.1], ["value": 25.32, "ts_s": 2.1]]
        ]
    ])
    check((calTzone["status_code"] as? String) == "READONLY_COMPARISON_COMPLETE" && (calTzone["writes_emitted"] as? Int) == 0, "CAL-03: TZONE read-only comparison")

    // 5. Shared Golden Fixture Corpus (`DAT-09`, `BUS-04..08`, `VOZ-01..10`)
    let goldenURL = repoRoot.appendingPathComponent("knowledge/fixtures/golden_contracts_v2_1.json")
    let goldenData = try Data(contentsOf: goldenURL)
    let goldenRoot = try JSONSerialization.jsonObject(with: goldenData) as! [String: Any]
    check((goldenRoot["contract_version"] as? String) == FieldScanSessionEngine.contractVersion, "DAT-09: Golden fixture contract_version match")

    let mbapVectors = goldenRoot["mbap_vectors"] as! [[String: Any]]
    var mbapPassed = 0
    for vec in mbapVectors {
        let hexStr = (vec["frame_hex"] as! String).replacingOccurrences(of: " ", with: "")
        var rawBytes: [UInt8] = []
        var idx = hexStr.startIndex
        while idx < hexStr.endIndex {
            let nextIdx = hexStr.index(idx, offsetBy: 2)
            rawBytes.append(UInt8(hexStr[idx..<nextIdx], radix: 16)!)
            idx = nextIdx
        }
        let vecParser = ModbusTCPStreamParser()
        let frames = try vecParser.feed(Data(rawBytes))
        check(frames.count == 1, "DAT-09 MBAP vector \(vec["id"] ?? "") frame count")
        let exp = vec["expected"] as! [String: Any]
        check(Int(frames[0].transactionId) == (exp["transaction_id"] as! Int), "DAT-09 MBAP TxID")
        check(frames[0].isException == (exp["is_exception"] as! Bool), "DAT-09 MBAP exception flag")
        if frames[0].isException {
            check(Int(frames[0].exceptionCode ?? 0) == (exp["exception_code"] as! Int), "DAT-09 MBAP exception code")
        } else {
            let dec = try ModbusTCPStreamParser.decodeTHT02PDURegisters(unitId: frames[0].unitId, pduPayload: frames[0].pduPayload)
            check((dec["temp_quality"] as? String) == (exp["temp_quality"] as? String), "DAT-09 MBAP temp_quality")
            check((dec["humidity_quality"] as? String) == (exp["humidity_quality"] as? String), "DAT-09 MBAP humidity_quality")
            if let expT = exp["temp_c"] as? Double {
                check(abs(((dec["temp_c"] as? Double) ?? -999.0) - expT) < 0.001, "DAT-09 MBAP temp_c")
            } else {
                check((dec["temp_c"] is NSNull) || dec["temp_c"] == nil, "DAT-09 MBAP nil temp_c on 0x7FFF")
            }
            if let expH = exp["humidity_rh"] as? Double {
                check(abs(((dec["humidity_rh"] as? Double) ?? -999.0) - expH) < 0.001, "DAT-09 MBAP humidity_rh")
            }
        }
        mbapPassed += 1
    }

    var intentLatenciesMs: [Double] = []
    func verifyCorpus(_ items: [[String: Any]], expectedLang: String) -> Int {
        var passed = 0
        for item in items {
            let utt = item["utterance"] as! String
            let t0 = CFAbsoluteTimeGetCurrent()
            let parsed = FieldScanSessionEngine.classifyBilingualVoiceIntent(utt, currentLanguage: expectedLang == "es" ? "en" : "es")
            let dtMs = (CFAbsoluteTimeGetCurrent() - t0) * 1000.0
            intentLatenciesMs.append(dtMs)
            let gotIntent = parsed["intent"] as? String
            let expIntent = item["expected_intent"] as! String
            let gotLang = parsed["detected_language"] as? String
            check(gotIntent == expIntent, "VOZ golden intent mismatch for '\(utt)': got \(String(describing: gotIntent)), expected \(expIntent)")
            check(gotLang == expectedLang, "VOZ golden language mismatch for '\(utt)': got \(String(describing: gotLang)), expected \(expectedLang)")
            if let expPage = item["expected_page"] as? Int {
                check((parsed["page"] as? Int) == expPage, "VOZ golden page mismatch for '\(utt)'")
            }
            if let expComp = item["expected_component"] as? String {
                check((parsed["component_3d_id"] as? String) == expComp, "VOZ golden component mismatch for '\(utt)'")
            }
            if let expTarget = item["expected_target_language"] as? String {
                check((parsed["target_language"] as? String) == expTarget, "VOZ golden target_language mismatch for '\(utt)'")
            }
            passed += 1
        }
        return passed
    }

    let enCorpus = goldenRoot["voice_corpus_en"] as! [[String: Any]]
    let esCorpus = goldenRoot["voice_corpus_es"] as! [[String: Any]]
    let advCorpus = goldenRoot["voice_adversarial"] as! [[String: Any]]
    let enPassed = verifyCorpus(enCorpus, expectedLang: "en")
    let esPassed = verifyCorpus(esCorpus, expectedLang: "es")

    var advPassed = 0
    for item in advCorpus {
        let utt = item["utterance"] as! String
        let parsed = FieldScanSessionEngine.classifyBilingualVoiceIntent(utt, currentLanguage: "en")
        if let expAmb = item["expected_ambiguous"] as? Bool, expAmb {
            check((parsed["ambiguous"] as? Bool) == true, "VOZ adversarial ambiguous expected for '\(utt)'")
            check((parsed["clarification_reason"] as? String) == (item["expected_reason"] as? String), "VOZ adversarial reason mismatch for '\(utt)'")
        }
        if let expBypass = item["expected_bypass_blocked"] as? Bool, expBypass {
            check((parsed["bypass_blocked"] as? Bool) == true, "VOZ adversarial bypass_blocked expected for '\(utt)'")
            check((parsed["intent"] as? String) == (item["expected_intent"] as? String), "VOZ adversarial intent mismatch for '\(utt)'")
        }
        advPassed += 1
    }

    let sortedLat = intentLatenciesMs.sorted()
    let medianMs = sortedLat[sortedLat.count / 2]
    let p95Idx = min(sortedLat.count - 1, Int(Double(sortedLat.count) * 0.95))
    let p95Ms = sortedLat[p95Idx]

    // 9. Modular 100% English Intent, Interactive 3D Digital Twin, Manual Auto-Open & Carpet-Proof Vision Verification
    let hearIntent = FieldScanConversationEngine.classifyIntent(query: "Can you hear me?")
    check(hearIntent.intent == .generalChat && hearIntent.language == "en", "Anti-Parrot: hearing check must be general_chat EN")

    let carpetIntent = FieldScanConversationEngine.classifyIntent(query: "Can you see what is on the carpet under the sensor?")
    check(carpetIntent.intent == .sceneVision && carpetIntent.language == "en", "Scene-Vision: carpet question must route to scene_vision EN")

    let calIntent = FieldScanConversationEngine.classifyIntent(query: "Where in the datasheet is the calibration section located?")
    check(calIntent.intent == .manualLookup && calIntent.language == "en", "Manual-Lookup: calibration datasheet query must route to manual_lookup EN")

    let calLookup = FieldScanManualNavigator.lookupManual(for: "Where in the datasheet is the calibration section?")
    check(calLookup.matched && calLookup.openManual && calLookup.openLightbox && calLookup.primaryPage == 3, "ManualNavigator: calibration must auto-open Page 3 Section 3.1")

    // Verify 1:1 Swift FieldScanTwinController parity for DIP-8, rear cable, main probe, X-ray, and close
    let twinDip = FieldScanTwinController.resolveTwinAction(
        query: "Show me how to configure the pins for Slave 3",
        zoneHint: nil,
        currentDipAddress: 1
    )
    check((twinDip?["focus_zone"] as? String) == "upper_barrel_dip" && (twinDip?["explode_pcb"] as? Bool) == true && (twinDip?["open_dip_pip"] as? Bool) == true, "TwinController: DIP-8 configuration must explode housing & open PiP")
    check((twinDip?["dip_bits"] as? [Int]) == [0, 0, 0, 0, 0, 0, 1, 1], "TwinController: Slave #3 must set DIP bits [0,0,0,0,0,0,1,1]")

    let twinRear = FieldScanTwinController.resolveTwinAction(
        query: "Show me at the back how the cable connects",
        zoneHint: nil,
        currentDipAddress: 1
    )
    check((twinRear?["focus_zone"] as? String) == "waterproof_gland_leads" && (twinRear?["camera_pose"] as? String) == "rear_wiring", "TwinController: rear cable must orbit 3D camera to waterproof_gland_leads")

    let twinMain = FieldScanTwinController.resolveTwinAction(
        query: "I want to see the main sensor probe and how it is placed",
        zoneHint: nil,
        currentDipAddress: 1
    )
    check((twinMain?["focus_zone"] as? String) == "strainer_head" && (twinMain?["camera_pose"] as? String) == "tip_closeup", "TwinController: main sensor must orbit 3D camera to strainer_head")

    let twinClose = FieldScanTwinController.resolveTwinAction(
        query: "Close the housing and reset view",
        zoneHint: nil,
        currentDipAddress: 1
    )
    check((twinClose?["action"] as? String) == "reset_view" && (twinClose?["explode_pcb"] as? Bool) == false, "TwinController: close housing must reset 3D twin")

    // Synthesize textured carpet frame (960x540) WITHOUT sensor -> must reject carpet (`sensorDetected == false`)
    let cw = 960, ch = 540
    var carpetPixels = [UInt8](repeating: 0, count: cw * ch * 4)
    for y in 0..<ch {
        for x in 0..<cw {
            let p = (y * cw + x) * 4
            let noise = Int(((x * 37 + y * 91) % 45) - 22)
            let weave = (x % 3 == 0) ? 14 : 0
            carpetPixels[p] = UInt8(max(0, min(255, 162 + noise + weave)))
            carpetPixels[p + 1] = UInt8(max(0, min(255, 134 + noise + weave)))
            carpetPixels[p + 2] = UInt8(max(0, min(255, 106 + noise + weave)))
            carpetPixels[p + 3] = 255
        }
    }
    let cs = CGColorSpaceCreateDeviceRGB()
    let detector = FieldScanVisionDetector()
    let emptyCarpetCG: CGImage = carpetPixels.withUnsafeMutableBytes { ptr in
        let ctx = CGContext(data: ptr.baseAddress, width: cw, height: ch, bitsPerComponent: 8, bytesPerRow: cw * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        return ctx.makeImage()!
    }
    let carpetOnlyRes = detector.analyzeCGImage(emptyCarpetCG, outputWidth: cw, outputHeight: ch)!
    check(carpetOnlyRes.sensorDetected == false, "VisionDetector: textured carpet without sensor MUST NOT false-detect")
    check(carpetOnlyRes.grainScore >= 4.0, "VisionDetector: textured carpet grain score must reflect fibrous texture")

    // Now place cylindrical TZ THT-02 with open teal/blue SW1 DIP-8 PCB + 8 bright pins on the textured carpet at (x: 180..560, y: 175..223 -> center ~ (370, 199))
    for y in 175..<223 {
        for x in 180..<560 {
            let p = (y * cw + x) * 4
            if x >= 355 && x < 435 && y >= 180 && y < 218 {
                if x >= 366 && x < 424 && y >= 187 && y < 211 {
                    let relX = x - 370
                    let isPin = (y >= 189 && y < 196 && relX >= 0 && relX < 48 && (relX % 6) < 3)
                    if isPin {
                        carpetPixels[p] = 248; carpetPixels[p + 1] = 248; carpetPixels[p + 2] = 248
                    } else {
                        carpetPixels[p] = 168; carpetPixels[p + 1] = 32; carpetPixels[p + 2] = 36
                    }
                } else {
                    carpetPixels[p] = 16; carpetPixels[p + 1] = 95; carpetPixels[p + 2] = 172
                }
            } else {
                carpetPixels[p] = 226; carpetPixels[p + 1] = 224; carpetPixels[p + 2] = 220
            }
        }
    }
    let sensorOnCarpetCG: CGImage = carpetPixels.withUnsafeMutableBytes { ptr in
        let ctx = CGContext(data: ptr.baseAddress, width: cw, height: ch, bitsPerComponent: 8, bytesPerRow: cw * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        return ctx.makeImage()!
    }
    let tVis0 = CFAbsoluteTimeGetCurrent()
    let sensorRes = detector.analyzeCGImage(sensorOnCarpetCG, outputWidth: cw, outputHeight: ch)!
    let visionMs = (CFAbsoluteTimeGetCurrent() - tVis0) * 1000.0
    check(sensorRes.sensorDetected == true, "VisionDetector: must detect cylinder on textured carpet on frame 1")
    check(abs(sensorRes.centerX - 370.0) < 28.0 && abs(sensorRes.centerY - 199.0) < 20.0, "VisionDetector: must lock onto cylinder center (370,199), not carpet center (480,270)")
    check(sensorRes.pcbOpenDetected == true, "VisionDetector: must detect exposed blue PCB")
    check(sensorRes.dipFocusPoint != nil && abs(Double(sensorRes.dipFocusPoint![0]) - 395.0) < 28.0, "VisionDetector: must lock onto SW1 DIP-8 8-pin comb")
    check(visionMs < 25.0, "VisionDetector: single-frame analysis must complete in < 25 ms (got \(visionMs) ms)")

    // 10. Cloud Catalog Integration Parity (`M4-ID`, `M4-PKG`, `M4-DOC`, `M4-3D`, `M4-VOICE`, `M4-WAN`, `M4-SESSION`, `M4-REVOKE`)
    let catDir = tmpDir.appendingPathComponent("catalog_store", isDirectory: true)
    let pkgStore = FieldScanPackageStore(catalogRoot: catDir, bundleRoot: repoRoot)
    let catSessionEngine = FieldScanSessionEngine(
        baseDirectory: tmpDir.appendingPathComponent("cat_sessions", isDirectory: true),
        bundleRoot: repoRoot,
        packageStore: pkgStore
    )

    // 10a. Cross-language Ed25519 (`Python RFC 8032` -> `Apple CryptoKit`) + Deflate `.zip` import (`M4-PKG-01`, `M4-PKG-08`)
    let refFullZip = repoRoot.appendingPathComponent("knowledge/fixtures/cloud_catalog_v1/reference_full_m12_seq10.zip")
    let refPartialZip = repoRoot.appendingPathComponent("knowledge/fixtures/cloud_catalog_v1/reference_partial_no3d_seq10.zip")
    let fullPkg = try pkgStore.importPackage(from: refFullZip)
    let fullSha = fullPkg["manifest_sha256"] as! String
    check((fullPkg["publication_seq"] as? Int) == 10 && (fullPkg["variant_id"] as? String) == "m12_4pin_rev2", "M4-PKG-01: Swift CryptoKit verified Python-signed reference_full_m12_seq10.zip")

    let partPkg = try pkgStore.importPackage(from: refPartialZip)
    let partSha = partPkg["manifest_sha256"] as! String
    let partCtx = try pkgStore.selectContextForNextSession(manifestSha256: partSha)
    let partDesc = try pkgStore.buildSceneAndManualDescriptor(context: partCtx)
    check((partDesc["scene_origin"] as? String) == "docs_only_no_3d", "M4-PKG-08: Partial package must declare docs_only_no_3d")

    // 10b. Duplicate JSON key & tampered signature rejection (`M4-PKG-02`, `M4-PKG-03`)
    var dupRejected = false
    do {
        _ = try FieldScanCatalogContract.parseJSONStrictNoDuplicateKeys(Data("{\"a\":1,\"a\":2}".utf8))
    } catch let ce as FieldScanCatalogError {
        dupRejected = (ce.code == "DUPLICATE_JSON_KEYS")
    }
    check(dupRejected, "M4-PKG-03: Swift raw UTF-8 duplicate-key scanner must reject duplicate keys")

    let fullPkgDir = URL(fileURLWithPath: fullPkg["package_dir"] as! String)
    let validEnvData = try Data(contentsOf: fullPkgDir.appendingPathComponent("manifest.envelope.json"))
    var validEnvObj = try JSONSerialization.jsonObject(with: validEnvData) as! [String: Any]
    validEnvObj["key_id"] = "untrusted-key-99"
    var badKeyRejected = false
    do {
        _ = try FieldScanCatalogContract.verifyAndDecodeManifestEnvelope(try JSONSerialization.data(withJSONObject: validEnvObj))
    } catch let ce as FieldScanCatalogError {
        badKeyRejected = (ce.code == "UNTRUSTED_KEY_ID")
    }
    check(badKeyRejected, "M4-PKG-02: Untrusted key_id must be rejected before installation")

    // 10c. Local Byte-Range (`206`, `416`, `HEAD`) streaming (`M4-3D-03`)
    let arts = fullPkg["artifacts"] as! [[String: Any]]
    let glbArt = arts.first(where: { ($0["role"] as? String) == "twin_glb" })!
    let glbSha = glbArt["sha256"] as! String
    let headRes = try pkgStore.readObjectRange(manifestSha256: fullSha, objectSha256: glbSha, rangeHeader: nil, headOnly: true)
    check(headRes.statusCode == 200 && headRes.body.isEmpty && headRes.headers["Content-Length"] == "\(glbArt["byte_count"]!)", "M4-3D-03: HEAD must return empty body + Content-Length")
    let rangeRes = try pkgStore.readObjectRange(manifestSha256: fullSha, objectSha256: glbSha, rangeHeader: "bytes=0-19", headOnly: false)
    check(rangeRes.statusCode == 206 && rangeRes.body.count == 20 && String(data: rangeRes.body.prefix(4), encoding: .ascii) == "glTF", "M4-3D-03: Range bytes=0-19 must return 206 glTF header")
    var range416 = false
    do {
        _ = try pkgStore.readObjectRange(manifestSha256: fullSha, objectSha256: glbSha, rangeHeader: "bytes=99999999-999999999", headOnly: false)
    } catch let ce as FieldScanCatalogError {
        range416 = (ce.statusCode == 416)
    }
    check(range416, "M4-3D-03: Out-of-bounds Range must return 416")

    // 10d. Strict asset identity (`M4-ID-01..02`)
    let foreignRes = pkgStore.resolveAssetQuery("Siemens QFA2060")
    check((foreignRes["matched"] as? Bool) == false && (foreignRes["sensor_id"] is NSNull), "M4-ID-01: Foreign model must NOT match THT-02")
    let famAmb = pkgStore.resolveAssetQuery("THT")
    check((famAmb["resolution"] as? String) == "ambiguous", "M4-ID-02: Family query must request discriminant")

    // 10e. 12-page multi-document manual + `twin_action_v1` + `"pin one"` ambiguity (`M4-DOC-01..02`, `M4-VOICE-01..03`)
    let fullCtx = try pkgStore.selectContextForNextSession(manifestSha256: fullSha)
    let fullDesc = try pkgStore.buildSceneAndManualDescriptor(context: fullCtx)
    let doc12Hit = FieldScanManualNavigator.lookupManualInDescriptor(query: "Show extended calibration drift appendix", descriptor: fullDesc)
    check((doc12Hit["matched"] as? Bool) == true && (doc12Hit["manual_page"] as? Int) == 12 && (doc12Hit["printed_page"] as? String) == "A-12", "M4-DOC-01: Swift 12-page manual lookup")
    let docTbHit = FieldScanManualNavigator.lookupManualInDescriptor(query: "Open page 4", descriptor: fullDesc, preferredDocumentId: "wiring_bulletin_tb204")
    check((docTbHit["matched"] as? Bool) == true && (docTbHit["document_id"] as? String) == "wiring_bulletin_tb204" && (docTbHit["printed_page"] as? String) == "B-4", "M4-DOC-01: Multi-doc disambiguation")
    let outRangeHit = FieldScanManualNavigator.lookupManualInDescriptor(query: "Open page 99", descriptor: fullDesc, preferredDocumentId: "fixture_manual_12p")
    check((outRangeHit["matched"] as? Bool) == false && (outRangeHit["error_code"] as? String) == "PAGE_OUT_OF_RANGE", "M4-DOC-02: Page 99 out-of-range blocked")

    let dipAct = FieldScanTwinController.prepareVisualAction(query: "Show me the DIP bank", descriptor: fullDesc, sceneGeneration: 4, turnId: "swift-turn-1")
    let dipV1 = dipAct["twin_action_v1"] as? [String: Any]
    check((dipV1?["part_id"] as? String) == "dip.bank" && (dipV1?["citation_id"] as? String) == "fixture_manual_12p:p5:5.1", "M4-VOICE-01: Swift twin_action_v1 dip.bank")
    let pinAmb = FieldScanTwinController.prepareVisualAction(query: "Show me pin one", descriptor: fullDesc, sceneGeneration: 4, turnId: "swift-turn-2")
    check((pinAmb["ambiguous"] as? Bool) == true && (pinAmb["twin_action_v1"] is NSNull), "M4-VOICE-03: Swift ambiguous pin one must ask clarification")

    // 10f. Session `catalog_context` pinning & `"Historical source unavailable"` (`M4-SESSION-01..03`)
    let pinnedSes = try catSessionEngine.createSession(payload: ["catalog_context": fullCtx.toDictionary(), "serial_number": "SWIFT-M12-01"])
    let pinnedSid = pinnedSes["session_id"] as! String
    check(((pinnedSes["catalog_context"] as? [String: Any])?["manifest_sha256"] as? String) == fullSha, "M4-SESSION-01: Swift session pins catalog_context")
    let pinnedExp = try catSessionEngine.exportSessionDossier(sessionId: pinnedSid, payload: ["audience": "private_bench"])
    let pinnedJson = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: pinnedExp["json_path"] as! String))) as! [String: Any]
    check(((pinnedJson["catalog_context"] as? [String: Any])?["manifest_sha256"] as? String) == fullSha, "M4-SESSION-03: Swift exported dossier embeds catalog_context")

    // 10g. `FieldScanCatalogClient` offline default + `URLProtocol` mock cloud (`202` dedup, `304`, redirect block) (`M4-WAN-01..04`)
    final class MockCloudURLProtocol: URLProtocol {
        static var envData: Data = Data()
        static var blobs: [String: Data] = [:]
        static var redirectMode: Bool = false

        override class func canInit(with request: URLRequest) -> Bool { true }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
        override func startLoading() {
            guard let url = request.url else { return }
            if Self.redirectMode {
                let redirResp = HTTPURLResponse(url: url, statusCode: 302, httpVersion: "HTTP/1.1", headerFields: ["Location": "https://evil.invalid/steal"])!
                let nextReq = URLRequest(url: URL(string: "https://evil.invalid/steal")!)
                client?.urlProtocol(self, wasRedirectedTo: nextReq, redirectResponse: redirResp)
                return
            }
            let path = url.path
            var status = 200
            var headers: [String: String] = ["Content-Type": "application/json"]
            var body = Data("{}".utf8)
            if path == "/healthz" {
                body = Data("{\"status\":\"ok\"}".utf8)
            } else if path == "/v1/catalog/resolve" {
                status = 202
                body = Data("{\"job_id\":\"swift-job-1\",\"job_state\":\"queued\",\"availability\":\"pending\"}".utf8)
            } else if path == "/v1/jobs/swift-job-1" {
                body = Data("{\"job_id\":\"swift-job-1\",\"job_state\":\"ready\",\"availability\":\"complete\",\"product_id\":\"tzone_tht02\",\"variant_id\":\"m12_4pin_rev2\"}".utf8)
            } else if path.hasSuffix("/manifest") {
                if request.value(forHTTPHeaderField: "If-None-Match") == "\"swift-etag-10\"" {
                    status = 304
                    headers["ETag"] = "\"swift-etag-10\""
                    body = Data()
                } else {
                    headers["ETag"] = "\"swift-etag-10\""
                    body = Self.envData
                }
            } else if path.contains("/v1/catalog/blobs/") {
                let sha = url.lastPathComponent
                if let b = Self.blobs[sha] {
                    headers["Content-Type"] = "application/octet-stream"
                    body = b
                } else {
                    status = 404
                }
            }
            let resp = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
            client?.urlProtocol(self, didReceive: resp, cacheStoragePolicy: .notAllowed)
            if !body.isEmpty { client?.urlProtocol(self, didLoad: body) }
            client?.urlProtocolDidFinishLoading(self)
        }
        override func stopLoading() {}
    }

    MockCloudURLProtocol.envData = validEnvData
    for a in arts {
        let s = a["sha256"] as! String
        let p = a["path"] as! String
        MockCloudURLProtocol.blobs[s] = try Data(contentsOf: fullPkgDir.appendingPathComponent(p))
    }
    let cloudStore = FieldScanPackageStore(catalogRoot: tmpDir.appendingPathComponent("cloud_store", isDirectory: true), bundleRoot: repoRoot)
    let signerReg = try cloudStore.registerTrustedSigner(keyId: "prod-cloud-test", publicKeyBase64: FieldScanCatalogContract.demo1PublicKeyBase64)
    check(((signerReg["trusted_key_ids"] as? [String]) ?? []).contains("prod-cloud-test"), "PR4-INTEROP: Swift registerTrustedSigner must register 32-byte Ed25519 key")
    let cloudClient = FieldScanCatalogClient(store: cloudStore, syncEnabled: false, customProtocolClasses: [MockCloudURLProtocol.self])
    check((cloudClient.getSyncTelemetry()["https_requests_emitted"] as? Int) == 0, "M4-BASE-01: Swift client emits 0 HTTPS requests when syncEnabled=false")
    _ = try cloudClient.configureEndpoint(
        baseURL: "https://catalog.fieldscan.internal",
        syncEnabled: true,
        authToken: "swift-tok",
        boatPortAuthToken: "swift-boat-gate",
        persistInKeychain: false
    )
    let swiftTel = cloudClient.getSyncTelemetry()
    check((swiftTel["has_boat_gate_cookie"] as? Bool) == true, "PR4-INTEROP: Swift client tracks Boat private gate cookie without exposing secret")
    let swiftTelJSON = String(data: try JSONSerialization.data(withJSONObject: swiftTel), encoding: .utf8) ?? ""
    check(!swiftTelJSON.contains("swift-boat-gate") && !swiftTelJSON.contains("swift-tok"), "M4-WAN-06: Swift telemetry must never leak Bearer or Boat cookie secrets")
    let cj1 = try cloudClient.resolveCatalog(manufacturer: "TZONE", model: "THT-02", variant: "m12")
    let cj2 = try cloudClient.resolveCatalog(manufacturer: "tzone", model: "tht-02", variant: "M12")
    check((cj2["reused_existing_job"] as? Bool) == true, "M4-WAN-02: Swift client deduplicates in-flight job")
    let cpoll = try cloudClient.pollJob(jobId: "swift-job-1")
    check((cpoll["job_state"] as? String) == "ready", "M4-WAN-01: Swift job poll ready")
    let cinst = try cloudClient.fetchAndInstallVariant(productId: "tzone_tht02", variantId: "m12_4pin_rev2")
    check((cinst["status"] as? String) == "installed", "M4-WAN-01: Swift cloud blob download & CryptoKit install")
    let c304 = try cloudClient.fetchAndInstallVariant(productId: "tzone_tht02", variantId: "m12_4pin_rev2")
    check((c304["status"] as? String) == "not_modified_304", "M4-WAN-03: Swift If-None-Match ETag 304")

    MockCloudURLProtocol.redirectMode = true
    var redirBlocked = false
    do {
        _ = try cloudClient.resolveCatalog(manufacturer: "TZONE", model: "REDIR-TEST")
    } catch let ce as FieldScanCatalogError {
        redirBlocked = (ce.code == "REDIRECT_BLOCKED")
    }
    check(redirBlocked, "M4-WAN-04: Swift URLSessionTaskDelegate must block cross-origin redirect")

    // 11. AP-First Direct PUSR Discovery & RFC1918 Guard Verification (Swift)
    check(ModbusTCPClient.isPrivateRFC1918IPv4("10.10.100.254") == true, "AP-First Swift: 10.10.100.254 must be RFC1918")
    check(ModbusTCPClient.isPrivateRFC1918IPv4("192.168.0.7") == true, "AP-First Swift: 192.168.0.7 must be RFC1918")
    check(ModbusTCPClient.isPrivateRFC1918IPv4("8.8.8.8") == false, "AP-First Swift: public WAN IP 8.8.8.8 must be rejected")
    let apCandidates = ModbusTCPClient.buildDirectAPCandidateHosts(wifiIP: "10.10.100.100", savedHost: "192.168.50.254")
    let apHosts = apCandidates.map { $0.host }
    check(apHosts.first == "10.10.100.254", "AP-First Swift: active PUSR subnet must rank 10.10.100.254 first")
    check(!apHosts.contains("10.10.100.100"), "AP-First Swift: must exclude device's own Wi-Fi IP")
    check(apHosts.contains("192.168.0.7"), "AP-First Swift: must include alternate PUSR AP preset 192.168.0.7")
    let badPortProbe = ModbusTCPClient.probeTCPPort(host: "10.10.100.254", port: 5502)
    check(!badPortProbe.reachable && badPortProbe.errorCode == "PROTOCOL_MISMATCH", "AP-First Swift: probe must block :5502")
    let badWanProbe = ModbusTCPClient.probeTCPPort(host: "8.8.8.8", port: 502)
    check(!badWanProbe.reachable && badWanProbe.errorCode == "WAN_HOST_BLOCKED", "AP-First Swift: probe must block public WAN IP")
    let badUdpWan = ModbusTCPClient.sendPusrUDPCommand(host: "8.8.8.8", command: "www.usr.cn")
    check(badUdpWan.reply == nil && badUdpWan.errorCode == "WAN_HOST_BLOCKED", "1-Tap PUSR Swift: UDP 48899 must block public WAN IP")
    let badAuto5502 = ModbusTCPClient.autoProvisionPusrGateway(preferredHost: "10.10.100.254", baud: 9600, targetPort: 5502)
    check((badAuto5502["ok"] as? Bool) == false && (badAuto5502["error_code"] as? String) == "PROTOCOL_MISMATCH", "1-Tap PUSR Swift: autoProvision must block :5502")

    let summary: [String: Any] = [
        "swift_contract_suite": "PASS",
        "contract_version": FieldScanSessionEngine.contractVersion,
        "manifest_verified": true,
        "pilot_writes_blocked": true,
        "cloud_catalog_swift_parity": "PASS",
        "ap_first_swift_parity": "PASS",
        "golden_mbap_vectors_passed": mbapPassed,
        "golden_voice_en_passed": enPassed,
        "golden_voice_es_passed": esPassed,
        "golden_voice_adversarial_passed": advPassed,
        "swift_intent_n": sortedLat.count,
        "swift_intent_median_ms": Double(round(medianMs * 10000) / 10000),
        "swift_intent_p95_ms": Double(round(p95Ms * 10000) / 10000),
        "vision_carpet_lock_ms": Double(round(visionMs * 100) / 100),
        "sample_export_sha256": expDemo["pdf_sha256"] ?? "",
    ]
    let outData = try JSONSerialization.data(withJSONObject: summary, options: [.sortedKeys])
    print(String(data: outData, encoding: .utf8)!)
}

@main
enum SwiftContractMain {
    static func main() {
        do {
            try runSwiftContractSuite()
        } catch {
            fputs("[SWIFT_CONTRACT_ERROR] \(error)\n", stderr)
            exit(1)
        }
    }
}
