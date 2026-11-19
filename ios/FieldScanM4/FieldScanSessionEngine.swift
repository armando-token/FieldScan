import Foundation
import CryptoKit
import SQLite3
#if canImport(UIKit)
import UIKit
#endif

/// Native iPadOS / Swift Authoritative Session, Evidence, Provenance, Voice Intent & Dossier Engine (`Contract v2.1.0`).
public struct FieldScanDomainError: Error {
    public let code: String
    public let message: String
    public let statusCode: Int

    public init(code: String, message: String, statusCode: Int = 400) {
        self.code = code
        self.message = message
        self.statusCode = statusCode
    }

    public func toDictionary() -> [String: Any] {
        return [
            "error_code": code,
            "message": message,
        ]
    }
}

public final class FieldScanSessionEngine {
    public static let shared = FieldScanSessionEngine()
    public static let contractVersion = "2.1.0"
    public static let processBootId = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)).lowercased()

    private let lock = NSRecursiveLock()
    private var db: OpaquePointer?
    public let baseDocumentsURL: URL
    public let exportsDirectoryURL: URL
    public let evidenceDirectoryURL: URL
    public let dbFileURL: URL
    public let bundleKnowledgeRootURL: URL?
    public var minFreeDiskBytes: Int64 = 2 * 1024 * 1024

    private var activeSessionId: String?
    private var connectionGeneration: Int = 1
    private var liveSampleTracker: [String: [String: Any]] = [:]

    // Camera stability & freeze detector (`VIS-01..07`)
    private var cameraEpoch: Int = 1
    private var activeCameraSource: String = "none"
    private var recentFrameDigests: [String] = []
    private var stabilityWindowTimes: [TimeInterval] = []
    private var autoCapturedKeys = Set<String>()

    // Audio / TTS Echo / Alert debounce state (`VOZ-01..10`)
    public private(set) var audioState: String = "idle"
    public private(set) var preferredLanguage: String = "en"
    private var lastTTSTextNorm: String = ""
    private var lastTTSEndedUptime: TimeInterval = -999.0
    private var seenUtteranceIds: [String] = []
    private var alertLastFiredUptime: [String: TimeInterval] = [:]
    private var linkTransitionTimes: [TimeInterval] = []

    public convenience init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        var kRoot: URL? = nil
        if let res = Bundle.main.resourceURL {
            for cand in [res.appendingPathComponent("BundleResources"), res] {
                if FileManager.default.fileExists(atPath: cand.appendingPathComponent("knowledge").path) {
                    kRoot = cand
                    break
                }
            }
        }
        self.init(baseDirectory: docs, bundleRoot: kRoot)
    }

    public init(baseDirectory: URL, bundleRoot: URL?) {
        self.baseDocumentsURL = baseDirectory
        self.exportsDirectoryURL = baseDirectory.appendingPathComponent("exports", isDirectory: true)
        self.evidenceDirectoryURL = exportsDirectoryURL.appendingPathComponent("session_evidence", isDirectory: true)
        let dataDir = baseDirectory.appendingPathComponent("data", isDirectory: true)
        self.dbFileURL = dataDir.appendingPathComponent("fieldscan_sessions.sqlite3")
        self.bundleKnowledgeRootURL = bundleRoot

        let fm = FileManager.default
        for dir in [exportsDirectoryURL, evidenceDirectoryURL, dataDir] {
            if !fm.fileExists(atPath: dir.path) {
                try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
            }
        }

        cleanupOrphanTempFiles()
        openAndInitSQLite()
    }

    deinit {
        if let handle = db {
            sqlite3_close(handle)
        }
    }

    // MARK: - Utilities & Hashing

    public static func sha256Hex(_ data: Data) -> String {
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    public static func sha256File(_ url: URL) -> String? {
        guard let data = try? Data(contentsOf: url) else { return nil }
        return sha256Hex(data)
    }

    public static func utcNowISO() -> String {
        let fmt = ISO8601DateFormatter()
        fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return fmt.string(from: Date())
    }

    public static func normalizeASCIILower(_ raw: String) -> String {
        let folded = raw.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        let comps = folded.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        return comps.joined(separator: " ").lowercased()
    }

    private func cleanupOrphanTempFiles() {
        let fm = FileManager.default
        for dir in [exportsDirectoryURL, evidenceDirectoryURL] {
            guard let items = try? fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil) else { continue }
            for item in items where item.pathExtension == "tmp" {
                try? fm.removeItem(at: item)
            }
        }
    }

    private func ensureDiskSpace() throws {
        if let vals = try? exportsDirectoryURL.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey, .volumeAvailableCapacityKey]) {
            let freeBytes = vals.volumeAvailableCapacityForImportantUsage ?? Int64(vals.volumeAvailableCapacity ?? Int(minFreeDiskBytes * 2))
            if freeBytes < minFreeDiskBytes {
                throw FieldScanDomainError(
                    code: "DISK_FULL",
                    message: "Insufficient local storage (\(freeBytes) bytes free). Existing session evidence is preserved.",
                    statusCode: 507
                )
            }
        }
    }

    // MARK: - Canonical Share Path Validation (`EXP-05`)

    public func resolveAuthorizedExportFile(named rawName: String) -> URL? {
        let trimmed = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              !trimmed.contains(".."),
              !trimmed.contains("/"),
              !trimmed.contains("\\") else {
            return nil
        }
        let exportsCanon = exportsDirectoryURL.resolvingSymlinksInPath().standardizedFileURL
        let candidate = exportsCanon.appendingPathComponent(trimmed).resolvingSymlinksInPath().standardizedFileURL
        guard candidate.deletingLastPathComponent().path == exportsCanon.path else {
            return nil
        }
        guard FileManager.default.fileExists(atPath: candidate.path) else {
            return nil
        }
        return candidate
    }

    // MARK: - Profile, Manual & Resource Manifest Verification (`VIS-10`, `OFF-08`, `FLU-04`)

    public func loadAllProfiles() -> [String: [String: Any]] {
        var out: [String: [String: Any]] = [:]
        guard let root = bundleKnowledgeRootURL else { return out }
        let profDir = root.appendingPathComponent("knowledge/profiles", isDirectory: true)
        guard let files = try? FileManager.default.contentsOfDirectory(at: profDir, includingPropertiesForKeys: nil) else {
            return out
        }
        for f in files where f.pathExtension == "json" {
            if let data = try? Data(contentsOf: f),
               var json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
                let pid = (json["profile_id"] as? String) ?? f.deletingPathExtension().lastPathComponent
                json["_profile_sha256"] = Self.sha256Hex(data)
                out[pid] = json
            }
        }
        return out
    }

    public func resolveDeviceProfile(_ query: String?) -> [String: Any] {
        let profiles = loadAllProfiles()
        let raw = (query ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if raw.isEmpty {
            if var tht = profiles["tzone_tht02"] {
                tht["identity_pending"] = false
                tht["auto_decode_allowed"] = true
                return tht
            }
        }

        let norm = Self.normalizeASCIILower(raw).replacingOccurrences(of: "[^a-z0-9]", with: "", options: .regularExpression)
        for pid in ["tzone_tht03r", "tzone_tht02"] {
            guard var prof = profiles[pid] else { continue }
            var candidates: [String] = [pid, (prof["sensor_id"] as? String) ?? "", (prof["model"] as? String) ?? ""]
            if let aliases = prof["aliases"] as? [String] {
                candidates.append(contentsOf: aliases)
            }
            for cand in candidates {
                let nc = Self.normalizeASCIILower(cand).replacingOccurrences(of: "[^a-z0-9]", with: "", options: .regularExpression)
                if !nc.isEmpty && (norm == nc || norm.contains(nc)) {
                    let supported = (prof["validation_status"] as? String) == "supported_bench_readonly"
                    prof["identity_pending"] = !supported
                    prof["auto_decode_allowed"] = supported
                    return prof
                }
            }
        }

        // Default fallback when profiles dir isn't mounted (e.g. minimal unit test)
        if norm == "tzonetht02" || norm == "tht02" || norm == "tztht02" {
            return [
                "profile_id": "tzone_tht02",
                "sensor_id": "TZ-THT-02",
                "model": "TZ THT-02",
                "tested_profile_revision": "2026.11.19-r1",
                "validation_status": "supported_bench_readonly",
                "identity_pending": false,
                "auto_decode_allowed": true,
                "_profile_sha256": Self.sha256Hex(Data("tzone_tht02".utf8)),
                "procedure": Self.defaultTHT02Procedure(),
            ]
        }

        return [
            "profile_id": "unknown_pending_identity",
            "sensor_id": "UNKNOWN:\(raw.prefix(32))",
            "model": raw.isEmpty ? "Unknown Model" : String(raw.prefix(64)),
            "tested_profile_revision": "identity-pending",
            "validation_status": "identity_pending",
            "identity_pending": true,
            "auto_decode_allowed": false,
            "_profile_sha256": Self.sha256Hex(Data(raw.utf8)),
            "procedure": [
                "initial_step": "identify",
                "steps": [
                    ["step_id": "identify", "allowed_transitions": ["as_found", "close"]],
                    ["step_id": "as_found", "allowed_transitions": ["close"]],
                    ["step_id": "close", "allowed_transitions": ["close"]],
                ],
            ],
        ]
    }

    private static func defaultTHT02Procedure() -> [String: Any] {
        return [
            "initial_step": "identify",
            "steps": [
                ["step_id": "identify", "component_3d_id": "mounting_flange", "allowed_transitions": ["as_found"]],
                ["step_id": "as_found", "component_3d_id": "strainer_head", "allowed_transitions": ["inspect", "verify_modbus"]],
                ["step_id": "inspect", "component_3d_id": "upper_barrel_dip", "allowed_transitions": ["verify_modbus", "inspect", "close"]],
                ["step_id": "verify_modbus", "component_3d_id": "lower_barrel_rs485", "allowed_transitions": ["close", "review", "inspect"]],
                ["step_id": "review", "component_3d_id": "strainer_head", "allowed_transitions": ["inspect", "verify_modbus", "close"]],
                ["step_id": "close", "component_3d_id": "mounting_flange", "allowed_transitions": ["close"]],
            ],
        ]
    }

    public func verifyAndResolveCitations(profile: [String: Any], requestedPages: [Int]) -> [String: Any] {
        guard let root = bundleKnowledgeRootURL,
              let refs = profile["references"] as? [String: Any],
              let manualRel = (refs["manual_document"] as? String)?.trimmingCharacters(in: CharacterSet(charactersIn: "/")),
              let expectedSha = refs["manual_sha256"] as? String,
              !manualRel.isEmpty else {
            return [
                "verified": false,
                "error_code": "MANUAL_UNAVAILABLE",
                "instruction_blocked": !requestedPages.isEmpty,
                "citations": [],
                "missing_pages": requestedPages,
            ]
        }

        let pdfURL = root.appendingPathComponent(manualRel)
        guard let actualSha = Self.sha256File(pdfURL) else {
            return [
                "verified": false,
                "error_code": "MANUAL_MISSING",
                "instruction_blocked": true,
                "citations": [],
                "missing_pages": requestedPages,
            ]
        }
        if actualSha != expectedSha {
            return [
                "verified": false,
                "error_code": "MANUAL_HASH_MISMATCH",
                "instruction_blocked": true,
                "citations": [],
                "missing_pages": requestedPages,
            ]
        }

        var citations: [[String: Any]] = []
        var missing: [Int] = []
        for p in requestedPages {
            let pngURL = root.appendingPathComponent("assets/manual_pages/page_\(p).png")
            if p < 1 || p > 9 || !FileManager.default.fileExists(atPath: pngURL.path) {
                missing.append(p)
                continue
            }
            citations.append([
                "page": p,
                "label": "Page \(p) · Manual V1.1",
                "image_url": "/assets/manual_pages/page_\(p).png",
                "manual_sha256": actualSha,
            ])
        }
        return [
            "verified": missing.isEmpty,
            "error_code": missing.isEmpty ? NSNull() : "MANUAL_PAGE_MISSING",
            "instruction_blocked": !missing.isEmpty,
            "citations": citations,
            "missing_pages": missing,
        ]
    }

    public func verifyResourceManifest() -> [String: Any] {
        guard let root = bundleKnowledgeRootURL else {
            return ["verified": false, "error_code": "BUNDLE_ROOT_MISSING", "mismatches": ["bundle_root_missing"]]
        }
        let manifestURL = root.appendingPathComponent("knowledge/resource_manifest.json")
        guard let data = try? Data(contentsOf: manifestURL),
              let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let files = json["files"] as? [String: [String: Any]] else {
            return ["verified": false, "error_code": "MANIFEST_MISSING", "mismatches": ["resource_manifest.json"]]
        }
        var mismatches: [String] = []
        for (rel, meta) in files {
            let fURL = root.appendingPathComponent(rel)
            guard let actual = Self.sha256File(fURL) else {
                mismatches.append("missing:\(rel)")
                continue
            }
            if actual != (meta["sha256"] as? String) {
                mismatches.append("hash_mismatch:\(rel)")
            }
        }
        return [
            "verified": mismatches.isEmpty,
            "error_code": mismatches.isEmpty ? NSNull() : "MANIFEST_MISMATCH",
            "tree_sha256": json["tree_sha256"] ?? NSNull(),
            "checked_files": files.count,
            "mismatches": mismatches,
        ]
    }

    // MARK: - Bilingual Voice Intent, Echo Guard & Deterministic Grounding (`VOZ-01..10`, `IA-04`)

    public func registerTTSPlayback(_ spokenText: String, estimatedDurationS: Double = 0.0) {
        lock.lock()
        lastTTSTextNorm = Self.normalizeASCIILower(spokenText)
        lastTTSEndedUptime = ProcessInfo.processInfo.systemUptime + max(0.0, estimatedDurationS)
        if estimatedDurationS > 0 {
            audioState = "speaking"
        }
        lock.unlock()
    }

    public func setAudioState(_ state: String) {
        lock.lock()
        if audioState == "speaking" && state != "speaking" {
            lastTTSEndedUptime = ProcessInfo.processInfo.systemUptime
        }
        audioState = state
        lock.unlock()
    }

    public func isTTSEchoOrDuplicate(utterance: String, utteranceId: String? = nil) -> (Bool, String?) {
        lock.lock()
        defer { lock.unlock() }

        if let uid = utteranceId, !uid.isEmpty {
            if seenUtteranceIds.contains(uid) {
                return (true, "DUPLICATE_UTTERANCE_ID")
            }
            seenUtteranceIds.append(uid)
            if seenUtteranceIds.count > 64 { seenUtteranceIds.removeFirst() }
        }

        let nowUp = ProcessInfo.processInfo.systemUptime
        let normU = Self.normalizeASCIILower(utterance)
        if audioState == "speaking" || (nowUp - lastTTSEndedUptime) < 0.65 {
            if normU.isEmpty { return (true, "EMPTY_DURING_TTS") }
            if !lastTTSTextNorm.isEmpty {
                let uWords = Set(normU.split(separator: " ").map(String.init))
                let tWords = Set(lastTTSTextNorm.split(separator: " ").map(String.init))
                if !uWords.isEmpty && Double(uWords.intersection(tWords).count) / Double(uWords.count) >= 0.55 {
                    return (true, "TTS_ACOUSTIC_ECHO_REJECTED")
                }
            }
            if audioState == "speaking" {
                return (true, "MIC_GATED_WHILE_SPEAKING")
            }
        }
        if !lastTTSTextNorm.isEmpty && normU.count >= 14 && lastTTSTextNorm.contains(normU) {
            return (true, "TTS_VERBATIM_ECHO_REJECTED")
        }
        return (false, nil)
    }

    public static func classifyBilingualVoiceIntent(_ rawUtterance: String, currentLanguage: String = "en") -> [String: Any] {
        let norm = normalizeASCIILower(rawUtterance)
        var lang = currentLanguage
        let esCues = ["que ", "debo", "revisar", "muestrame", "conector", "respondiendo", "lectura", "pagina", "repite", "captura", "cambiar a"]
        if esCues.contains(where: { "\(norm) ".contains($0) }) {
            lang = "es"
        } else if ["what ", "show me", "is the", "read ", "page ", "repeat", "switch to"].contains(where: { "\(norm) ".contains($0) }) {
            lang = "en"
        }

        if norm.range(of: "\\b(switch to spanish|cambiar a espan\\w*|modo espan\\w*)\\b", options: .regularExpression) != nil {
            return ["intent": "switch_language", "target_language": "es", "detected_language": lang, "ambiguous": false]
        }
        if norm.range(of: "\\b(switch to english|cambiar a ingles|english mode)\\b", options: .regularExpression) != nil {
            return ["intent": "switch_language", "target_language": "en", "detected_language": lang, "ambiguous": false]
        }
        if norm.range(of: "\\b(skip confirm\\w*|force write|override confirm\\w*|saltar confirm\\w*|otro equipo|other unit)\\b", options: .regularExpression) != nil {
            return ["intent": "request_confirmation", "detected_language": lang, "bypass_blocked": true, "requires_separate_confirmation": true, "ambiguous": false]
        }

        let hasNumber = norm.range(of: "(?<![a-z0-9])[+-]?\\d+(?:\\.\\d+)?(?![a-z0-9])", options: .regularExpression) != nil
        let hasUnitContext = norm.range(
            of: "\\b(page|pagina|step|paso|slave|esclav\\w*|unit|address|direccion|pin|celsius|degc|rh|percent|por ciento|baud)\\b",
            options: .regularExpression
        ) != nil || rawUtterance.contains("%") || rawUtterance.contains("°")

        if hasNumber && !hasUnitContext {
            return ["intent": NSNull(), "detected_language": lang, "ambiguous": true, "clarification_reason": "AMBIGUOUS_NUMERIC_WITHOUT_UNIT"]
        }

        if let r = norm.range(of: "\\b(?:page|pagina)\\s*(\\d{1,2})\\b", options: .regularExpression) {
            let sub = String(norm[r])
            let digits = sub.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
            if let p = Int(digits) {
                return ["intent": "show_manual", "page": p, "detected_language": lang, "ambiguous": false]
            }
        }

        let compRules: [(String, String)] = [
            ("waterproof_gland_leads", "\\b(connector|conector|wiring|cable\\w*|lead\\w*|gland|terminal)\\b"),
            ("upper_barrel_dip", "\\b(dip|switch\\w*|pin\\w*|pcb|tarjeta|rocker\\w*)\\b"),
            ("strainer_head", "\\b(strainer|probe|sonda|filtro|sht30|sht3x|tip|punta)\\b"),
            ("mounting_flange", "\\b(flange|brida|bracket|mount\\w*|soporte)\\b"),
            ("upper_seal_ring", "\\b(o-ring|oring|seal|sello)\\b"),
            ("lower_barrel_rs485", "\\b(barrel|transceiver|rs485|rs-485)\\b"),
        ]
        if norm.range(of: "\\b(show|muestr\\w*|highlight|resalt\\w*|where is|donde esta|que debo revisar|what should i check)\\b", options: .regularExpression) != nil {
            for (cid, pat) in compRules {
                if norm.range(of: pat, options: .regularExpression) != nil {
                    return ["intent": "highlight_component", "component_3d_id": cid, "detected_language": lang, "ambiguous": false]
                }
            }
            return ["intent": "repeat_step", "detected_language": lang, "ambiguous": false]
        }

        if norm.range(of: "\\b(respond\\w*|read\\w*|lectura|valor\\w*|temperatur\\w*|humid\\w*|humed\\w*|estado actual)\\b", options: .regularExpression) != nil {
            if norm.range(of: "\\b(start|iniciar|nuevo|new|poll|probar)\\b", options: .regularExpression) != nil {
                return ["intent": "start_readonly_check", "detected_language": lang, "ambiguous": false]
            }
            return ["intent": "read_current", "detected_language": lang, "ambiguous": false]
        }

        if norm.range(of: "\\b(repeat|repite|repetir|again|otra vez)\\b", options: .regularExpression) != nil {
            return ["intent": "repeat_step", "detected_language": lang, "ambiguous": false]
        }
        if norm.range(of: "\\b(capture|captur\\w*|take photo|tomar foto|snapshot)\\b", options: .regularExpression) != nil {
            return ["intent": "request_capture", "detected_language": lang, "ambiguous": false]
        }
        if norm.range(of: "\\b(confirm\\w*|changed|adjusted|ajust\\w*|modif\\w*)\\b", options: .regularExpression) != nil {
            return ["intent": "request_confirmation", "detected_language": lang, "requires_separate_confirmation": true, "ambiguous": false]
        }

        return ["intent": NSNull(), "detected_language": lang, "ambiguous": true, "clarification_reason": "UNRECOGNIZED_OR_CONVERSATIONAL"]
    }

    public func applyDeterministicGroundingFilter(
        candidateText: String,
        profile: [String: Any],
        verifiedTelemetry: [String: Any]?
    ) -> [String: Any] {
        var reasons: [String] = []
        let trimmed = candidateText.trimmingCharacters(in: .whitespacesAndNewlines)

        let forbiddenPatterns = [
            "\\bscada\\s+(?:online|verified|showed|confirmed)\\b",
            "\\bplc\\s+(?:verified|confirmed|observed|showed)\\b",
            "\\bcalibrated\\s+values?\\b",
            "\\bfield\\s+repair\\s+successfully\\s+verified\\b",
        ]
        for pat in forbiddenPatterns {
            if trimmed.range(of: pat, options: [.regularExpression, .caseInsensitive]) != nil {
                reasons.append("overclaim_blocked:\(pat)")
            }
        }

        if let regex = try? NSRegularExpression(pattern: "\\bpage\\s+(\\d{1,3})\\b", options: [.caseInsensitive]) {
            let matches = regex.matches(in: trimmed, range: NSRange(trimmed.startIndex..., in: trimmed))
            for m in matches {
                if let r = Range(m.range(at: 1), in: trimmed), let p = Int(trimmed[r]) {
                    if p < 1 || p > 9 {
                        reasons.append("invalid_page_citation:\(p)")
                    }
                }
            }
        }

        if !reasons.isEmpty {
            let online = (verifiedTelemetry?["online"] as? Bool) ?? false
            let fresh = (verifiedTelemetry?["fresh"] as? Bool) ?? online
            let truth: String
            if online && fresh {
                let t = verifiedTelemetry?["temp_c"] ?? "--"
                let h = verifiedTelemetry?["humidity_rh"] ?? "--"
                truth = "[Needs review — grounded to verified bench data] Sensor responded on Modbus: Temp=\(t) degC, RH=\(h) %RH. Consult verified Manual V1.1 pages 1-9 only."
            } else {
                truth = "[Needs review — grounded to verified profile] Model output referenced unverified claims or pages and was replaced by deterministic profile data."
            }
            return ["text": truth, "grounding_corrected": true, "reasons": reasons]
        }
        return ["text": trimmed, "grounding_corrected": false, "reasons": []]
    }

    // MARK: - SQLite Schema & Persistence

    private func openAndInitSQLite() {
        lock.lock()
        defer { lock.unlock() }
        if sqlite3_open_v2(dbFileURL.path, &db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX, nil) != SQLITE_OK {
            return
        }
        let sql = """
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            created_at_utc TEXT NOT NULL,
            updated_at_utc TEXT NOT NULL,
            boot_id TEXT NOT NULL,
            status TEXT NOT NULL,
            step_id TEXT NOT NULL,
            seq INTEGER NOT NULL,
            profile_id TEXT NOT NULL,
            profile_revision TEXT NOT NULL,
            profile_sha256 TEXT NOT NULL,
            manual_sha256 TEXT,
            identity_pending INTEGER NOT NULL DEFAULT 0,
            asset_tag TEXT,
            serial_number TEXT,
            asset_confirmed INTEGER NOT NULL DEFAULT 0,
            transport_mode TEXT NOT NULL,
            simulation INTEGER NOT NULL DEFAULT 0,
            build_id TEXT NOT NULL,
            language TEXT NOT NULL DEFAULT 'en',
            state_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS session_events (
            session_id TEXT NOT NULL,
            seq INTEGER NOT NULL,
            event_id TEXT NOT NULL UNIQUE,
            kind TEXT NOT NULL,
            step_id TEXT NOT NULL,
            occurred_at_utc TEXT NOT NULL,
            monotonic_s REAL NOT NULL,
            boot_id TEXT NOT NULL,
            source TEXT NOT NULL,
            actor TEXT NOT NULL,
            simulation INTEGER NOT NULL DEFAULT 0,
            payload_json TEXT NOT NULL,
            PRIMARY KEY (session_id, seq)
        );
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            scope_key TEXT PRIMARY KEY,
            payload_sha256 TEXT NOT NULL,
            created_at_utc TEXT NOT NULL,
            response_json TEXT NOT NULL
        );
        """
        sqlite3_exec(db, sql, nil, nil, nil)
    }

    private func canonicalJSONHash(_ dict: [String: Any]) -> String {
        let data = (try? JSONSerialization.data(withJSONObject: dict, options: [.sortedKeys])) ?? Data()
        return Self.sha256Hex(data)
    }

    private func checkIdempotencyUnlocked(scopeKey: String, payloadHash: String) throws -> [String: Any]? {
        guard let db = db else { return nil }
        var stmt: OpaquePointer?
        let q = "SELECT payload_sha256, response_json FROM idempotency_keys WHERE scope_key = ?;"
        guard sqlite3_prepare_v2(db, q, -1, &stmt, nil) == SQLITE_OK else { return nil }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_text(stmt, 1, (scopeKey as NSString).utf8String, -1, nil)
        if sqlite3_step(stmt) == SQLITE_ROW {
            let storedHash = String(cString: sqlite3_column_text(stmt, 0))
            if storedHash != payloadHash {
                throw FieldScanDomainError(
                    code: "IDEMPOTENCY_CONFLICT",
                    message: "Idempotency key '\(scopeKey)' reused with different payload.",
                    statusCode: 409
                )
            }
            let jsonStr = String(cString: sqlite3_column_text(stmt, 1))
            if let data = jsonStr.data(using: .utf8),
               var obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] {
                obj["idempotent_replay"] = true
                return obj
            }
        }
        return nil
    }

    private func storeIdempotencyUnlocked(scopeKey: String, payloadHash: String, response: [String: Any]) {
        guard let db = db,
              let data = try? JSONSerialization.data(withJSONObject: response, options: []),
              let jsonStr = String(data: data, encoding: .utf8) else { return }
        var stmt: OpaquePointer?
        let q = "INSERT OR REPLACE INTO idempotency_keys (scope_key, payload_sha256, created_at_utc, response_json) VALUES (?, ?, ?, ?);"
        guard sqlite3_prepare_v2(db, q, -1, &stmt, nil) == SQLITE_OK else { return }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_text(stmt, 1, (scopeKey as NSString).utf8String, -1, nil)
        sqlite3_bind_text(stmt, 2, (payloadHash as NSString).utf8String, -1, nil)
        sqlite3_bind_text(stmt, 3, (Self.utcNowISO() as NSString).utf8String, -1, nil)
        sqlite3_bind_text(stmt, 4, (jsonStr as NSString).utf8String, -1, nil)
        sqlite3_step(stmt)
    }

    public func invalidateLiveConnection(reason: String = "transport_or_asset_changed") {
        lock.lock()
        connectionGeneration += 1
        linkTransitionTimes.append(ProcessInfo.processInfo.systemUptime)
        if linkTransitionTimes.count > 12 { linkTransitionTimes.removeFirst() }
        for k in liveSampleTracker.keys {
            liveSampleTracker[k]?["invalidated"] = true
            liveSampleTracker[k]?["invalidation_reason"] = reason
        }
        lock.unlock()
    }

    public var currentActiveSessionId: String? {
        lock.lock()
        defer { lock.unlock() }
        return activeSessionId
    }

    public func pauseActiveSession(reason: String = "topology_switched") {
        lock.lock()
        defer { lock.unlock() }
        guard let sid = activeSessionId, let db = db else { return }
        var pStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, "UPDATE sessions SET status='paused', updated_at_utc=? WHERE session_id=? AND status='open';", -1, &pStmt, nil) == SQLITE_OK {
            sqlite3_bind_text(pStmt, 1, (Self.utcNowISO() as NSString).utf8String, -1, nil)
            sqlite3_bind_text(pStmt, 2, (sid as NSString).utf8String, -1, nil)
            sqlite3_step(pStmt)
            sqlite3_finalize(pStmt)
        }
        liveSampleTracker[sid]?["invalidated"] = true
        liveSampleTracker[sid]?["invalidation_reason"] = reason
    }

    // MARK: - Session CRUD & Actions

    public func createSession(payload: [String: Any]) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }

        let idemKey = (payload["idempotency_key"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let profileQuery = ((payload["profile_id"] as? String) ?? (payload["model"] as? String) ?? "tzone_tht02").trimmingCharacters(in: .whitespacesAndNewlines)
        let transportMode = ((payload["transport_mode"] as? String) ?? "auto").lowercased()
        let assetTag = (payload["asset_tag"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let serialNumber = (payload["serial_number"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let lang = ((payload["language"] as? String) ?? preferredLanguage).lowercased() == "es" ? "es" : "en"
        let isSim = transportMode.hasPrefix("sim") || ((payload["simulation"] as? Bool) ?? false)

        let canonReq: [String: Any] = [
            "profile_query": profileQuery,
            "transport_mode": transportMode,
            "asset_tag": assetTag ?? "",
            "serial_number": serialNumber ?? "",
            "simulation": isSim,
            "language": lang,
        ]
        let reqHash = canonicalJSONHash(canonReq)
        if let ik = idemKey, !ik.isEmpty {
            if let replay = try checkIdempotencyUnlocked(scopeKey: "create_session:\(ik)", payloadHash: reqHash) {
                return replay
            }
        }

        if let prevId = activeSessionId, let db = db {
            var pStmt: OpaquePointer?
            if sqlite3_prepare_v2(db, "UPDATE sessions SET status='paused', updated_at_utc=? WHERE session_id=? AND status='open';", -1, &pStmt, nil) == SQLITE_OK {
                sqlite3_bind_text(pStmt, 1, (Self.utcNowISO() as NSString).utf8String, -1, nil)
                sqlite3_bind_text(pStmt, 2, (prevId as NSString).utf8String, -1, nil)
                sqlite3_step(pStmt)
                sqlite3_finalize(pStmt)
            }
        }
        connectionGeneration += 1

        let prof = resolveDeviceProfile(profileQuery)
        let sessionId = "ses-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)).lowercased()
        let nowUTC = Self.utcNowISO()
        let nowMono = ProcessInfo.processInfo.systemUptime
        let pid = (prof["profile_id"] as? String) ?? "tzone_tht02"
        let pRev = (prof["tested_profile_revision"] as? String) ?? "draft"
        let pSha = (prof["_profile_sha256"] as? String) ?? ""
        let mSha = (prof["references"] as? [String: Any])?["manual_sha256"] as? String
        let idPending = (prof["identity_pending"] as? Bool) ?? false
        let assetConfirmed = (!idPending && ((assetTag != nil && !assetTag!.isEmpty) || (serialNumber != nil && !serialNumber!.isEmpty)))

        let stateDoc: [String: Any] = [
            "as_found": NSNull(),
            "as_left": NSNull(),
            "observations": [],
            "confirmed_changes": [],
            "evidence_files": [],
            "pending_confirmation_token": NSNull(),
            "last_valid_sample": NSNull(),
            "partial_close": false,
            "missing_evidence": [],
            "connection_generation": connectionGeneration,
            "profile_snapshot": prof,
        ]
        let stateData = (try? JSONSerialization.data(withJSONObject: stateDoc)) ?? Data("{}".utf8)
        let stateStr = String(data: stateData, encoding: .utf8) ?? "{}"

        if let db = db {
            var stmt: OpaquePointer?
            let ins = """
            INSERT INTO sessions (
                session_id, created_at_utc, updated_at_utc, boot_id, status, step_id, seq,
                profile_id, profile_revision, profile_sha256, manual_sha256, identity_pending,
                asset_tag, serial_number, asset_confirmed, transport_mode, simulation,
                build_id, language, state_json
            ) VALUES (?, ?, ?, ?, 'open', 'identify', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'fieldscan-m4-2.1.0', ?, ?);
            """
            if sqlite3_prepare_v2(db, ins, -1, &stmt, nil) == SQLITE_OK {
                sqlite3_bind_text(stmt, 1, (sessionId as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 2, (nowUTC as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 3, (nowUTC as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 4, (Self.processBootId as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 5, (pid as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 6, (pRev as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 7, (pSha as NSString).utf8String, -1, nil)
                if let ms = mSha {
                    sqlite3_bind_text(stmt, 8, (ms as NSString).utf8String, -1, nil)
                } else {
                    sqlite3_bind_null(stmt, 8)
                }
                sqlite3_bind_int(stmt, 9, idPending ? 1 : 0)
                if let at = assetTag, !at.isEmpty { sqlite3_bind_text(stmt, 10, (at as NSString).utf8String, -1, nil) } else { sqlite3_bind_null(stmt, 10) }
                if let sn = serialNumber, !sn.isEmpty { sqlite3_bind_text(stmt, 11, (sn as NSString).utf8String, -1, nil) } else { sqlite3_bind_null(stmt, 11) }
                sqlite3_bind_int(stmt, 12, assetConfirmed ? 1 : 0)
                sqlite3_bind_text(stmt, 13, (transportMode as NSString).utf8String, -1, nil)
                sqlite3_bind_int(stmt, 14, isSim ? 1 : 0)
                sqlite3_bind_text(stmt, 15, (lang as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 16, (stateStr as NSString).utf8String, -1, nil)
                sqlite3_step(stmt)
                sqlite3_finalize(stmt)
            }
            insertEventUnlocked(
                sessionId: sessionId,
                seq: 1,
                kind: "session.opened",
                stepId: "identify",
                occurredAtUTC: nowUTC,
                monotonicS: nowMono,
                source: isSim ? "simulation" : "bench_session",
                actor: "operator",
                simulation: isSim,
                payload: ["profile_id": pid, "simulation": isSim]
            )
        }

        activeSessionId = sessionId
        preferredLanguage = lang
        let snap = try loadSessionSnapshotUnlocked(sessionId: sessionId)
        if let ik = idemKey, !ik.isEmpty {
            storeIdempotencyUnlocked(scopeKey: "create_session:\(ik)", payloadHash: reqHash, response: snap)
        }
        return snap
    }

    private func insertEventUnlocked(
        sessionId: String,
        seq: Int,
        kind: String,
        stepId: String,
        occurredAtUTC: String,
        monotonicS: Double,
        source: String,
        actor: String,
        simulation: Bool,
        payload: [String: Any]
    ) {
        guard let db = db else { return }
        let evId = "evt-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)).lowercased()
        let pData = (try? JSONSerialization.data(withJSONObject: payload)) ?? Data("{}".utf8)
        let pStr = String(data: pData, encoding: .utf8) ?? "{}"
        var stmt: OpaquePointer?
        let sql = """
        INSERT INTO session_events (
            session_id, seq, event_id, kind, step_id, occurred_at_utc,
            monotonic_s, boot_id, source, actor, simulation, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_text(stmt, 1, (sessionId as NSString).utf8String, -1, nil)
            sqlite3_bind_int(stmt, 2, Int32(seq))
            sqlite3_bind_text(stmt, 3, (evId as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 4, (kind as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 5, (stepId as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 6, (occurredAtUTC as NSString).utf8String, -1, nil)
            sqlite3_bind_double(stmt, 7, monotonicS)
            sqlite3_bind_text(stmt, 8, (Self.processBootId as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 9, (source as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 10, (actor as NSString).utf8String, -1, nil)
            sqlite3_bind_int(stmt, 11, simulation ? 1 : 0)
            sqlite3_bind_text(stmt, 12, (pStr as NSString).utf8String, -1, nil)
            sqlite3_step(stmt)
            sqlite3_finalize(stmt)
        }
    }

    public func getSession(sessionId: String) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        return try loadSessionSnapshotUnlocked(sessionId: sessionId)
    }

    public func listSessions(limit: Int = 20) -> [[String: Any]] {
        lock.lock()
        defer { lock.unlock() }
        guard let db = db else { return [] }
        var stmt: OpaquePointer?
        var ids: [String] = []
        if sqlite3_prepare_v2(db, "SELECT session_id FROM sessions ORDER BY updated_at_utc DESC LIMIT ?;", -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_int(stmt, 1, Int32(max(1, limit)))
            while sqlite3_step(stmt) == SQLITE_ROW {
                ids.append(String(cString: sqlite3_column_text(stmt, 0)))
            }
            sqlite3_finalize(stmt)
        }
        return ids.compactMap { try? loadSessionSnapshotUnlocked(sessionId: $0) }
    }

    public func evaluateSampleFreshness(sessionSnap: [String: Any]) -> [String: Any] {
        guard let stateDoc = sessionSnap["state"] as? [String: Any],
              let lastSample = stateDoc["last_valid_sample"] as? [String: Any] else {
            return ["has_sample": false, "fresh": false, "sample_state": "none", "reason": "NO_SAMPLE_RECORDED", "sample": NSNull()]
        }
        let sid = (sessionSnap["session_id"] as? String) ?? ""
        let sampleBoot = (lastSample["boot_id"] as? String) ?? ""
        guard let tracker = liveSampleTracker[sid],
              (tracker["boot_id"] as? String) == Self.processBootId,
              sampleBoot == Self.processBootId else {
            return ["has_sample": true, "fresh": false, "sample_state": "historical", "reason": "PRIOR_PROCESS_RUN", "sample": lastSample]
        }
        let nowMono = ProcessInfo.processInfo.systemUptime
        let capMono = (tracker["captured_mono"] as? Double) ?? 0.0
        let ageS = max(0.0, ((nowMono - capMono) * 1000.0).rounded() / 1000.0)
        if (tracker["invalidated"] as? Bool) == true {
            return [
                "has_sample": true,
                "fresh": false,
                "sample_state": "historical",
                "age_s": ageS,
                "reason": (tracker["invalidation_reason"] as? String) ?? "LINK_LOST",
                "sample": lastSample,
            ]
        }
        if ageS > 3.0 {
            return [
                "has_sample": true,
                "fresh": false,
                "sample_state": "historical",
                "age_s": ageS,
                "reason": "STALE_SAMPLE",
                "sample": lastSample,
            ]
        }
        return ["has_sample": true, "fresh": true, "sample_state": "fresh", "age_s": ageS, "reason": NSNull(), "sample": lastSample]
    }

    public func recordModbusObservation(sessionId: String, modbusTel: [String: Any], actor: String = "transport") throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        let snap = try loadSessionSnapshotUnlocked(sessionId: sessionId)
        guard var stateDoc = snap["state"] as? [String: Any] else {
            throw FieldScanDomainError(code: "CORRUPT_SESSION", message: "Invalid session state", statusCode: 500)
        }
        let prof = (stateDoc["profile_snapshot"] as? [String: Any]) ?? [:]
        if ((prof["identity_pending"] as? Bool) ?? false) || !((prof["auto_decode_allowed"] as? Bool) ?? true) {
            throw FieldScanDomainError(
                code: "PROFILE_MISMATCH",
                message: "Automatic register scaling is inhibited for unverified profile '\(snap["profile_id"] ?? "")'.",
                statusCode: 409
            )
        }

        let nowUTC = Self.utcNowISO()
        let nowMono = ProcessInfo.processInfo.systemUptime
        let rawSource = (modbusTel["source"] as? String) ?? "unknown"
        let isSim = rawSource.hasPrefix("simulator") || ((modbusTel["simulation"] as? Bool) ?? false) || ((snap["simulation"] as? Bool) ?? false)
        let online = (modbusTel["online"] as? Bool) ?? false
        let proto = (modbusTel["protocol"] as? String) ?? (isSim ? "simulation" : "modbus_tcp_mbap")
        let tempVal = modbusTel["temp_c"]
        let humVal = modbusTel["humidity_rh"]
        let tempQ = (modbusTel["temp_quality"] as? String) ?? ((tempVal is NSNull || tempVal == nil) ? "unavailable" : "valid")
        let humQ = (modbusTel["humidity_quality"] as? String) ?? ((humVal is NSNull || humVal == nil) ? "unavailable" : "valid")

        let measurements: [[String: Any]] = [
            ["quantity": "temperature", "value": tempQ == "valid" ? (tempVal ?? NSNull()) : NSNull(), "unit": "Cel", "quality": tempQ],
            ["quantity": "relative_humidity", "value": humQ == "valid" ? (humVal ?? NSNull()) : NSNull(), "unit": "%RH", "quality": humQ],
        ]
        let nextSeq = ((snap["seq"] as? Int) ?? 1) + 1
        let stepId = (snap["step_id"] as? String) ?? "verify_modbus"

        if online {
            let smp: [String: Any] = [
                "seq": nextSeq,
                "captured_at_utc": nowUTC,
                "boot_id": Self.processBootId,
                "measurements": measurements,
                "unit_id": (modbusTel["slave_id"] as? Int) ?? 1,
                "protocol": proto,
                "source": isSim ? "simulation" : rawSource,
                "scope": isSim ? "simulation" : "sensor_communication",
                "simulation": isSim,
            ]
            stateDoc["last_valid_sample"] = smp
            liveSampleTracker[sessionId] = [
                "captured_mono": nowMono,
                "boot_id": Self.processBootId,
                "invalidated": false,
            ]
            if stepId == "as_found" && (stateDoc["as_found"] == nil || stateDoc["as_found"] is NSNull) {
                stateDoc["as_found"] = ["recorded_at_utc": nowUTC, "communication": "responded", "sample": smp]
            }
        } else {
            liveSampleTracker[sessionId]?["invalidated"] = true
            liveSampleTracker[sessionId]?["invalidation_reason"] = (modbusTel["error_code"] as? String) ?? "READ_TIMEOUT"
            if stepId == "as_found" && (stateDoc["as_found"] == nil || stateDoc["as_found"] is NSNull) {
                stateDoc["as_found"] = ["recorded_at_utc": nowUTC, "communication": "no_response"]
            }
        }

        updateSessionRowUnlocked(
            sessionId: sessionId,
            seq: nextSeq,
            stepId: stepId,
            status: (snap["status"] as? String) ?? "open",
            simulation: isSim,
            language: (snap["language"] as? String) ?? "en",
            assetConfirmed: (snap["asset_confirmed"] as? Bool) ?? false,
            stateDoc: stateDoc
        )
        insertEventUnlocked(
            sessionId: sessionId,
            seq: nextSeq,
            kind: online ? "sensor.sample" : "sensor.timeout",
            stepId: stepId,
            occurredAtUTC: nowUTC,
            monotonicS: nowMono,
            source: isSim ? "simulation" : rawSource,
            actor: actor,
            simulation: isSim,
            payload: ["measurements": measurements, "protocol": proto, "plc_verified": false, "scada_verified": false]
        )
        return try loadSessionSnapshotUnlocked(sessionId: sessionId)
    }

    public func applyAction(sessionId: String, payload: [String: Any]) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }

        let idemKey = (payload["idempotency_key"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        var canon = payload
        canon.removeValue(forKey: "idempotency_key")
        let reqHash = canonicalJSONHash(canon)
        if let ik = idemKey, !ik.isEmpty {
            if let replay = try checkIdempotencyUnlocked(scopeKey: "action:\(sessionId):\(ik)", payloadHash: reqHash) {
                return replay
            }
        }

        let snap = try loadSessionSnapshotUnlocked(sessionId: sessionId)
        let curStatus = (snap["status"] as? String) ?? "open"
        let curSeq = (snap["seq"] as? Int) ?? 1
        let curStep = (snap["step_id"] as? String) ?? "identify"
        var curLang = (snap["language"] as? String) ?? "en"
        var assetConfirmed = (snap["asset_confirmed"] as? Bool) ?? false
        let idPending = (snap["identity_pending"] as? Bool) ?? false
        let isSim = (snap["simulation"] as? Bool) ?? false
        var stateDoc = (snap["state"] as? [String: Any]) ?? [:]
        let prof = (stateDoc["profile_snapshot"] as? [String: Any]) ?? [:]

        var action = ((payload["action"] as? String) ?? (payload["intent"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        var actor = (payload["actor"] as? String) ?? "operator"

        if curStatus == "closed" && action != "amend_closed_session" {
            throw FieldScanDomainError(code: "INVALID_TRANSITION", message: "Session is already closed.", statusCode: 409)
        }
        if let expSeq = payload["expected_seq"] as? Int, expSeq != curSeq {
            throw FieldScanDomainError(code: "INVALID_TRANSITION", message: "Stale sequence expected=\(expSeq) actual=\(curSeq).", statusCode: 409)
        }
        if let expStep = payload["expected_step"] as? String, expStep != curStep {
            throw FieldScanDomainError(code: "INVALID_TRANSITION", message: "Stale step expected=\(expStep) actual=\(curStep).", statusCode: 409)
        }

        var responseNote: [String: Any] = ["action_applied": action]
        var workingPayload = payload

        if action == "voice_utterance" {
            let utt = ((payload["utterance"] as? String) ?? (payload["text"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let uttId = payload["utterance_id"] as? String
            let (isEcho, echoReason) = isTTSEchoOrDuplicate(utterance: utt, utteranceId: uttId)
            if isEcho {
                let res: [String: Any] = ["ignored": true, "reason": echoReason ?? "ECHO", "session": snap]
                if let ik = idemKey, !ik.isEmpty { storeIdempotencyUnlocked(scopeKey: "action:\(sessionId):\(ik)", payloadHash: reqHash, response: res) }
                return res
            }
            let parsed = Self.classifyBilingualVoiceIntent(utt, currentLanguage: curLang)
            if (parsed["ambiguous"] as? Bool) == true {
                let res: [String: Any] = [
                    "ignored": false,
                    "clarification_required": true,
                    "clarification_reason": parsed["clarification_reason"] ?? "AMBIGUOUS",
                    "parsed_intent": parsed,
                    "session": snap,
                ]
                if let ik = idemKey, !ik.isEmpty { storeIdempotencyUnlocked(scopeKey: "action:\(sessionId):\(ik)", payloadHash: reqHash, response: res) }
                return res
            }
            action = (parsed["intent"] as? String) ?? ""
            actor = "voice_operator"
            for (k, v) in parsed { workingPayload[k] = v }
            responseNote["parsed_intent"] = parsed
            responseNote["action_applied"] = action
        }

        let nowUTC = Self.utcNowISO()
        var newStep = curStep
        var newStatus = curStatus

        if action == "switch_language" {
            let tl = ((workingPayload["target_language"] as? String) ?? "en").lowercased()
            curLang = tl == "es" ? "es" : "en"
            preferredLanguage = curLang
            responseNote["language"] = curLang
        } else if action == "confirm_identity" {
            if !idPending { assetConfirmed = true }
            if curStep == "identify" { newStep = "as_found" }
        } else if action == "record_as_found" {
            stateDoc["as_found"] = [
                "recorded_at_utc": nowUTC,
                "communication": (workingPayload["communication"] as? String) ?? "observed",
                "observation": (workingPayload["observation"] as? String) ?? "",
            ]
            if curStep == "as_found" { newStep = "inspect" }
        } else if action == "highlight_component" || action == "inspect_component" {
            let cid = (workingPayload["component_3d_id"] as? String) ?? "upper_barrel_dip"
            responseNote["component_3d_id"] = idPending ? NSNull() : cid
            responseNote["citations_verification"] = verifyAndResolveCitations(profile: prof, requestedPages: [cid == "upper_barrel_dip" ? 5 : 1])
        } else if action == "show_manual" {
            let p = (workingPayload["page"] as? Int) ?? 1
            responseNote["citations_verification"] = verifyAndResolveCitations(profile: prof, requestedPages: [p])
        } else if action == "read_current" {
            responseNote["freshness"] = evaluateSampleFreshness(sessionSnap: snap)
        } else if action == "repeat_step" || action == "start_readonly_check" || action == "request_capture" {
            responseNote["ready_for_execution"] = true
        } else if action == "record_observation" {
            let txt = ((workingPayload["note_text"] as? String) ?? (workingPayload["observation"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if !txt.isEmpty {
                var obs = (stateDoc["observations"] as? [[String: Any]]) ?? []
                obs.append(["recorded_at_utc": nowUTC, "step_id": curStep, "actor": actor, "text": txt])
                stateDoc["observations"] = obs
            }
        } else if action == "request_confirmation" {
            let tok = "cfm-" + String(UUID().uuidString.prefix(8)).lowercased()
            stateDoc["pending_confirmation_token"] = ["token": tok, "created_at_utc": nowUTC]
            responseNote["confirmation_required"] = true
            responseNote["confirmation_token"] = tok
        } else if action == "confirm_physical_change" {
            let pendingTok = (stateDoc["pending_confirmation_token"] as? [String: Any])?["token"] as? String
            let suppliedTok = workingPayload["confirmation_token"] as? String
            if actor == "voice_operator" && (pendingTok == nil || pendingTok != suppliedTok) {
                throw FieldScanDomainError(
                    code: "CONFIRMATION_REQUIRED",
                    message: "Spoken physical change requires separate explicit operator confirmation.",
                    statusCode: 409
                )
            }
            let desc = ((workingPayload["action_taken"] as? String) ?? (workingPayload["description"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !desc.isEmpty else {
                throw FieldScanDomainError(code: "MISSING_CHANGE_DESCRIPTION", message: "Requires action_taken.", statusCode: 400)
            }
            var changes = (stateDoc["confirmed_changes"] as? [[String: Any]]) ?? []
            let entry: [String: Any] = [
                "change_id": "chg-" + String(UUID().uuidString.prefix(8)).lowercased(),
                "confirmed_at_utc": nowUTC,
                "step_id": curStep,
                "confirmed_by": (workingPayload["technician_id"] as? String) ?? "bench_technician",
                "observed": (workingPayload["observed"] as? String) ?? "",
                "action_taken": desc,
            ]
            changes.append(entry)
            stateDoc["confirmed_changes"] = changes
            stateDoc["pending_confirmation_token"] = NSNull()
            responseNote["confirmed_change"] = entry
        } else if action == "advance_step" {
            let target = (workingPayload["target_step"] as? String) ?? ""
            let steps = ((prof["procedure"] as? [String: Any])?["steps"] as? [[String: Any]]) ?? []
            let allowed = (steps.first(where: { ($0["step_id"] as? String) == curStep })?["allowed_transitions"] as? [String]) ?? []
            guard allowed.contains(target) else {
                throw FieldScanDomainError(code: "INVALID_TRANSITION", message: "Transition \(curStep) -> \(target) not allowed.", statusCode: 409)
            }
            newStep = target
        } else if action == "close_session" {
            let freshInfo = evaluateSampleFreshness(sessionSnap: snap)
            let freshOk = (freshInfo["fresh"] as? Bool) ?? false
            var missing: [String] = []
            if idPending || !assetConfirmed { missing.append("verified_asset_identity") }
            if stateDoc["as_found"] == nil || stateDoc["as_found"] is NSNull { missing.append("initial_as_found_state") }
            let evFiles = (stateDoc["evidence_files"] as? [[String: Any]]) ?? []
            if evFiles.isEmpty { missing.append("inspection_photo_evidence") }
            if !freshOk && !isSim { missing.append("fresh_physical_modbus_sample") }
            let changes = (stateDoc["confirmed_changes"] as? [[String: Any]]) ?? []
            if let lastChg = changes.last?["confirmed_at_utc"] as? String {
                let lastSmp = ((stateDoc["last_valid_sample"] as? [String: Any])?["captured_at_utc"] as? String) ?? ""
                if lastSmp.isEmpty || lastSmp < lastChg {
                    missing.append("post_change_modbus_verification")
                }
            }
            let partial = !missing.isEmpty
            stateDoc["partial_close"] = partial
            stateDoc["missing_evidence"] = missing
            stateDoc["as_left"] = [
                "recorded_at_utc": nowUTC,
                "confirmed_changes_count": changes.count,
                "summary": isSim
                    ? "Simulation walkthrough completed (synthetic data only)."
                    : (partial ? "Partial maintenance record closed." : "Bench inspection completed: sensor responded on Modbus."),
            ]
            newStep = "close"
            newStatus = "closed"
        } else if action == "amend_closed_session" {
            let note = ((workingPayload["amendment_note"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !note.isEmpty else {
                throw FieldScanDomainError(code: "MISSING_AMENDMENT_NOTE", message: "Amendment requires amendment_note.", statusCode: 400)
            }
            var amends = (stateDoc["amendments"] as? [[String: Any]]) ?? []
            amends.append(["amended_at_utc": nowUTC, "actor": actor, "note": note, "previous_seq": curSeq])
            stateDoc["amendments"] = amends
        } else {
            throw FieldScanDomainError(code: "UNKNOWN_ACTION", message: "Unsupported action '\(action)'", statusCode: 400)
        }

        let nextSeq = curSeq + 1
        updateSessionRowUnlocked(
            sessionId: sessionId,
            seq: nextSeq,
            stepId: newStep,
            status: newStatus,
            simulation: isSim,
            language: curLang,
            assetConfirmed: assetConfirmed,
            stateDoc: stateDoc
        )
        insertEventUnlocked(
            sessionId: sessionId,
            seq: nextSeq,
            kind: "action.\(action)",
            stepId: newStep,
            occurredAtUTC: nowUTC,
            monotonicS: ProcessInfo.processInfo.systemUptime,
            source: isSim ? "simulation" : "session_engine",
            actor: actor,
            simulation: isSim,
            payload: responseNote
        )

        let updatedSnap = try loadSessionSnapshotUnlocked(sessionId: sessionId)
        var out = responseNote
        out["ok"] = true
        out["seq"] = nextSeq
        out["session"] = updatedSnap
        if let ik = idemKey, !ik.isEmpty {
            storeIdempotencyUnlocked(scopeKey: "action:\(sessionId):\(ik)", payloadHash: reqHash, response: out)
        }
        return out
    }

    // MARK: - Camera Evidence & Auto-Capture (`VIS-01..07`, `EXP-03`)

    public func notifyCameraSourceChanged(_ newSource: String) {
        lock.lock()
        let clean = newSource.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean != activeCameraSource {
            cameraEpoch += 1
            activeCameraSource = clean
            stabilityWindowTimes.removeAll()
            recentFrameDigests.removeAll()
        }
        lock.unlock()
    }

    public func ingestCameraFrameForSession(
        sessionId: String,
        rawJPEG: Data,
        visionTel: [String: Any],
        cameraSource: String,
        manualTrigger: Bool
    ) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }

        guard rawJPEG.count > 16, rawJPEG[0] == 0xFF, rawJPEG[1] == 0xD8 else {
            return ["captured": false, "reason": "INVALID_JPEG"]
        }
        if cameraSource != activeCameraSource {
            notifyCameraSourceChanged(cameraSource)
        }

        let digest = Self.sha256Hex(rawJPEG)
        let repeats = recentFrameDigests.filter { $0 == digest }.count
        recentFrameDigests.append(digest)
        if recentFrameDigests.count > 6 { recentFrameDigests.removeFirst() }

        if repeats >= 2 && !manualTrigger {
            stabilityWindowTimes.removeAll()
            return ["captured": false, "stream_frozen": true, "reason": "STREAM_FROZEN_DUPLICATE_DIGEST"]
        }

        let srcLow = cameraSource.lowercased()
        let isSim = srcLow.hasPrefix("sim") || srcLow.contains("simulator")
        let isUpload = srcLow.contains("upload") || srcLow.contains("custom")
        let isPhysical = !isSim && !isUpload

        let occluded = ((visionTel["hand_detected"] as? Bool) ?? false)
            || ((visionTel["tool_detected"] as? Bool) ?? false)
            || ((visionTel["white_sticker_occluded"] as? Bool) ?? false)
        let sharpness = (visionTel["sharpness_score"] as? Double) ?? 45.0
        let exposureOk = (visionTel["exposure_ok"] as? Bool) ?? true
        let detected = (visionTel["detected"] as? Bool) ?? true

        let snap = try loadSessionSnapshotUnlocked(sessionId: sessionId)
        let curStep = (snap["step_id"] as? String) ?? "inspect"
        let curSeq = (snap["seq"] as? Int) ?? 1
        var stateDoc = (snap["state"] as? [String: Any]) ?? [:]
        let roiZone = (visionTel["anomaly_zone"] as? String) ?? "full_sensor"

        let trigger: String
        let origin: String

        if !manualTrigger {
            guard isPhysical else {
                return ["captured": false, "reason": "NON_PHYSICAL_SOURCE_AUTO_CAPTURE_BLOCKED", "evidence_origin": isSim ? "simulation" : "uploaded_file"]
            }
            if occluded || sharpness < 24.0 || !exposureOk || !detected {
                stabilityWindowTimes.removeAll()
                return ["captured": false, "reason": "FRAME_REJECTED_OCCLUDED_OR_BLURRY"]
            }
            let dedupKey = "\(sessionId):\(curStep):\(cameraEpoch):\(roiZone)"
            if autoCapturedKeys.contains(dedupKey) {
                return ["captured": false, "reason": "ALREADY_CAPTURED_FOR_STEP_CONTEXT"]
            }
            let nowUp = ProcessInfo.processInfo.systemUptime
            stabilityWindowTimes.append(nowUp)
            stabilityWindowTimes.removeAll { (nowUp - $0) > 1.5 }
            if stabilityWindowTimes.count < 5 {
                return ["captured": false, "reason": "AWAITING_STABILITY_WINDOW", "usable_frames_in_window": stabilityWindowTimes.count]
            }
            autoCapturedKeys.insert(dedupKey)
            trigger = "auto_physical_window"
            origin = "live_physical_camera"
        } else {
            trigger = "manual_operator"
            origin = isSim ? "simulation" : (isUpload ? "uploaded_file" : "manual_physical_camera")
        }

        try ensureDiskSpace()
        let photoId = "pho-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased()
        let fileName = "\(sessionId)_\(photoId)_original.jpg"
        let tmpURL = evidenceDirectoryURL.appendingPathComponent("\(fileName).tmp")
        let finalURL = evidenceDirectoryURL.appendingPathComponent(fileName)

        try rawJPEG.write(to: tmpURL, options: .atomic)
        guard Self.sha256File(tmpURL) == digest else {
            try? FileManager.default.removeItem(at: tmpURL)
            throw FieldScanDomainError(code: "CORRUPT_PHOTO_WRITE", message: "Photo hash mismatch", statusCode: 500)
        }
        if FileManager.default.fileExists(atPath: finalURL.path) {
            try? FileManager.default.removeItem(at: finalURL)
        }
        try FileManager.default.moveItem(at: tmpURL, to: finalURL)

        let nowUTC = Self.utcNowISO()
        let record: [String: Any] = [
            "photo_id": photoId,
            "step_id": curStep,
            "captured_at_utc": nowUTC,
            "camera_source": cameraSource,
            "camera_epoch": cameraEpoch,
            "capture_trigger": trigger,
            "evidence_origin": origin,
            "roi_zone": roiZone,
            "original_filename": fileName,
            "original_sha256": digest,
            "simulation": isSim,
        ]
        var evFiles = (stateDoc["evidence_files"] as? [[String: Any]]) ?? []
        evFiles.append(record)
        stateDoc["evidence_files"] = evFiles

        let nextSeq = curSeq + 1
        updateSessionRowUnlocked(
            sessionId: sessionId,
            seq: nextSeq,
            stepId: curStep,
            status: (snap["status"] as? String) ?? "open",
            simulation: (snap["simulation"] as? Bool) ?? false,
            language: (snap["language"] as? String) ?? "en",
            assetConfirmed: (snap["asset_confirmed"] as? Bool) ?? false,
            stateDoc: stateDoc
        )
        insertEventUnlocked(
            sessionId: sessionId,
            seq: nextSeq,
            kind: "evidence.photo",
            stepId: curStep,
            occurredAtUTC: nowUTC,
            monotonicS: ProcessInfo.processInfo.systemUptime,
            source: origin,
            actor: manualTrigger ? "operator" : "vision_auto",
            simulation: isSim,
            payload: record
        )
        return ["captured": true, "photo": record, "seq": nextSeq]
    }

    // MARK: - Transactional PDF + JSON Dossier Exporter (`EXP-01..07`)

    public func exportSessionDossier(sessionId: String, payload: [String: Any]) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }

        let snap = try loadSessionSnapshotUnlocked(sessionId: sessionId)
        let seq = (snap["seq"] as? Int) ?? 1
        let audience = ((payload["audience"] as? String) ?? "private_bench").lowercased()
        let supersedesId = payload["supersedes_export_id"] as? String
        let idemKey = (payload["idempotency_key"] as? String) ?? "auto-\(sessionId)-\(seq)-\(audience)-\(supersedesId ?? "none")"

        let canonReq: [String: Any] = [
            "session_id": sessionId,
            "seq": seq,
            "audience": audience,
            "supersedes": supersedesId ?? "",
        ]
        let reqHash = canonicalJSONHash(canonReq)
        if let replay = try checkIdempotencyUnlocked(scopeKey: "export:\(idemKey)", payloadHash: reqHash) {
            return replay
        }

        try ensureDiskSpace()
        let freshness = evaluateSampleFreshness(sessionSnap: snap)
        let freshOk = (freshness["fresh"] as? Bool) ?? false
        let isSim = (snap["simulation"] as? Bool) ?? false
        let stateDoc = (snap["state"] as? [String: Any]) ?? [:]
        var missing = (stateDoc["missing_evidence"] as? [String]) ?? []
        if !isSim && !freshOk && !missing.contains("fresh_physical_modbus_sample") {
            missing.append("fresh_physical_modbus_sample")
        }
        let isPartial = ((stateDoc["partial_close"] as? Bool) ?? false) || !missing.isEmpty
        let confirmedChanges = (stateDoc["confirmed_changes"] as? [[String: Any]]) ?? []
        let exportProfile = isSim ? "simulated_demo" : "intervention"
        let prefix = isSim ? "SIMULATION_" : ""
        let stem = "\(prefix)fieldscan_\(sessionId)_seq\(seq)_\(audience)"
        let exportId = "exp-\(sessionId)-r\(seq)"
        let nowUTC = Self.utcNowISO()

        let rawSerial = snap["serial_number"] as? String
        let maskedSerial: Any = {
            guard let s = rawSerial, !s.isEmpty else { return NSNull() }
            if audience == "public_demo" {
                return s.count <= 4 ? "****" : String(repeating: "*", count: s.count - 4) + s.suffix(4)
            }
            return s
        }()

        let dossierRecord: [String: Any] = [
            "schema_version": 1,
            "contract_version": Self.contractVersion,
            "export_id": exportId,
            "supersedes_export_id": supersedesId ?? NSNull(),
            "generated_at_utc": nowUTC,
            "export_profile": exportProfile,
            "audience": audience,
            "simulation": isSim,
            "partial_report": isPartial,
            "pending_evidence": missing,
            "session_id": sessionId,
            "session_seq": seq,
            "device": [
                "profile_id": snap["profile_id"] ?? "tzone_tht02",
                "profile_revision": snap["profile_revision"] ?? "",
                "profile_sha256": snap["profile_sha256"] ?? "",
                "manual_sha256": snap["manual_sha256"] ?? NSNull(),
                "serial_number": maskedSerial,
            ],
            "scope_limitations": [
                "verified_scope": isSim ? "simulation" : (isPartial ? "partial_observation" : "sensor_communication"),
                "plc_verified": false,
                "scada_verified": false,
                "calibrated_against_reference": false,
            ],
            "as_found": stateDoc["as_found"] ?? NSNull(),
            "as_left": stateDoc["as_left"] ?? NSNull(),
            "latest_sample_evaluation": freshness,
            "confirmed_changes": confirmedChanges,
            "evidence_catalog": stateDoc["evidence_files"] ?? [],
            "events": snap["events"] ?? [],
        ]

        let jsonTmp = exportsDirectoryURL.appendingPathComponent("\(stem).json.tmp")
        let jsonFinal = exportsDirectoryURL.appendingPathComponent("\(stem).json")
        let pdfTmp = exportsDirectoryURL.appendingPathComponent("\(stem).pdf.tmp")
        let pdfFinal = exportsDirectoryURL.appendingPathComponent("\(stem).pdf")

        let jsonData = try JSONSerialization.data(withJSONObject: dossierRecord, options: [.prettyPrinted, .sortedKeys])
        try jsonData.write(to: jsonTmp, options: .atomic)
        let jsonSha = Self.sha256Hex(jsonData)

        let pdfData = renderPDFBytes(record: dossierRecord)
        try pdfData.write(to: pdfTmp, options: .atomic)
        guard pdfData.starts(with: Data("%PDF-".utf8)) else {
            try? FileManager.default.removeItem(at: pdfTmp)
            throw FieldScanDomainError(code: "PDF_GENERATION_FAILED", message: "Invalid PDF header", statusCode: 500)
        }
        let pdfSha = Self.sha256Hex(pdfData)

        for (tmp, fin) in [(jsonTmp, jsonFinal), (pdfTmp, pdfFinal)] {
            if FileManager.default.fileExists(atPath: fin.path) {
                try? FileManager.default.removeItem(at: fin)
            }
            try FileManager.default.moveItem(at: tmp, to: fin)
        }

        let manifest: [String: Any] = [
            "ok": true,
            "export_id": exportId,
            "supersedes_export_id": supersedesId ?? NSNull(),
            "session_id": sessionId,
            "session_seq": seq,
            "export_profile": exportProfile,
            "audience": audience,
            "simulation": isSim,
            "partial_report": isPartial,
            "pending_evidence": missing,
            "confirmed_changes_count": confirmedChanges.count,
            "json_path": jsonFinal.path,
            "pdf_path": pdfFinal.path,
            "json_url": "/exports/\(jsonFinal.lastPathComponent)",
            "pdf_url": "/exports/\(pdfFinal.lastPathComponent)",
            "json_sha256": jsonSha,
            "pdf_sha256": pdfSha,
        ]
        storeIdempotencyUnlocked(scopeKey: "export:\(idemKey)", payloadHash: reqHash, response: manifest)
        return manifest
    }

    private func renderPDFBytes(record: [String: Any]) -> Data {
        let isSim = (record["simulation"] as? Bool) ?? false
        let isPartial = (record["partial_report"] as? Bool) ?? false
        let title = isSim
            ? "FIELDSCAN MAINTENANCE DOSSIER [SIMULATION MODE]"
            : (isPartial ? "FIELDSCAN MAINTENANCE DOSSIER [PARTIAL REPORT]" : "FIELDSCAN BENCH MAINTENANCE DOSSIER")
        let changes = (record["confirmed_changes"] as? [[String: Any]]) ?? []
        let observations = (record["observations"] as? [[String: Any]]) ?? []
        let events = (record["events"] as? [[String: Any]]) ?? []
        var summaryLines = [
            title,
            "Export ID: \(record["export_id"] ?? "") | Session: \(record["session_id"] ?? "") (seq \(record["session_seq"] ?? 1))",
            "Generated UTC: \(record["generated_at_utc"] ?? "") | Profile: \(record["export_profile"] ?? "")",
            isSim ? "SIMULATION ONLY: Synthetic data does not verify physical sensor hardware." : "Scope: Bench Read-Only Modbus Communication (PLC/SCADA & Calibration Not Verified).",
            "Confirmed Physical Changes: \(changes.count) (0 = inspection only, zero modifications)",
            "Observations (\(observations.count)) & Ordered Events (\(events.count)):",
        ]
        for ev in events {
            summaryLines.append("  seq=\(ev["seq"] ?? 0) | \(ev["occurred_at_utc"] ?? "") | \(ev["kind"] ?? "") | step=\(ev["step_id"] ?? "")")
        }

        #if canImport(UIKit)
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 595, height: 842))
        return renderer.pdfData { ctx in
            ctx.beginPage()
            let attrsTitle: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 13, weight: .bold),
                .foregroundColor: UIColor.black,
            ]
            let attrsBody: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 9.5, weight: .regular),
                .foregroundColor: UIColor.darkGray,
            ]
            var y: CGFloat = 36
            for (idx, line) in summaryLines.enumerated() {
                if y > 790 {
                    ctx.beginPage()
                    y = 36
                }
                (line as NSString).draw(
                    in: CGRect(x: 32, y: y, width: 530, height: 24),
                    withAttributes: idx == 0 ? attrsTitle : attrsBody
                )
                y += idx == 0 ? 28 : 16
            }
        }
        #else
        // Minimal valid PDF-1.4 document builder for macOS CLI unit testing
        let escaped = summaryLines.joined(separator: " | ").replacingOccurrences(of: "(", with: "[").replacingOccurrences(of: ")", with: "]")
        let stream = "BT /F1 10 Tf 36 780 Td (\(escaped)) Tj ET"
        let pdf = """
        %PDF-1.4
        1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
        2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
        3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
        4 0 obj << /Length \(stream.utf8.count) >> stream
        \(stream)
        endstream endobj
        5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
        xref
        0 6
        0000000000 65535 f 
        trailer << /Root 1 0 R /Size 6 >>
        %%EOF
        """
        return Data(pdf.utf8)
        #endif
    }

    // MARK: - Planned Calibration Extension (`CAL-00` .. `CAL-09`)

    public static func plannedCalibrationCard() -> [String: Any] {
        return [
            "feature_id": "calibration_and_verified_adjustment",
            "badge": "Calibration & Verified Adjustment · Planned",
            "status": "planned",
            "pilot_writes_enabled": false,
            "tzone_offset_write_supported": false,
            "event_summary_en": "FieldScan already guides inspection and reads our TZONE sensors over Modbus. Calibration and Verified Adjustment is a planned extension. It will compare a device against a reference and, on documented compatible models, apply and verify an adjustment.",
            "tzone_scope_reason": "Published TZONE TZ THT-02 / THT-03R manuals document communication baud rate (0x0005) as the only writable parameter and expose no temperature or relative humidity offset registers. FieldScan keeps TZONE sensors strictly read-only.",
            "roadmap_stages": [
                [
                    "stage": "C0",
                    "title": "Planned Extension Informational Card (Active in P0)",
                    "status": "active_informational",
                    "detail": "Displays scope boundary between live read-only bench diagnostics and planned metrology workflow.",
                ],
                [
                    "stage": "C1",
                    "title": "Read-Only Reference Standard Comparison",
                    "status": "planned",
                    "detail": "Logs reference instrument ID, certificate expiry, uncertainty, stability window, and read-only error delta.",
                ],
                [
                    "stage": "C2",
                    "title": "Verified Single-Model Bench Adjustment (Candidate: NOVUS RHT Climate RS-485)",
                    "status": "planned",
                    "detail": "Requires verified register map, human confirmation of single bounded offset write, readback, and post-adjustment as_left check.",
                ],
                [
                    "stage": "C3",
                    "title": "Multi-Vendor Profile Adapter (Candidate: Vaisala HMP Series)",
                    "status": "planned",
                    "detail": "Reuses session contract with model-specific two-point/command adapter on dedicated calibration bench.",
                ],
                [
                    "stage": "C4",
                    "title": "Laboratory Calibration Procedure Integration",
                    "status": "planned",
                    "detail": "Exports traceable comparison records governed by approved laboratory metrology procedures.",
                ],
            ],
        ]
    }

    public static func evaluateCalibrationComparisonContract(payload: [String: Any]) -> [String: Any] {
        struct CalProfileSpec {
            let supportsAdjustment: Bool
            let convention: String
            let tempBounds: (Double, Double)
            let rhBounds: (Double, Double)
            let scaleLSB: Double
            let tempTol: Double
            let rhTol: Double
        }
        let specs: [String: CalProfileSpec] = [
            "tzone_tht02": CalProfileSpec(supportsAdjustment: false, convention: "none", tempBounds: (0, 0), rhBounds: (0, 0), scaleLSB: 0.1, tempTol: 0.3, rhTol: 2.0),
            "novus_rht_climate_lab": CalProfileSpec(supportsAdjustment: true, convention: "additive_user_offset", tempBounds: (-5.0, 5.0), rhBounds: (-10.0, 10.0), scaleLSB: 0.1, tempTol: 0.3, rhTol: 1.8),
            "vaisala_hmp110_lab": CalProfileSpec(supportsAdjustment: true, convention: "two_point_reference_sequence", tempBounds: (-3.0, 3.0), rhBounds: (-8.0, 8.0), scaleLSB: 0.01, tempTol: 0.2, rhTol: 1.5),
        ]

        let profileId = ((payload["profile_id"] as? String) ?? "tzone_tht02").trimmingCharacters(in: .whitespacesAndNewlines)
        guard let prof = specs[profileId] else {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "UNSUPPORTED_PROFILE",
                "missing_or_invalid_fields": ["profile_id"],
                "message": "Profile '\(profileId)' has no validated metrology definition.",
            ]
        }

        let quantity = ((payload["quantity"] as? String) ?? "temperature").trimmingCharacters(in: .whitespacesAndNewlines)
        let expectedUnit = (quantity == "relative_humidity") ? "%RH" : "Cel"
        let ref = (payload["reference"] as? [String: Any]) ?? [:]
        let uut = (payload["uut"] as? [String: Any]) ?? [:]

        if (payload["voice_ambiguous"] as? Bool) == true || (ref["unit_confirmed"] as? Bool) == false {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "CLARIFICATION_REQUIRED",
                "missing_or_invalid_fields": ["reference.unit_confirmation"],
                "message": "Spoken or ambiguous reference value lacks confirmed unit; clarify value and unit before comparison.",
            ]
        }

        var missing: [String] = []
        for k in ["instrument_id", "certificate_id", "valid_until_utc", "uncertainty", "unit", "samples"] {
            let v = ref[k]
            if v == nil || v is NSNull || (v as? String)?.isEmpty == true || (v as? [[String: Any]])?.isEmpty == true {
                missing.append("reference.\(k)")
            }
        }
        for k in ["unit", "samples"] {
            let v = uut[k]
            if v == nil || v is NSNull || (v as? String)?.isEmpty == true || (v as? [[String: Any]])?.isEmpty == true {
                missing.append("uut.\(k)")
            }
        }
        if !missing.isEmpty {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "INCOMPLETE_REFERENCE_RECORD",
                "missing_or_invalid_fields": missing,
                "message": "Reference record incomplete: missing \(missing.joined(separator: ", ")).",
            ]
        }

        if (ref["unit"] as? String) != expectedUnit || (uut["unit"] as? String) != expectedUnit {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "INCOMPATIBLE_UNIT",
                "missing_or_invalid_fields": ["unit"],
                "message": "Unit mismatch: expected '\(expectedUnit)'.",
            ]
        }

        let isoFmt = ISO8601DateFormatter()
        let nowStr = (payload["evaluated_at_utc"] as? String) ?? "2026-11-19T00:00:00Z"
        let expStr = (ref["valid_until_utc"] as? String) ?? ""
        if let nowDt = isoFmt.date(from: nowStr), let expDt = isoFmt.date(from: expStr), expDt < nowDt {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "REFERENCE_EXPIRED",
                "missing_or_invalid_fields": ["reference.valid_until_utc"],
                "message": "Reference certificate expired at \(expStr).",
            ]
        }

        if (payload["prior_write_link_dropped"] as? Bool) == true && (payload["reconciled_parameter_readback"] as? Bool) != true {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "UNCERTAIN_RESULT_RECONCILIATION_REQUIRED",
                "reconciliation_required": true,
                "retry_blocked": true,
                "message": "Link dropped after parameter transmission: result is uncertain. Read back stored parameter before any retry.",
            ]
        }

        func doubleVal(_ any: Any?) -> Double? {
            if let d = any as? Double { return d }
            if let i = any as? Int { return Double(i) }
            if let n = any as? NSNumber { return n.doubleValue }
            return nil
        }

        let refRows = (ref["samples"] as? [[String: Any]]) ?? []
        let uutRows = (uut["samples"] as? [[String: Any]]) ?? []
        let refSamples = refRows.compactMap { doubleVal($0["value"]) }
        let uutSamples = uutRows.compactMap { doubleVal($0["value"]) }
        let refTimes = refRows.enumerated().map { idx, r in doubleVal(r["ts_s"]) ?? Double(idx) }
        let uutTimes = uutRows.enumerated().map { idx, r in doubleVal(r["ts_s"]) ?? Double(idx) }

        guard !refSamples.isEmpty && !uutSamples.isEmpty else {
            return ["extension_status": "planned", "proposal_allowed": false, "writes_emitted": 0, "status_code": "INCOMPLETE_REFERENCE_RECORD"]
        }

        let maxSkew = doubleVal(payload["max_allowed_skew_s"]) ?? 5.0
        let maxSpread = doubleVal(payload["max_stability_spread"]) ?? (quantity == "temperature" ? 0.25 : 1.0)
        let obsSkew = abs((refTimes.reduce(0, +) / Double(refTimes.count)) - (uutTimes.reduce(0, +) / Double(uutTimes.count)))
        let refSpread = (refSamples.max() ?? 0) - (refSamples.min() ?? 0)
        let uutSpread = (uutSamples.max() ?? 0) - (uutSamples.min() ?? 0)

        if obsSkew > maxSkew || refSpread > maxSpread || uutSpread > maxSpread {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "INDETERMINATE_UNSTABLE_OR_SKEWED",
                "observed_skew_s": (obsSkew * 1000).rounded() / 1000,
                "ref_spread": (refSpread * 10000).rounded() / 10000,
                "uut_spread": (uutSpread * 10000).rounded() / 10000,
            ]
        }

        let refMean = ((refSamples.reduce(0, +) / Double(refSamples.count)) * 1000).rounded() / 1000
        let uutMean = ((uutSamples.reduce(0, +) / Double(uutSamples.count)) * 1000).rounded() / 1000
        let err = ((uutMean - refMean) * 1000).rounded() / 1000
        let corr = ((refMean - uutMean) * 1000).rounded() / 1000
        let tol = (quantity == "relative_humidity") ? prof.rhTol : prof.tempTol
        let withinTol = abs(err) <= tol

        if let p2 = payload["second_point"] as? [String: Any],
           let p2Ref = doubleVal(p2["ref_value"]),
           let p2Uut = doubleVal(p2["uut_value"]) {
            let p2Err = ((p2Uut - p2Ref) * 1000).rounded() / 1000
            let nonLin = (abs(p2Err - err) * 1000).rounded() / 1000
            let p2Resid = ((p2Err + corr) * 1000).rounded() / 1000
            if abs(p2Resid) > tol || nonLin > tol {
                return [
                    "extension_status": "planned",
                    "proposal_allowed": false,
                    "writes_emitted": 0,
                    "status_code": "NONLINEAR_OR_RESIDUAL_OUT_OF_CRITERIA",
                    "claimed_calibrated": false,
                    "point_1_error": err,
                    "point_2_error": p2Err,
                    "residual_at_point_2": p2Resid,
                ]
            }
        }

        if !prof.supportsAdjustment {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "READONLY_COMPARISON_COMPLETE",
                "scope": "single_point_readonly_comparison",
                "claimed_calibrated": false,
                "evaluated_at_utc": nowStr,
                "quantity": quantity,
                "unit": expectedUnit,
                "reference_mean": refMean,
                "uut_as_found_mean": uutMean,
                "error_uut_minus_ref": err,
                "within_profile_tolerance": withinTol,
                "method": "simultaneous_bench_comparison_readonly",
            ]
        }

        let priorOffset = doubleVal(payload["prior_device_offset"]) ?? 0.0
        let bounds = (quantity == "relative_humidity") ? prof.rhBounds : prof.tempBounds
        let newTotalOffset = ((priorOffset + corr) * 1000).rounded() / 1000
        if newTotalOffset < bounds.0 || newTotalOffset > bounds.1 || newTotalOffset.isNaN {
            return [
                "extension_status": "planned",
                "proposal_allowed": false,
                "writes_emitted": 0,
                "status_code": "OFFSET_OUT_OF_PROFILE_BOUNDS",
                "proposed_offset": newTotalOffset,
                "allowed_bounds": [bounds.0, bounds.1],
            ]
        }

        let rawReg = Int((newTotalOffset / prof.scaleLSB).rounded())
        var result: [String: Any] = [
            "extension_status": "planned",
            "proposal_allowed": true,
            "writes_emitted": 0,
            "requires_human_confirmation": true,
            "claimed_calibrated": false,
            "status_code": "LAB_ADJUSTMENT_PROPOSAL_READY",
            "profile_id": profileId,
            "convention": prof.convention,
            "quantity": quantity,
            "unit": expectedUnit,
            "as_found_uut_mean": uutMean,
            "reference_mean": refMean,
            "as_found_error": err,
            "prior_device_offset": priorOffset,
            "proposed_device_offset": newTotalOffset,
            "proposed_register_raw_int": rawReg,
        ]

        if (payload["human_confirmed"] as? Bool) == true, let asLeft = doubleVal(payload["as_left_uut_mean"]) {
            let persisted = doubleVal(payload["readback_offset_after_reboot"] ?? payload["readback_offset"])
            let residual = ((asLeft - refMean) * 1000).rounded() / 1000
            let persOk = persisted != nil && abs(persisted! - newTotalOffset) <= (prof.scaleLSB + 1e-6)
            result["status_code"] = (abs(residual) <= tol && persOk) ? "VERIFIED_ADJUSTMENT_PASS" : "POST_ADJUSTMENT_REVIEW_REQUIRED"
            result["human_confirmed"] = true
            result["as_found_preserved"] = uutMean
            result["readback_offset"] = persisted ?? NSNull()
            result["persistence_verified"] = persOk
            result["as_left_uut_mean"] = asLeft
            result["residual_error"] = residual
            result["within_tolerance_as_left"] = abs(residual) <= tol
        }
        return result
    }

    // MARK: - SQLite Row Helpers

    private func updateSessionRowUnlocked(
        sessionId: String,
        seq: Int,
        stepId: String,
        status: String,
        simulation: Bool,
        language: String,
        assetConfirmed: Bool,
        stateDoc: [String: Any]
    ) {
        guard let db = db,
              let sData = try? JSONSerialization.data(withJSONObject: stateDoc),
              let sStr = String(data: sData, encoding: .utf8) else { return }
        var stmt: OpaquePointer?
        let sql = "UPDATE sessions SET seq=?, step_id=?, status=?, simulation=?, language=?, asset_confirmed=?, updated_at_utc=?, state_json=? WHERE session_id=?;"
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            sqlite3_bind_int(stmt, 1, Int32(seq))
            sqlite3_bind_text(stmt, 2, (stepId as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 3, (status as NSString).utf8String, -1, nil)
            sqlite3_bind_int(stmt, 4, simulation ? 1 : 0)
            sqlite3_bind_text(stmt, 5, (language as NSString).utf8String, -1, nil)
            sqlite3_bind_int(stmt, 6, assetConfirmed ? 1 : 0)
            sqlite3_bind_text(stmt, 7, (Self.utcNowISO() as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 8, (sStr as NSString).utf8String, -1, nil)
            sqlite3_bind_text(stmt, 9, (sessionId as NSString).utf8String, -1, nil)
            sqlite3_step(stmt)
            sqlite3_finalize(stmt)
        }
    }

    private func loadSessionSnapshotUnlocked(sessionId: String) throws -> [String: Any] {
        guard let db = db else {
            throw FieldScanDomainError(code: "DB_UNAVAILABLE", message: "SQLite store not open", statusCode: 500)
        }
        var stmt: OpaquePointer?
        let q = """
        SELECT created_at_utc, updated_at_utc, status, step_id, seq, profile_id, profile_revision,
               profile_sha256, manual_sha256, identity_pending, asset_tag, serial_number,
               asset_confirmed, transport_mode, simulation, build_id, language, state_json
        FROM sessions WHERE session_id = ?;
        """
        guard sqlite3_prepare_v2(db, q, -1, &stmt, nil) == SQLITE_OK else {
            throw FieldScanDomainError(code: "DB_ERROR", message: "Prepare failed", statusCode: 500)
        }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_text(stmt, 1, (sessionId as NSString).utf8String, -1, nil)
        guard sqlite3_step(stmt) == SQLITE_ROW else {
            throw FieldScanDomainError(code: "SESSION_NOT_FOUND", message: "Unknown session '\(sessionId)'", statusCode: 404)
        }

        let created = String(cString: sqlite3_column_text(stmt, 0))
        let updated = String(cString: sqlite3_column_text(stmt, 1))
        let status = String(cString: sqlite3_column_text(stmt, 2))
        let stepId = String(cString: sqlite3_column_text(stmt, 3))
        let seq = Int(sqlite3_column_int(stmt, 4))
        let profileId = String(cString: sqlite3_column_text(stmt, 5))
        let profileRev = String(cString: sqlite3_column_text(stmt, 6))
        let profileSha = String(cString: sqlite3_column_text(stmt, 7))
        let manualSha = sqlite3_column_type(stmt, 8) == SQLITE_NULL ? nil : String(cString: sqlite3_column_text(stmt, 8))
        let idPending = sqlite3_column_int(stmt, 9) != 0
        let assetTag = sqlite3_column_type(stmt, 10) == SQLITE_NULL ? nil : String(cString: sqlite3_column_text(stmt, 10))
        let serialNum = sqlite3_column_type(stmt, 11) == SQLITE_NULL ? nil : String(cString: sqlite3_column_text(stmt, 11))
        let assetConf = sqlite3_column_int(stmt, 12) != 0
        let transMode = String(cString: sqlite3_column_text(stmt, 13))
        let sim = sqlite3_column_int(stmt, 14) != 0
        let buildId = String(cString: sqlite3_column_text(stmt, 15))
        let lang = String(cString: sqlite3_column_text(stmt, 16))
        let stateStr = String(cString: sqlite3_column_text(stmt, 17))
        let stateObj = ((try? JSONSerialization.jsonObject(with: Data(stateStr.utf8))) as? [String: Any]) ?? [:]

        var events: [[String: Any]] = []
        var evStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, "SELECT seq, event_id, kind, step_id, occurred_at_utc, boot_id, source, actor, simulation, payload_json FROM session_events WHERE session_id=? ORDER BY seq ASC;", -1, &evStmt, nil) == SQLITE_OK {
            sqlite3_bind_text(evStmt, 1, (sessionId as NSString).utf8String, -1, nil)
            while sqlite3_step(evStmt) == SQLITE_ROW {
                let pStr = String(cString: sqlite3_column_text(evStmt, 9))
                let pObj = ((try? JSONSerialization.jsonObject(with: Data(pStr.utf8))) as? [String: Any]) ?? [:]
                let evBoot = String(cString: sqlite3_column_text(evStmt, 5))
                events.append([
                    "seq": Int(sqlite3_column_int(evStmt, 0)),
                    "event_id": String(cString: sqlite3_column_text(evStmt, 1)),
                    "kind": String(cString: sqlite3_column_text(evStmt, 2)),
                    "step_id": String(cString: sqlite3_column_text(evStmt, 3)),
                    "occurred_at_utc": String(cString: sqlite3_column_text(evStmt, 4)),
                    "historical_from_prior_boot": (evBoot != Self.processBootId),
                    "source": String(cString: sqlite3_column_text(evStmt, 6)),
                    "actor": String(cString: sqlite3_column_text(evStmt, 7)),
                    "simulation": sqlite3_column_int(evStmt, 8) != 0,
                    "payload": pObj,
                ])
            }
            sqlite3_finalize(evStmt)
        }

        var snap: [String: Any] = [
            "contract_version": Self.contractVersion,
            "session_id": sessionId,
            "created_at_utc": created,
            "updated_at_utc": updated,
            "status": status,
            "step_id": stepId,
            "seq": seq,
            "profile_id": profileId,
            "profile_revision": profileRev,
            "profile_sha256": profileSha,
            "manual_sha256": manualSha ?? NSNull(),
            "identity_pending": idPending,
            "asset_tag": assetTag ?? NSNull(),
            "serial_number": serialNum ?? NSNull(),
            "asset_confirmed": assetConf,
            "transport_mode": transMode,
            "simulation": sim,
            "build_id": buildId,
            "language": lang,
            "state": stateObj,
            "events": events,
        ]
        snap["freshness"] = evaluateSampleFreshness(sessionSnap: snap)
        return snap
    }
}
