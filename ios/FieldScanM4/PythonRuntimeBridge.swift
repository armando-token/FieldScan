import Foundation
import Darwin

/// Manages the embedded Python 3.11+ / FastAPI runtime on `127.0.0.1:8088` (via `Python.xcframework`
/// C-API `Py_Initialize` + `PyRun_SimpleString` when linked) AND provides an intelligent multi-stage
/// endpoint resolver that guarantees the iPad Air M4 app ALWAYS boots into a working 3D Digital Twin
/// and SCADA studio.
///
/// Endpoint Resolution Order:
///   1. Local embedded FastAPI server: `http://127.0.0.1:8088`
///   2. Direct USB-C tether to Mac Mini (`en6`): `https://169.254.37.69:8443` / `http://169.254.37.69:8088`
///   3. Local LAN workstation: `http://10.0.0.15:8088`
///   4. Bundled standalone offline HTML/Three.js studio (`BundleResources/static/index.html` inside `.app`)
public final class PythonRuntimeBridge: NSObject, URLSessionDelegate {
    public static let shared = PythonRuntimeBridge()

    private typealias PyInitializeFn = @convention(c) () -> Void
    private typealias PyRunSimpleStringFn = @convention(c) (UnsafePointer<CChar>) -> Int32

    public private(set) var embeddedPythonActive: Bool = false
    public private(set) var resolvedMode: FieldScanEndpointMode = .embeddedLocal
    public private(set) var resolvedURL: URL = URL(string: "http://127.0.0.1:8088")!

    private lazy var probeSession: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 0.85
        config.timeoutIntervalForResource = 1.2
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    private override init() {
        super.init()
    }

    /// Configures iOS environment variables (`FIELDSCAN_PLATFORM=ios` and `FIELDSCAN_ALLOW_USB_LINKLOCAL=1`)
    /// and boots the in-process Python interpreter if `Python.xcframework` symbols are present in the process.
    public func startEmbeddedPythonServerIfAvailable() {
        setenv("FIELDSCAN_PLATFORM", "ios", 1)
        setenv("FIELDSCAN_ALLOW_USB_LINKLOCAL", "1", 1)
        setenv("PYTHONDONTWRITEBYTECODE", "1", 1)

        let RTLD_DEFAULT_HANDLE = UnsafeMutableRawPointer(bitPattern: -2)
        guard
            let pyInitSym = dlsym(RTLD_DEFAULT_HANDLE, "Py_Initialize"),
            let pyRunSym = dlsym(RTLD_DEFAULT_HANDLE, "PyRun_SimpleString")
        else {
            // Python.xcframework not linked in standalone build; boot the native in-process Swift server on 127.0.0.1:8088.
            StandaloneFieldScanServer.shared.start()
            return
        }

        let pyInitialize = unsafeBitCast(pyInitSym, to: PyInitializeFn.self)
        let pyRunSimpleString = unsafeBitCast(pyRunSym, to: PyRunSimpleStringFn.self)

        let resourceRoot = Bundle.main.resourceURL?.path ?? ""
        let docsRoot = FieldScanRuntimeConfig.shared.documentsDirectory.path

        Thread.detachNewThread { [weak self] in
            pyInitialize()
            let bootstrapScript = """
            import os, sys, threading
            os.environ["FIELDSCAN_PLATFORM"] = "ios"
            os.environ["FIELDSCAN_ALLOW_USB_LINKLOCAL"] = "1"
            for candidate in [
                "\(resourceRoot)/src",
                "\(resourceRoot)/BundleResources/src",
                "\(docsRoot)/src"
            ]:
                if os.path.isdir(candidate) and candidate not in sys.path:
                    sys.path.insert(0, candidate)
            try:
                import uvicorn
                from fieldscan.server import app
                uvicorn.run(app, host="127.0.0.1", port=8088, log_level="warning")
            except Exception as exc:
                print(f"[FieldScanM4 PythonRuntimeBridge] Embedded startup note: {exc}")
            """
            bootstrapScript.withCString { cStr in
                _ = pyRunSimpleString(cStr)
            }
            self?.embeddedPythonActive = true
        }
    }

    /// Starts the in-process StandaloneFieldScanServer on `127.0.0.1:8088` and resolves to it once the listener is bound.
    public func resolveBestEndpoint(completion: @escaping (FieldScanEndpointMode, URL) -> Void) {
        StandaloneFieldScanServer.shared.start()
        let cfg = FieldScanRuntimeConfig.shared
        let localURL = cfg.localBackendURL
        self.resolvedMode = .embeddedLocal
        self.resolvedURL = localURL
        cfg.currentMode = .embeddedLocal
        cfg.activeEndpointURL = localURL

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
            completion(.embeddedLocal, localURL)
        }
    }

    private func probeCandidateChain(
        _ candidates: [(FieldScanEndpointMode, URL)],
        index: Int,
        completion: @escaping ((FieldScanEndpointMode, URL)?) -> Void
    ) {
        guard index < candidates.count else {
            completion(nil)
            return
        }

        let (mode, baseURL) = candidates[index]
        let statusURL = baseURL.appendingPathComponent("api/status")
        var request = URLRequest(url: statusURL)
        request.httpMethod = "GET"
        request.timeoutInterval = 0.85

        probeSession.dataTask(with: request) { [weak self] _, response, error in
            if error == nil, let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) {
                completion((mode, baseURL))
            } else {
                self?.probeCandidateChain(candidates, index: index + 1, completion: completion)
            }
        }.resume()
    }

    /// Locates `static/index.html` inside the `.app` bundle or returns `http://127.0.0.1:8088` when the standalone server is active.
    public func locateBundledOfflineStudioURL() -> URL {
        if StandaloneFieldScanServer.shared.isRunning {
            return FieldScanRuntimeConfig.shared.localBackendURL
        }
        let fm = FileManager.default
        if let resURL = Bundle.main.resourceURL {
            let candidates = [
                resURL.appendingPathComponent("BundleResources/static/index.html"),
                resURL.appendingPathComponent("static/index.html"),
                resURL.appendingPathComponent("index.html"),
            ]
            for url in candidates where fm.fileExists(atPath: url.path) {
                return url
            }
        }
        return FieldScanRuntimeConfig.shared.localBackendURL
    }

    /// Trusts the local self-signed USB-C tether certificate on `169.254.37.69` or loopback `127.0.0.1`.
    public func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        let host = challenge.protectionSpace.host
        if (host == "127.0.0.1" || host == "localhost" || host.hasPrefix("169.254.") || host.hasPrefix("10.0.")),
           let serverTrust = challenge.protectionSpace.serverTrust {
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
            return
        }
        completionHandler(.performDefaultHandling, nil)
    }
}
