import Foundation
import CryptoKit
#if canImport(CoreGraphics)
import CoreGraphics
#endif

/// Typed Domain Models, Strict Duplicate-Key JSON Parser, GLB Binary Validator & Errors for FieldScan Cloud Catalog (`Contract v2.1.0`).
public struct FieldScanCatalogError: Error {
    public let code: String
    public let message: String
    public let statusCode: Int
    public let retryAfterSeconds: Int?

    public init(code: String, message: String, statusCode: Int = 400, retryAfterSeconds: Int? = nil) {
        self.code = code
        self.message = message
        self.statusCode = statusCode
        self.retryAfterSeconds = retryAfterSeconds
    }

    public func toDictionary() -> [String: Any] {
        var out: [String: Any] = [
            "ok": false,
            "error_code": code,
            "message": message,
        ]
        if let ra = retryAfterSeconds {
            out["retry_after_s"] = ra
        }
        return out
    }
}

public struct SessionContentContext {
    public let productId: String
    public let variantId: String
    public let title: String
    public let publicationSeq: Int
    public let manifestSha256: String
    public let localProfileId: String?
    public let contentOrigin: String // "bundle" | "catalog"
    public let benchModbusHomologated: Bool
    public let capabilities: [String: Bool]

    public init(
        productId: String,
        variantId: String,
        title: String,
        publicationSeq: Int,
        manifestSha256: String,
        localProfileId: String?,
        contentOrigin: String,
        benchModbusHomologated: Bool,
        capabilities: [String: Bool]
    ) {
        self.productId = productId
        self.variantId = variantId
        self.title = title
        self.publicationSeq = publicationSeq
        self.manifestSha256 = manifestSha256
        self.localProfileId = localProfileId
        self.contentOrigin = contentOrigin
        self.benchModbusHomologated = benchModbusHomologated
        self.capabilities = capabilities
    }

    public func toDictionary() -> [String: Any] {
        return [
            "product_id": productId,
            "variant_id": variantId,
            "title": title,
            "publication_seq": publicationSeq,
            "manifest_sha256": manifestSha256,
            "local_profile_id": localProfileId ?? NSNull(),
            "content_origin": contentOrigin,
            "bench_modbus_homologated": benchModbusHomologated,
            "capabilities": capabilities,
        ]
    }

    public static func fromDictionary(_ dict: [String: Any]) -> SessionContentContext? {
        guard let pid = dict["product_id"] as? String,
              let vid = dict["variant_id"] as? String,
              let msha = dict["manifest_sha256"] as? String else {
            return nil
        }
        let seq = (dict["publication_seq"] as? Int) ?? 1
        let title = (dict["title"] as? String) ?? "\(pid) (\(vid))"
        let locProf = dict["local_profile_id"] as? String
        let origin = (dict["content_origin"] as? String) ?? "bundle"
        let homologated = (dict["bench_modbus_homologated"] as? Bool) ?? (origin == "bundle" && pid == "tzone_tht02")
        let caps = (dict["capabilities"] as? [String: Bool]) ?? [
            "documentation": true,
            "interactive_twin": origin == "bundle",
            "procedures": origin == "bundle",
        ]
        return SessionContentContext(
            productId: pid,
            variantId: vid,
            title: title,
            publicationSeq: seq,
            manifestSha256: msha,
            localProfileId: locProf,
            contentOrigin: origin,
            benchModbusHomologated: homologated,
            capabilities: caps
        )
    }
}

public enum FieldScanCatalogContract {
    public static let maxEnvelopeBytes = 512 * 1024
    public static let maxArtifactsPerPackage = 256
    public static let maxSingleArtifactBytes = 50 * 1024 * 1024
    public static let maxPackageTotalBytes = 120 * 1024 * 1024
    public static let currentAppBuild = 210

    /// Labeled reference fixture Ed25519 public key (`demo-1`, matches Python `DEMO_FIXTURE_PUBLIC_KEY_B64`).
    public static let demo1PublicKeyBase64 = "dY3z2CiJZsOxQuwsAHq4jGNIfYDzRWQ4U1yAV3IMsb0="

    public static let forbiddenExecutableExtensions: Set<String> = [
        "sh", "bash", "zsh", "exe", "dll", "dylib", "so", "bin",
        "py", "pyc", "js", "mjs", "html", "htm", "command", "app",
    ]

    public static let allowedArtifactRoles: Set<String> = [
        "manual_pdf",
        "manual_index",
        "document_index",
        "manual_page_image",
        "manual_markdown",
        "twin_glb",
        "twin_parts",
        "twin_actions",
        "procedures",
        "thumbnail",
    ]

    public static let allowedTwinActionKinds: Set<String> = [
        "show_view",
        "focus_part",
        "highlight_part",
        "simulate_state",
        "show_reference",
        "reset_view",
    ]

    public static let roleMimeTypes: [String: String] = [
        "manual_pdf": "application/pdf",
        "manual_index": "application/json; charset=utf-8",
        "document_index": "application/json; charset=utf-8",
        "manual_page_image": "image/png",
        "manual_markdown": "text/markdown; charset=utf-8",
        "twin_glb": "model/gltf-binary",
        "twin_parts": "application/json; charset=utf-8",
        "twin_actions": "application/json; charset=utf-8",
        "procedures": "application/json; charset=utf-8",
        "thumbnail": "image/png",
    ]

    public static func defaultTrustedPublicKeys() -> [String: Data] {
        var out: [String: Data] = [:]
        if let raw = Data(base64Encoded: demo1PublicKeyBase64), raw.count == 32 {
            out["demo-1"] = raw
        }
        return out
    }

    public static func sha256Hex(_ data: Data) -> String {
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    public static func sha256File(_ url: URL) -> String? {
        guard let fh = try? FileHandle(forReadingFrom: url) else { return nil }
        defer { try? fh.close() }
        var hasher = SHA256()
        while true {
            let chunk = (try? fh.read(upToCount: 65536)) ?? Data()
            if chunk.isEmpty { break }
            hasher.update(data: chunk)
        }
        return hasher.finalize().map { String(format: "%02x", $0) }.joined()
    }

    /// Escape/strip HTML tags, scripts, iframes, and `javascript:` schemes from manufacturer labels/markdown (`M4-DOC-03`).
    public static func sanitizeReferenceText(_ raw: String) -> String {
        var text = raw
        text = text.replacingOccurrences(of: "<\\s*script[^>]*>[\\s\\S]*?<\\s*/\\s*script\\s*>", with: "", options: [.regularExpression, .caseInsensitive])
        text = text.replacingOccurrences(of: "<\\s*(?:iframe|object|embed|style|link|meta)[^>]*>", with: "", options: [.regularExpression, .caseInsensitive])
        text = text.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        text = text.replacingOccurrences(of: "javascript\\s*:", with: "", options: [.regularExpression, .caseInsensitive])
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    public static func normalizeSafeRelativePath(_ rawPath: String) throws -> String {
        let trimmed = rawPath.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty || trimmed.hasPrefix("/") || trimmed.contains("\\") || trimmed.contains(":") {
            throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Unsafe artifact path '\(rawPath)'")
        }
        let parts = trimmed.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        if parts.isEmpty || parts.contains(where: { $0.isEmpty || $0 == "." || $0 == ".." }) {
            throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Path traversal or empty segment rejected in '\(rawPath)'")
        }
        let norm = parts.joined(separator: "/")
        let ext = URL(fileURLWithPath: norm).pathExtension.lowercased()
        if forbiddenExecutableExtensions.contains(ext) {
            throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Executable/script extension '.\(ext)' rejected")
        }
        return norm
    }

    // MARK: - Strict Duplicate-Key Scanner + JSON Decoder (`Section 3.3`, `M4-PKG-02`)

    /// Scans raw UTF-8 JSON tokens to guarantee zero duplicate object keys before `JSONSerialization` parses it.
    public static func parseJSONStrictNoDuplicateKeys(_ data: Data) throws -> Any {
        guard let str = String(data: data, encoding: .utf8) else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Payload is not valid UTF-8")
        }
        try assertNoDuplicateObjectKeysInJSON(str)
        do {
            return try JSONSerialization.jsonObject(with: data, options: [])
        } catch {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Malformed JSON: \(error.localizedDescription)")
        }
    }

    private static func assertNoDuplicateObjectKeysInJSON(_ json: String) throws {
        let chars = Array(json.unicodeScalars)
        let n = chars.count
        var i = 0

        enum Scope {
            case object(seen: Set<String>, expectingKey: Bool)
            case array
        }
        var stack: [Scope] = []

        func skipWhitespace() {
            while i < n {
                let v = chars[i].value
                if v == 0x20 || v == 0x09 || v == 0x0A || v == 0x0D {
                    i += 1
                } else {
                    break
                }
            }
        }

        func readString() throws -> String {
            i += 1 // skip opening quote
            var out = ""
            while i < n {
                let ch = chars[i]
                if ch == "\"" {
                    i += 1
                    return out
                }
                if ch == "\\" {
                    i += 1
                    guard i < n else { break }
                    let esc = chars[i]
                    switch esc {
                    case "\"", "\\", "/": out.unicodeScalars.append(esc); i += 1
                    case "b": out.append("\u{0008}"); i += 1
                    case "f": out.append("\u{000C}"); i += 1
                    case "n": out.append("\n"); i += 1
                    case "r": out.append("\r"); i += 1
                    case "t": out.append("\t"); i += 1
                    case "u":
                        guard i + 4 < n else {
                            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Truncated unicode escape")
                        }
                        let hex = String(String.UnicodeScalarView(chars[(i + 1)...(i + 4)]))
                        if let code = UInt32(hex, radix: 16), let sc = UnicodeScalar(code) {
                            out.unicodeScalars.append(sc)
                        }
                        i += 5
                    default:
                        out.unicodeScalars.append(esc)
                        i += 1
                    }
                } else {
                    out.unicodeScalars.append(ch)
                    i += 1
                }
            }
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Unterminated JSON string")
        }

        while i < n {
            skipWhitespace()
            if i >= n { break }
            let c = chars[i]
            switch c {
            case "{":
                stack.append(.object(seen: [], expectingKey: true))
                i += 1
            case "}":
                guard let top = stack.popLast(), case .object = top else {
                    throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Mismatched '}'")
                }
                i += 1
            case "[":
                stack.append(.array)
                i += 1
            case "]":
                guard let top = stack.popLast(), case .array = top else {
                    throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Mismatched ']'")
                }
                i += 1
            case ",":
                if let lastIdx = stack.indices.last, case .object(let seen, _) = stack[lastIdx] {
                    stack[lastIdx] = .object(seen: seen, expectingKey: true)
                }
                i += 1
            case ":":
                i += 1
            case "\"":
                let val = try readString()
                skipWhitespace()
                if i < n && chars[i] == ":" {
                    if let lastIdx = stack.indices.last, case .object(var seen, let expKey) = stack[lastIdx], expKey {
                        if seen.contains(val) {
                            throw FieldScanCatalogError(code: "DUPLICATE_JSON_KEYS", message: "Duplicate JSON key '\(val)' rejected")
                        }
                        seen.insert(val)
                        stack[lastIdx] = .object(seen: seen, expectingKey: false)
                    }
                }
            default:
                i += 1
            }
        }
    }

    // MARK: - Signed Manifest Envelope Verification (`Section 3.3`)

    public static func verifyAndDecodeManifestEnvelope(
        _ envelopeData: Data,
        trustedKeys: [String: Data]? = nil,
        appBuild: Int = currentAppBuild
    ) throws -> (manifest: [String: Any], manifestSha256: String, rawPayload: Data) {
        if envelopeData.count > maxEnvelopeBytes {
            throw FieldScanCatalogError(code: "SIZE_BUDGET_EXCEEDED", message: "Manifest envelope exceeds 512 KB limit")
        }
        guard let env = try parseJSONStrictNoDuplicateKeys(envelopeData) as? [String: Any] else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Envelope root must be a JSON object")
        }
        guard let keyId = env["key_id"] as? String, !keyId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let payloadB64 = env["payload_b64"] as? String,
              let sigB64 = env["signature_b64"] as? String else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Missing key_id, payload_b64, or signature_b64")
        }

        let keyring = trustedKeys ?? defaultTrustedPublicKeys()
        guard let pubKeyBytes = keyring[keyId] else {
            throw FieldScanCatalogError(code: "UNTRUSTED_KEY_ID", message: "Untrusted signing key_id '\(keyId)'")
        }
        guard let rawPayload = Data(base64Encoded: payloadB64),
              let rawSig = Data(base64Encoded: sigB64),
              rawSig.count == 64 else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Invalid Base64 in manifest envelope")
        }

        let pubKey: Curve25519.Signing.PublicKey
        do {
            pubKey = try Curve25519.Signing.PublicKey(rawRepresentation: pubKeyBytes)
        } catch {
            throw FieldScanCatalogError(code: "UNTRUSTED_KEY_ID", message: "Malformed Ed25519 public key for '\(keyId)'")
        }

        guard pubKey.isValidSignature(rawSig, for: rawPayload) else {
            throw FieldScanCatalogError(code: "INVALID_SIGNATURE", message: "Ed25519 signature verification failed on raw payload bytes")
        }

        guard var payload = try parseJSONStrictNoDuplicateKeys(rawPayload) as? [String: Any] else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Signed payload must be a JSON object")
        }

        guard (payload["key_id"] as? String) == keyId else {
            throw FieldScanCatalogError(code: "KEY_ID_MISMATCH", message: "Envelope key_id does not match signed payload key_id")
        }
        guard (payload["schema_version"] as? Int) == 1 && (payload["interaction_version"] as? Int) == 1 else {
            throw FieldScanCatalogError(code: "UNSUPPORTED_SCHEMA_VERSION", message: "Unsupported manifest schema_version or interaction_version")
        }
        let minBuild = (payload["minimum_app_build"] as? Int) ?? 1
        if minBuild > appBuild {
            throw FieldScanCatalogError(code: "INCOMPATIBLE_APP_BUILD", message: "Package requires minimum_app_build \(minBuild) (> \(appBuild))")
        }

        for reqField in ["issuer", "product_id", "variant_id"] {
            guard let v = payload[reqField] as? String, !v.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Missing required string field '\(reqField)'")
            }
        }
        guard let pubSeq = payload["publication_seq"] as? Int, pubSeq >= 1 else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "publication_seq must be a positive integer")
        }
        guard let rawArtifacts = payload["artifacts"] as? [[String: Any]], !rawArtifacts.isEmpty else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Manifest must declare at least one artifact")
        }
        if rawArtifacts.count > maxArtifactsPerPackage {
            throw FieldScanCatalogError(code: "ARTIFACT_COUNT_EXCEEDED", message: "Artifact count exceeds limit \(maxArtifactsPerPackage)")
        }

        var normalizedArtifacts: [[String: Any]] = []
        var seenPaths = Set<String>()
        var rolesPresent = Set<String>()
        var totalBytes = 0

        for var art in rawArtifacts {
            let role = (art["role"] as? String) ?? ""
            guard allowedArtifactRoles.contains(role) else {
                throw FieldScanCatalogError(code: "EXECUTABLE_OR_UNSAFE_PATH", message: "Unsupported artifact role '\(role)'")
            }
            let normPath = try normalizeSafeRelativePath((art["path"] as? String) ?? "")
            if seenPaths.contains(normPath) {
                throw FieldScanCatalogError(code: "DUPLICATE_ARTIFACT_PATH", message: "Duplicate normalized path '\(normPath)'")
            }
            seenPaths.insert(normPath)
            art["path"] = normPath

            let sha = ((art["sha256"] as? String) ?? "").lowercased()
            guard sha.range(of: "^[0-9a-f]{64}$", options: .regularExpression) != nil else {
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Invalid SHA-256 digest for '\(normPath)'")
            }
            art["sha256"] = sha

            guard let bCount = art["byte_count"] as? Int, bCount > 0, bCount <= maxSingleArtifactBytes else {
                throw FieldScanCatalogError(code: "SIZE_BUDGET_EXCEEDED", message: "Invalid or oversized byte_count on '\(normPath)'")
            }
            totalBytes += bCount
            rolesPresent.insert(role)
            normalizedArtifacts.append(art)
        }

        if totalBytes > maxPackageTotalBytes {
            throw FieldScanCatalogError(code: "SIZE_BUDGET_EXCEEDED", message: "Package total size \(totalBytes) exceeds 120 MB budget")
        }
        payload["artifacts"] = normalizedArtifacts

        guard let caps = payload["capabilities"] as? [String: Any] else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Missing capabilities object")
        }
        let hasDocIndexAndMd = (rolesPresent.contains("manual_index") || rolesPresent.contains("document_index")) && rolesPresent.contains("manual_markdown")
        if (caps["documentation"] as? Bool) == true && !rolesPresent.contains("manual_pdf") && !hasDocIndexAndMd {
            throw FieldScanCatalogError(
                code: "MISSING_CAPABILITY_DEPENDENCY",
                message: "documentation=true requires manual_pdf or document_index + manual_markdown artifacts"
            )
        }
        if (caps["interactive_twin"] as? Bool) == true {
            for reqRole in ["twin_glb", "twin_parts", "twin_actions"] where !rolesPresent.contains(reqRole) {
                throw FieldScanCatalogError(code: "MISSING_CAPABILITY_DEPENDENCY", message: "interactive_twin=true requires '\(reqRole)'")
            }
        }
        if (caps["procedures"] as? Bool) == true && !rolesPresent.contains("procedures") && !rolesPresent.contains("twin_actions") {
            throw FieldScanCatalogError(
                code: "MISSING_CAPABILITY_DEPENDENCY",
                message: "procedures=true requires 'procedures' or 'twin_actions' artifact"
            )
        }

        return (manifest: payload, manifestSha256: sha256Hex(rawPayload), rawPayload: rawPayload)
    }

    // MARK: - Binary glTF 2.0 (`.glb`) Inspector (`Section 5.3`, `M4-3D-01..04`)

    public static func inspectGLBBinary(_ glbData: Data) throws -> [String: Any] {
        guard glbData.count >= 20 else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "GLB file shorter than 20-byte header")
        }
        let magic = glbData.subdata(in: 0..<4).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
        let version = glbData.subdata(in: 4..<8).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
        let totalLen = Int(glbData.subdata(in: 8..<12).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian })
        guard magic == 0x46546C67 && version == 2 else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Invalid glTF 2.0 binary magic or version")
        }
        guard totalLen == glbData.count else {
            throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "GLB header length \(totalLen) != actual \(glbData.count)")
        }

        var offset = 12
        var jsonChunkObj: [String: Any]?
        var hasBinChunk = false

        while offset + 8 <= glbData.count {
            let chunkLen = Int(glbData.subdata(in: offset..<(offset + 4)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian })
            let chunkType = glbData.subdata(in: (offset + 4)..<(offset + 8)).withUnsafeBytes { $0.load(as: UInt32.self).littleEndian }
            offset += 8
            guard offset + chunkLen <= glbData.count else {
                throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "GLB chunk exceeds file bounds")
            }
            let chunkData = glbData.subdata(in: offset..<(offset + chunkLen))
            offset += chunkLen

            if chunkType == 0x4E4F534A {
                jsonChunkObj = try parseJSONStrictNoDuplicateKeys(chunkData) as? [String: Any]
            } else if chunkType == 0x004E4942 {
                hasBinChunk = true
            }
        }

        guard let gltf = jsonChunkObj else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "GLB missing JSON scene chunk")
        }

        if let buffers = gltf["buffers"] as? [[String: Any]] {
            for b in buffers {
                if let uri = b["uri"] as? String, !uri.hasPrefix("data:") {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "External buffer URI '\(uri)' forbidden in GLB")
                }
            }
        }
        if let images = gltf["images"] as? [[String: Any]] {
            for img in images {
                if let uri = img["uri"] as? String, !uri.hasPrefix("data:") {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "External image URI '\(uri)' forbidden in GLB")
                }
            }
        }
        if let reqExt = gltf["extensionsRequired"] as? [String], !reqExt.isEmpty {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Unsupported required glTF extensions: \(reqExt)")
        }

        let nodes = (gltf["nodes"] as? [[String: Any]]) ?? []
        var nodeNames: [String] = []
        var seenNames = Set<String>()
        for n in nodes {
            if let nm = n["name"] as? String, !nm.isEmpty {
                if seenNames.contains(nm) {
                    throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Duplicate GLB node name '\(nm)'")
                }
                seenNames.insert(nm)
                nodeNames.append(nm)
            }
        }
        return [
            "valid": true,
            "has_bin_chunk": hasBinChunk,
            "node_count": nodes.count,
            "node_names": nodeNames,
            "mesh_count": ((gltf["meshes"] as? [[String: Any]]) ?? []).count,
        ]
    }

    public static func inspectPDFPageCount(_ url: URL) throws -> Int {
        guard let provider = CGDataProvider(url: url as CFURL),
              let doc = CGPDFDocument(provider) else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Unreadable PDF '\(url.lastPathComponent)'")
        }
        let count = doc.numberOfPages
        guard count >= 1 else {
            throw FieldScanCatalogError(code: "SEMANTIC_REFERENCE_BROKEN", message: "Empty PDF '\(url.lastPathComponent)'")
        }
        return count
    }
}
