import CryptoKit
import Foundation

// ============================================================================
// FieldScan Cloud Catalog Client for iPad Air M4 (Megaplan E4 / CL-IPAD-01..03)
// - Authenticates with Bearer token + optional Boat private gate cookie (`_port_auth`)
// - Verifies Ed25519 signature over exact UTF-8 `payload_b64` bytes (never re-serialized)
// - Rejects duplicate JSON keys and key_id mismatches
// - Verifies SHA-256 and byte_count of every downloaded artifact before atomic install
// - Preserves side-by-side revisions (`seq_<N>`) so an open inspection keeps its pinned
//   revision even when a newer publication downloads or WAN is disconnected.
// ============================================================================

public enum FieldScanCloudError: Error, Equatable {
    case invalidConfiguration(String)
    case unauthorized
    case notFound
    case rateLimited
    case httpError(Int)
    case duplicateJSONKey(String)
    case invalidEnvelope(String)
    case untrustedKeyID(String)
    case signatureVerificationFailed
    case hashMismatch(expected: String, actual: String)
    case byteCountMismatch(expected: Int, actual: Int)
    case offlineUnavailable(productID: String, variantID: String)
    case unsafeArtifactPath(String)
}

public struct FieldScanTrustedSigner: Sendable {
    public let keyID: String
    public let issuer: String
    public let publicKeyRawBase64: String

    public init(keyID: String, issuer: String, publicKeyRawBase64: String) {
        self.keyID = keyID
        self.issuer = issuer
        self.publicKeyRawBase64 = publicKeyRawBase64
    }
}

public struct FieldScanCloudEndpointConfig: Sendable {
    public let baseURL: URL
    public let apiBearerToken: String
    public let boatPortAuthToken: String?
    public let trustedSigners: [String: FieldScanTrustedSigner]

    public init(
        baseURL: URL,
        apiBearerToken: String,
        boatPortAuthToken: String? = nil,
        trustedSigners: [FieldScanTrustedSigner]
    ) throws {
        guard baseURL.scheme?.lowercased() == "https" || baseURL.host == "127.0.0.1" else {
            throw FieldScanCloudError.invalidConfiguration("Cloud baseURL must use HTTPS")
        }
        var map: [String: FieldScanTrustedSigner] = [:]
        for signer in trustedSigners {
            map[signer.keyID] = signer
        }
        guard !map.isEmpty else {
            throw FieldScanCloudError.invalidConfiguration("At least one trusted Ed25519 signer is required")
        }
        self.baseURL = baseURL
        self.apiBearerToken = apiBearerToken
        self.boatPortAuthToken = boatPortAuthToken
        self.trustedSigners = map
    }
}

public struct FieldScanManifestSource: Codable, Equatable, Sendable {
    public let source_id: String
    public let origin: String
    public let revision_label: String
}

public struct FieldScanManifestCapabilities: Codable, Equatable, Sendable {
    public let documentation: Bool
    public let interactive_twin: Bool
    public let procedures: Bool
}

public struct FieldScanManifestArtifact: Codable, Equatable, Sendable {
    public let role: String
    public let path: String
    public let sha256: String
    public let byte_count: Int
    public let document_id: String?
}

public struct FieldScanManifestPayload: Codable, Equatable, Sendable {
    public let schema_version: Int
    public let interaction_version: Int
    public let issuer: String
    public let key_id: String
    public let product_id: String
    public let variant_id: String
    public let publication_seq: Int
    public let minimum_app_build: Int
    public let sources: [FieldScanManifestSource]
    public let capabilities: FieldScanManifestCapabilities
    public let artifacts: [FieldScanManifestArtifact]
    public let reason_codes: [String]?
    public let withdrawn_procedures: [String]?
    public let restored_from_seq: Int?
}

public struct FieldScanSignedEnvelope: Codable, Sendable {
    public let key_id: String
    public let payload_b64: String
    public let signature_b64: String
}

public struct FieldScanInstalledRevision: Equatable, Sendable {
    public let payload: FieldScanManifestPayload
    public let etag: String?
    public let packageDirectory: URL

    public func localArtifactURL(forRole role: String) -> URL? {
        guard let art = payload.artifacts.first(where: { $0.role == role }) else {
            return nil
        }
        return packageDirectory.appendingPathComponent(art.path)
    }
}

/// Strict scanner rejecting duplicate object keys at every nesting depth in UTF-8 JSON (§11.2 & §14.1).
enum StrictJSONDuplicateKeyValidator {
    static func validateNoDuplicateKeys(_ data: Data) throws {
        guard let text = String(data: data, encoding: .utf8) else {
            throw FieldScanCloudError.invalidEnvelope("Non-UTF8 JSON bytes")
        }
        var index = text.startIndex
        _ = try parseValue(text, &index)
        skipWhitespace(text, &index)
        if index != text.endIndex {
            throw FieldScanCloudError.invalidEnvelope("Trailing characters in JSON")
        }
    }

    private static func skipWhitespace(_ s: String, _ i: inout String.Index) {
        while i < s.endIndex {
            let c = s[i]
            if c == " " || c == "\t" || c == "\r" || c == "\n" {
                i = s.index(after: i)
            } else {
                break
            }
        }
    }

    private static func parseString(_ s: String, _ i: inout String.Index) throws -> String {
        guard i < s.endIndex, s[i] == "\"" else {
            throw FieldScanCloudError.invalidEnvelope("Expected JSON string")
        }
        i = s.index(after: i)
        var out = ""
        while i < s.endIndex {
            let c = s[i]
            i = s.index(after: i)
            if c == "\"" {
                return out
            }
            if c == "\\" {
                guard i < s.endIndex else {
                    throw FieldScanCloudError.invalidEnvelope("Unterminated escape")
                }
                let esc = s[i]
                i = s.index(after: i)
                switch esc {
                case "\"", "\\", "/": out.append(esc)
                case "b": out.append("\u{0008}")
                case "f": out.append("\u{000C}")
                case "n": out.append("\n")
                case "r": out.append("\r")
                case "t": out.append("\t")
                case "u":
                    var hex = ""
                    for _ in 0..<4 {
                        guard i < s.endIndex else {
                            throw FieldScanCloudError.invalidEnvelope("Short unicode escape")
                        }
                        hex.append(s[i])
                        i = s.index(after: i)
                    }
                    guard let scalarVal = UInt32(hex, radix: 16), let scalar = UnicodeScalar(scalarVal) else {
                        throw FieldScanCloudError.invalidEnvelope("Invalid unicode escape")
                    }
                    out.append(Character(scalar))
                default:
                    throw FieldScanCloudError.invalidEnvelope("Unsupported JSON escape")
                }
            } else {
                out.append(c)
            }
        }
        throw FieldScanCloudError.invalidEnvelope("Unterminated JSON string")
    }

    private static func parseObject(_ s: String, _ i: inout String.Index) throws {
        i = s.index(after: i) // consume '{'
        skipWhitespace(s, &i)
        if i < s.endIndex && s[i] == "}" {
            i = s.index(after: i)
            return
        }
        var seenKeys = Set<String>()
        while true {
            skipWhitespace(s, &i)
            let key = try parseString(s, &i)
            if seenKeys.contains(key) {
                throw FieldScanCloudError.duplicateJSONKey(key)
            }
            seenKeys.insert(key)
            skipWhitespace(s, &i)
            guard i < s.endIndex, s[i] == ":" else {
                throw FieldScanCloudError.invalidEnvelope("Expected ':' after object key")
            }
            i = s.index(after: i)
            try parseValue(s, &i)
            skipWhitespace(s, &i)
            guard i < s.endIndex else {
                throw FieldScanCloudError.invalidEnvelope("Unterminated JSON object")
            }
            if s[i] == "}" {
                i = s.index(after: i)
                return
            }
            guard s[i] == "," else {
                throw FieldScanCloudError.invalidEnvelope("Expected ',' or '}' in object")
            }
            i = s.index(after: i)
        }
    }

    private static func parseArray(_ s: String, _ i: inout String.Index) throws {
        i = s.index(after: i) // consume '['
        skipWhitespace(s, &i)
        if i < s.endIndex && s[i] == "]" {
            i = s.index(after: i)
            return
        }
        while true {
            try parseValue(s, &i)
            skipWhitespace(s, &i)
            guard i < s.endIndex else {
                throw FieldScanCloudError.invalidEnvelope("Unterminated JSON array")
            }
            if s[i] == "]" {
                i = s.index(after: i)
                return
            }
            guard s[i] == "," else {
                throw FieldScanCloudError.invalidEnvelope("Expected ',' or ']' in array")
            }
            i = s.index(after: i)
        }
    }

    private static func parseLiteralOrNumber(_ s: String, _ i: inout String.Index) throws {
        let start = i
        while i < s.endIndex {
            let c = s[i]
            if c == "," || c == "}" || c == "]" || c == " " || c == "\t" || c == "\r" || c == "\n" {
                break
            }
            i = s.index(after: i)
        }
        if start == i {
            throw FieldScanCloudError.invalidEnvelope("Unexpected JSON token")
        }
    }

    static func parseValue(_ s: String, _ i: inout String.Index) throws {
        skipWhitespace(s, &i)
        guard i < s.endIndex else {
            throw FieldScanCloudError.invalidEnvelope("Unexpected end of JSON")
        }
        switch s[i] {
        case "{": try parseObject(s, &i)
        case "[": try parseArray(s, &i)
        case "\"": _ = try parseString(s, &i)
        default: try parseLiteralOrNumber(s, &i)
        }
    }
}

public final class FieldScanCloudCatalogClient {
    public let storageRoot: URL
    public var offlineMode: Bool = false
    private let endpoint: FieldScanCloudEndpointConfig
    private let urlSession: URLSession
    private var pinnedSessions: [String: FieldScanInstalledRevision] = [:]

    public init(
        storageRoot: URL,
        endpoint: FieldScanCloudEndpointConfig,
        urlSession: URLSession = .shared
    ) throws {
        self.storageRoot = storageRoot
        self.endpoint = endpoint
        self.urlSession = urlSession
        try FileManager.default.createDirectory(at: storageRoot, withIntermediateDirectories: true)
    }

    /// Verify Ed25519 envelope over exact UTF-8 `payload_b64` bytes against pinned trust store (§11.2).
    public func verifySignedManifestEnvelope(_ envelopeData: Data) throws -> FieldScanManifestPayload {
        try StrictJSONDuplicateKeyValidator.validateNoDuplicateKeys(envelopeData)
        let envelope: FieldScanSignedEnvelope
        do {
            envelope = try JSONDecoder().decode(FieldScanSignedEnvelope.self, from: envelopeData)
        } catch {
            throw FieldScanCloudError.invalidEnvelope("Malformed envelope fields")
        }

        guard let signer = endpoint.trustedSigners[envelope.key_id] else {
            throw FieldScanCloudError.untrustedKeyID(envelope.key_id)
        }
        guard let rawPubKey = Data(base64Encoded: signer.publicKeyRawBase64), rawPubKey.count == 32 else {
            throw FieldScanCloudError.invalidConfiguration("Trusted public key must be 32 raw bytes")
        }
        guard let payloadBytes = Data(base64Encoded: envelope.payload_b64),
              let signatureBytes = Data(base64Encoded: envelope.signature_b64),
              signatureBytes.count == 64
        else {
            throw FieldScanCloudError.invalidEnvelope("Invalid Base64 payload or 64-byte Ed25519 signature")
        }

        let publicKey: Curve25519.Signing.PublicKey
        do {
            publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: rawPubKey)
        } catch {
            throw FieldScanCloudError.invalidConfiguration("Invalid Curve25519 raw public key")
        }

        guard publicKey.isValidSignature(signatureBytes, for: payloadBytes) else {
            throw FieldScanCloudError.signatureVerificationFailed
        }

        try StrictJSONDuplicateKeyValidator.validateNoDuplicateKeys(payloadBytes)
        let payload: FieldScanManifestPayload
        do {
            payload = try JSONDecoder().decode(FieldScanManifestPayload.self, from: payloadBytes)
        } catch {
            throw FieldScanCloudError.invalidEnvelope("Malformed inner manifest payload")
        }

        guard payload.key_id == envelope.key_id else {
            throw FieldScanCloudError.invalidEnvelope("Inner key_id does not match envelope key_id")
        }
        guard payload.issuer == signer.issuer else {
            throw FieldScanCloudError.invalidEnvelope("Unexpected manifest issuer \(payload.issuer)")
        }
        return payload
    }

    public static func sha256Hex(_ data: Data) -> String {
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    private static func validateRelativeArtifactPath(_ relPath: String) throws {
        if relPath.isEmpty || relPath.hasPrefix("/") || relPath.contains("..") || relPath.contains("\\") {
            throw FieldScanCloudError.unsafeArtifactPath(relPath)
        }
    }

    private func revisionDirectory(productID: String, variantID: String, seq: Int) -> URL {
        return storageRoot
            .appendingPathComponent(productID, isDirectory: true)
            .appendingPathComponent(variantID, isDirectory: true)
            .appendingPathComponent("seq_\(seq)", isDirectory: true)
    }

    private func currentPointerURL(productID: String, variantID: String) -> URL {
        return storageRoot
            .appendingPathComponent(productID, isDirectory: true)
            .appendingPathComponent(variantID, isDirectory: true)
            .appendingPathComponent("current.json", isDirectory: false)
    }

    /// Install a verified manifest + in-memory or downloaded blob map atomically into local storage.
    public func installVerifiedPackage(
        envelopeData: Data,
        etag: String?,
        blobProvider: (FieldScanManifestArtifact) throws -> Data
    ) throws -> FieldScanInstalledRevision {
        let payload = try verifySignedManifestEnvelope(envelopeData)
        let fm = FileManager.default
        let finalDir = revisionDirectory(
            productID: payload.product_id,
            variantID: payload.variant_id,
            seq: payload.publication_seq
        )
        let stagingDir = storageRoot
            .appendingPathComponent(".staging_\(UUID().uuidString)", isDirectory: true)
        try fm.createDirectory(at: stagingDir, withIntermediateDirectories: true)
        defer { try? fm.removeItem(at: stagingDir) }

        for art in payload.artifacts {
            try Self.validateRelativeArtifactPath(art.path)
            let bytes = try blobProvider(art)
            if bytes.count != art.byte_count {
                throw FieldScanCloudError.byteCountMismatch(expected: art.byte_count, actual: bytes.count)
            }
            let actualHash = Self.sha256Hex(bytes)
            if actualHash != art.sha256.lowercased() {
                throw FieldScanCloudError.hashMismatch(expected: art.sha256.lowercased(), actual: actualHash)
            }
            let dest = stagingDir.appendingPathComponent(art.path)
            try fm.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
            try bytes.write(to: dest, options: .atomic)
        }

        try envelopeData.write(to: stagingDir.appendingPathComponent("manifest.envelope.json"), options: .atomic)
        if let etagValue = etag {
            try Data(etagValue.utf8).write(to: stagingDir.appendingPathComponent("manifest.etag"), options: .atomic)
        }

        try fm.createDirectory(at: finalDir.deletingLastPathComponent(), withIntermediateDirectories: true)
        if fm.fileExists(atPath: finalDir.path) {
            try fm.removeItem(at: finalDir)
        }
        try fm.moveItem(at: stagingDir, to: finalDir)

        let pointer: [String: Any] = [
            "publication_seq": payload.publication_seq,
            "etag": etag ?? "",
        ]
        let pointerData = try JSONSerialization.data(withJSONObject: pointer, options: [.sortedKeys])
        try pointerData.write(
            to: currentPointerURL(productID: payload.product_id, variantID: payload.variant_id),
            options: .atomic
        )

        return FieldScanInstalledRevision(payload: payload, etag: etag, packageDirectory: finalDir)
    }

    /// Load the latest installed offline revision without network access (CL-IPAD-02).
    public func loadInstalledRevision(
        productID: String,
        variantID: String,
        seq: Int? = nil
    ) throws -> FieldScanInstalledRevision {
        let targetSeq: Int
        if let explicitSeq = seq {
            targetSeq = explicitSeq
        } else {
            let ptrURL = currentPointerURL(productID: productID, variantID: variantID)
            guard let ptrData = try? Data(contentsOf: ptrURL),
                  let obj = try? JSONSerialization.jsonObject(with: ptrData) as? [String: Any],
                  let s = obj["publication_seq"] as? Int
            else {
                throw FieldScanCloudError.offlineUnavailable(productID: productID, variantID: variantID)
            }
            targetSeq = s
        }

        let dir = revisionDirectory(productID: productID, variantID: variantID, seq: targetSeq)
        let envURL = dir.appendingPathComponent("manifest.envelope.json")
        guard let envData = try? Data(contentsOf: envURL) else {
            throw FieldScanCloudError.offlineUnavailable(productID: productID, variantID: variantID)
        }
        let payload = try verifySignedManifestEnvelope(envData)
        let etagURL = dir.appendingPathComponent("manifest.etag")
        let etag = (try? Data(contentsOf: etagURL)).flatMap { String(data: $0, encoding: .utf8) }
        return FieldScanInstalledRevision(payload: payload, etag: etag, packageDirectory: dir)
    }

    /// Pin an active inspection session to a specific installed revision (CL-IPAD-03).
    public func pinInspectionSession(_ sessionID: String, productID: String, variantID: String) throws -> FieldScanInstalledRevision {
        let rev = try loadInstalledRevision(productID: productID, variantID: variantID)
        pinnedSessions[sessionID] = rev
        return rev
    }

    public func pinnedRevision(forSession sessionID: String) -> FieldScanInstalledRevision? {
        return pinnedSessions[sessionID]
    }

    private func authorizedRequest(path: String, method: String = "GET", ifNoneMatch: String? = nil) -> URLRequest {
        let cleanBase = endpoint.baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let cleanPath = path.hasPrefix("/") ? path : "/\(path)"
        let url = URL(string: cleanBase + cleanPath)!
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("Bearer \(endpoint.apiBearerToken)", forHTTPHeaderField: "Authorization")
        if let portToken = endpoint.boatPortAuthToken, !portToken.isEmpty {
            req.setValue("_port_auth=\(portToken)", forHTTPHeaderField: "Cookie")
        }
        if let etag = ifNoneMatch, !etag.isEmpty {
            req.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }
        return req
    }

    private func performSync(_ req: URLRequest) throws -> (Int, Data, HTTPURLResponse) {
        if offlineMode {
            throw URLError(.notConnectedToInternet)
        }
        var result: Result<(Data, URLResponse), Error>!
        let sem = DispatchSemaphore(value: 0)
        urlSession.dataTask(with: req) { data, resp, err in
            if let err = err {
                result = .failure(err)
            } else {
                result = .success((data ?? Data(), resp!))
            }
            sem.signal()
        }.resume()
        sem.wait()

        let (data, resp) = try result.get()
        let http = resp as! HTTPURLResponse
        switch http.statusCode {
        case 200, 202, 206, 304:
            return (http.statusCode, data, http)
        case 401, 403:
            throw FieldScanCloudError.unauthorized
        case 404:
            throw FieldScanCloudError.notFound
        case 429:
            throw FieldScanCloudError.rateLimited
        default:
            throw FieldScanCloudError.httpError(http.statusCode)
        }
    }

    /// Synchronize a product/variant over HTTPS from Boat.dev, honoring ETag 304 and offline fallback (CL-IPAD-01..03).
    public func syncVariant(productID: String, variantID: String) throws -> FieldScanInstalledRevision {
        if offlineMode {
            return try loadInstalledRevision(productID: productID, variantID: variantID)
        }
        let currentCached = try? loadInstalledRevision(productID: productID, variantID: variantID)
        let manifestReq = authorizedRequest(
            path: "/v1/catalog/products/\(productID)/variants/\(variantID)/manifest",
            ifNoneMatch: currentCached?.etag
        )
        let (status, envData, http) = try performSync(manifestReq)
        if status == 304, let existing = currentCached {
            return existing
        }
        let etag = http.value(forHTTPHeaderField: "ETag")
        return try installVerifiedPackage(envelopeData: envData, etag: etag) { art in
            let blobReq = self.authorizedRequest(path: "/v1/catalog/blobs/\(art.sha256)")
            let (_, blobBytes, _) = try self.performSync(blobReq)
            return blobBytes
        }
    }
}
