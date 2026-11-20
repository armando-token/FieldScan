import CryptoKit
import Foundation

// ============================================================================
// FieldScan Cloud Swift Contract & iPad Offline Retention Runner (CL-IPAD-01..03)
// Compiles directly against `ios/FieldScanM4/FieldScanCloudCatalogClient.swift`.
// If FS_PUBLIC_URL and FS_API_TOKEN are present in env, also runs live HTTPS
// verification against Boat.dev!
// ============================================================================

@inline(__always)
func check(_ cond: Bool, _ msg: String, file: String = #file, line: Int = #line) {
    if !cond {
        fputs("[CLOUD_SWIFT_FAIL] \(file):\(line) -- \(msg)\n", stderr)
        exit(1)
    }
}

func makeSignedEnvelope(
    privKey: Curve25519.Signing.PrivateKey,
    keyID: String = "pilot-1",
    issuer: String = "fieldscan-pilot",
    seq: Int,
    artifacts: [[String: Any]]
) throws -> Data {
    let payloadObj: [String: Any] = [
        "schema_version": 1,
        "interaction_version": 1,
        "issuer": issuer,
        "key_id": keyID,
        "product_id": "tzone_tht02",
        "variant_id": "v1_1_rs485",
        "publication_seq": seq,
        "minimum_app_build": 1,
        "sources": [["source_id": "src_1", "origin": "test_fixture", "revision_label": "V1.1"]],
        "capabilities": ["documentation": true, "interactive_twin": true, "procedures": true],
        "artifacts": artifacts,
    ]
    let payloadBytes = try JSONSerialization.data(withJSONObject: payloadObj, options: [.sortedKeys])
    let sig = try privKey.signature(for: payloadBytes)
    let envObj: [String: Any] = [
        "key_id": keyID,
        "payload_b64": payloadBytes.base64EncodedString(),
        "signature_b64": sig.base64EncodedString(),
    ]
    return try JSONSerialization.data(withJSONObject: envObj, options: [.sortedKeys])
}

func runLocalCryptoAndOfflineSuite() throws {
    let fm = FileManager.default
    let tmpRoot = fm.temporaryDirectory.appendingPathComponent("fs_cloud_swift_\(UUID().uuidString)", isDirectory: true)
    try fm.createDirectory(at: tmpRoot, withIntermediateDirectories: true)
    defer { try? fm.removeItem(at: tmpRoot) }

    let privKey = Curve25519.Signing.PrivateKey()
    let pubB64 = privKey.publicKey.rawRepresentation.base64EncodedString()
    let signer = FieldScanTrustedSigner(keyID: "pilot-1", issuer: "fieldscan-pilot", publicKeyRawBase64: pubB64)
    let cfg = try FieldScanCloudEndpointConfig(
        baseURL: URL(string: "https://example.on.boat.dev")!,
        apiBearerToken: "token_demo",
        trustedSigners: [signer]
    )
    let client = try FieldScanCloudCatalogClient(storageRoot: tmpRoot, endpoint: cfg)

    let pdfBytes = Data("%PDF-1.4\nTHT-02 rev1\n".utf8)
    let glbBytes = Data("glTF_mock_binary_v1".utf8)
    let artsV1: [[String: Any]] = [
        [
            "role": "manual_pdf",
            "path": "docs/manual.pdf",
            "sha256": FieldScanCloudCatalogClient.sha256Hex(pdfBytes),
            "byte_count": pdfBytes.count,
        ],
        [
            "role": "twin_glb",
            "path": "twin/model.glb",
            "sha256": FieldScanCloudCatalogClient.sha256Hex(glbBytes),
            "byte_count": glbBytes.count,
        ],
    ]
    let envV1 = try makeSignedEnvelope(privKey: privKey, seq: 1, artifacts: artsV1)

    // 1. Reject duplicate JSON keys
    let dupJSON = Data("{\"key_id\":\"pilot-1\",\"key_id\":\"pilot-1\",\"payload_b64\":\"\",\"signature_b64\":\"\"}".utf8)
    var caughtDup = false
    do {
        _ = try client.verifySignedManifestEnvelope(dupJSON)
    } catch FieldScanCloudError.duplicateJSONKey {
        caughtDup = true
    }
    check(caughtDup, "Duplicate JSON key must be rejected")

    // 2. Reject tampered signature
    var badEnvObj = try JSONSerialization.jsonObject(with: envV1) as! [String: String]
    var sigData = Data(base64Encoded: badEnvObj["signature_b64"]!)!
    sigData[0] ^= 0xFF
    badEnvObj["signature_b64"] = sigData.base64EncodedString()
    let badEnvBytes = try JSONSerialization.data(withJSONObject: badEnvObj)
    var caughtBadSig = false
    do {
        _ = try client.verifySignedManifestEnvelope(badEnvBytes)
    } catch FieldScanCloudError.signatureVerificationFailed {
        caughtBadSig = true
    }
    check(caughtBadSig, "Tampered Ed25519 signature must fail verification")

    // 3. Install v1, pin open inspection session, cut WAN (offlineMode = true), read offline (CL-IPAD-01 & CL-IPAD-02)
    let blobsV1: [String: Data] = ["manual_pdf": pdfBytes, "twin_glb": glbBytes]
    let installedV1 = try client.installVerifiedPackage(envelopeData: envV1, etag: "\"etag-v1\"") { art in
        return blobsV1[art.role]!
    }
    check(installedV1.payload.publication_seq == 1, "Installed seq 1")
    let pinned = try client.pinInspectionSession("session_001", productID: "tzone_tht02", variantID: "v1_1_rs485")
    check(pinned.payload.publication_seq == 1, "Pinned session on seq 1")

    client.offlineMode = true
    let offlineLoaded = try client.syncVariant(productID: "tzone_tht02", variantID: "v1_1_rs485")
    check(offlineLoaded.payload.publication_seq == 1, "CL-IPAD-02: Offline load after WAN cut")
    check(fm.fileExists(atPath: offlineLoaded.localArtifactURL(forRole: "manual_pdf")!.path), "Offline manual PDF present")
    check(fm.fileExists(atPath: offlineLoaded.localArtifactURL(forRole: "twin_glb")!.path), "Offline GLB present")

    // 4. Install seq 2 while inspection session_001 remains open -> both coexist, session_001 keeps seq 1 (CL-IPAD-03)
    client.offlineMode = false
    let pdfBytesV2 = Data("%PDF-1.4\nTHT-02 rev2 updated\n".utf8)
    let artsV2: [[String: Any]] = [
        [
            "role": "manual_pdf",
            "path": "docs/manual.pdf",
            "sha256": FieldScanCloudCatalogClient.sha256Hex(pdfBytesV2),
            "byte_count": pdfBytesV2.count,
        ],
        [
            "role": "twin_glb",
            "path": "twin/model.glb",
            "sha256": FieldScanCloudCatalogClient.sha256Hex(glbBytes),
            "byte_count": glbBytes.count,
        ],
    ]
    let envV2 = try makeSignedEnvelope(privKey: privKey, seq: 2, artifacts: artsV2)
    let blobsV2: [String: Data] = ["manual_pdf": pdfBytesV2, "twin_glb": glbBytes]
    let installedV2 = try client.installVerifiedPackage(envelopeData: envV2, etag: "\"etag-v2\"") { art in
        return blobsV2[art.role]!
    }
    check(installedV2.payload.publication_seq == 2, "Installed seq 2")
    let stillPinned = client.pinnedRevision(forSession: "session_001")!
    check(stillPinned.payload.publication_seq == 1, "CL-IPAD-03: Open session retains seq 1")
    let v1PdfData = try Data(contentsOf: stillPinned.localArtifactURL(forRole: "manual_pdf")!)
    let v2PdfData = try Data(contentsOf: installedV2.localArtifactURL(forRole: "manual_pdf")!)
    check(v1PdfData == pdfBytes && v2PdfData == pdfBytesV2, "CL-IPAD-03: Both revisions coexist on disk intact")
}

func runLiveBoatSuiteIfConfigured() throws {
    let env = ProcessInfo.processInfo.environment
    guard let pubURLStr = env["FS_PUBLIC_URL"], !pubURLStr.isEmpty,
          let apiToken = env["FS_API_TOKEN"], !apiToken.isEmpty,
          let pubKeyB64 = env["FS_PUBLIC_KEY_B64"], !pubKeyB64.isEmpty
    else {
        print("[CLOUD_SWIFT] Live HTTPS env vars not set; local CryptoKit & offline suite passed.")
        return
    }
    let portToken = env["FS_BOAT_PORT_TOKEN"]
    let fm = FileManager.default
    let liveRoot = fm.temporaryDirectory.appendingPathComponent("fs_cloud_live_\(UUID().uuidString)", isDirectory: true)
    try fm.createDirectory(at: liveRoot, withIntermediateDirectories: true)
    defer { try? fm.removeItem(at: liveRoot) }

    let signer = FieldScanTrustedSigner(
        keyID: env["FS_KEY_ID"] ?? "pilot-1",
        issuer: env["FS_ISSUER"] ?? "fieldscan-pilot",
        publicKeyRawBase64: pubKeyB64
    )
    let cfg = try FieldScanCloudEndpointConfig(
        baseURL: URL(string: pubURLStr)!,
        apiBearerToken: apiToken,
        boatPortAuthToken: portToken,
        trustedSigners: [signer]
    )
    let client = try FieldScanCloudCatalogClient(storageRoot: liveRoot, endpoint: cfg)

    // CL-IPAD-01: Download from live Boat VM, verify Ed25519 + all 14 SHA-256 blobs in Swift CryptoKit
    let rev = try client.syncVariant(productID: "tzone_tht02", variantID: "v1_1_rs485")
    check(rev.payload.publication_seq >= 1, "CL-IPAD-01: Live publication seq >= 1")
    check(rev.payload.capabilities.documentation && rev.payload.capabilities.interactive_twin, "CL-IPAD-01: Full capabilities")
    check(rev.payload.artifacts.count == 14, "CL-IPAD-01: All 14 artifacts verified and installed")

    // Repeat sync -> hits 304 Not Modified cleanly
    let rev304 = try client.syncVariant(productID: "tzone_tht02", variantID: "v1_1_rs485")
    check(rev304.payload.publication_seq == rev.payload.publication_seq, "ETag 304 repeat sync")

    // CL-IPAD-02: Cut WAN (`offlineMode = true`) and verify PDF + GLB remain accessible locally
    client.offlineMode = true
    let offlineRev = try client.syncVariant(productID: "tzone_tht02", variantID: "v1_1_rs485")
    let glbData = try Data(contentsOf: offlineRev.localArtifactURL(forRole: "twin_glb")!)
    check(String(data: glbData.prefix(4), encoding: .ascii) == "glTF", "CL-IPAD-02: Offline GLB binary intact")
    print("[CLOUD_SWIFT] Live Boat.dev CL-IPAD-01..03 CryptoKit & offline suite PASSED (seq=\(rev.payload.publication_seq), artifacts=\(rev.payload.artifacts.count)).")
}

@main
enum CloudSwiftContractMain {
    static func main() {
        do {
            try runLocalCryptoAndOfflineSuite()
            try runLiveBoatSuiteIfConfigured()
            print("[CLOUD_SWIFT_OK] All Swift Cloud Catalog contracts verified.")
        } catch {
            fputs("[CLOUD_SWIFT_ERROR] \(error)\n", stderr)
            exit(1)
        }
    }
}
