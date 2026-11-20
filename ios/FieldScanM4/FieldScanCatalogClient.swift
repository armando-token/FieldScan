import Foundation
import Security

/// Dedicated Native HTTPS Client & Job Coordinator for FieldScan Cloud (`Section 3.1` & `Section 3.4`).
///
/// Completely isolated from `WKWebView` origins and local Modbus sockets:
/// - `syncEnabled` defaults to `false` on launch (`0` unsolicited WAN requests, `M4-BASE-01`).
/// - Enforces HTTPS (allowing loopback HTTP strictly when `allowLoopbackHTTPForTests == true`),
///   blocks cross-origin redirects (`M4-WAN-04`), and stores access tokens in Keychain (`OFF-05`, `M4-WAN-06`).
/// - Deduplicates active jobs per `(manufacturer, model, variant, endpoint)` (`M4-WAN-02`), handles
///   `200`, `202`, `304` (`If-None-Match` ETag), `401/403`, `404/410`, `429` (`Retry-After`), and `5xx` (`M4-WAN-03`).
/// - Downloads blobs to temporary files and verifies exact byte count & SHA-256 before committing to `FieldScanPackageStore` (`M4-WAN-05`).
public final class FieldScanCatalogClient: NSObject, URLSessionTaskDelegate {
    public static let shared = FieldScanCatalogClient(store: .shared)

    public let store: FieldScanPackageStore
    public let allowLoopbackHTTPForTests: Bool

    private let lock = NSRecursiveLock()
    private var urlSession: URLSession!
    private var syncEnabledFlag: Bool = false
    private var baseURLString: String = ""
    private var allowedHost: String = ""
    private var allowedScheme: String = "https"

    private let keychainService = "com.fieldscan.tht02.ipadm4.catalog"
    private let keychainAccount = "cloud_access_token"
    private let keychainBoatGateAccount = "boat_port_auth_token"
    private var inMemoryTokenFallback: String?
    private var inMemoryBoatGateFallback: String?

    private var activeJobsByKey: [String: [String: Any]] = [:]
    private var jobsById: [String: [String: Any]] = [:]
    private var etagCache: [String: (etag: String, manifestSha256: String)] = [:]
    private var activeTasks: [UUID: URLSessionTask] = [:]
    private var blockedRedirectTaskIds: Set<Int> = []
    private var cancelEpoch: Int = 0
    private var uiAttemptSeq: Int = 0

    private var httpsRequestsEmitted: Int = 0
    private var lastContactUTC: String?
    private var lastHealthStatus: String = "unchecked"
    private var syncLogs: [[String: Any]] = []

    public init(
        store: FieldScanPackageStore,
        baseURL: String = "",
        syncEnabled: Bool = false,
        allowLoopbackHTTPForTests: Bool = true,
        customProtocolClasses: [AnyClass]? = nil
    ) {
        self.store = store
        self.allowLoopbackHTTPForTests = allowLoopbackHTTPForTests
        super.init()

        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 12.0
        cfg.timeoutIntervalForResource = 60.0
        cfg.httpShouldSetCookies = false
        cfg.requestCachePolicy = .reloadIgnoringLocalCacheData
        if let protos = customProtocolClasses {
            cfg.protocolClasses = protos
        }
        self.urlSession = URLSession(configuration: cfg, delegate: self, delegateQueue: nil)

        if !baseURL.isEmpty {
            _ = try? configureEndpoint(baseURL: baseURL, syncEnabled: syncEnabled, authToken: nil)
        }
    }

    // MARK: - Strict Redirect Origin Guard (`M4-WAN-04`)

    public func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        lock.lock()
        let expHost = allowedHost
        let expScheme = allowedScheme
        lock.unlock()

        guard let url = request.url,
              let scheme = url.scheme?.lowercased(),
              let host = url.host?.lowercased(),
              scheme == expScheme,
              host == expHost else {
            // Cancel redirect outside authorized environment host (`M4-WAN-04`)
            lock.lock()
            blockedRedirectTaskIds.insert(task.taskIdentifier)
            lock.unlock()
            completionHandler(nil)
            task.cancel()
            return
        }
        completionHandler(request)
    }

    // MARK: - Configuration, Keychain Token & Egress Telemetry

    public func configureEndpoint(
        baseURL: String,
        syncEnabled: Bool? = nil,
        authToken: String? = nil,
        boatPortAuthToken: String? = nil,
        persistInKeychain: Bool = false
    ) throws -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }

        let raw = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if !raw.isEmpty {
            guard let parsed = URL(string: raw),
                  let scheme = parsed.scheme?.lowercased(),
                  let host = parsed.host?.lowercased(), !host.isEmpty else {
                throw FieldScanCatalogError(code: "INSECURE_CLOUD_ENDPOINT", message: "Malformed Cloud Catalog URL")
            }
            let isLoopback = (host == "127.0.0.1" || host == "localhost" || host == "::1")
            if scheme != "https" && !(scheme == "http" && isLoopback && allowLoopbackHTTPForTests) {
                throw FieldScanCatalogError(
                    code: "INSECURE_CLOUD_ENDPOINT",
                    message: "Cloud Catalog endpoint must use HTTPS (HTTP allowed only for loopback test fixtures)."
                )
            }
            self.baseURLString = raw
            self.allowedHost = host
            self.allowedScheme = scheme
        }

        if let tok = authToken {
            let clean = tok.trimmingCharacters(in: .whitespacesAndNewlines)
            inMemoryTokenFallback = clean.isEmpty ? nil : clean
            if persistInKeychain {
                saveSecretToKeychain(clean.isEmpty ? nil : clean, account: keychainAccount)
            }
        }

        if let boatTok = boatPortAuthToken {
            let clean = boatTok.trimmingCharacters(in: .whitespacesAndNewlines)
            inMemoryBoatGateFallback = clean.isEmpty ? nil : clean
            if persistInKeychain {
                saveSecretToKeychain(clean.isEmpty ? nil : clean, account: keychainBoatGateAccount)
            }
        }

        if let nextSync = syncEnabled {
            let wasEnabled = self.syncEnabledFlag
            self.syncEnabledFlag = nextSync
            if wasEnabled && !nextSync {
                cancelEpoch += 1
                let tasks = Array(activeTasks.values)
                activeTasks.removeAll()
                for t in tasks {
                    t.cancel()
                }
            }
        }

        return getSyncTelemetry()
    }

    public func setSyncEnabled(_ enabled: Bool) throws -> [String: Any] {
        let effectiveBase = baseURLString.isEmpty ? FieldScanRuntimeConfig.shared.cloudCatalogBaseURL : baseURLString
        return try configureEndpoint(baseURL: effectiveBase, syncEnabled: enabled)
    }

    private func persistentDeviceIdentifier() -> String {
        let key = "fieldscan.cloud.device_id"
        if let existing = UserDefaults.standard.string(forKey: key), existing.count >= 6 {
            return existing
        }
        let generated = "ipad-\(UUID().uuidString.lowercased())"
        UserDefaults.standard.set(generated, forKey: key)
        return generated
    }

    /// Automatically connects to the default server and enrolls a per-device Keychain Bearer token (zero manual typing).
    public func ensureAutoEnrolledIfNeeded(
        defaultBaseURL: String = FieldScanRuntimeConfig.shared.cloudCatalogBaseURL,
        forceReenroll: Bool = false
    ) throws {
        lock.lock()
        let currentBase = baseURLString
        let hasToken = resolveAuthTokenUnlocked() != nil
        let isEnabled = syncEnabledFlag
        lock.unlock()

        let targetBase = currentBase.isEmpty ? defaultBaseURL : currentBase
        if currentBase.isEmpty || !isEnabled {
            _ = try configureEndpoint(baseURL: targetBase, syncEnabled: true, persistInKeychain: true)
            FieldScanRuntimeConfig.shared.cloudCatalogBaseURL = targetBase
            FieldScanRuntimeConfig.shared.cloudCatalogSyncEnabled = true
        }

        if hasToken && !forceReenroll {
            return
        }
        if forceReenroll && hasToken {
            _ = try configureEndpoint(baseURL: targetBase, syncEnabled: true, authToken: "", persistInKeychain: true)
        }

        let enrollBody: [String: Any] = [
            "device_id": persistentDeviceIdentifier(),
            "platform": "ipados",
            "app_version": "2.1",
        ]
        let res = try performDataRequest(method: "POST", relPath: "/v1/devices/enroll", jsonBody: enrollBody)
        guard res.statusCode == 200,
              let json = (try? JSONSerialization.jsonObject(with: res.body)) as? [String: Any],
              let token = json["access_token"] as? String,
              !token.isEmpty else {
            throw FieldScanCatalogError(
                code: "AUTO_ENROLL_FAILED",
                message: "Automatic device enrollment with FieldScan Cloud did not return an access token.",
                statusCode: res.statusCode
            )
        }
        _ = try configureEndpoint(baseURL: targetBase, syncEnabled: true, authToken: token, persistInKeychain: true)
    }

    /// One-tap update flow: auto-connects, enrolls transparently in Keychain, verifies Ed25519 + SHA-256, and installs latest.
    public func downloadLatestPackage(
        productId: String = "tzone_tht02",
        variantId: String = "v1_1_rs485",
        defaultBaseURL: String = FieldScanRuntimeConfig.shared.cloudCatalogBaseURL
    ) throws -> [String: Any] {
        try ensureAutoEnrolledIfNeeded(defaultBaseURL: defaultBaseURL, forceReenroll: false)
        do {
            return try fetchAndInstallVariant(productId: productId, variantId: variantId, channel: "pilot")
        } catch let cerr as FieldScanCatalogError where cerr.code == "HTTP_UNAUTHORIZED" {
            // Token rotated or revoked on server -> transparently re-enroll once and retry
            try ensureAutoEnrolledIfNeeded(defaultBaseURL: defaultBaseURL, forceReenroll: true)
            return try fetchAndInstallVariant(productId: productId, variantId: variantId, channel: "pilot")
        }
    }

    private func saveSecretToKeychain(_ token: String?, account: String) {
        let baseQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(baseQuery as CFDictionary)
        guard let t = token, !t.isEmpty, let data = t.data(using: .utf8) else { return }
        var addQuery = baseQuery
        addQuery[kSecValueData as String] = data
        addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    private func readSecretFromKeychain(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        if SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
           let data = item as? Data,
           let str = String(data: data, encoding: .utf8), !str.isEmpty {
            return str
        }
        return nil
    }

    private func resolveAuthTokenUnlocked() -> String? {
        if let mem = inMemoryTokenFallback, !mem.isEmpty {
            return mem
        }
        if let kc = readSecretFromKeychain(account: keychainAccount) {
            inMemoryTokenFallback = kc
            return kc
        }
        return nil
    }

    private func resolveBoatGateTokenUnlocked() -> String? {
        if let mem = inMemoryBoatGateFallback, !mem.isEmpty {
            return mem
        }
        if let kc = readSecretFromKeychain(account: keychainBoatGateAccount) {
            inMemoryBoatGateFallback = kc
            return kc
        }
        return nil
    }

    public func getSyncTelemetry() -> [String: Any] {
        lock.lock()
        defer { lock.unlock() }
        let activeCount = jobsById.values.filter {
            let st = ($0["job_state"] as? String) ?? ""
            return st == "queued" || st == "running"
        }.count
        return [
            "sync_enabled": syncEnabledFlag,
            "egress_policy": syncEnabledFlag ? "catalog_https_authorized" : "strict_local_only",
            "configured_endpoint": baseURLString.isEmpty ? NSNull() : baseURLString,
            "has_credentials": resolveAuthTokenUnlocked() != nil,
            "has_boat_gate_cookie": resolveBoatGateTokenUnlocked() != nil,
            "trusted_signer_key_ids": Array(store.trustedKeys.keys).sorted(),
            "https_requests_emitted": httpsRequestsEmitted,
            "last_contact_utc": lastContactUTC ?? NSNull(),
            "last_health_status": lastHealthStatus,
            "active_jobs_count": activeCount,
            "recent_sync_logs": Array(syncLogs.suffix(12)),
        ]
    }

    private func recordLog(phase: String, correlationId: String, statusCode: Int?, bytes: Int, elapsedMs: Double, errorCode: String?) {
        lock.lock()
        syncLogs.append([
            "ts_utc": FieldScanSessionEngine.utcNowISO(),
            "phase": phase,
            "correlation_id": correlationId,
            "status_code": statusCode ?? NSNull(),
            "bytes": bytes,
            "elapsed_ms": (elapsedMs * 10).rounded() / 10,
            "error_code": errorCode ?? NSNull(),
        ])
        if syncLogs.count > 100 {
            syncLogs.removeFirst(syncLogs.count - 100)
        }
        lock.unlock()
    }

    private func ensureSyncAllowedUnlocked() throws -> (baseURL: String, host: String, scheme: String, epoch: Int, token: String?, boatCookie: String?) {
        guard syncEnabledFlag else {
            throw FieldScanCatalogError(
                code: "SYNC_DISABLED",
                message: "Cloud Catalog synchronization is disabled; operating strictly from local verified packages.",
                statusCode: 409
            )
        }
        guard !baseURLString.isEmpty && !allowedHost.isEmpty else {
            throw FieldScanCatalogError(code: "CLOUD_ENDPOINT_UNCONFIGURED", message: "Cloud Catalog HTTPS URL is not configured.")
        }
        return (baseURLString, allowedHost, allowedScheme, cancelEpoch, resolveAuthTokenUnlocked(), resolveBoatGateTokenUnlocked())
    }

    private func performDataRequest(
        method: String,
        relPath: String,
        jsonBody: [String: Any]? = nil,
        extraHeaders: [String: String] = [:]
    ) throws -> (statusCode: Int, headers: [AnyHashable: Any], body: Data) {
        lock.lock()
        let (base, expHost, expScheme, startEpoch, token, boatCookie) = try ensureSyncAllowedUnlocked()
        httpsRequestsEmitted += 1
        lock.unlock()

        let corr = "req-\(UUID().uuidString.prefix(10).lowercased())"
        guard let url = URL(string: "\(base)\(relPath)"),
              url.scheme?.lowercased() == expScheme,
              url.host?.lowercased() == expHost else {
            recordLog(phase: relPath, correlationId: corr, statusCode: nil, bytes: 0, elapsedMs: 0, errorCode: "REDIRECT_BLOCKED")
            throw FieldScanCatalogError(code: "REDIRECT_BLOCKED", message: "Target URL violates configured origin policy", statusCode: 403)
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue(corr, forHTTPHeaderField: "X-FieldScan-Correlation-Id")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let tok = token {
            req.setValue("Bearer \(tok)", forHTTPHeaderField: "Authorization")
        }
        if let bc = boatCookie {
            req.setValue("_port_auth=\(bc)", forHTTPHeaderField: "Cookie")
        }
        for (k, v) in extraHeaders {
            req.setValue(v, forHTTPHeaderField: k)
        }
        if let bodyObj = jsonBody {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: bodyObj)
        }

        let t0 = ProcessInfo.processInfo.systemUptime
        let sema = DispatchSemaphore(value: 0)
        var outData: Data?
        var outHTTP: HTTPURLResponse?
        var outErr: Error?
        let taskKey = UUID()

        let task = urlSession.dataTask(with: req) { data, resp, err in
            outData = data
            outHTTP = resp as? HTTPURLResponse
            outErr = err
            sema.signal()
        }
        lock.lock()
        activeTasks[taskKey] = task
        lock.unlock()
        task.resume()
        sema.wait()

        lock.lock()
        activeTasks.removeValue(forKey: taskKey)
        let wasRedirectBlocked = blockedRedirectTaskIds.remove(task.taskIdentifier) != nil
        let cancelledByPolicy = (!syncEnabledFlag || cancelEpoch != startEpoch)
        lock.unlock()

        let elapsed = (ProcessInfo.processInfo.systemUptime - t0) * 1000.0
        if wasRedirectBlocked {
            recordLog(phase: relPath, correlationId: corr, statusCode: outHTTP?.statusCode ?? 302, bytes: 0, elapsedMs: elapsed, errorCode: "REDIRECT_BLOCKED")
            throw FieldScanCatalogError(code: "REDIRECT_BLOCKED", message: "Cross-origin redirect blocked by FieldScan security policy", statusCode: 403)
        }
        if cancelledByPolicy {
            recordLog(phase: relPath, correlationId: corr, statusCode: nil, bytes: 0, elapsedMs: elapsed, errorCode: "DOWNLOAD_CANCELLED")
            throw FieldScanCatalogError(code: "DOWNLOAD_CANCELLED", message: "Operation cancelled because Cloud Sync was disabled.")
        }

        if let err = outErr {
            recordLog(phase: relPath, correlationId: corr, statusCode: nil, bytes: 0, elapsedMs: elapsed, errorCode: "NETWORK_UNREACHABLE")
            throw FieldScanCatalogError(
                code: "NETWORK_UNREACHABLE",
                message: "Cloud Catalog unreachable (\(err.localizedDescription)). Local cached packages remain operational.",
                statusCode: 503
            )
        }

        guard let http = outHTTP else {
            throw FieldScanCatalogError(code: "NETWORK_UNREACHABLE", message: "No HTTP response received", statusCode: 503)
        }

        // Detect blocked cross-origin redirect (URLSession returns the 30x response when delegate passes `nil`!)
        if (300...399).contains(http.statusCode) && http.statusCode != 304 {
            recordLog(phase: relPath, correlationId: corr, statusCode: http.statusCode, bytes: 0, elapsedMs: elapsed, errorCode: "REDIRECT_BLOCKED")
            throw FieldScanCatalogError(code: "REDIRECT_BLOCKED", message: "Cross-origin redirect blocked by FieldScan security policy", statusCode: 403)
        }

        lock.lock()
        lastContactUTC = FieldScanSessionEngine.utcNowISO()
        lock.unlock()

        let data = outData ?? Data()
        let code = http.statusCode

        if code == 401 || code == 403 {
            recordLog(phase: relPath, correlationId: corr, statusCode: code, bytes: data.count, elapsedMs: elapsed, errorCode: "HTTP_UNAUTHORIZED")
            throw FieldScanCatalogError(code: "HTTP_UNAUTHORIZED", message: "Cloud Catalog credentials rejected (\(code)).", statusCode: code)
        }
        if code == 404 || code == 410 {
            recordLog(phase: relPath, correlationId: corr, statusCode: code, bytes: data.count, elapsedMs: elapsed, errorCode: "HTTP_JOB_EXPIRED")
            throw FieldScanCatalogError(code: "HTTP_JOB_EXPIRED", message: "Requested job or catalog resource expired (\(code)).", statusCode: code)
        }
        if code == 429 {
            let raStr = (http.value(forHTTPHeaderField: "Retry-After") ?? "5").trimmingCharacters(in: .whitespaces)
            let ra = Int(raStr) ?? 5
            recordLog(phase: relPath, correlationId: corr, statusCode: 429, bytes: data.count, elapsedMs: elapsed, errorCode: "HTTP_RATE_LIMITED")
            throw FieldScanCatalogError(code: "HTTP_RATE_LIMITED", message: "Cloud Catalog rate-limited (429). Retry after \(ra)s.", statusCode: 429, retryAfterSeconds: ra)
        }
        if code >= 500 {
            recordLog(phase: relPath, correlationId: corr, statusCode: code, bytes: data.count, elapsedMs: elapsed, errorCode: "HTTP_SERVER_ERROR")
            throw FieldScanCatalogError(code: "HTTP_SERVER_ERROR", message: "Cloud Catalog temporary server error (\(code)).", statusCode: 503)
        }

        recordLog(phase: relPath, correlationId: corr, statusCode: code, bytes: data.count, elapsedMs: elapsed, errorCode: nil)
        return (statusCode: code, headers: http.allHeaderFields, body: data)
    }

    // MARK: - 5 Agreed Cloud Endpoints (`Section 3.1`)

    public func checkHealth() -> [String: Any] {
        do {
            let res = try performDataRequest(method: "GET", relPath: "/healthz")
            let ok = (res.statusCode == 200)
            lock.lock()
            lastHealthStatus = ok ? "healthy" : "http_\(res.statusCode)"
            lock.unlock()
            return ["ok": ok, "status": ok ? "healthy" : "http_\(res.statusCode)", "telemetry": getSyncTelemetry()]
        } catch let cerr as FieldScanCatalogError {
            lock.lock()
            lastHealthStatus = cerr.code.lowercased()
            lock.unlock()
            var d = cerr.toDictionary()
            d["telemetry"] = getSyncTelemetry()
            return d
        } catch {
            return ["ok": false, "error_code": "NETWORK_UNREACHABLE", "message": error.localizedDescription]
        }
    }

    private static func hoistIdentityAliases(_ json: inout [String: Any]) {
        let ident = (json["identity"] as? [String: Any]) ?? [:]
        let cached = (json["cached_publication"] as? [String: Any]) ?? [:]
        if json["product_id"] == nil || json["product_id"] is NSNull {
            if let pid = (ident["product_id"] as? String) ?? (cached["product_id"] as? String) {
                json["product_id"] = pid
            }
        }
        if json["variant_id"] == nil || json["variant_id"] is NSNull {
            if let vid = (ident["variant_id"] as? String) ?? (cached["variant_id"] as? String) {
                json["variant_id"] = vid
            }
        }
    }

    public func resolveCatalog(
        manufacturer: String?,
        model: String,
        variant: String? = nil,
        hardwareRevision: String? = nil
    ) throws -> [String: Any] {
        lock.lock()
        let (base, _, _, _, _, _) = try ensureSyncAllowedUnlocked()
        uiAttemptSeq += 1
        let attemptId = uiAttemptSeq
        let rawKey = "\((manufacturer ?? "").lowercased())|\(model.lowercased())|\((variant ?? "").lowercased())|\((hardwareRevision ?? "").lowercased())|\(base.lowercased())"
        let normKey = String(FieldScanCatalogContract.sha256Hex(Data(rawKey.utf8)).prefix(24))
        if var existing = activeJobsByKey[normKey],
           let st = existing["job_state"] as? String, (st == "queued" || st == "running") {
            lock.unlock()
            existing["reused_existing_job"] = true
            existing["ui_attempt_id"] = attemptId
            return existing
        }
        lock.unlock()

        let cleanMfg = manufacturer?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let body: [String: Any] = [
            "manufacturer": cleanMfg.isEmpty ? "UNKNOWN" : cleanMfg,
            "model": model.trimmingCharacters(in: .whitespacesAndNewlines),
            "variant": (variant?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false) ? variant! : NSNull(),
            "hardware_revision": (hardwareRevision?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false) ? hardwareRevision! : NSNull(),
        ]
        let res = try performDataRequest(method: "POST", relPath: "/v1/catalog/resolve", jsonBody: body)
        guard var json = (try? JSONSerialization.jsonObject(with: res.body)) as? [String: Any] else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Invalid JSON from /v1/catalog/resolve")
        }
        Self.hoistIdentityAliases(&json)
        json["ui_attempt_id"] = attemptId
        json["reused_existing_job"] = false

        let st = (json["job_state"] as? String) ?? ""
        if res.statusCode == 202 || st == "queued" || st == "running" {
            let jid = (json["job_id"] as? String) ?? "job-\(UUID().uuidString.prefix(8).lowercased())"
            json["job_id"] = jid
            json["norm_key"] = normKey
            lock.lock()
            activeJobsByKey[normKey] = json
            jobsById[jid] = json
            lock.unlock()
        }
        return json
    }

    public func pollJob(jobId: String) throws -> [String: Any] {
        let res = try performDataRequest(method: "GET", relPath: "/v1/jobs/\(jobId)")
        guard var json = (try? JSONSerialization.jsonObject(with: res.body)) as? [String: Any] else {
            throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Invalid JSON from /v1/jobs/\(jobId)")
        }
        Self.hoistIdentityAliases(&json)
        json["job_id"] = jobId
        lock.lock()
        if let prev = jobsById[jobId], let nk = prev["norm_key"] as? String {
            json["norm_key"] = nk
            activeJobsByKey[nk] = json
        }
        jobsById[jobId] = json
        lock.unlock()
        return json
    }

    public func fetchAndInstallVariant(
        productId: String,
        variantId: String,
        channel: String = "default"
    ) throws -> [String: Any] {
        lock.lock()
        let (base, expHost, expScheme, startEpoch, token, boatCookie) = try ensureSyncAllowedUnlocked()
        let pvKey = "\(productId)/\(variantId)@\(base)"
        var hdrs: [String: String] = [:]
        var cachedSha: String?
        if let cached = etagCache[pvKey] {
            hdrs["If-None-Match"] = cached.etag
            cachedSha = cached.manifestSha256
        }
        lock.unlock()

        let mRes = try performDataRequest(
            method: "GET",
            relPath: "/v1/catalog/products/\(productId)/variants/\(variantId)/manifest",
            extraHeaders: hdrs
        )
        if mRes.statusCode == 304, let cSha = cachedSha {
            let pkg = try store.getInstalledPackage(manifestSha256: cSha)
            return [
                "ok": true,
                "status": "not_modified_304",
                "reused_cached": true,
                "package": pkg,
            ]
        }

        let (manifest, manifestSha, _) = try FieldScanCatalogContract.verifyAndDecodeManifestEnvelope(
            mRes.body,
            trustedKeys: store.trustedKeys
        )
        let artifacts = (manifest["artifacts"] as? [[String: Any]]) ?? []

        let fm = FileManager.default
        let dlDir = store.stagingDirURL.appendingPathComponent("dl-\(UUID().uuidString.prefix(10).lowercased())", isDirectory: true)
        try fm.createDirectory(at: dlDir, withIntermediateDirectories: true)
        defer { try? fm.removeItem(at: dlDir) }

        var blobsMap: [String: URL] = [:]
        for art in artifacts {
            lock.lock()
            let cancelled = (!syncEnabledFlag || cancelEpoch != startEpoch)
            if !cancelled { httpsRequestsEmitted += 1 }
            lock.unlock()
            if cancelled {
                throw FieldScanCatalogError(code: "DOWNLOAD_CANCELLED", message: "Download cancelled because Cloud Sync was disabled.")
            }

            let objSha = (art["sha256"] as? String) ?? ""
            let expLen = (art["byte_count"] as? Int) ?? 0
            let corr = "blob-\(objSha.prefix(10))"
            guard let bURL = URL(string: "\(base)/v1/catalog/blobs/\(objSha)"),
                  bURL.scheme?.lowercased() == expScheme,
                  bURL.host?.lowercased() == expHost else {
                throw FieldScanCatalogError(code: "REDIRECT_BLOCKED", message: "Invalid blob URL origin", statusCode: 403)
            }

            var req = URLRequest(url: bURL)
            req.httpMethod = "GET"
            req.setValue(corr, forHTTPHeaderField: "X-FieldScan-Correlation-Id")
            if let tok = token {
                req.setValue("Bearer \(tok)", forHTTPHeaderField: "Authorization")
            }
            if let bc = boatCookie {
                req.setValue("_port_auth=\(bc)", forHTTPHeaderField: "Cookie")
            }

            let t0 = ProcessInfo.processInfo.systemUptime
            let sema = DispatchSemaphore(value: 0)
            var tmpLoc: URL?
            var dlHTTP: HTTPURLResponse?
            var dlErr: Error?
            let taskKey = UUID()
            let dstFile = dlDir.appendingPathComponent("\(objSha).blob")

            let dlTask = urlSession.downloadTask(with: req) { loc, resp, err in
                dlHTTP = resp as? HTTPURLResponse
                dlErr = err
                if let loc = loc {
                    try? fm.moveItem(at: loc, to: dstFile)
                    tmpLoc = dstFile
                }
                sema.signal()
            }
            lock.lock()
            activeTasks[taskKey] = dlTask
            lock.unlock()
            dlTask.resume()
            sema.wait()

            lock.lock()
            activeTasks.removeValue(forKey: taskKey)
            let midCancelled = (!syncEnabledFlag || cancelEpoch != startEpoch)
            lock.unlock()

            let elapsed = (ProcessInfo.processInfo.systemUptime - t0) * 1000.0
            if midCancelled {
                recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: nil, bytes: 0, elapsedMs: elapsed, errorCode: "DOWNLOAD_CANCELLED")
                throw FieldScanCatalogError(code: "DOWNLOAD_CANCELLED", message: "Download cancelled because Cloud Sync was disabled.")
            }
            if let err = dlErr {
                recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: nil, bytes: 0, elapsedMs: elapsed, errorCode: "BLOB_TRUNCATED")
                throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "Blob transfer interrupted (\(err.localizedDescription)). Active package preserved.", statusCode: 503)
            }
            guard let http = dlHTTP else {
                throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "No HTTP response on blob transfer", statusCode: 503)
            }
            if (300...399).contains(http.statusCode) {
                recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: http.statusCode, bytes: 0, elapsedMs: elapsed, errorCode: "REDIRECT_BLOCKED")
                throw FieldScanCatalogError(code: "REDIRECT_BLOCKED", message: "Cross-origin redirect blocked on blob download", statusCode: 403)
            }
            guard http.statusCode == 200, let finalTmp = tmpLoc, fm.fileExists(atPath: finalTmp.path) else {
                recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: http.statusCode, bytes: 0, elapsedMs: elapsed, errorCode: "BLOB_DOWNLOAD_FAILED")
                throw FieldScanCatalogError(code: "BLOB_DOWNLOAD_FAILED", message: "Blob HTTP \(http.statusCode)", statusCode: http.statusCode)
            }
            if let ctype = http.value(forHTTPHeaderField: "Content-Type")?.lowercased(), ctype.contains("text/html") {
                throw FieldScanCatalogError(code: "BLOB_DOWNLOAD_FAILED", message: "Unexpected HTML error page instead of binary blob")
            }

            let attrs = try fm.attributesOfItem(atPath: finalTmp.path)
            let actualLen = (attrs[.size] as? NSNumber)?.intValue ?? -1
            if actualLen != expLen {
                recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: 200, bytes: actualLen, elapsedMs: elapsed, errorCode: "BLOB_TRUNCATED")
                throw FieldScanCatalogError(code: "BLOB_TRUNCATED", message: "Truncated blob (\(actualLen) != \(expLen) bytes)")
            }
            guard let actualSha = FieldScanCatalogContract.sha256File(finalTmp), actualSha == objSha else {
                recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: 200, bytes: actualLen, elapsedMs: elapsed, errorCode: "BLOB_HASH_MISMATCH")
                throw FieldScanCatalogError(code: "BLOB_HASH_MISMATCH", message: "Downloaded blob SHA-256 mismatch")
            }

            recordLog(phase: "/v1/catalog/blobs/\(objSha.prefix(12))", correlationId: corr, statusCode: 200, bytes: actualLen, elapsedMs: elapsed, errorCode: nil)
            blobsMap[objSha] = finalTmp
        }

        let installed = try store.installVerifiedPackage(
            envelopeData: mRes.body,
            blobsBySha256: blobsMap,
            channel: channel,
            sourceOrigin: "cloud_https"
        )

        if let etag = (mRes.headers["ETag"] as? String) ?? (mRes.headers["Etag"] as? String) ?? (mRes.headers["etag"] as? String) {
            lock.lock()
            etagCache[pvKey] = (etag: etag, manifestSha256: manifestSha)
            lock.unlock()
        }

        return [
            "ok": true,
            "status": "installed",
            "reused_cached": false,
            "package": installed,
        ]
    }
}
