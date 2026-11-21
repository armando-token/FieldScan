import Foundation
import Compression
import CryptoKit
import SQLite3

/// Native iPadOS Transactional Package Store (`Application Support/FieldScanCatalog/`).
///
/// Implements Section 4 & Section 5.1/5.2 of the Cloud Integration Megaplan:
/// - Stores verified immutable packages in `Application Support/FieldScanCatalog/packages/<manifest-sha256>/`
///   completely isolated from `Documents/` and `BundleResources/`.
/// - Enforces Ed25519 manifest signature, duplicate-key rejection, artifact SHA-256 + byte_count,
///   semantic cross-references (`PDF` page counts, `twin.glb` nodes, `twin.parts.json`, `twin.actions.json`),
///   anti-rollback `publication_seq`, instruction revocations (`M4-REVOKE-01`), and crash recovery (`M4-PKG-04`).
/// - Supports bounded local directory & `.zip`/`.fspkg` import (`M4-PKG-01`, `M4-PKG-09`) and
///   chunked `FileHandle` Byte-Range (`200`/`206`/`416`/`HEAD`) local serving (`Section 4.4`).
public final class FieldScanPackageStore {
    public static let shared = FieldScanPackageStore()

    public let catalogRootURL: URL
    public let stagingDirURL: URL
    public let packagesDirURL: URL
    public let dbFileURL: URL
    public let bundleRootURL: URL?
    public var trustedKeys: [String: Data]
    public var minFreeDiskBytes: Int64 = 4 * 1024 * 1024

    private let lock = NSRecursiveLock()
    private var db: OpaquePointer?
    private var activeSelection: SessionContentContext?

    public convenience init() {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        let catRoot = appSupport.appendingPathComponent("FieldScanCatalog", isDirectory: true)
        var bRoot: URL? = nil
        if let res = Bundle.main.resourceURL {
            for cand in [res.appendingPathComponent("BundleResources"), res] {
                if FileManager.default.fileExists(atPath: cand.appendingPathComponent("knowledge").path) {
                    bRoot = cand
                    break
                }
            }
        }
        self.init(catalogRoot: catRoot, bundleRoot: bRoot)
    }

    public init(
        catalogRoot: URL,
        bundleRoot: URL?,
        trustedKeys: [String: Data]? = nil
    ) {
        self.catalogRootURL = catalogRoot
        self.stagingDirURL = catalogRoot.appendingPathComponent("staging", isDirectory: true)
        self.packagesDirURL = catalogRoot.appendingPathComponent("packages", isDirectory: true)
        self.dbFileURL = catalogRoot.appendingPathComponent("catalog.sqlite3")
        self.bundleRootURL = bundleRoot
        self.trustedKeys = trustedKeys ?? FieldScanCatalogContract.defaultTrustedPublicKeys()

        let fm = FileManager.default
        try? fm.createDirectory(at: stagingDirURL, withIntermediateDirectories: true)
        try? fm.createDirectory(at: packagesDirURL, withIntermediateDirectories: true)

        openAndInitSQLite()
        _ = recoverOnBoot()
    }

    /// Registers an authorized Ed25519 signing public key (raw 32-byte Base64) for production/cloud verification.
    @discardableResult
    public func registerTrustedSigner(keyId: String, publicKeyBase64: String) throws -> [String: Any] {
        let cleanId = keyId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanId.isEmpty else {
            throw FieldScanCatalogError(code: "UNTRUSTED_KEY_ID", message: "Signer key_id cannot be empty")
        }
        guard let raw = Data(base64Encoded: publicKeyBase64.trimmingCharacters(in: .whitespacesAndNewlines)),
              raw.count == 32 else {
            throw FieldScanCatalogError(code: "UNTRUSTED_KEY_ID", message: "Ed25519 public key must be 32-byte Base64")
        }
        do {
            _ = try Curve25519.Signing.PublicKey(rawRepresentation: raw)
        } catch {
            throw FieldScanCatalogError(code: "UNTRUSTED_KEY_ID", message: "Malformed Ed25519 public key for '\(cleanId)'")
        }
        lock.lock()
        trustedKeys[cleanId] = raw
        let allIds = Array(trustedKeys.keys).sorted()
        lock.unlock()
        return ["key_id": cleanId, "trusted_key_ids": allIds]
    }

    deinit {
        if let handle = db {
            sqlite3_close(handle)
        }
    }

    private func openAndInitSQLite() {
        guard sqlite3_open_v2(
            dbFileURL.path,
            &db,
            SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX,
            nil
        ) == SQLITE_OK, let handle = db else {
            return
        }
        let schema = """
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS installations (
            manifest_sha256 TEXT PRIMARY KEY,
            issuer TEXT NOT NULL,
            channel TEXT NOT NULL,
            product_id TEXT NOT NULL,
            variant_id TEXT NOT NULL,
            publication_seq INTEGER NOT NULL,
            state TEXT NOT NULL,
            installed_at_utc TEXT NOT NULL,
            source_origin TEXT NOT NULL,
            envelope_json TEXT NOT NULL,
            manifest_json TEXT NOT NULL,
            capabilities_json TEXT NOT NULL,
            revocations_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS active_variants (
            issuer TEXT NOT NULL,
            channel TEXT NOT NULL,
            product_id TEXT NOT NULL,
            variant_id TEXT NOT NULL,
            manifest_sha256 TEXT NOT NULL,
            publication_seq INTEGER NOT NULL,
            updated_at_utc TEXT NOT NULL,
            PRIMARY KEY (issuer, channel, product_id, variant_id)
        );
        CREATE TABLE IF NOT EXISTS revoked_instructions (
            instruction_id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            variant_id TEXT NOT NULL,
            revoked_by_manifest_sha256 TEXT NOT NULL,
            publication_seq INTEGER NOT NULL,
            reason TEXT NOT NULL,
            recorded_at_utc TEXT NOT NULL
        );
        """
        sqlite3_exec(handle, schema, nil, nil, nil)
    }

    // MARK: - Boot Crash Recovery (`M4-PKG-04`)

    @discardableResult
    public func recoverOnBoot() -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        let fm = FileManager.default
        var cleanedStaging = 0
        if let items = try? fm.contentsOfDirectory(at: stagingDirURL, includingPropertiesForKeys: nil) {
            for item in items {
                try? fm.removeItem(at: item)
                cleanedStaging += 1
            }
        }

        var quarantined: [String] = []
        guard let db = db else {
            return ["cleaned_staging": cleanedStaging, "quarantined": quarantined]
        }

        var verifiedShas = Set<String>()
        var stmt: OpaquePointer?
        if sqlite3_prepare_v2(db, "SELECT manifest_sha256, manifest_json FROM installations WHERE state='verified';", -1, &stmt, nil) == SQLITE_OK {
            while sqlite3_step(stmt) == SQLITE_ROW {
                let msha = String(cString: sqlite3_column_text(stmt, 0))
                let mjson = String(cString: sqlite3_column_text(stmt, 1))
                let pkgDir = packagesDirURL.appendingPathComponent(msha, isDirectory: true)
                var intact = fm.fileExists(atPath: pkgDir.path)
                if intact,
                   let data = mjson.data(using: .utf8),
                   let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
                   let arts = obj["artifacts"] as? [[String: Any]] {
                    for a in arts {
                        if let rel = a["path"] as? String {
                            if !fm.fileExists(atPath: pkgDir.appendingPathComponent(rel).path) {
                                intact = false
                                break
                            }
                        }
                    }
                } else {
                    intact = false
                }
                if intact {
                    verifiedShas.insert(msha)
                } else {
                    quarantined.append(msha)
                }
            }
            sqlite3_finalize(stmt)
        }

        for bad in quarantined {
            var upd: OpaquePointer?
            if sqlite3_prepare_v2(db, "UPDATE installations SET state='failed' WHERE manifest_sha256=?;", -1, &upd, nil) == SQLITE_OK {
                sqlite3_bind_text(upd, 1, (bad as NSString).utf8String, -1, nil)
                sqlite3_step(upd)
                sqlite3_finalize(upd)
            }
        }

        if let pDirs = try? fm.contentsOfDirectory(at: packagesDirURL, includingPropertiesForKeys: nil) {
            for pdir in pDirs where !verifiedShas.contains(pdir.lastPathComponent) {
                try? fm.removeItem(at: pdir)
                quarantined.append(pdir.lastPathComponent)
            }
        }

        return ["cleaned_staging": cleanedStaging, "quarantined": quarantined]
    }

    private func ensureDiskSpace(requiredBytes: Int64) throws {
        if let vals = try? catalogRootURL.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey, .volumeAvailableCapacityKey]) {
            let free = vals.volumeAvailableCapacityForImportantUsage ?? Int64(vals.volumeAvailableCapacity ?? Int(requiredBytes + minFreeDiskBytes * 2))
            if free < (requiredBytes + minFreeDiskBytes) {
                throw FieldScanCatalogError(
                    code: "DISK_FULL",
                    message: "Insufficient storage space (\(free) bytes free). Active verified package preserved.",
                    statusCode: 507
                )
            }
        }
    }

    // MARK: - Semantic Validator (`Section 4.2 Step 4`, `M4-PKG-08`, `M4-3D-02`, `M4-DOC-01..02`)

    private func validatePackageSemantics(stageDir: URL, manifest: [String: Any]) throws -> [String: Any] {
        let artifacts = (manifest["artifacts"] as? [[String: Any]]) ?? []
        var byRole: [String: [[String: Any]]] = [:]
        for a in artifacts {
            let r = (a["role"] as? String) ?? ""
            byRole[r, default: []].append(a)
        }

        var docPageCounts: [String: Int] = [:]
        for pdfArt in (byRole["manual_pdf"] ?? []) {
            let rel = (pdfArt["path"] as? String) ?? ""
            let pdfURL = stageDir.appendingPathComponent(rel)
            let pCount = try FieldScanCatalogContract.inspectPDFPageCount(pdfURL)
            let docId = (pdfArt["document_id"] as? String) ?? URL(fileURLWithPath: rel).deletingPathExtension().lastPathComponent
            docPageCounts[docId] = pCount
        }

        if let idxArt = (byRole["manual_index"]?.first ?? byRole["document_index"]?.first),
           let rel = idxArt["path"] as? String {
            let idxData = try Data(contentsOf: stageDir.appendingPathComponent(rel))
            guard let idxObj = try FieldScanCatalogContract.parseJSONStrictNoDuplicateKeys(idxData) as? [String: Any] else {
                throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "manual_index must be an object")
            }
            let docEntries: [[String: Any]] = {
                if let arr = idxObj["documents"] as? [[String: Any]] {
                    return arr
                }
                if idxObj["document_id"] is String {
                    return [idxObj]
                }
                return []
            }()
            let hasManualPdfs = !(byRole["manual_pdf"] ?? []).isEmpty
            for docEntry in docEntries {
                guard let did = docEntry["document_id"] as? String, !did.isEmpty else { continue }
                if hasManualPdfs {
                    if docPageCounts[did] == nil {
                        throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "manual_index references unknown document_id '\(did)'")
                    }
                } else {
                    let pc = (docEntry["page_count"] as? Int) ?? ((docEntry["pages"] as? [[String: Any]])?.count ?? 0)
                    guard pc >= 1 else {
                        throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "document_index '\(did)' has invalid page_count")
                    }
                    docPageCounts[did] = pc
                }
            }
        }

        var glbMeta: [String: Any] = [:]
        var validPartIds = Set<String>()
        var validViewIds = Set<String>()
        let caps = (manifest["capabilities"] as? [String: Any]) ?? [:]

        if (caps["interactive_twin"] as? Bool) == true {
            guard let glbRel = byRole["twin_glb"]?.first?["path"] as? String,
                  let partsRel = byRole["twin_parts"]?.first?["path"] as? String,
                  let actionsRel = byRole["twin_actions"]?.first?["path"] as? String else {
                throw FieldScanCatalogError(code: "MISSING_CAPABILITY_DEPENDENCY", message: "Missing twin scene artifacts")
            }
            let glbData = try Data(contentsOf: stageDir.appendingPathComponent(glbRel))
            glbMeta = try FieldScanCatalogContract.inspectGLBBinary(glbData)
            let glbNodes = Set((glbMeta["node_names"] as? [String]) ?? [])

            let partsData = try Data(contentsOf: stageDir.appendingPathComponent(partsRel))
            guard let partsObj = try FieldScanCatalogContract.parseJSONStrictNoDuplicateKeys(partsData) as? [String: Any],
                  let partsList = partsObj["parts"] as? [[String: Any]], !partsList.isEmpty else {
                throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "twin.parts.json must declare non-empty parts[]")
            }
            let rawUnits = ((partsObj["units"] as? String) ?? (partsObj["unit"] as? String) ?? "meters")
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .lowercased()
            let validUnits: Set<String> = ["m", "meter", "meters", "mm", "millimeter", "millimeters"]
            guard validUnits.contains(rawUnits) else {
                throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Unsupported twin units '\(rawUnits)'")
            }

            for p in partsList {
                let pid = ((p["part_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let nname = ((p["node_name"] as? String) ?? (p["node_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                if pid.isEmpty || nname.isEmpty {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Every part requires part_id and node_name/node_id")
                }
                if validPartIds.contains(pid) {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Duplicate part_id '\(pid)' in twin.parts.json")
                }
                if !glbNodes.contains(nname) {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Part '\(pid)' references missing GLB node '\(nname)'")
                }
                validPartIds.insert(pid)
            }

            for v in ((partsObj["views"] as? [[String: Any]]) ?? []) {
                if let vid = v["view_id"] as? String, !vid.isEmpty {
                    validViewIds.insert(vid)
                }
            }

            let actionsData = try Data(contentsOf: stageDir.appendingPathComponent(actionsRel))
            guard let actionsObj = try FieldScanCatalogContract.parseJSONStrictNoDuplicateKeys(actionsData) as? [String: Any],
                  let actionsList = actionsObj["actions"] as? [[String: Any]] else {
                throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "twin.actions.json must declare actions[]")
            }
            for act in actionsList {
                let kind = (act["kind"] as? String) ?? ""
                guard FieldScanCatalogContract.allowedTwinActionKinds.contains(kind) else {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Unsupported twin action kind '\(kind)'")
                }
                if let pid = act["part_id"] as? String, !validPartIds.contains(pid) {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Action references unknown part_id '\(pid)'")
                }
                if let vid = act["view_id"] as? String, !validViewIds.isEmpty, !validViewIds.contains(vid) {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Action references unknown view_id '\(vid)'")
                }
                if let cit = act["citation_id"] as? String {
                    try Self.validateCitationId(cit, docPageCounts: docPageCounts)
                }
            }
        }

        if (caps["procedures"] as? Bool) == true,
           let procRel = byRole["procedures"]?.first?["path"] as? String {
            let procData = try Data(contentsOf: stageDir.appendingPathComponent(procRel))
            guard let procObj = try FieldScanCatalogContract.parseJSONStrictNoDuplicateKeys(procData) as? [String: Any],
                  let steps = procObj["steps"] as? [[String: Any]] else {
                throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "procedures.json must declare steps[]")
            }
            for st in steps {
                if let cit = st["citation_id"] as? String {
                    try Self.validateCitationId(cit, docPageCounts: docPageCounts)
                }
                if let pid = st["part_id"] as? String, !validPartIds.isEmpty, !validPartIds.contains(pid) {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Procedure references unknown part_id '\(pid)'")
                }
            }
        }

        return [
            "doc_page_counts": docPageCounts,
            "glb_meta": glbMeta,
            "part_count": validPartIds.count,
        ]
    }

    private static func validateCitationId(_ citId: String, docPageCounts: [String: Int]) throws {
        let comps = citId.split(separator: ":", omittingEmptySubsequences: false).map(String.init)
        guard comps.count >= 2, comps[1].hasPrefix("p"), let pNum = Int(comps[1].dropFirst()) else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Malformed citation_id '\(citId)'")
        }
        guard let maxPage = docPageCounts[comps[0]] else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Citation '\(citId)' references missing document '\(comps[0])'")
        }
        guard pNum >= 1 && pNum <= maxPage else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Citation '\(citId)' page \(pNum) out of range 1..\(maxPage)")
        }
    }

    // MARK: - Transactional Installation (`M4-PKG-01..09`)

    public func installVerifiedPackage(
        envelopeData: Data,
        blobsBySha256: [String: URL],
        channel: String = "default",
        sourceOrigin: String = "file_import",
        simulateCrashBeforeDBCommit: Bool = false
    ) throws -> [String: Any] {
        let (manifest, manifestSha, _) = try FieldScanCatalogContract.verifyAndDecodeManifestEnvelope(
            envelopeData,
            trustedKeys: trustedKeys
        )
        let artifacts = (manifest["artifacts"] as? [[String: Any]]) ?? []
        let totalBytes = artifacts.reduce(Int64(0)) { $0 + Int64(($1["byte_count"] as? Int) ?? 0) }
        try ensureDiskSpace(requiredBytes: totalBytes)

        let issuer = (manifest["issuer"] as? String) ?? "fieldscan-demo"
        let productId = (manifest["product_id"] as? String) ?? ""
        let variantId = (manifest["variant_id"] as? String) ?? ""
        let pubSeq = (manifest["publication_seq"] as? Int) ?? 1

        lock.lock()
        defer { lock.unlock() }

        // Anti-rollback check (`M4-PKG-06`)
        if let db = db {
            var stmt: OpaquePointer?
            let sql = "SELECT publication_seq, manifest_sha256 FROM active_variants WHERE issuer=? AND channel=? AND product_id=? AND variant_id=?;"
            if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
                sqlite3_bind_text(stmt, 1, (issuer as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 2, (channel as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 3, (productId as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 4, (variantId as NSString).utf8String, -1, nil)
                if sqlite3_step(stmt) == SQLITE_ROW {
                    let curSeq = Int(sqlite3_column_int(stmt, 0))
                    let curSha = String(cString: sqlite3_column_text(stmt, 1))
                    sqlite3_finalize(stmt)
                    if curSha == manifestSha {
                        return try getInstalledPackage(manifestSha256: manifestSha)
                    }
                    if pubSeq <= curSeq {
                        throw FieldScanCatalogError(
                            code: "ROLLBACK_BLOCKED",
                            message: "Rejected older/equal publication_seq \(pubSeq) (active is \(curSeq) for \(productId)/\(variantId)).",
                            statusCode: 409
                        )
                    }
                } else {
                    sqlite3_finalize(stmt)
                }
            }
        }

        let fm = FileManager.default
        let stageDir = stagingDirURL.appendingPathComponent("inst-\(UUID().uuidString.prefix(12).lowercased())", isDirectory: true)
        try fm.createDirectory(at: stageDir, withIntermediateDirectories: true)

        do {
            let expectedShas = Set(artifacts.compactMap { $0["sha256"] as? String })
            let unexpected = Set(blobsBySha256.keys).subtracting(expectedShas)
            if !unexpected.isEmpty {
                throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Unexpected undeclared blob(s) provided")
            }

            for art in artifacts {
                let expSha = (art["sha256"] as? String) ?? ""
                let expLen = (art["byte_count"] as? Int) ?? 0
                let relPath = (art["path"] as? String) ?? ""
                guard let srcURL = blobsBySha256[expSha], fm.fileExists(atPath: srcURL.path) else {
                    throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "Missing required blob for '\(relPath)'")
                }
                let dstURL = stageDir.appendingPathComponent(relPath)
                try fm.createDirectory(at: dstURL.deletingLastPathComponent(), withIntermediateDirectories: true)
                if fm.fileExists(atPath: dstURL.path) {
                    try fm.removeItem(at: dstURL)
                }
                try fm.copyItem(at: srcURL, to: dstURL)

                let attrs = try fm.attributesOfItem(atPath: dstURL.path)
                let actualLen = (attrs[.size] as? NSNumber)?.intValue ?? -1
                if actualLen != expLen {
                    throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "Artifact '\(relPath)' byte_count mismatch (\(actualLen) != \(expLen))")
                }
                guard let actualSha = FieldScanCatalogContract.sha256File(dstURL), actualSha == expSha else {
                    throw FieldScanCatalogError(code: "BLOB_HASH_MISMATCH", message: "Artifact '\(relPath)' SHA-256 mismatch")
                }
            }

            try envelopeData.write(to: stageDir.appendingPathComponent("manifest.envelope.json"), options: .atomic)
            let semantics = try validatePackageSemantics(stageDir: stageDir, manifest: manifest)

            let finalDir = packagesDirURL.appendingPathComponent(manifestSha, isDirectory: true)
            if fm.fileExists(atPath: finalDir.path) {
                try fm.removeItem(at: finalDir)
            }
            try fm.moveItem(at: stageDir, to: finalDir)

            if simulateCrashBeforeDBCommit {
                throw NSError(domain: "FieldScanSimulatedCrash", code: 99, userInfo: [NSLocalizedDescriptionKey: "SIMULATED_CRASH_AFTER_MOVE"])
            }

            let nowUTC = FieldScanSessionEngine.utcNowISO()
            let envStr = String(data: envelopeData, encoding: .utf8) ?? "{}"
            let manStr = String(data: (try? JSONSerialization.data(withJSONObject: manifest)) ?? Data("{}".utf8), encoding: .utf8) ?? "{}"
            let capsStr = String(data: (try? JSONSerialization.data(withJSONObject: manifest["capabilities"] ?? [:])) ?? Data("{}".utf8), encoding: .utf8) ?? "{}"
            var revList = (manifest["revoked_instructions"] as? [[String: Any]]) ?? []
            for wpId in ((manifest["withdrawn_procedures"] as? [String]) ?? []) where !wpId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                revList.append(["instruction_id": wpId.trimmingCharacters(in: .whitespacesAndNewlines), "reason": "Withdrawn by catalog publication"])
            }
            let revStr = String(data: (try? JSONSerialization.data(withJSONObject: revList)) ?? Data("[]".utf8), encoding: .utf8) ?? "[]"

            if let db = db {
                sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION;", nil, nil, nil)
                var ins: OpaquePointer?
                let insSQL = """
                INSERT OR REPLACE INTO installations (
                    manifest_sha256, issuer, channel, product_id, variant_id, publication_seq,
                    state, installed_at_utc, source_origin, envelope_json, manifest_json,
                    capabilities_json, revocations_json
                ) VALUES (?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?, ?, ?, ?);
                """
                if sqlite3_prepare_v2(db, insSQL, -1, &ins, nil) == SQLITE_OK {
                    sqlite3_bind_text(ins, 1, (manifestSha as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 2, (issuer as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 3, (channel as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 4, (productId as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 5, (variantId as NSString).utf8String, -1, nil)
                    sqlite3_bind_int(ins, 6, Int32(pubSeq))
                    sqlite3_bind_text(ins, 7, (nowUTC as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 8, (sourceOrigin as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 9, (envStr as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 10, (manStr as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 11, (capsStr as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(ins, 12, (revStr as NSString).utf8String, -1, nil)
                    sqlite3_step(ins)
                    sqlite3_finalize(ins)
                }

                var act: OpaquePointer?
                let actSQL = """
                INSERT INTO active_variants (issuer, channel, product_id, variant_id, manifest_sha256, publication_seq, updated_at_utc)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(issuer, channel, product_id, variant_id) DO UPDATE SET
                    manifest_sha256=excluded.manifest_sha256,
                    publication_seq=excluded.publication_seq,
                    updated_at_utc=excluded.updated_at_utc;
                """
                if sqlite3_prepare_v2(db, actSQL, -1, &act, nil) == SQLITE_OK {
                    sqlite3_bind_text(act, 1, (issuer as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(act, 2, (channel as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(act, 3, (productId as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(act, 4, (variantId as NSString).utf8String, -1, nil)
                    sqlite3_bind_text(act, 5, (manifestSha as NSString).utf8String, -1, nil)
                    sqlite3_bind_int(act, 6, Int32(pubSeq))
                    sqlite3_bind_text(act, 7, (nowUTC as NSString).utf8String, -1, nil)
                    sqlite3_step(act)
                    sqlite3_finalize(act)
                }

                for rev in revList {
                    if let iid = rev["instruction_id"] as? String, !iid.isEmpty {
                        let reason = (rev["reason"] as? String) ?? "Revoked by manufacturer bulletin"
                        var rStmt: OpaquePointer?
                        let rSQL = """
                        INSERT OR REPLACE INTO revoked_instructions (
                            instruction_id, product_id, variant_id, revoked_by_manifest_sha256,
                            publication_seq, reason, recorded_at_utc
                        ) VALUES (?, ?, ?, ?, ?, ?, ?);
                        """
                        if sqlite3_prepare_v2(db, rSQL, -1, &rStmt, nil) == SQLITE_OK {
                            sqlite3_bind_text(rStmt, 1, (iid as NSString).utf8String, -1, nil)
                            sqlite3_bind_text(rStmt, 2, (productId as NSString).utf8String, -1, nil)
                            sqlite3_bind_text(rStmt, 3, (variantId as NSString).utf8String, -1, nil)
                            sqlite3_bind_text(rStmt, 4, (manifestSha as NSString).utf8String, -1, nil)
                            sqlite3_bind_int(rStmt, 5, Int32(pubSeq))
                            sqlite3_bind_text(rStmt, 6, (reason as NSString).utf8String, -1, nil)
                            sqlite3_bind_text(rStmt, 7, (nowUTC as NSString).utf8String, -1, nil)
                            sqlite3_step(rStmt)
                            sqlite3_finalize(rStmt)
                        }
                    }
                }
                sqlite3_exec(db, "COMMIT;", nil, nil, nil)
            }

            var out = try getInstalledPackage(manifestSha256: manifestSha)
            out["semantics"] = semantics
            return out
        } catch {
            try? fm.removeItem(at: stageDir)
            throw error
        }
    }

    // MARK: - Bounded Directory & `.zip` Importer (`Section 4.3`, `M4-PKG-01`, `M4-PKG-09`)

    public func importPackage(from sourceURL: URL, channel: String = "default") throws -> [String: Any] {
        let scoped = sourceURL.startAccessingSecurityScopedResource()
        defer {
            if scoped { sourceURL.stopAccessingSecurityScopedResource() }
        }

        let fm = FileManager.default
        var isDir: ObjCBool = false
        guard fm.fileExists(atPath: sourceURL.path, isDirectory: &isDir) else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Import source does not exist: \(sourceURL.lastPathComponent)")
        }

        if isDir.boolValue {
            let envURL = sourceURL.appendingPathComponent("manifest.envelope.json")
            guard fm.fileExists(atPath: envURL.path) else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Directory missing manifest.envelope.json")
            }
            let envData = try Data(contentsOf: envURL)
            let (manifest, _, _) = try FieldScanCatalogContract.verifyAndDecodeManifestEnvelope(envData, trustedKeys: trustedKeys)
            let baseCanon = sourceURL.resolvingSymlinksInPath().standardizedFileURL.path
            var blobs: [String: URL] = [:]
            for art in ((manifest["artifacts"] as? [[String: Any]]) ?? []) {
                let rel = (art["path"] as? String) ?? ""
                let sha = (art["sha256"] as? String) ?? ""
                let cand = sourceURL.appendingPathComponent(rel).resolvingSymlinksInPath().standardizedFileURL
                guard cand.path.hasPrefix(baseCanon + "/") else {
                    throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Path escapes import directory: \(rel)")
                }
                let vals = try? cand.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey])
                if vals?.isSymbolicLink == true || vals?.isRegularFile != true {
                    throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Non-regular or symlink file rejected: \(rel)")
                }
                blobs[sha] = cand
            }
            return try installVerifiedPackage(envelopeData: envData, blobsBySha256: blobs, channel: channel, sourceOrigin: "directory_import")
        }

        // Bounded pure-Swift ZIP extractor supporting Stored (0) & Deflate (8) via Apple `Compression`
        let extractDir = stagingDirURL.appendingPathComponent("zip-\(UUID().uuidString.prefix(10).lowercased())", isDirectory: true)
        try fm.createDirectory(at: extractDir, withIntermediateDirectories: true)
        defer { try? fm.removeItem(at: extractDir) }

        let archiveData = try Data(contentsOf: sourceURL)
        try Self.extractBoundedZIP(archiveData, to: extractDir)

        let envURL = extractDir.appendingPathComponent("manifest.envelope.json")
        guard fm.fileExists(atPath: envURL.path) else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Archive missing manifest.envelope.json")
        }
        let envData = try Data(contentsOf: envURL)
        let (manifest, _, _) = try FieldScanCatalogContract.verifyAndDecodeManifestEnvelope(envData, trustedKeys: trustedKeys)
        var blobs: [String: URL] = [:]
        for art in ((manifest["artifacts"] as? [[String: Any]]) ?? []) {
            let rel = (art["path"] as? String) ?? ""
            let sha = (art["sha256"] as? String) ?? ""
            let fURL = extractDir.appendingPathComponent(rel)
            guard fm.fileExists(atPath: fURL.path) else {
                throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "Archive missing declared artifact '\(rel)'")
            }
            blobs[sha] = fURL
        }
        return try installVerifiedPackage(envelopeData: envData, blobsBySha256: blobs, channel: channel, sourceOrigin: "archive_import")
    }

    private static func extractBoundedZIP(_ data: Data, to destRoot: URL) throws {
        // Locate End of Central Directory (EOCD `0x06054b50`)
        guard data.count >= 22 else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Invalid or truncated ZIP archive")
        }
        var eocdOffset = -1
        let minSearch = max(0, data.count - 65557)
        for pos in stride(from: data.count - 22, through: minSearch, by: -1) {
            let sig = data.subdata(in: pos..<(pos + 4)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
            if sig == 0x06054B50 {
                eocdOffset = pos
                break
            }
        }
        guard eocdOffset >= 0 else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Missing ZIP End-of-Central-Directory signature")
        }

        let entryCount = Int(data.subdata(in: (eocdOffset + 10)..<(eocdOffset + 12)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian })
        let cdOffset = Int(data.subdata(in: (eocdOffset + 16)..<(eocdOffset + 20)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian })
        if entryCount > (FieldScanCatalogContract.maxArtifactsPerPackage + 8) {
            throw FieldScanCatalogError(code: "ARCHIVE_LIMIT_EXCEEDED", message: "ZIP entry count \(entryCount) exceeds limit")
        }

        var cursor = cdOffset
        var totalUncompressed = 0
        let fm = FileManager.default

        for _ in 0..<entryCount {
            guard cursor + 46 <= data.count else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Truncated ZIP central directory")
            }
            let cdSig = data.subdata(in: cursor..<(cursor + 4)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
            guard cdSig == 0x02014B50 else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Corrupt ZIP central directory entry")
            }
            let compMethod = data.subdata(in: (cursor + 10)..<(cursor + 12)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian }
            let compSize = Int(data.subdata(in: (cursor + 20)..<(cursor + 24)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian })
            let uncompSize = Int(data.subdata(in: (cursor + 24)..<(cursor + 28)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian })
            let nameLen = Int(data.subdata(in: (cursor + 28)..<(cursor + 30)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian })
            let extraLen = Int(data.subdata(in: (cursor + 30)..<(cursor + 32)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian })
            let commentLen = Int(data.subdata(in: (cursor + 32)..<(cursor + 34)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian })
            let extAttr = data.subdata(in: (cursor + 38)..<(cursor + 42)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
            let localHdrOff = Int(data.subdata(in: (cursor + 42)..<(cursor + 46)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian })

            guard cursor + 46 + nameLen + extraLen + commentLen <= data.count else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "ZIP entry name exceeds bounds")
            }
            let nameData = data.subdata(in: (cursor + 46)..<(cursor + 46 + nameLen))
            cursor += 46 + nameLen + extraLen + commentLen

            guard let rawName = String(data: nameData, encoding: .utf8) else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Non-UTF8 ZIP member name")
            }
            if rawName.hasSuffix("/") { continue }

            let unixMode = (extAttr >> 16) & 0o170000
            if unixMode == 0o120000 {
                throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Symlink rejected in archive: \(rawName)")
            }

            let normName = try FieldScanCatalogContract.normalizeSafeRelativePath(rawName)
            if uncompSize > FieldScanCatalogContract.maxSingleArtifactBytes {
                throw FieldScanCatalogError(code: "ARCHIVE_LIMIT_EXCEEDED", message: "ZIP member '\(normName)' exceeds 50 MB limit")
            }
            totalUncompressed += uncompSize
            if totalUncompressed > FieldScanCatalogContract.maxPackageTotalBytes {
                throw FieldScanCatalogError(code: "ARCHIVE_LIMIT_EXCEEDED", message: "ZIP uncompressed total exceeds 120 MB budget")
            }

            guard localHdrOff + 30 <= data.count else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Invalid local header offset")
            }
            let lNameLen = Int(data.subdata(in: (localHdrOff + 26)..<(localHdrOff + 28)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian })
            let lExtraLen = Int(data.subdata(in: (localHdrOff + 28)..<(localHdrOff + 30)).withUnsafeBytes { $0.load(as: UInt16.self).littleEndian })
            let payloadStart = localHdrOff + 30 + lNameLen + lExtraLen
            guard payloadStart + compSize <= data.count else {
                throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "Truncated ZIP compressed data for '\(normName)'")
            }
            let compSlice = data.subdata(in: payloadStart..<(payloadStart + compSize))

            let outBytes: Data
            if compMethod == 0 {
                outBytes = compSlice
            } else if compMethod == 8 {
                if uncompSize == 0 {
                    outBytes = Data()
                } else {
                    var dstBuf = Data(count: uncompSize + 64)
                    let decodedCount = dstBuf.withUnsafeMutableBytes { dstPtr -> Int in
                        compSlice.withUnsafeBytes { srcPtr -> Int in
                            guard let sBase = srcPtr.bindMemory(to: UInt8.self).baseAddress,
                                  let dBase = dstPtr.bindMemory(to: UInt8.self).baseAddress else { return 0 }
                            return compression_decode_buffer(dBase, uncompSize + 64, sBase, compSlice.count, nil, COMPRESSION_ZLIB)
                        }
                    }
                    guard decodedCount == uncompSize else {
                        throw FieldScanCatalogError(code: "ARCHIVE_LIMIT_EXCEEDED", message: "ZIP deflate size mismatch on '\(normName)'")
                    }
                    outBytes = dstBuf.prefix(uncompSize)
                }
            } else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Unsupported ZIP compression method \(compMethod)")
            }

            let outURL = destRoot.appendingPathComponent(normName)
            try fm.createDirectory(at: outURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            try outBytes.write(to: outURL, options: .atomic)
        }
    }

    // MARK: - Queries, Local Byte-Range Streaming & Context Selection (`Section 4.4`, `Section 5.1`)

    public func listInstalledPackages() -> [[String: Any]] {
        lock.lock()
        defer { lock.unlock() }
        guard let db = db else { return [] }

        var activeMap: [String: String] = [:]
        var aStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, "SELECT issuer, channel, product_id, variant_id, manifest_sha256 FROM active_variants;", -1, &aStmt, nil) == SQLITE_OK {
            while sqlite3_step(aStmt) == SQLITE_ROW {
                let k = "\(String(cString: sqlite3_column_text(aStmt, 0)))|\(String(cString: sqlite3_column_text(aStmt, 1)))|\(String(cString: sqlite3_column_text(aStmt, 2)))|\(String(cString: sqlite3_column_text(aStmt, 3)))"
                activeMap[k] = String(cString: sqlite3_column_text(aStmt, 4))
            }
            sqlite3_finalize(aStmt)
        }

        var out: [[String: Any]] = []
        var stmt: OpaquePointer?
        let sql = "SELECT manifest_sha256, issuer, channel, product_id, variant_id, publication_seq, installed_at_utc, source_origin, manifest_json, capabilities_json FROM installations WHERE state='verified' ORDER BY publication_seq DESC, installed_at_utc DESC;"
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            while sqlite3_step(stmt) == SQLITE_ROW {
                let msha = String(cString: sqlite3_column_text(stmt, 0))
                let issuer = String(cString: sqlite3_column_text(stmt, 1))
                let channel = String(cString: sqlite3_column_text(stmt, 2))
                let pid = String(cString: sqlite3_column_text(stmt, 3))
                let vid = String(cString: sqlite3_column_text(stmt, 4))
                let seq = Int(sqlite3_column_int(stmt, 5))
                let instAt = String(cString: sqlite3_column_text(stmt, 6))
                let origin = String(cString: sqlite3_column_text(stmt, 7))
                let mStr = String(cString: sqlite3_column_text(stmt, 8))
                let cStr = String(cString: sqlite3_column_text(stmt, 9))

                let mObj = ((try? JSONSerialization.jsonObject(with: Data(mStr.utf8))) as? [String: Any]) ?? [:]
                let cObj = ((try? JSONSerialization.jsonObject(with: Data(cStr.utf8))) as? [String: Bool]) ?? [:]
                let key = "\(issuer)|\(channel)|\(pid)|\(vid)"
                out.append([
                    "manifest_sha256": msha,
                    "issuer": issuer,
                    "channel": channel,
                    "product_id": pid,
                    "variant_id": vid,
                    "title": (mObj["title"] as? String) ?? "\(pid) (\(vid))",
                    "manufacturer": (mObj["manufacturer"] as? String) ?? (mObj["issuer"] as? String) ?? "UNKNOWN",
                    "model": (mObj["model"] as? String) ?? pid,
                    "connector_type": mObj["connector_type"] ?? NSNull(),
                    "publication_seq": seq,
                    "installed_at_utc": instAt,
                    "source_origin": origin,
                    "is_active_for_variant": activeMap[key] == msha,
                    "capabilities": cObj,
                    "reason_codes": (mObj["reason_codes"] as? [String]) ?? [],
                    "bench_profile_id": mObj["bench_profile_id"] ?? NSNull(),
                    "bench_modbus_homologated": (mObj["bench_modbus_homologated"] as? Bool) ?? false,
                    "artifact_count": ((mObj["artifacts"] as? [[String: Any]]) ?? []).count,
                ])
            }
            sqlite3_finalize(stmt)
        }
        return out
    }

    public func getInstalledPackage(manifestSha256: String) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        guard let db = db else {
            throw FieldScanCatalogError(code: "PACKAGE_NOT_FOUND", message: "Catalog DB unavailable", statusCode: 500)
        }
        var stmt: OpaquePointer?
        let sql = "SELECT product_id, variant_id, publication_seq, source_origin, installed_at_utc, manifest_json, capabilities_json, revocations_json FROM installations WHERE manifest_sha256=? AND state='verified';"
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw FieldScanCatalogError(code: "PACKAGE_NOT_FOUND", message: "Query error", statusCode: 500)
        }
        sqlite3_bind_text(stmt, 1, (manifestSha256 as NSString).utf8String, -1, nil)
        guard sqlite3_step(stmt) == SQLITE_ROW else {
            sqlite3_finalize(stmt)
            throw FieldScanCatalogError(code: "PACKAGE_NOT_FOUND", message: "Installed package '\(manifestSha256)' not found", statusCode: 404)
        }
        let pid = String(cString: sqlite3_column_text(stmt, 0))
        let vid = String(cString: sqlite3_column_text(stmt, 1))
        let seq = Int(sqlite3_column_int(stmt, 2))
        let origin = String(cString: sqlite3_column_text(stmt, 3))
        let instAt = String(cString: sqlite3_column_text(stmt, 4))
        let mStr = String(cString: sqlite3_column_text(stmt, 5))
        let cStr = String(cString: sqlite3_column_text(stmt, 6))
        let rStr = String(cString: sqlite3_column_text(stmt, 7))
        sqlite3_finalize(stmt)

        let pkgDir = packagesDirURL.appendingPathComponent(manifestSha256, isDirectory: true)
        guard FileManager.default.fileExists(atPath: pkgDir.path) else {
            throw FieldScanCatalogError(code: "HISTORICAL_SOURCE_UNAVAILABLE", message: "Historical source unavailable", statusCode: 404)
        }

        let manifest = ((try? JSONSerialization.jsonObject(with: Data(mStr.utf8))) as? [String: Any]) ?? [:]
        for art in ((manifest["artifacts"] as? [[String: Any]]) ?? []) {
            let rel = (art["path"] as? String) ?? ""
            if rel.isEmpty || !FileManager.default.fileExists(atPath: pkgDir.appendingPathComponent(rel).path) {
                throw FieldScanCatalogError(code: "HISTORICAL_SOURCE_UNAVAILABLE", message: "Historical source unavailable", statusCode: 404)
            }
        }
        let caps = ((try? JSONSerialization.jsonObject(with: Data(cStr.utf8))) as? [String: Bool]) ?? [:]
        let revs = ((try? JSONSerialization.jsonObject(with: Data(rStr.utf8))) as? [[String: Any]]) ?? []

        var artsOut: [[String: Any]] = []
        for var a in ((manifest["artifacts"] as? [[String: Any]]) ?? []) {
            let sha = (a["sha256"] as? String) ?? ""
            let role = (a["role"] as? String) ?? ""
            a["local_url"] = "/api/catalog/installed/\(manifestSha256)/objects/\(sha)"
            a["mime_type"] = FieldScanCatalogContract.roleMimeTypes[role] ?? "application/octet-stream"
            artsOut.append(a)
        }

        return [
            "manifest_sha256": manifestSha256,
            "product_id": pid,
            "variant_id": vid,
            "publication_seq": seq,
            "source_origin": origin,
            "installed_at_utc": instAt,
            "capabilities": caps,
            "revoked_instructions": revs,
            "manifest": manifest,
            "artifacts": artsOut,
            "package_dir": pkgDir.path,
        ]
    }

    public func getRevokedInstructions(productId: String? = nil, variantId: String? = nil) -> [[String: Any]] {
        lock.lock()
        defer { lock.unlock() }
        guard let db = db else { return [] }
        var stmt: OpaquePointer?
        let sql: String
        if productId != nil && variantId != nil {
            sql = "SELECT instruction_id, product_id, variant_id, revoked_by_manifest_sha256, publication_seq, reason, recorded_at_utc FROM revoked_instructions WHERE product_id=? AND variant_id=? ORDER BY publication_seq DESC;"
        } else {
            sql = "SELECT instruction_id, product_id, variant_id, revoked_by_manifest_sha256, publication_seq, reason, recorded_at_utc FROM revoked_instructions ORDER BY publication_seq DESC;"
        }
        var out: [[String: Any]] = []
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK {
            if let p = productId, let v = variantId {
                sqlite3_bind_text(stmt, 1, (p as NSString).utf8String, -1, nil)
                sqlite3_bind_text(stmt, 2, (v as NSString).utf8String, -1, nil)
            }
            while sqlite3_step(stmt) == SQLITE_ROW {
                out.append([
                    "instruction_id": String(cString: sqlite3_column_text(stmt, 0)),
                    "product_id": String(cString: sqlite3_column_text(stmt, 1)),
                    "variant_id": String(cString: sqlite3_column_text(stmt, 2)),
                    "revoked_by_manifest_sha256": String(cString: sqlite3_column_text(stmt, 3)),
                    "publication_seq": Int(sqlite3_column_int(stmt, 4)),
                    "reason": String(cString: sqlite3_column_text(stmt, 5)),
                    "recorded_at_utc": String(cString: sqlite3_column_text(stmt, 6)),
                ])
            }
            sqlite3_finalize(stmt)
        }
        return out
    }

    /// Serves verified installed object bytes with bounded `FileHandle` reading & HTTP `Range` (`200`, `206`, `416`, `HEAD`).
    public func readObjectRange(
        manifestSha256: String,
        objectSha256: String,
        rangeHeader: String?,
        headOnly: Bool = false
    ) throws -> (statusCode: Int, mimeType: String, headers: [String: String], body: Data) {
        guard manifestSha256.range(of: "^[0-9a-f]{64}$", options: .regularExpression) != nil,
              objectSha256.range(of: "^[0-9a-f]{64}$", options: .regularExpression) != nil else {
            throw FieldScanCatalogError(code: "PACKAGE_NOT_FOUND", message: "Invalid SHA-256 identifier", statusCode: 404)
        }
        let pkg = try getInstalledPackage(manifestSha256: manifestSha256)
        let arts = (pkg["artifacts"] as? [[String: Any]]) ?? []
        guard let matched = arts.first(where: { ($0["sha256"] as? String) == objectSha256 }),
              let relPath = matched["path"] as? String else {
            throw FieldScanCatalogError(code: "OBJECT_NOT_DECLARED", message: "Object not declared in package manifest", statusCode: 404)
        }
        let pkgRoot = URL(fileURLWithPath: pkg["package_dir"] as! String).resolvingSymlinksInPath().standardizedFileURL
        let fileURL = pkgRoot.appendingPathComponent(relPath).resolvingSymlinksInPath().standardizedFileURL
        guard fileURL.path.hasPrefix(pkgRoot.path + "/"), FileManager.default.fileExists(atPath: fileURL.path) else {
            throw FieldScanCatalogError(code: "OBJECT_MISSING", message: "Declared artifact missing on disk", statusCode: 404)
        }

        let attrs = try FileManager.default.attributesOfItem(atPath: fileURL.path)
        let totalSize = (attrs[.size] as? NSNumber)?.intValue ?? 0
        let role = (matched["role"] as? String) ?? ""
        let mime = FieldScanCatalogContract.roleMimeTypes[role] ?? "application/octet-stream"

        guard let rHdr = rangeHeader?.trimmingCharacters(in: .whitespacesAndNewlines),
              rHdr.lowercased().hasPrefix("bytes=") else {
            let body: Data
            if headOnly {
                body = Data()
            } else {
                let fh = try FileHandle(forReadingFrom: fileURL)
                defer { try? fh.close() }
                body = (try? fh.read(upToCount: FieldScanCatalogContract.maxSingleArtifactBytes)) ?? Data()
            }
            return (
                statusCode: 200,
                mimeType: mime,
                headers: [
                    "Accept-Ranges": "bytes",
                    "Content-Length": "\(totalSize)",
                    "ETag": "\"\(objectSha256)\"",
                ],
                body: body
            )
        }

        let spec = String(rHdr.dropFirst(6)).trimmingCharacters(in: .whitespaces)
        if spec.contains(",") || !spec.contains("-") {
            throw FieldScanCatalogError(code: "INVALID_BYTE_RANGE", message: "Malformed Range header", statusCode: 416)
        }
        let parts = spec.split(separator: "-", maxSplits: 1, omittingEmptySubsequences: false).map(String.init)
        let start: Int
        let end: Int
        if parts[0].isEmpty {
            guard let suffix = Int(parts[1]), suffix > 0 else {
                throw FieldScanCatalogError(code: "INVALID_BYTE_RANGE", message: "Invalid suffix Range", statusCode: 416)
            }
            start = max(0, totalSize - suffix)
            end = max(0, totalSize - 1)
        } else {
            guard let s = Int(parts[0]) else {
                throw FieldScanCatalogError(code: "INVALID_BYTE_RANGE", message: "Invalid Range start", statusCode: 416)
            }
            let e = parts[1].isEmpty ? (totalSize - 1) : (Int(parts[1]) ?? -1)
            start = s
            end = min(e, totalSize - 1)
        }

        guard totalSize > 0, start >= 0, start < totalSize, end >= start else {
            throw FieldScanCatalogError(code: "INVALID_BYTE_RANGE", message: "Byte range out of bounds", statusCode: 416)
        }
        let length = end - start + 1
        let body: Data
        if headOnly {
            body = Data()
        } else {
            let fh = try FileHandle(forReadingFrom: fileURL)
            defer { try? fh.close() }
            try fh.seek(toOffset: UInt64(start))
            body = (try? fh.read(upToCount: length)) ?? Data()
        }
        return (
            statusCode: 206,
            mimeType: mime,
            headers: [
                "Accept-Ranges": "bytes",
                "Content-Range": "bytes \(start)-\(end)/\(totalSize)",
                "Content-Length": "\(length)",
                "ETag": "\"\(objectSha256)\"",
            ],
            body: body
        )
    }

    public func buildBundleDefaultContext() -> SessionContentContext {
        var treeSha = "bundle-tzone-tht02-v2.1"
        if let root = bundleRootURL {
            let mf = root.appendingPathComponent("knowledge/resource_manifest.json")
            if let d = try? Data(contentsOf: mf),
               let obj = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any],
               let ts = obj["tree_sha256"] as? String {
                treeSha = ts
            }
        }
        return SessionContentContext(
            productId: "tzone_tht02",
            variantId: "bundled_v1_1",
            title: "TZ THT-02 · Bundled 1:1 Parametric Reference (V1.1)",
            publicationSeq: 1,
            manifestSha256: treeSha,
            localProfileId: "tzone_tht02",
            contentOrigin: "bundle",
            benchModbusHomologated: true,
            capabilities: ["documentation": true, "interactive_twin": true, "procedures": true]
        )
    }

    public func buildEmptyWorkspaceContext() -> SessionContentContext {
        return SessionContentContext(
            productId: "unassigned",
            variantId: "none",
            title: "No Sensor Loaded",
            publicationSeq: 0,
            manifestSha256: "empty-workspace",
            localProfileId: nil,
            contentOrigin: "empty_workspace",
            benchModbusHomologated: false,
            capabilities: ["documentation": false, "interactive_twin": false, "procedures": false]
        )
    }

    /// Clears the active sensor workspace to a clean empty slate (`empty_workspace`) and optionally
    /// wipes locally installed Cloud packages so the next onboarding fetches fresh signed artifacts.
    /// Does NOT touch PUSR gateway settings or authorized Modbus bus target.
    public func resetWorkspaceToCleanSlate(clearInstalledCloudPackages: Bool = true) -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        var removedCount = 0
        if clearInstalledCloudPackages {
            if let db = db {
                var cStmt: OpaquePointer?
                if sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM installations;", -1, &cStmt, nil) == SQLITE_OK {
                    if sqlite3_step(cStmt) == SQLITE_ROW {
                        removedCount = Int(sqlite3_column_int(cStmt, 0))
                    }
                    sqlite3_finalize(cStmt)
                }
                sqlite3_exec(db, "DELETE FROM installations; DELETE FROM active_variants; DELETE FROM revoked_instructions;", nil, nil, nil)
            }
            let fm = FileManager.default
            if let entries = try? fm.contentsOfDirectory(at: packagesDirURL, includingPropertiesForKeys: nil) {
                for url in entries {
                    try? fm.removeItem(at: url)
                }
            }
        }
        let emptyCtx = buildEmptyWorkspaceContext()
        activeSelection = emptyCtx
        let desc: [String: Any] = [
            "context": emptyCtx.toDictionary(),
            "scene_origin": "empty_workspace",
            "cad_exports_supported": [],
            "documents": [],
            "twin": NSNull(),
            "revoked_instructions": [],
        ]
        return [
            "ok": true,
            "removed_packages_count": removedCount,
            "selected_context": emptyCtx.toDictionary(),
            "catalog_descriptor": desc,
        ]
    }

    public func selectContextForNextSession(manifestSha256: String?) throws -> SessionContentContext {
        lock.lock()
        defer { lock.unlock() }
        if manifestSha256 == "empty_workspace" || manifestSha256 == "empty-workspace" {
            let emptyCtx = buildEmptyWorkspaceContext()
            activeSelection = emptyCtx
            return emptyCtx
        }
        guard let sha = manifestSha256, !sha.isEmpty, sha != "bundle" else {
            activeSelection = nil
            return buildBundleDefaultContext()
        }
        let pkg = try getInstalledPackage(manifestSha256: sha)
        let m = (pkg["manifest"] as? [String: Any]) ?? [:]
        let homologated = (m["bench_modbus_homologated"] as? Bool) ?? false
        let ctx = SessionContentContext(
            productId: (pkg["product_id"] as? String) ?? "unknown",
            variantId: (pkg["variant_id"] as? String) ?? "default",
            title: (m["title"] as? String) ?? "\(pkg["product_id"] ?? "") (\(pkg["variant_id"] ?? ""))",
            publicationSeq: (pkg["publication_seq"] as? Int) ?? 1,
            manifestSha256: sha,
            localProfileId: homologated ? (m["bench_profile_id"] as? String) : nil,
            contentOrigin: "catalog",
            benchModbusHomologated: homologated,
            capabilities: (pkg["capabilities"] as? [String: Bool]) ?? [:]
        )
        activeSelection = ctx
        return ctx
    }

    public func getSelectedContext() -> SessionContentContext {
        lock.lock()
        defer { lock.unlock() }
        if let sel = activeSelection {
            if sel.contentOrigin == "empty_workspace" {
                return sel
            }
            if (try? getInstalledPackage(manifestSha256: sel.manifestSha256)) != nil {
                return sel
            }
            activeSelection = nil
        }
        return buildBundleDefaultContext()
    }

    public func buildSceneAndManualDescriptor(context: SessionContentContext? = nil) throws -> [String: Any] {
        let ctx = context ?? getSelectedContext()
        if ctx.contentOrigin == "empty_workspace" {
            return [
                "context": ctx.toDictionary(),
                "scene_origin": "empty_workspace",
                "cad_exports_supported": [],
                "documents": [],
                "twin": NSNull(),
                "revoked_instructions": [],
            ]
        }
        if ctx.contentOrigin != "catalog" {
            let pages: [[String: Any]] = (1...9).map { p in
                ["page": p, "printed_page": "\(p)", "image_url": "/assets/manual_pages/page_\(p).png"]
            }
            return [
                "context": ctx.toDictionary(),
                "scene_origin": "bundled_parametric",
                "cad_exports_supported": ["dxf", "stl", "pdf", "json"],
                "documents": [[
                    "document_id": "tht02_manual_v1_1",
                    "title": "TZ THT-02 User's Manual V1.1",
                    "revision": "V1.1",
                    "page_count": 9,
                    "pdf_url": "/assets/THT02_Users_Manual_v1.1.pdf",
                    "pages": pages,
                ]],
                "twin": NSNull(),
                "revoked_instructions": getRevokedInstructions(productId: "tzone_tht02", variantId: "bundled_v1_1"),
            ]
        }

        let pkg = try getInstalledPackage(manifestSha256: ctx.manifestSha256)
        let pkgDir = URL(fileURLWithPath: pkg["package_dir"] as! String)
        let arts = (pkg["artifacts"] as? [[String: Any]]) ?? []

        var pdfByDoc: [String: [String: Any]] = [:]
        var imgByPath: [String: [String: Any]] = [:]
        var mdByPath: [String: [String: Any]] = [:]
        var idxArt: [String: Any]?
        for a in arts {
            let r = (a["role"] as? String) ?? ""
            if r == "manual_pdf" {
                let did = (a["document_id"] as? String) ?? URL(fileURLWithPath: (a["path"] as? String) ?? "doc").deletingPathExtension().lastPathComponent
                pdfByDoc[did] = a
            } else if r == "manual_page_image", let p = a["path"] as? String {
                imgByPath[p] = a
            } else if r == "manual_markdown", let p = a["path"] as? String {
                mdByPath[p] = a
            } else if r == "manual_index" || r == "document_index" {
                idxArt = a
            }
        }

        var docsOut: [[String: Any]] = []
        if let ia = idxArt, let rel = ia["path"] as? String,
           let d = try? Data(contentsOf: pkgDir.appendingPathComponent(rel)),
           let idxObj = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] {
            let docEntries: [[String: Any]] = {
                if let arr = idxObj["documents"] as? [[String: Any]] { return arr }
                if idxObj["document_id"] is String { return [idxObj] }
                return []
            }()
            for doc in docEntries {
                let did = (doc["document_id"] as? String) ?? ""
                let pdfA = pdfByDoc[did]
                let pdfURL = pdfA?["local_url"] as? String
                var pagesOut: [[String: Any]] = []
                for pg in ((doc["pages"] as? [[String: Any]]) ?? []) {
                    let pnum = (pg["page"] as? Int) ?? 1
                    let imgRel = pg["image_path"] as? String
                    let imgURL = (imgRel != nil) ? (imgByPath[imgRel!]?["local_url"] as? String) : nil
                    let mdRel = pg["markdown_path"] as? String
                    let mdURL = (mdRel != nil) ? (mdByPath[mdRel!]?["local_url"] as? String) : nil
                    let citRaw = (pg["citation_id"] as? String) ?? ""
                    let citParts = citRaw.split(separator: ":").map(String.init)
                    let secFromCit = (citParts.count >= 3) ? citParts[2] : nil
                    let secId = FieldScanCatalogContract.sanitizeReferenceText((pg["section_id"] as? String) ?? secFromCit ?? "\(pnum).1")
                    let excerptRaw = (pg["verified_excerpt"] as? String) ?? (pg["excerpt"] as? String) ?? ""
                    pagesOut.append([
                        "page": pnum,
                        "printed_page": FieldScanCatalogContract.sanitizeReferenceText("\(pg["printed_page"] ?? pnum)"),
                        "title": FieldScanCatalogContract.sanitizeReferenceText((pg["title"] as? String) ?? "Page \(pnum)"),
                        "section_id": secId,
                        "citation_id": citRaw.isEmpty ? "\(did):p\(pnum):\(secId)" : citRaw,
                        "verified_excerpt": FieldScanCatalogContract.sanitizeReferenceText(excerptRaw),
                        "image_url": imgURL ?? NSNull(),
                        "markdown_url": mdURL ?? NSNull(),
                        "pdf_fallback_url": (pdfURL != nil) ? "\(pdfURL!)#page=\(pnum)" : NSNull(),
                        "keywords": ((pg["keywords"] as? [String]) ?? []).map { $0.lowercased() },
                    ])
                }
                let resolvedPdfShaStr = (pdfA?["sha256"] as? String) ?? (doc["pdf_sha256"] as? String)
                let resolvedPdfSha: Any = resolvedPdfShaStr ?? NSNull()
                docsOut.append([
                    "document_id": did,
                    "title": FieldScanCatalogContract.sanitizeReferenceText((doc["title"] as? String) ?? did),
                    "revision": FieldScanCatalogContract.sanitizeReferenceText((doc["revision"] as? String) ?? (doc["revision_label"] as? String) ?? "rev-1"),
                    "page_count": pagesOut.isEmpty ? ((doc["page_count"] as? Int) ?? 1) : pagesOut.count,
                    "pdf_url": pdfURL ?? NSNull(),
                    "pdf_sha256": resolvedPdfSha,
                    "pages": pagesOut,
                ])
            }
        } else {
            for (did, pdfA) in pdfByDoc {
                let rel = (pdfA["path"] as? String) ?? ""
                let pc = (try? FieldScanCatalogContract.inspectPDFPageCount(pkgDir.appendingPathComponent(rel))) ?? 1
                let pdfURL = (pdfA["local_url"] as? String) ?? ""
                let pagesOut: [[String: Any]] = (1...pc).map { p in
                    [
                        "page": p,
                        "printed_page": "\(p)",
                        "title": "Page \(p)",
                        "section_id": "\(p).1",
                        "verified_excerpt": "",
                        "image_url": NSNull(),
                        "pdf_fallback_url": "\(pdfURL)#page=\(p)",
                        "keywords": [],
                    ]
                }
                docsOut.append([
                    "document_id": did,
                    "title": FieldScanCatalogContract.sanitizeReferenceText(did),
                    "revision": "rev-1",
                    "page_count": pc,
                    "pdf_url": pdfURL,
                    "pdf_sha256": (pdfA["sha256"] as? String) ?? NSNull(),
                    "pages": pagesOut,
                ])
            }
        }

        var twinDesc: Any = NSNull()
        let caps = (pkg["capabilities"] as? [String: Bool]) ?? [:]
        if caps["interactive_twin"] == true,
           let glbA = arts.first(where: { ($0["role"] as? String) == "twin_glb" }),
           let partsA = arts.first(where: { ($0["role"] as? String) == "twin_parts" }),
           let actionsA = arts.first(where: { ($0["role"] as? String) == "twin_actions" }),
           let pData = try? Data(contentsOf: pkgDir.appendingPathComponent((partsA["path"] as? String) ?? "")),
           let aData = try? Data(contentsOf: pkgDir.appendingPathComponent((actionsA["path"] as? String) ?? "")),
           let pObj = (try? JSONSerialization.jsonObject(with: pData)) as? [String: Any],
           let aObj = (try? JSONSerialization.jsonObject(with: aData)) as? [String: Any] {
            let rawUnits = ((pObj["units"] as? String) ?? (pObj["unit"] as? String) ?? "meters")
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .lowercased()
            let isMeters = (rawUnits == "m" || rawUnits == "meter" || rawUnits == "meters")
            let scaleMm = isMeters ? 1000.0 : 1.0

            var cleanParts: [[String: Any]] = []
            for var p in ((pObj["parts"] as? [[String: Any]]) ?? []) {
                let nodeNm = ((p["node_name"] as? String) ?? (p["node_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let aliases = ((p["aliases"] as? [String]) ?? []).map { FieldScanCatalogContract.sanitizeReferenceText($0) }.filter { !$0.isEmpty }
                p["node_name"] = nodeNm
                p["node_id"] = nodeNm
                p["aliases"] = aliases
                let fallbackLabel = aliases.first ?? ((p["part_id"] as? String) ?? "")
                p["label"] = FieldScanCatalogContract.sanitizeReferenceText((p["label"] as? String) ?? fallbackLabel)
                let fallbackSummary = aliases.isEmpty ? "" : "Verified CAD component (\(aliases.prefix(3).joined(separator: ", ")))"
                p["summary"] = FieldScanCatalogContract.sanitizeReferenceText((p["summary"] as? String) ?? fallbackSummary)
                cleanParts.append(p)
            }

            var normViews: [[String: Any]] = []
            for var v in ((pObj["views"] as? [[String: Any]]) ?? []) {
                if v["camera_pos_mm"] == nil, let camM = v["camera_offset_m"] as? [NSNumber], camM.count == 3 {
                    v["camera_pos_mm"] = camM.map { (Double(truncating: $0) * scaleMm * 1000.0).rounded() / 1000.0 }
                }
                if v["target_mm"] == nil, let tgtM = v["target_m"] as? [NSNumber], tgtM.count == 3 {
                    v["target_mm"] = tgtM.map { (Double(truncating: $0) * scaleMm * 1000.0).rounded() / 1000.0 }
                }
                normViews.append(v)
            }

            twinDesc = [
                "glb_url": glbA["local_url"] ?? "",
                "glb_sha256": glbA["sha256"] ?? "",
                "units": isMeters ? "meters" : "millimeters",
                "scale_to_studio_mm": scaleMm,
                "reference_dimensions_mm": pObj["reference_dimensions_mm"] ?? [:],
                "parts": cleanParts,
                "views": normViews,
                "actions": aObj["actions"] ?? [],
            ]
        }

        let hasTwin = !(twinDesc is NSNull)
        return [
            "context": ctx.toDictionary(),
            "scene_origin": hasTwin ? "catalog_glb" : "docs_only_no_3d",
            "cad_exports_supported": hasTwin ? ["glb", "pdf", "json"] : ["pdf", "json"],
            "documents": docsOut,
            "twin": twinDesc,
            "revoked_instructions": getRevokedInstructions(productId: ctx.productId, variantId: ctx.variantId),
        ]
    }

    // MARK: - Strict Identity & Multi-Variant Ambiguity Resolver (`M4-ID-01..03`)

    public func resolveAssetQuery(_ rawQuery: String) -> [String: Any] {
        let q = rawQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        if q.isEmpty {
            let ctx = getSelectedContext()
            return [
                "matched": true,
                "resolution": "exact",
                "identity_status": "matched",
                "sensor_id": ctx.productId == "tzone_tht02" ? "TZ-THT-02" : ctx.productId.uppercased(),
                "context": ctx.toDictionary(),
                "candidates": [],
            ]
        }

        let norm = q.lowercased().replacingOccurrences(of: "[^a-z0-9]+", with: " ", options: .regularExpression).trimmingCharacters(in: .whitespaces)
        let compact = q.lowercased().replacingOccurrences(of: "[^a-z0-9]+", with: "", options: .regularExpression)

        struct Candidate {
            let productId: String
            let variantId: String
            let sensorId: String
            let title: String
            let connectorType: String
            let discriminantHint: String
            let aliases: [String]
            let context: SessionContentContext
        }

        var cands: [Candidate] = []
        for pkg in listInstalledPackages() where (pkg["is_active_for_variant"] as? Bool) == true {
            guard let msha = pkg["manifest_sha256"] as? String,
                  let fullPkg = try? getInstalledPackage(manifestSha256: msha),
                  let mObj = fullPkg["manifest"] as? [String: Any] else { continue }
            let pid = (pkg["product_id"] as? String) ?? ""
            let vid = (pkg["variant_id"] as? String) ?? ""
            let title = (pkg["title"] as? String) ?? "\(pid) (\(vid))"
            let conn = (mObj["connector_type"] as? String) ?? "standard"
            let hint = (mObj["discriminant_hint"] as? String) ?? "Variant: \(vid)"
            var aliases = [pid, vid, "\(pid) \(vid)", (pkg["model"] as? String) ?? ""]
            aliases.append(contentsOf: (mObj["aliases"] as? [String]) ?? [])
            let homologated = (pkg["bench_modbus_homologated"] as? Bool) ?? false
            let ctx = SessionContentContext(
                productId: pid,
                variantId: vid,
                title: title,
                publicationSeq: (pkg["publication_seq"] as? Int) ?? 1,
                manifestSha256: msha,
                localProfileId: homologated ? (pkg["bench_profile_id"] as? String) : nil,
                contentOrigin: "catalog",
                benchModbusHomologated: homologated,
                capabilities: (pkg["capabilities"] as? [String: Bool]) ?? [:]
            )
            cands.append(Candidate(
                productId: pid,
                variantId: vid,
                sensorId: (mObj["sensor_id"] as? String) ?? pid.uppercased(),
                title: title,
                connectorType: conn,
                discriminantHint: hint,
                aliases: aliases,
                context: ctx
            ))
        }

        let bCtx = buildBundleDefaultContext()
        cands.append(Candidate(
            productId: "tzone_tht02",
            variantId: "bundled_v1_1",
            sensorId: "TZ-THT-02",
            title: "TZ THT-02 · 4-Wire Waterproof Pigtail (Bundled V1.1)",
            connectorType: "4_wire_pigtail",
            discriminantHint: "1 m 4-wire shielded pigtail (Red/Black/Yellow/Green), no LCD",
            aliases: ["tz tht 02", "tht 02", "tht02", "tzone tht02", "ths 00", "ths00", "thp 02", "thp02", "rs485 temperature and humidity sensor"],
            context: bCtx
        ))
        cands.append(Candidate(
            productId: "tzone_tht03r",
            variantId: "bundled_pending",
            sensorId: "TZ-THT-03R",
            title: "TZ THT-03R · Wall-Mount RS-485 Display Variant (Pending Bench Validation)",
            connectorType: "terminal_block_wall",
            discriminantHint: "Wall housing with internal screw terminal block",
            aliases: ["tz tht 03r", "tht 03r", "tht03r", "tzone tht03r"],
            context: SessionContentContext(
                productId: "tzone_tht03r",
                variantId: "bundled_pending",
                title: "TZ THT-03R (Pending Bench Validation)",
                publicationSeq: 1,
                manifestSha256: bCtx.manifestSha256,
                localProfileId: "tzone_tht03r",
                contentOrigin: "bundle",
                benchModbusHomologated: false,
                capabilities: ["documentation": false, "interactive_twin": false, "procedures": false]
            )
        ))

        var hits: [Candidate] = []
        var seenPV = Set<String>()
        for c in cands {
            for al in c.aliases {
                let alNorm = al.lowercased().replacingOccurrences(of: "[^a-z0-9]+", with: " ", options: .regularExpression).trimmingCharacters(in: .whitespaces)
                let alComp = al.lowercased().replacingOccurrences(of: "[^a-z0-9]+", with: "", options: .regularExpression)
                if alComp.isEmpty { continue }
                let wordHit = alNorm.count >= 5 && norm.range(of: "\\b\(NSRegularExpression.escapedPattern(for: alNorm))\\b", options: .regularExpression) != nil
                if norm == alNorm || compact == alComp || wordHit || (alComp.count >= 5 && compact.contains(alComp)) {
                    let pv = "\(c.productId)|\(c.variantId)"
                    if !seenPV.contains(pv) {
                        seenPV.insert(pv)
                        hits.append(c)
                    }
                    break
                }
            }
        }

        if hits.count > 1 {
            let narrowed = hits.filter { h in
                compact.contains(h.variantId.lowercased().replacingOccurrences(of: "_", with: ""))
                    || compact.contains(h.connectorType.lowercased().replacingOccurrences(of: "_", with: ""))
            }
            if narrowed.count == 1 {
                hits = narrowed
            } else {
                return [
                    "matched": false,
                    "resolution": "ambiguous",
                    "identity_status": "identify_variant",
                    "sensor_id": NSNull(),
                    "resolved_model": NSNull(),
                    "discriminant_field": "connector_or_variant_suffix",
                    "discriminant_prompt": "Multiple hardware variants match this model family. Confirm the physical connector or variant suffix before opening a session.",
                    "candidates": hits.map {
                        [
                            "product_id": $0.productId,
                            "variant_id": $0.variantId,
                            "title": $0.title,
                            "connector_type": $0.connectorType,
                            "discriminant_hint": $0.discriminantHint,
                            "manifest_sha256": $0.context.manifestSha256,
                        ]
                    },
                ]
            }
        }

        if let winner = hits.first {
            let status = (winner.context.benchModbusHomologated || winner.context.contentOrigin == "catalog") ? "matched" : "identity_pending"
            return [
                "matched": true,
                "resolution": "exact",
                "identity_status": status,
                "sensor_id": winner.sensorId,
                "resolved_model": winner.sensorId,
                "matched_alias": winner.aliases.first ?? winner.sensorId,
                "confidence": 0.99,
                "context": winner.context.toDictionary(),
                "candidates": [],
            ]
        }

        if ["tzonetht", "tht", "thtseries", "tzonethtsensor"].contains(compact) {
            let fam = cands.filter { $0.productId.hasPrefix("tzone_tht") }
            return [
                "matched": false,
                "resolution": "ambiguous",
                "identity_status": "identify_variant",
                "sensor_id": NSNull(),
                "resolved_model": NSNull(),
                "discriminant_field": "variant_suffix_and_connector",
                "discriminant_prompt": "Ambiguous TZONE THT family query. Confirm exact model suffix and connector type.",
                "candidates": fam.map {
                    [
                        "product_id": $0.productId,
                        "variant_id": $0.variantId,
                        "title": $0.title,
                        "connector_type": $0.connectorType,
                        "discriminant_hint": $0.discriminantHint,
                        "manifest_sha256": $0.context.manifestSha256,
                    ]
                },
            ]
        }

        let parts = q.split(separator: " ").map(String.init)
        return [
            "matched": false,
            "resolution": "unknown",
            "identity_status": "unknown_pending_identity",
            "sensor_id": NSNull(),
            "resolved_model": NSNull(),
            "confidence": 0.0,
            "can_query_cloud_catalog": true,
            "suggested_cloud_query": [
                "manufacturer": (parts.count >= 2 ? (parts[0].uppercased() as Any) : NSNull()),
                "model": q,
                "variant": NSNull(),
                "hardware_revision": NSNull(),
            ],
            "candidates": [],
        ]
    }
}
