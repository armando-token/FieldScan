import Foundation
import Darwin
#if canImport(UIKit)
import UIKit
#endif
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Provider-aware AI & Embedded `llama.cpp` Runtime Coordinator (`Section 10.2`, `IA-01..06`).
///
/// Key guarantees:
/// - **Autonomous Mode Isolation (`IA-02`)**: When running in native autonomous iPad mode (`embeddedLocal`),
///   NEVER probes Mac Mini IPs (`169.254.*`, `10.0.*`, `.local`)! Only probes `127.0.0.1:8091` if in-process
///   embedded `llama.cpp` was explicitly launched.
/// - **Real Provider Identity (`IA-01`)**: Queries `/v1/models` to report actual served model ID & location
///   (`iPad` vs `Mac Mini` vs `Apple Foundation Models · iPad` vs `Local Deterministic Rules v2.1`).
/// - **Embedded `llama.cpp` Safety (`IA-05`, `IA-06`)**: Verifies `os_proc_available_memory()` > 3.2 GB before
///   loading weights in-process via `_Z12llama_serveriPPc`, supports cancellation, and invokes
///   `_Z22llama_server_terminatev` automatically on `UIApplication.didReceiveMemoryWarningNotification`.
public final class LlamaServerBridge {
    public static let shared = LlamaServerBridge()

    private typealias LlamaServerMainFn = @convention(c) (
        Int32,
        UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>?
    ) -> Int32

    private typealias LlamaServerTerminateFn = @convention(c) () -> Void

    private static let dylibLoadOrder: [String] = [
        "libggml-base.0.dylib",
        "libggml-blas.0.dylib",
        "libggml-cpu.0.dylib",
        "libggml-metal.0.dylib",
        "libggml-rpc.0.dylib",
        "libggml.0.dylib",
        "libllama.0.dylib",
        "libmtmd.0.dylib",
        "libllama-common.0.dylib",
        "libllama-server-impl.dylib",
    ]

    private let workerQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.llama-bridge",
        qos: .userInitiated,
        attributes: .concurrent
    )
    private let stateLock = NSLock()
    private var dylibHandles: [UnsafeMutableRawPointer] = []
    private var terminateFn: LlamaServerTerminateFn?
    private var inProcessServerLaunched: Bool = false

    public private(set) var vlServerRunning: Bool = false
    public private(set) var audioServerRunning: Bool = false
    public private(set) var omniModeActive: Bool = true
    public private(set) var activeProviderId: String = "local_rules_v2"
    public private(set) var activeModelName: String = "Local Deterministic Rules v2.1 · iPad"
    public private(set) var activeOmniBaseURL: String = "http://127.0.0.1:8091"
    public private(set) var lastStatusMessage: String = "Initialized (Autonomous iPad Mode)"
    public private(set) var macProbingSuppressedInAutonomousMode: Bool = true

    private init() {
        #if canImport(UIKit)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
        #endif
    }

    @objc private func handleMemoryWarning() {
        terminateEmbeddedLlamaIfRunning(reason: "iOS Memory Pressure Warning")
    }

    public func terminateEmbeddedLlamaIfRunning(reason: String = "Requested") {
        stateLock.lock()
        let term = terminateFn
        let wasLaunched = inProcessServerLaunched
        inProcessServerLaunched = false
        vlServerRunning = false
        audioServerRunning = false
        activeProviderId = detectAppleFoundationModelsAvailable() ? "apple_foundation_models" : "local_rules_v2"
        activeModelName = activeProviderId == "apple_foundation_models"
            ? "Apple Foundation Models · iPad"
            : "Local Deterministic Rules v2.1 · iPad"
        lastStatusMessage = "Embedded llama.cpp unloaded (\(reason)); degraded cleanly to \(activeModelName)"
        stateLock.unlock()

        if wasLaunched, let fn = term {
            fn()
        }
    }

    public func detectAppleFoundationModelsAvailable() -> Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            switch SystemLanguageModel.default.availability {
            case .available:
                return true
            default:
                return false
            }
        }
        #endif
        return false
    }

    public func locateModelFile(named filename: String) -> URL? {
        let fm = FileManager.default
        let docsCandidate = FieldScanRuntimeConfig.shared.documentsDirectory
            .appendingPathComponent("vendor/models/\(filename)")
        if fm.fileExists(atPath: docsCandidate.path) {
            return docsCandidate
        }
        if let bundleResourceURL = Bundle.main.resourceURL {
            let candidates = [
                bundleResourceURL.appendingPathComponent("vendor/models/\(filename)"),
                bundleResourceURL.appendingPathComponent("BundleResources/vendor/models/\(filename)"),
            ]
            for url in candidates where fm.fileExists(atPath: url.path) {
                return url
            }
        }
        return nil
    }

    private func resolveLlamaSymbols() -> (LlamaServerMainFn?, LlamaServerTerminateFn?) {
        var candidateDirs: [URL] = []
        if let privPath = Bundle.main.privateFrameworksPath {
            candidateDirs.append(URL(fileURLWithPath: privPath, isDirectory: true))
        }
        candidateDirs.append(Bundle.main.bundleURL.appendingPathComponent("Frameworks", isDirectory: true))
        if let execURL = Bundle.main.executableURL {
            candidateDirs.append(execURL.deletingLastPathComponent().appendingPathComponent("Frameworks", isDirectory: true))
        }

        let fm = FileManager.default
        var serverImplHandle: UnsafeMutableRawPointer?

        for dir in candidateDirs where fm.fileExists(atPath: dir.path) {
            for dylibName in Self.dylibLoadOrder {
                let dylibURL = dir.appendingPathComponent(dylibName)
                guard fm.fileExists(atPath: dylibURL.path) else { continue }
                if let handle = dlopen(dylibURL.path, RTLD_LAZY | RTLD_GLOBAL) {
                    stateLock.lock()
                    dylibHandles.append(handle)
                    stateLock.unlock()
                    if dylibName == "libllama-server-impl.dylib" {
                        serverImplHandle = handle
                    }
                }
            }
            if serverImplHandle != nil { break }
        }

        guard let h = serverImplHandle else { return (nil, nil) }
        let mainSym = dlsym(h, "_Z12llama_serveriPPc") ?? dlsym(h, "__Z12llama_serveriPPc")
        let termSym = dlsym(h, "_Z22llama_server_terminatev") ?? dlsym(h, "__Z22llama_server_terminatev")
        let mainFn = mainSym.map { unsafeBitCast($0, to: LlamaServerMainFn.self) }
        let termFn = termSym.map { unsafeBitCast($0, to: LlamaServerTerminateFn.self) }
        return (mainFn, termFn)
    }

    /// Evaluates available on-device AI providers without ever probing Mac IPs in autonomous mode (`IA-02`).
    public func startEmbeddedServersIfAvailable(enableExperimentalInProcessLlama: Bool = false, completion: ((Bool, Bool) -> Void)? = nil) {
        workerQueue.async { [weak self] in
            guard let self = self else { return }
            FieldScanRuntimeConfig.shared.prepareSharedDirectories()

            // Optional experimental in-process llama.cpp launch when verified GGUF weights exist & RAM headroom >= 3.2 GB (`IA-05`)
            if enableExperimentalInProcessLlama {
                self.launchExperimentalInProcessLlamaIfEligible()
            }

            self.refreshProviderHealth { vlOK, audioOK in
                completion?(vlOK, audioOK)
            }

            // Poll health asynchronously during Metal GGUF warmup (up to 30s) so `vlServerRunning` activates automatically once loaded
            if enableExperimentalInProcessLlama {
                self.pollWarmupUntilReady(remainingAttempts: 30)
            }
        }
    }

    private func pollWarmupUntilReady(remainingAttempts: Int) {
        guard remainingAttempts > 0 else { return }
        stateLock.lock()
        let launched = inProcessServerLaunched
        let alreadyUp = vlServerRunning
        stateLock.unlock()
        guard launched && !alreadyUp else { return }

        workerQueue.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let self = self else { return }
            self.refreshProviderHealth { vlOK, _ in
                if !vlOK {
                    self.pollWarmupUntilReady(remainingAttempts: remainingAttempts - 1)
                }
            }
        }
    }

    public func launchExperimentalInProcessLlamaIfEligible() {
        stateLock.lock()
        if inProcessServerLaunched {
            stateLock.unlock()
            return
        }
        stateLock.unlock()

        let mem = FieldScanRuntimeConfig.shared.sampleMemoryTelemetry()
        guard mem.availableMemoryGB >= 3.2 else {
            stateLock.lock()
            lastStatusMessage = String(format: "Skipped embedded llama.cpp: %.2f GB available (< 3.2 GB safety floor)", mem.availableMemoryGB)
            stateLock.unlock()
            return
        }

        let cfg = FieldScanRuntimeConfig.shared
        // Prefer Qwen3VL-4B-Instruct on 12 GB iPad Air M4 (strong bilingual ES/EN + scene & document vision) when >= 4.2 GB free
        let preferQwen = mem.availableMemoryGB >= 4.2
        let modelURL: URL?
        let mmprojURL: URL?
        if preferQwen, let qModel = locateModelFile(named: cfg.qwenModelFilename) {
            modelURL = qModel
            mmprojURL = locateModelFile(named: cfg.qwenMmprojFilename)
        } else {
            modelURL = locateModelFile(named: cfg.visionModelFilename) ?? locateModelFile(named: cfg.omniModelFilename)
            mmprojURL = locateModelFile(named: cfg.visionMmprojFilename) ?? locateModelFile(named: cfg.omniMmprojFilename)
        }
        guard let resolvedModelURL = modelURL else {
            return
        }
        let (mainFnOpt, termFnOpt) = resolveLlamaSymbols()
        guard let mainFn = mainFnOpt else { return }

        stateLock.lock()
        self.terminateFn = termFnOpt
        self.inProcessServerLaunched = true
        stateLock.unlock()

        Thread.detachNewThread {
            var args: [String] = [
                "llama-server",
                "-m", resolvedModelURL.path,
                "--host", "127.0.0.1",
                "--port", "8091",
                "-c", "2048",
                "-ngl", "99",
            ]
            if let mp = mmprojURL {
                args.append(contentsOf: ["--mmproj", mp.path])
            }
            var cStrings: [UnsafeMutablePointer<CChar>?] = args.map { strdup($0) }
            defer {
                for ptr in cStrings {
                    if let p = ptr { free(p) }
                }
            }
            cStrings.withUnsafeMutableBufferPointer { buf in
                _ = mainFn(Int32(args.count), buf.baseAddress)
            }
        }
    }

    /// Probes ONLY allowed endpoints for the current topology mode (`IA-01`, `IA-02`).
    public func refreshProviderHealth(completion: @escaping (Bool, Bool) -> Void) {
        let cfg = FieldScanRuntimeConfig.shared
        var candidates: [(String, String)] = [] // (baseURL, locationLabel)

        if cfg.currentMode.isMacAssisted {
            macProbingSuppressedInAutonomousMode = false
            candidates.append(("http://\(cfg.macTetherHost):8091", "Mac Mini"))
        } else {
            macProbingSuppressedInAutonomousMode = true
            if inProcessServerLaunched {
                candidates.append(("http://127.0.0.1:8091", "iPad Metal"))
            }
        }

        guard let first = candidates.first, let healthURL = URL(string: "\(first.0)/health") else {
            let appleAvail = detectAppleFoundationModelsAvailable()
            DispatchQueue.main.async {
                self.vlServerRunning = false
                self.audioServerRunning = false
                if appleAvail {
                    self.activeProviderId = "apple_foundation_models"
                    self.activeModelName = "Apple Foundation Models · iPad"
                } else {
                    self.activeProviderId = "local_rules_v2"
                    self.activeModelName = "Local Deterministic Rules v2.1 · iPad"
                }
                self.lastStatusMessage = "\(self.activeModelName) = ONLINE (Mac Probing Disabled)"
                completion(false, false)
            }
            return
        }

        var req = URLRequest(url: healthURL)
        req.timeoutInterval = 0.5
        URLSession.shared.dataTask(with: req) { data, resp, err in
            let ok = (err == nil && ((resp as? HTTPURLResponse)?.statusCode == 200))
            if !ok {
                let appleAvail = self.detectAppleFoundationModelsAvailable()
                DispatchQueue.main.async {
                    self.vlServerRunning = false
                    self.audioServerRunning = false
                    self.activeProviderId = appleAvail ? "apple_foundation_models" : "local_rules_v2"
                    self.activeModelName = appleAvail
                        ? "Apple Foundation Models · iPad"
                        : "Local Deterministic Rules v2.1 · iPad"
                    self.lastStatusMessage = "\(self.activeModelName) = ONLINE"
                    completion(false, false)
                }
                return
            }

            // Query `/v1/models` to report the real model ID (`IA-01`)
            let modelsURL = URL(string: "\(first.0)/v1/models")!
            var mReq = URLRequest(url: modelsURL)
            mReq.timeoutInterval = 0.5
            URLSession.shared.dataTask(with: mReq) { mData, _, _ in
                var realId = "llama-server"
                if let mData = mData,
                   let json = (try? JSONSerialization.jsonObject(with: mData)) as? [String: Any],
                   let items = json["data"] as? [[String: Any]],
                   let idStr = items.first?["id"] as? String, !idStr.isEmpty {
                    realId = URL(fileURLWithPath: idStr).lastPathComponent
                }
                DispatchQueue.main.async {
                    self.activeOmniBaseURL = first.0
                    self.vlServerRunning = true
                    self.audioServerRunning = self.omniModeActive
                    self.activeProviderId = first.1 == "iPad Metal" ? "embedded_llamacpp_ipad" : "mac_assisted_llm"
                    self.activeModelName = "\(realId) · \(first.1)"
                    self.lastStatusMessage = "\(self.activeModelName) = ONLINE"
                    completion(true, self.audioServerRunning)
                }
            }.resume()
        }.resume()
    }

    public func currentTelemetrySnapshot() -> [String: Any] {
        let mem = FieldScanRuntimeConfig.shared.sampleMemoryTelemetry()
        let vlModel = locateModelFile(named: FieldScanRuntimeConfig.shared.visionModelFilename)
            ?? locateModelFile(named: FieldScanRuntimeConfig.shared.omniModelFilename)
        let dylibsEmbedded = (Bundle.main.privateFrameworksPath.map {
            FileManager.default.fileExists(atPath: "\($0)/libllama-server-impl.dylib")
        }) ?? false

        return [
            "memory": mem.toDictionary(),
            "status_message": lastStatusMessage,
            "active_provider_id": activeProviderId,
            "active_model": activeModelName,
            "apple_foundation_models_available": detectAppleFoundationModelsAvailable(),
            "mac_probing_suppressed_in_autonomous_mode": macProbingSuppressedInAutonomousMode,
            "embedded_llamacpp": [
                "dylibs_embedded_in_app": dylibsEmbedded,
                "in_process_launched": inProcessServerLaunched,
                "weights_present_in_documents": vlModel != nil,
                "weights_path": vlModel?.path ?? "Copy .gguf to Documents/vendor/models for experimental iPad Metal LLM",
                "server_healthy": vlServerRunning && activeProviderId == "embedded_llamacpp_ipad",
            ],
        ]
    }
}
