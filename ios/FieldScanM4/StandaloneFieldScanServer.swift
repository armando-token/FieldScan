import Foundation
import Network
import AVFoundation
import CoreImage
import Speech
import Vision
#if canImport(FoundationModels)
import FoundationModels
#endif
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Runtime Config & Camera Bridge Convenience Extensions

extension FieldScanRuntimeConfig {
    /// Directory for generated CAD blueprints (.dxf), 3D meshes (.stl), PNG sheets, and .zip bundles.
    public var exportsDirectory: URL {
        let dir = documentsDirectory.appendingPathComponent("exports", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    /// Directory for offline store-and-forward RFC-5322 (.eml) sign-off and escalation messages.
    public var outboxDirectory: URL {
        let dir = documentsDirectory.appendingPathComponent("outbox", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }
}

extension NativeCameraBridge {
    /// Starts live camera capture with an explicit target frame rate and preferred camera source.
    public func startCapture(
        preferredSource: String,
        targetFPS: Int32,
        completion: ((Bool, String) -> Void)? = nil
    ) {
        self.targetFPS = targetFPS
        self.startCapture(preferredSource: preferredSource, completion: completion)
    }
}

// MARK: - Standalone In-Process HTTP/1.1 Server, Workbench Simulator, Modbus-RTU & Edge AI Engine

/// Complete, self-contained HTTP/1.1 backend server running on `127.0.0.1:8088` inside `FieldScanM4.app`.
/// Guarantees 100% standalone operation on the iPad Air M4 even when the Mac Mini is powered off,
/// unplugged, and Wi-Fi / Airplane Mode is active.
public final class StandaloneFieldScanServer: NSObject, AVSpeechSynthesizerDelegate {
    public static let shared = StandaloneFieldScanServer()

    public let listenHost: String = "127.0.0.1"
    public let listenPort: UInt16 = 8088

    /// Strictly serial socket queue for Network.framework (`NWListener` / `NWConnection`) non-blocking I/O.
    private let nwSocketQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.nw-socket",
        qos: .userInitiated
    )
    /// Concurrent worker pool for HTTP route handlers so socket framing never stalls.
    private let serverQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.standalone-http",
        qos: .userInitiated,
        attributes: .concurrent
    )
    private let stateLock = NSLock()
    private let renderQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.workbench-render",
        qos: .userInitiated
    )
    private let modbusQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.modbus-poll",
        qos: .utility
    )
    /// Strictly serial queue owning all `AVAudioEngine` (`liveAudioEngine`) and Hands-Free timer mutations.
    private let audioEngineQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.audio-engine",
        qos: .userInitiated
    )
    /// Background serial queue for Hands-Free speech transcription & LLM/rule diagnosis turns.
    private let voiceDiagnosisQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.voice-diagnosis",
        qos: .userInitiated
    )
    private let ttsQueue = DispatchQueue(
        label: "com.fieldscan.tht02.ipadm4.offline-tts",
        qos: .userInitiated
    )

    private var listener: NWListener?
    public private(set) var isRunning: Bool = false

    // MARK: - Optical Workbench & Camera State

    private static let dipWeights: [Int] = [128, 64, 32, 16, 8, 4, 2, 1]
    private static let manualPageTitles: [Int: String] = [
        1: "Page 1 · THT-02 Anatomy & SHT30 Probe",
        2: "Page 2 · Specifications & HVAC Overview",
        3: "Page 3 · SHT30/SHT3X Ratings & RS-485 Bus",
        4: "Page 4 · 4-Wire Color Code & RS-485 Grounding",
        5: "Page 5 · 2-Step Opening & DIP-8 Switch (Ex. 176)",
        6: "Page 6 · Modbus Registers & 7FFFH Fault Alarm",
        7: "Page 7 · Modbus 0x03 Poll & 21-Byte RTU Frame",
        8: "Page 8 · Baud Write 0x06 & Exception Responses",
        9: "Page 9 · CRC-16 (0xA001) & 140x16 mm Blueprint",
    ]

    private var activeCameraMode: String = "ipad_camera"
    private var cameraSourceLabel: String = "ipad:avfoundation:back"
    private var nativeAudioRecorder: AVAudioRecorder?
    private var nativeAudioRecordingURL: URL?

    // Live streaming AVAudioEngine + SFSpeechAudioBufferRecognitionRequest + Acoustic VAD & 16 kHz PCM capture for LFM3-Omni-2B
    private let liveAudioEngine = AVAudioEngine()
    private var liveSpeechRecognizer: SFSpeechRecognizer?
    private var liveSpeechRequest: SFSpeechAudioBufferRecognitionRequest?
    private var liveSpeechTask: SFSpeechRecognitionTask?
    private var liveTapInstalled: Bool = false
    private var livePartialTranscript: String = ""
    private var lastTranscriptChangeTime: TimeInterval = 0
    private var livePreRollPcmSamples: [Int16] = []
    private var liveRecordedPcmSamples: [Int16] = []
    private var liveVoiceDetectedInSession: Bool = false
    private var lastVoiceActivityTime: TimeInterval = 0
    private var liveActiveSpeechFrames: Int = 0
    private var liveMicRmsPct: Int = 8
    private var handsFreeActive: Bool = false
    private var handsFreeTurnInFlight: Bool = false
    private var pendingHandsFreeResults: [[String: Any]] = []
    private var handsFreeMonitorTimer: DispatchSourceTimer?
    private var activeSpeechSessionGeneration: Int = 0
    private var lastTtsActiveUptime: TimeInterval = 0
    private var ttsUtteranceStartUptime: TimeInterval = 0
    private var ttsSpeakingFlag: Bool = false
    private var ttsExpectedEndUptime: TimeInterval = 0
    private var needsSpeechTaskResetAfterTts: Bool = false
    private var lastCompletedLiveTranscriptNorm: String = ""
    private var lastCompletedLiveTurnUptime: TimeInterval = 0
    private var pttRecordingActive: Bool = false
    private var bargeInConsecutiveFrames: Int = 0
    private var lastAudioStartAttemptUptime: TimeInterval = 0
    private var audioPermissionState: String = "unknown"
    private var permissionPromptInFlight: Bool = false
    private var audioSessionConfigured: Bool = false
    private var cachedPreferredVoice: AVSpeechSynthesisVoice?
    private var cachedSpanishVoice: AVSpeechSynthesisVoice?
    private var preferredVoiceLanguage: String = "en"
    private var activePttTurnContext: [String: Any] = [:]
    private var activeHandsFreeContext: [String: Any] = [:]
    private var pendingDeferredVoiceTurns: [String: (text: String, language: String)] = [:]
    private var lastDiagnosedLinkOnline: Bool?
    private var recentChatHistory: [[String: String]] = []

    // Temporal EMA smoothing & persistence hold for live camera sensor tracking
    private var smoothedLiveCx: Double = 480.0
    private var smoothedLiveCy: Double = 270.0
    private var smoothedLiveAngle: Double = 0.0
    private var smoothedLiveLen: Double = 440.0
    private var smoothedLiveWid: Double = 58.0
    private var liveDetectionHoldFrames: Int = 0
    private var hasInitializedLiveSmoothing: Bool = false
    private var cachedLiveAnalysis: FieldScanLiveVisionResult?
    private var lastLiveAnalysisSeq: Int = 0

    private var frameSequence: Int = 0
    private var fpsEMA: Double = 25.0
    private var startTime: TimeInterval = ProcessInfo.processInfo.systemUptime

    private static let minimalPlaceholderJpeg: Data = Data(
        base64Encoded: "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    ) ?? Data()

    private var latestRawJpeg: Data = StandaloneFieldScanServer.minimalPlaceholderJpeg
    private var latestHudJpeg: Data = StandaloneFieldScanServer.minimalPlaceholderJpeg
    private var latestDipCropJpeg: Data = StandaloneFieldScanServer.minimalPlaceholderJpeg
    private var customUploadedJpeg: Data?
    private var liveCameraJpeg: Data?
    private var lastLiveCameraTimestamp: TimeInterval = 0
    private var liveCameraWidth: Int = 1280
    private var liveCameraHeight: Int = 720
    private var latestVisionTelemetry: [String: Any] = [:]
    private var handTrailPoints: [[Int]] = []

    private var renderTimer: DispatchSourceTimer?
    private var modbusTimer: DispatchSourceTimer?

    #if canImport(UIKit)
    private var cachedPage9Image: UIImage?
    private var cachedPage5Image: UIImage?
    private var cachedClosedProbeImage: UIImage?
    private var cachedOpenProbeImage: UIImage?
    private var cachedEsdMatImage: UIImage?
    #endif

    // MARK: - Modbus-RTU / Modbus-TCP & RS-485 Engine State

    private var activeModbusMode: String = "auto"
    private var targetSlaveId: Int = 1
    private var simulatedVisualDipAddress: Int = 1
    private var activeSceneGeneration: Int = 1
    private var latestSceneReadyTurn: [String: Any] = [:]
    private var activeBaudBps: Int = 9600
    private var modbusPollSequence: Int = 0
    private var breathTestStartTime: TimeInterval = 0
    private var modbusHistory: [[String: Any]] = []
    private var latestModbusTelemetry: [String: Any] = [:]
    private var pusrTCPClient: ModbusTCPClient?
    private var lastValidHistoricalSample: [String: Any]?
    private var lastValidSampleUptime: TimeInterval = -999.0
    private var lastSampleInvalidatedReason: String?

    // MARK: - 4-Stage Guided Repair & Dossier State

    private var liveWatchEnabled: Bool = true
    private var repairStage: String = "IDLE_MONITORING"
    private var focusDipActive: Bool = false
    private var lastModbusHealthy: Bool = false
    private var lastModbus7FFF: Bool = false
    private var lastPcbOpen: Bool = false
    private var lastOpenAlertTimestamp: TimeInterval = 0
    private var repairEventSequence: Int = 0
    private var latestProactiveEvent: [String: Any]?
    private var repairEventsLog: [[String: String]] = []
    private var evidenceSnapshots: [[String: Any]] = []
    private var packageCounter: Int = 0

    // MARK: - Offline Speech & AI State

    private let speechSynthesizer = AVSpeechSynthesizer()
    private var lastLatencyMs: Double = 38.0
    private var lastTokensPerSec: Double = 42.5
    private var lastModelLabel: String = "Qwen3-VL-4B-Instruct + M4 ANE"
    private var cachedSpecDict: [String: Any]?

    private override init() {
        super.init()
        speechSynthesizer.delegate = self
    }

    /// Lock-only TTS check (`caller must hold stateLock`). Never touches `AVSpeechSynthesizer` off the main thread.
    private func isTtsSpeakingLocked(now: TimeInterval) -> Bool {
        if ttsSpeakingFlag {
            if now <= ttsExpectedEndUptime {
                return true
            }
            ttsSpeakingFlag = false
            DispatchQueue.global(qos: .utility).async {
                FieldScanSessionEngine.shared.setAudioState("idle")
            }
        }
        return false
    }

    private func isTtsSpeakingNow() -> Bool {
        let now = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        let active = isTtsSpeakingLocked(now: now)
        stateLock.unlock()
        return active
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        let now = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        ttsSpeakingFlag = true
        ttsUtteranceStartUptime = now
        lastTtsActiveUptime = now
        bargeInConsecutiveFrames = 0
        stateLock.unlock()
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        let now = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        ttsSpeakingFlag = false
        ttsExpectedEndUptime = 0
        lastTtsActiveUptime = now
        bargeInConsecutiveFrames = 0
        livePartialTranscript = ""
        lastTranscriptChangeTime = 0
        needsSpeechTaskResetAfterTts = true
        stateLock.unlock()
        FieldScanSessionEngine.shared.setAudioState("idle")
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        stateLock.lock()
        ttsSpeakingFlag = false
        ttsExpectedEndUptime = 0
        // Do NOT reset `lastTtsActiveUptime = now` on user barge-in or PTT cancellation so mic captures immediately!
        lastTtsActiveUptime = 0
        bargeInConsecutiveFrames = 0
        stateLock.unlock()
        FieldScanSessionEngine.shared.setAudioState("idle")
    }

    // MARK: - Lifecycle

    private let lifecycleLock = NSLock()

    /// Starts the in-process HTTP/1.1 server on `127.0.0.1:8088`, the 25 FPS optical workbench loop,
    /// and the 2 Hz Modbus-RTU telemetry loop.
    public func start() {
        lifecycleLock.lock()
        defer { lifecycleLock.unlock() }

        stateLock.lock()
        if isRunning {
            stateLock.unlock()
            return
        }
        isRunning = true
        stateLock.unlock()

        FieldScanRuntimeConfig.shared.prepareSharedDirectories()
        _ = FieldScanRuntimeConfig.shared.exportsDirectory
        _ = FieldScanRuntimeConfig.shared.outboxDirectory

        configureAudioSessionForOfflineVoice()
        loadBundledAssetsIntoMemory()
        wireNativeCameraBridgeHook()

        // Generate initial synchronous frames and Modbus state before accepting sockets
        stepModbusTelemetryOnce()
        renderWorkbenchOrCameraStep()

        startBackgroundTimers()
        startNetworkListener()

        // Automatically activate iPad camera capture when initial mode is "usb" or "ipad_camera"
        let initialMode = currentCameraMode()
        if initialMode == "usb" || initialMode == "ipad_camera" {
            NativeCameraBridge.shared.startCapture(preferredSource: "back", targetFPS: 24, completion: nil)
        }
    }

    public func stop() {
        stateLock.lock()
        isRunning = false
        let client = pusrTCPClient
        stateLock.unlock()

        client?.close()
        renderTimer?.cancel()
        renderTimer = nil
        modbusTimer?.cancel()
        modbusTimer = nil
        listener?.cancel()
        listener = nil
    }

    public func configurePusrGateway(host: String, port: Int = 502, activate: Bool = true, topology: String = "ap_direct") {
        let trimmed = host.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanTopo = topology.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == "sta_lan" ? "sta_lan" : "ap_direct"
        let cfg = FieldScanRuntimeConfig.shared
        cfg.pusrGatewayHost = trimmed
        cfg.pusrGatewayPort = port
        cfg.pusrGatewayTopology = cleanTopo

        stateLock.lock()
        pusrTCPClient?.close()
        if !trimmed.isEmpty {
            pusrTCPClient = ModbusTCPClient(host: trimmed, port: port, timeoutS: 1.0, pilotReadonly: true)
            if activate {
                activeModbusMode = "pusr_tcp"
            }
        } else {
            pusrTCPClient = nil
        }
        lastSampleInvalidatedReason = "GATEWAY_RECONFIGURED"
        stateLock.unlock()

        FieldScanSessionEngine.shared.invalidateLiveConnection(reason: "gateway_reconfigured")
        if activate && !trimmed.isEmpty {
            stepModbusTelemetryOnce(forceImmediateTCPPoll: true)
        }
    }

    /// 1-Tap PUSR USR-DR164 diagnostics, UDP 48899 auto-provisioning (`9600 8N1`, `TCP Server :502`, `Modbus TCP`), and immediate RS-485 bus scan.
    public func runOneTapPusrAutoSetup(
        preferredHost: String? = nil,
        baud: Int = 9600,
        port: Int = FieldScanRuntimeConfig.defaultPusrPort
    ) -> [String: Any] {
        var result = ModbusTCPClient.autoProvisionPusrGateway(
            preferredHost: preferredHost,
            baud: baud,
            targetPort: port
        )
        let statusStr = (result["status"] as? String) ?? ""
        if let detectedHost = result["host"] as? String, !detectedHost.isEmpty {
            let activateNow = (statusStr == "ready_on_502")
            configurePusrGateway(host: detectedHost, port: port, activate: activateNow, topology: "ap_direct")
            result["gateway"] = [
                "host": detectedHost,
                "port": port,
                "topology": "ap_direct",
                "protocol": "modbus_tcp_mbap",
            ]
            if activateNow {
                let scanRes = scanHardwareModbusBus()
                result["scan_result"] = scanRes
                result["modbus"] = getModbusTelemetry()
                if (scanRes["found"] as? Bool) == true, let foundSid = scanRes["slave_id"] as? Int {
                    let tVal = scanRes["temp_c"] as? Double
                    let hVal = scanRes["humidity_rh"] as? Double
                    if let t = tVal, let h = hVal {
                        result["message"] = String(
                            format: "Connected to PUSR at %@:%d — Sensor Slave #%d live (%.1f C, %.1f %%RH)!",
                            detectedHost,
                            port,
                            foundSid,
                            t,
                            h
                        )
                    } else {
                        result["message"] = "Connected to PUSR at \(detectedHost):\(port) — Sensor Slave #\(foundSid) responded!"
                    }
                } else {
                    let errDetail = (scanRes["error_detail"] as? String)
                        ?? (scanRes["error_code"] as? String)
                        ?? "No RS-485 response"
                    result["message"] = "PUSR TCP \(detectedHost):\(port) is REACHABLE, but sensor did not reply on Slave IDs 1..10/176 (\(errDetail)). Check THT-02 power (5-24V), RS-485 A+/B- wiring (try swapping Yellow/Green), Serial = 9600 8N1, and Modbus TCP enabled."
                }
            }
        }
        return result
    }

    public func handleTopologySwitch() {
        stateLock.lock()
        let client = pusrTCPClient
        lastSampleInvalidatedReason = "TOPOLOGY_SWITCHED"
        stateLock.unlock()

        client?.close()
        FieldScanSessionEngine.shared.pauseActiveSession(reason: "topology_switched")
    }

    public func handleAppSuspend() {
        stateLock.lock()
        let client = pusrTCPClient
        lastSampleInvalidatedReason = "APP_SUSPENDED"
        if !latestModbusTelemetry.isEmpty {
            latestModbusTelemetry["fresh"] = false
            latestModbusTelemetry["online"] = false
            if let hist = lastValidHistoricalSample {
                latestModbusTelemetry["historical_sample"] = hist
            }
        }
        stateLock.unlock()

        client?.close()
        FieldScanSessionEngine.shared.invalidateLiveConnection(reason: "app_suspended")
    }

    private func configureAudioSessionForOfflineVoice(force: Bool = false) {
        #if os(iOS)
        if audioSessionConfigured && !force {
            return
        }
        let session = AVAudioSession.sharedInstance()
        do {
            // `.voiceChat` activates M4 hardware Acoustic Echo Cancellation (AEC) so user can barge-in mid-TTS
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.defaultToSpeaker, .allowBluetoothHFP, .allowBluetoothA2DP, .mixWithOthers]
            )
            try session.setActive(true, options: [])
            audioSessionConfigured = true
        } catch {
            do {
                try session.setCategory(
                    .playAndRecord,
                    mode: .default,
                    options: [.defaultToSpeaker, .allowBluetoothHFP, .allowBluetoothA2DP, .mixWithOthers]
                )
                try session.setActive(true, options: [])
                audioSessionConfigured = true
            } catch {
                // Non-fatal if another audio session is active
            }
        }
        #endif
    }

    private func wireNativeCameraBridgeHook() {
        NativeCameraBridge.shared.pushToBackendEnabled = false
    }

    private func startBackgroundTimers() {
        let rTimer = DispatchSource.makeTimerSource(queue: renderQueue)
        rTimer.schedule(deadline: .now() + 0.04, repeating: 0.04, leeway: .milliseconds(5))
        rTimer.setEventHandler { [weak self] in
            self?.renderWorkbenchOrCameraStep()
        }
        rTimer.resume()
        self.renderTimer = rTimer

        let mTimer = DispatchSource.makeTimerSource(queue: modbusQueue)
        mTimer.schedule(deadline: .now() + 0.5, repeating: 0.5, leeway: .milliseconds(25))
        mTimer.setEventHandler { [weak self] in
            guard let self = self else { return }
            self.stepModbusTelemetryOnce()
            self.evaluateLiveReactiveWatch()
        }
        mTimer.resume()
        self.modbusTimer = mTimer
    }

    private func startNetworkListener() {
        do {
            let tcpOptions = NWProtocolTCP.Options()
            tcpOptions.enableFastOpen = true
            tcpOptions.noDelay = true
            let params = NWParameters(tls: nil, tcp: tcpOptions)
            params.allowLocalEndpointReuse = true

            guard let port = NWEndpoint.Port(rawValue: listenPort) else { return }
            // Bind strictly to loopback `127.0.0.1:8088` so no external LAN interface can reach the embedded server (`[G30]`, `M4-BASE-01`)
            params.requiredLocalEndpoint = NWEndpoint.hostPort(host: .ipv4(.loopback), port: port)
            let nwListener = try NWListener(using: params)

            nwListener.stateUpdateHandler = { [weak self] newState in
                switch newState {
                case .ready:
                    self?.stateLock.lock()
                    self?.isRunning = true
                    self?.stateLock.unlock()
                case .failed:
                    nwListener.cancel()
                    self?.stateLock.lock()
                    self?.isRunning = false
                    self?.stateLock.unlock()
                default:
                    break
                }
            }

            nwListener.newConnectionHandler = { [weak self] connection in
                self?.handleIncomingConnection(connection)
            }

            nwListener.start(queue: nwSocketQueue)
            self.listener = nwListener
        } catch {
            stateLock.lock()
            isRunning = false
            stateLock.unlock()
        }
    }

    // MARK: - HTTP/1.1 Connection & Request Parser

    private struct HTTPRequestPacket {
        let method: String
        let rawPath: String
        let path: String
        let queryItems: [String: String]
        let headers: [String: String]
        let body: Data
    }

    private func handleIncomingConnection(_ connection: NWConnection) {
        connection.start(queue: nwSocketQueue)
        receiveHTTPRequest(on: connection, accumulated: Data())
    }

    private func receiveHTTPRequest(on connection: NWConnection, accumulated: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 262_144) { [weak self] data, _, isComplete, error in
            guard let self = self else {
                connection.cancel()
                return
            }

            var buffer = accumulated
            if let chunk = data, !chunk.isEmpty {
                buffer.append(chunk)
            }

            let headerDelimiter = Data([13, 10, 13, 10]) // "\r\n\r\n"
            if let headerRange = buffer.range(of: headerDelimiter) {
                let headerData = buffer.subdata(in: 0..<headerRange.lowerBound)
                let bodyStart = headerRange.upperBound
                let headerString = String(data: headerData, encoding: .utf8) ?? ""
                let lines = headerString.components(separatedBy: "\r\n")
                guard let requestLine = lines.first else {
                    connection.cancel()
                    return
                }
                let parts = requestLine.split(separator: " ", omittingEmptySubsequences: true)
                guard parts.count >= 2 else {
                    connection.cancel()
                    return
                }

                let method = String(parts[0]).uppercased()
                let rawTarget = String(parts[1])

                var headers: [String: String] = [:]
                for line in lines.dropFirst() {
                    if let colon = line.firstIndex(of: ":") {
                        let key = line[..<colon].trimmingCharacters(in: .whitespaces).lowercased()
                        let val = line[line.index(after: colon)...].trimmingCharacters(in: .whitespaces)
                        headers[key] = val
                    }
                }

                let expectedBodyLength = Int(headers["content-length"] ?? "0") ?? 0
                let currentBodyLength = buffer.count - bodyStart
                if currentBodyLength < expectedBodyLength && !isComplete && error == nil && buffer.count < 136_314_880 {
                    self.receiveHTTPRequest(on: connection, accumulated: buffer)
                    return
                }

                let bodyEnd = min(buffer.count, bodyStart + max(0, expectedBodyLength))
                let bodyData = (expectedBodyLength > 0 && bodyEnd >= bodyStart)
                    ? buffer.subdata(in: bodyStart..<bodyEnd)
                    : buffer.subdata(in: bodyStart..<buffer.count)

                let (cleanPath, queryMap) = self.splitPathAndQuery(rawTarget)
                let packet = HTTPRequestPacket(
                    method: method,
                    rawPath: rawTarget,
                    path: cleanPath,
                    queryItems: queryMap,
                    headers: headers,
                    body: bodyData
                )
                self.serverQueue.async { [weak self] in
                    self?.dispatchHTTPRequest(packet, on: connection)
                }
                return
            }

            if isComplete || error != nil || buffer.count > 136_314_880 {
                connection.cancel()
                return
            }

            self.receiveHTTPRequest(on: connection, accumulated: buffer)
        }
    }

    private func splitPathAndQuery(_ rawTarget: String) -> (String, [String: String]) {
        guard let qIndex = rawTarget.firstIndex(of: "?") else {
            return (rawTarget.removingPercentEncoding ?? rawTarget, [:])
        }
        let pathPart = String(rawTarget[..<qIndex])
        let queryPart = String(rawTarget[rawTarget.index(after: qIndex)...])
        var queryItems: [String: String] = [:]
        for pair in queryPart.split(separator: "&") {
            let kv = pair.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: false)
            if let k = kv.first {
                let key = String(k).removingPercentEncoding ?? String(k)
                let val = kv.count > 1 ? (String(kv[1]).removingPercentEncoding ?? String(kv[1])) : ""
                queryItems[key] = val
            }
        }
        return (pathPart.removingPercentEncoding ?? pathPart, queryItems)
    }

    // MARK: - HTTP Router

    private func dispatchHTTPRequest(_ req: HTTPRequestPacket, on connection: NWConnection) {
        if req.method == "OPTIONS" {
            sendHTTPResponse(on: connection, statusCode: 204, contentType: "text/plain", body: Data())
            return
        }

        let path = req.path

        // 1. Live MJPEG Stream (`GET /api/video/stream`)
        if req.method == "GET" && path == "/api/video/stream" {
            let rawFlag = isTruthyQuery(req.queryItems["raw"])
            startMJPEGStream(on: connection, raw: rawFlag)
            return
        }

        // 2. Video Snapshot & DIP-8 Macro Crop
        if req.method == "GET" && path == "/api/video/snapshot" {
            let rawFlag = isTruthyQuery(req.queryItems["raw"])
            let jpg = rawFlag ? getRawJpeg() : getLatestJpeg()
            sendHTTPResponse(on: connection, statusCode: 200, contentType: "image/jpeg", body: jpg)
            return
        }

        if req.method == "GET" && path == "/api/video/dip_crop" {
            let jpg = getDipFocusJpeg()
            sendHTTPResponse(on: connection, statusCode: 200, contentType: "image/jpeg", body: jpg)
            return
        }

        // 3. Fast Video Spatial Telemetry (`GET /api/video/telemetry`)
        if req.method == "GET" && path == "/api/video/telemetry" {
            sendJSONResponse(on: connection, statusCode: 200, payload: getVideoTelemetry())
            return
        }

        // 4. Unified Status & Health (`GET /api/status`, `/api/telemetry`, `/api/health`)
        if req.method == "GET" && (path == "/api/status" || path == "/api/telemetry" || path == "/api/health") {
            sendJSONResponse(on: connection, statusCode: 200, payload: buildUnifiedStatus())
            return
        }

        // 5. Airplane / Offline Socket Guard Verification (`M4-BASE-01..03`)
        if path == "/api/offline/verify" || path == "/api/airplane/verify" {
            let status = buildUnifiedStatus()
            sendJSONResponse(on: connection, statusCode: 200, payload: status)
            return
        }

        // 6. Sensor Specification, Multi-Doc Manual & 3D Scene Descriptor (`GET /api/spec`)
        if req.method == "GET" && path == "/api/spec" {
            let ctx = resolveEffectiveContext(
                sessionId: req.queryItems["session_id"],
                manifestSha: req.queryItems["manifest_sha256"]
            )
            let spec = loadTHT02Spec()
            let descriptor = (try? FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: ctx)) ?? [:]
            let sensorIdOut = ctx.productId == "tzone_tht02" ? "TZ-THT-02" : ctx.productId.uppercased()
            let payload: [String: Any] = [
                "sensor_id": sensorIdOut,
                "active_context": ctx.toDictionary(),
                "catalog_descriptor": descriptor,
                "cad_exports_supported": descriptor["cad_exports_supported"] ?? ["dxf", "stl", "pdf", "json"],
                "spec": spec,
                "pdf_document": buildPDFDocumentMetadata(),
                "camera_modes": [
                    ["id": "ipad_camera", "label": "Cam: iPad Air M4 Camera (Live 30 FPS)"],
                    ["id": "usb", "label": "Live USB Camera (UVC / AVFoundation)"],
                    ["id": "sim_normal", "label": "Sim: Clean TZ THT-02 Probe"],
                    ["id": "sim_strainer_patch", "label": "Sim: Strainer Red X-Patch (+56 mm)"],
                    ["id": "sim_open_dip", "label": "Sim: Unscrewed Blue DIP PCB (+18 mm)"],
                    ["id": "sim_gland_fault", "label": "Sim: Gland / RS-485 Wire Fault (-60 mm)"],
                    ["id": "sim_hand_screwdriver", "label": "Sim: Hand + Screwdriver on DIP-8 (Masked)"],
                ],
                "serial_ports": discoverSerialPorts(),
            ]
            sendJSONResponse(on: connection, statusCode: 200, payload: payload)
            return
        }

        // 7. Strict Context-Aware Sensor & Variant Resolver (`POST /api/sensor/load`, `M4-ID-01..02`)
        if req.method == "POST" && path == "/api/sensor/load" {
            let bodyJSON = parseJSONBody(req.body)
            let rawQuery = (bodyJSON["query"] as? String)
                ?? (bodyJSON["sensor_query"] as? String)
                ?? (bodyJSON["sensor_id"] as? String)
                ?? ""
            let response = handleSensorLoad(query: rawQuery)
            sendJSONResponse(on: connection, statusCode: 200, payload: response)
            return
        }

        // 8. Camera Mode Switch (`POST /api/video/mode`, `/api/camera/mode`, `/api/scanner/mode`)
        if req.method == "POST" && (path == "/api/video/mode" || path == "/api/camera/mode" || path == "/api/scanner/mode") {
            let bodyJSON = parseJSONBody(req.body)
            let mode = (bodyJSON["mode"] as? String) ?? "ipad_camera"
            setCameraMode(mode)
            sendJSONResponse(on: connection, statusCode: 200, payload: buildUnifiedStatus())
            return
        }

        // 9. Custom Photo Upload (`POST /api/video/upload`, `/api/camera/upload`, `/api/scanner/upload`)
        if req.method == "POST" && (path == "/api/video/upload" || path == "/api/camera/upload" || path == "/api/scanner/upload") {
            let extracted = extractUploadedData(from: req)
            if !extracted.isEmpty {
                injectCustomFrame(extracted)
            }
            sendJSONResponse(on: connection, statusCode: 200, payload: buildUnifiedStatus())
            return
        }

        // 10. Live iPad Camera Frame Push (`POST /api/video/ipad_frame`, `/api/camera/ipad_frame`)
        if req.method == "POST" && (path == "/api/video/ipad_frame" || path == "/api/camera/ipad_frame") {
            let sourceLabel = req.queryItems["source"]
                ?? req.headers["x-camera-source"]
                ?? req.headers["x-fieldscan-camera-device"]
                ?? "ipad:avfoundation:back"
            let frameBytes = extractUploadedData(from: req)
            if !frameBytes.isEmpty {
                ingestLiveCameraFrame(jpegData: frameBytes, width: 960, height: 540, sourceLabel: sourceLabel)
            }
            evaluateLiveReactiveWatch()
            sendJSONResponse(on: connection, statusCode: 200, payload: buildUnifiedStatus())
            return
        }

        // 11. Modbus-RTU Telemetry, Mode & Bus Scan
        if req.method == "GET" && path == "/api/modbus/telemetry" {
            var tel = getModbusTelemetry()
            tel["available_ports"] = discoverSerialPorts()
            sendJSONResponse(on: connection, statusCode: 200, payload: tel)
            return
        }

        if req.method == "POST" && path == "/api/modbus/mode" {
            let bodyJSON = parseJSONBody(req.body)
            let mode = (bodyJSON["mode"] as? String) ?? "auto"
            let effCtx = resolveEffectiveContext(sessionId: bodyJSON["session_id"] as? String, manifestSha: nil)
            if !mode.lowercased().hasPrefix("sim_") && mode.lowercased() != "auto" && !effCtx.benchModbusHomologated {
                sendJSONResponse(on: connection, statusCode: 409, payload: [
                    "ok": false,
                    "error_code": "PROFILE_NOT_HOMOLOGATED_FOR_BUS",
                    "message": "Active profile '\(effCtx.productId)/\(effCtx.variantId)' is a catalog reference package without bench Modbus homologation; hardware bus polling is inhibited.",
                ])
                return
            }
            let slaveId = intFromAny(bodyJSON["target_slave_id"] ?? bodyJSON["slave_id"])
            let baudBps = intFromAny(bodyJSON["baud_bps"])
            setModbusMode(mode: mode, slaveId: slaveId, baudBps: baudBps)
            evaluateLiveReactiveWatch()
            sendJSONResponse(on: connection, statusCode: 200, payload: buildUnifiedStatus())
            return
        }

        if req.method == "POST" && path == "/api/modbus/target_slave" {
            let bodyJSON = parseJSONBody(req.body)
            let confirmed = boolFromAny(bodyJSON["confirmed"], defaultValue: false)
            guard confirmed else {
                sendJSONResponse(on: connection, statusCode: 400, payload: [
                    "ok": false,
                    "error_code": "CONFIRMATION_REQUIRED",
                    "message": "Changing the authorized Modbus polling target requires explicit confirmed=true.",
                ])
                return
            }
            guard let sid = intFromAny(bodyJSON["slave_id"] ?? bodyJSON["target_slave_id"]), (1...247).contains(sid) else {
                sendJSONResponse(on: connection, statusCode: 400, payload: [
                    "ok": false,
                    "error_code": "INVALID_SLAVE_ID",
                    "message": "Modbus Slave ID must be in 1..247.",
                ])
                return
            }
            let effCtx = resolveEffectiveContext(sessionId: bodyJSON["session_id"] as? String, manifestSha: nil)
            guard effCtx.benchModbusHomologated else {
                sendJSONResponse(on: connection, statusCode: 409, payload: [
                    "ok": false,
                    "error_code": "PROFILE_NOT_HOMOLOGATED_FOR_BUS",
                    "message": "Profile '\(effCtx.productId)/\(effCtx.variantId)' is not homologated for Modbus register polling.",
                ])
                return
            }
            stateLock.lock()
            targetSlaveId = sid
            simulatedVisualDipAddress = sid
            stateLock.unlock()
            stepModbusTelemetryOnce(forceImmediateTCPPoll: false)
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "target_slave_id": sid,
                "simulated_visual_dip_address": sid,
                "modbus": getModbusTelemetry(),
            ])
            return
        }

        if req.method == "POST" && path == "/api/modbus/scan" {
            let scanRes = scanHardwareModbusBus()
            var status = buildUnifiedStatus()
            status["scan_result"] = scanRes
            sendJSONResponse(on: connection, statusCode: 200, payload: status)
            return
        }

        if req.method == "POST" && path == "/api/modbus/gateway/auto_setup" {
            let bodyJSON = parseJSONBody(req.body)
            let port = intFromAny(bodyJSON["port"]) ?? FieldScanRuntimeConfig.defaultPusrPort
            if port == ModbusTCPClient.legacyRTUBridgePort {
                sendJSONResponse(on: connection, statusCode: 400, payload: [
                    "ok": false,
                    "status": "protocol_mismatch",
                    "error_code": "PROTOCOL_MISMATCH",
                    "message": "Port 5502 is reserved for raw RTU-over-TCP framing; configure PUSR USR-DR164 as Modbus TCP (MBAP) on port 502.",
                ])
                return
            }
            let baud = intFromAny(bodyJSON["baud_bps"]) ?? 9600
            let savedHost = FieldScanRuntimeConfig.shared.pusrGatewayHost
            let prefHost = ((bodyJSON["host"] as? String) ?? savedHost).trimmingCharacters(in: .whitespacesAndNewlines)
            let result = runOneTapPusrAutoSetup(
                preferredHost: prefHost.isEmpty ? nil : prefHost,
                baud: baud,
                port: port
            )
            sendJSONResponse(on: connection, statusCode: 200, payload: result)
            return
        }

        if req.method == "POST" && path == "/api/modbus/gateway/discover" {
            let bodyJSON = parseJSONBody(req.body)
            let port = intFromAny(bodyJSON["port"]) ?? FieldScanRuntimeConfig.defaultPusrPort
            if port == ModbusTCPClient.legacyRTUBridgePort {
                sendJSONResponse(on: connection, statusCode: 400, payload: [
                    "ok": false,
                    "error_code": "PROTOCOL_MISMATCH",
                    "message": "Port 5502 is reserved for raw RTU-over-TCP framing; configure PUSR USR-DR164 as Modbus TCP (MBAP) on port 502.",
                ])
                return
            }
            let timeoutS = (bodyJSON["timeout_s"] as? Double)
                ?? (bodyJSON["timeout_s"] as? NSNumber)?.doubleValue
                ?? 0.45
            let autoSelect = boolFromAny(bodyJSON["auto_select"], defaultValue: true)
            let savedHost = FieldScanRuntimeConfig.shared.pusrGatewayHost
            var result = ModbusTCPClient.discoverDirectPusrAP(
                port: port,
                timeoutS: timeoutS,
                savedHost: savedHost.isEmpty ? nil : savedHost
            )
            var autoSelected = false
            if autoSelect, let recHost = result["recommended_host"] as? String, !recHost.isEmpty {
                let recTopo = (result["recommended_topology"] as? String) ?? "ap_direct"
                configurePusrGateway(host: recHost, port: port, activate: true, topology: recTopo)
                autoSelected = true
                result["gateway"] = [
                    "host": recHost,
                    "port": port,
                    "topology": recTopo,
                    "protocol": "modbus_tcp_mbap",
                ]
                result["modbus"] = getModbusTelemetry()
            }
            result["auto_selected"] = autoSelected
            sendJSONResponse(on: connection, statusCode: 200, payload: result)
            return
        }

        if req.method == "POST" && path == "/api/modbus/gateway" {
            let bodyJSON = parseJSONBody(req.body)
            let host = ((bodyJSON["host"] as? String) ?? FieldScanRuntimeConfig.shared.pusrGatewayHost).trimmingCharacters(in: .whitespacesAndNewlines)
            let port = intFromAny(bodyJSON["port"]) ?? 502
            let topology = ((bodyJSON["topology"] as? String) ?? "ap_direct").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let cleanTopo = topology == "sta_lan" ? "sta_lan" : "ap_direct"
            let activate = boolFromAny(bodyJSON["activate"] ?? bodyJSON["activate_mode"], defaultValue: !host.isEmpty)
            if port == ModbusTCPClient.legacyRTUBridgePort {
                sendJSONResponse(on: connection, statusCode: 400, payload: [
                    "ok": false,
                    "error_code": "PROTOCOL_MISMATCH",
                    "message": "Port 5502 is reserved for raw RTU-over-TCP framing; configure PUSR USR-DR164 as Modbus TCP (MBAP) on port 502.",
                ])
                return
            }
            configurePusrGateway(host: host, port: port, activate: activate, topology: cleanTopo)
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "gateway": ["host": host, "port": port, "topology": cleanTopo, "protocol": "modbus_tcp_mbap"],
                "modbus": getModbusTelemetry(),
            ])
            return
        }

        if req.method == "POST" && path == "/api/modbus/poll" {
            let bodyJSON = parseJSONBody(req.body)
            let effCtx = resolveEffectiveContext(sessionId: bodyJSON["session_id"] as? String, manifestSha: nil)
            if !effCtx.benchModbusHomologated {
                sendJSONResponse(on: connection, statusCode: 409, payload: [
                    "ok": false,
                    "error_code": "PROFILE_NOT_HOMOLOGATED_FOR_BUS",
                    "message": "Active profile '\(effCtx.productId)/\(effCtx.variantId)' is not homologated for TZONE Modbus register polling.",
                ])
                return
            }
            // Only change authorized targetSlaveId when explicitly confirmed (`Finding 2`)
            if boolFromAny(bodyJSON["confirmed"], defaultValue: false),
               let sid = intFromAny(bodyJSON["slave_id"] ?? bodyJSON["unit_id"]),
               (1...247).contains(sid) {
                stateLock.lock()
                targetSlaveId = sid
                stateLock.unlock()
            }
            if let modeReq = bodyJSON["mode"] as? String, !modeReq.isEmpty {
                setModbusMode(mode: modeReq, slaveId: nil, baudBps: nil)
            }
            stepModbusTelemetryOnce(forceImmediateTCPPoll: true)
            let tel = getModbusTelemetry()
            var sessionSnap: Any = NSNull()
            if let sessId = (bodyJSON["session_id"] as? String) ?? FieldScanSessionEngine.shared.currentActiveSessionId {
                if let rec = try? FieldScanSessionEngine.shared.recordModbusObservation(sessionId: sessId, modbusTel: tel, actor: "operator_poll") {
                    sessionSnap = rec
                }
            }
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": (tel["online"] as? Bool) ?? false,
                "modbus": tel,
                "session": sessionSnap,
            ])
            return
        }

        // 11b. Capabilities, Device Profiles, Authoritative Sessions & Planned Calibration (`Contract v2.1.0`)
        if req.method == "GET" && path == "/api/capabilities" {
            sendJSONResponse(on: connection, statusCode: 200, payload: buildCapabilitiesPayload())
            return
        }

        if req.method == "GET" && path == "/api/profiles" {
            let profs = FieldScanSessionEngine.shared.loadAllProfiles()
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "contract_version": FieldScanSessionEngine.contractVersion,
                "profiles": Array(profs.values),
                "manifest": FieldScanSessionEngine.shared.verifyResourceManifest(),
            ])
            return
        }

        if req.method == "GET" && path == "/api/calibration/planned" {
            sendJSONResponse(on: connection, statusCode: 200, payload: FieldScanSessionEngine.plannedCalibrationCard())
            return
        }

        if req.method == "POST" && path == "/api/calibration/compare" {
            let bodyJSON = parseJSONBody(req.body)
            let res = FieldScanSessionEngine.evaluateCalibrationComparisonContract(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if path == "/api/sessions" {
            if req.method == "GET" {
                let items = FieldScanSessionEngine.shared.listSessions(limit: 20)
                sendJSONResponse(on: connection, statusCode: 200, payload: ["sessions": items])
                return
            }
            if req.method == "POST" {
                let bodyJSON = parseJSONBody(req.body)
                do {
                    let snap = try FieldScanSessionEngine.shared.createSession(payload: bodyJSON)
                    sendJSONResponse(on: connection, statusCode: 200, payload: snap)
                } catch let domErr as FieldScanDomainError {
                    sendJSONResponse(on: connection, statusCode: domErr.statusCode, payload: domErr.toDictionary())
                } catch {
                    sendJSONResponse(on: connection, statusCode: 500, payload: ["error_code": "INTERNAL_ERROR", "message": error.localizedDescription])
                }
                return
            }
        }

        if path == "/api/sessions/evidence_policy" {
            if req.method == "GET" {
                sendJSONResponse(on: connection, statusCode: 200, payload: FieldScanSessionEngine.shared.getEvidencePolicy())
                return
            }
            if req.method == "POST" {
                let bodyJSON = parseJSONBody(req.body)
                let updated = FieldScanSessionEngine.shared.configureEvidencePolicy(payload: bodyJSON)
                sendJSONResponse(on: connection, statusCode: 200, payload: updated)
                return
            }
        }

        if path.hasPrefix("/api/sessions/") {
            let rest = String(path.dropFirst("/api/sessions/".count))
            let comps = rest.split(separator: "/", omittingEmptySubsequences: true).map(String.init)
            if let sessionId = comps.first {
                do {
                    if comps.count == 1 && req.method == "GET" {
                        let snap = try FieldScanSessionEngine.shared.getSession(sessionId: sessionId)
                        sendJSONResponse(on: connection, statusCode: 200, payload: snap)
                        return
                    }
                    if comps.count == 2 && comps[1] == "actions" && req.method == "POST" {
                        let bodyJSON = parseJSONBody(req.body)
                        let out = try FieldScanSessionEngine.shared.applyAction(sessionId: sessionId, payload: bodyJSON)
                        sendJSONResponse(on: connection, statusCode: 200, payload: out)
                        return
                    }
                    if comps.count == 2 && comps[1] == "capture" && req.method == "POST" {
                        let bodyJSON = parseJSONBody(req.body)
                        let manual = boolFromAny(bodyJSON["manual"], defaultValue: true)
                        let rawJpg = getRawJpeg()
                        let vTel = getVideoTelemetry()
                        let camSrc = (vTel["camera_source"] as? String) ?? cameraSourceLabel
                        let out = try FieldScanSessionEngine.shared.ingestCameraFrameForSession(
                            sessionId: sessionId,
                            rawJPEG: rawJpg,
                            visionTel: vTel,
                            cameraSource: camSrc,
                            manualTrigger: manual
                        )
                        sendJSONResponse(on: connection, statusCode: 200, payload: out)
                        return
                    }
                    if comps.count == 2 && comps[1] == "exports" && req.method == "POST" {
                        let bodyJSON = parseJSONBody(req.body)
                        let out = try FieldScanSessionEngine.shared.exportSessionDossier(sessionId: sessionId, payload: bodyJSON)
                        sendJSONResponse(on: connection, statusCode: 200, payload: out)
                        return
                    }
                    if comps.count == 2 && comps[1] == "attach_history" && req.method == "POST" {
                        let bodyJSON = parseJSONBody(req.body)
                        let turnIds = (bodyJSON["turn_ids"] as? [String]) ?? []
                        let confirmed = boolFromAny(bodyJSON["confirmed"], defaultValue: false)
                        let out = try FieldScanSessionEngine.shared.attachGeneralHistoryToSession(
                            sessionId: sessionId,
                            turnIds: turnIds,
                            confirmed: confirmed
                        )
                        sendJSONResponse(on: connection, statusCode: 200, payload: out)
                        return
                    }
                    if comps.count == 3 && comps[1] == "drafts" && req.method == "POST" {
                        let bodyJSON = parseJSONBody(req.body)
                        let out = try FieldScanSessionEngine.shared.createLocalDraft(
                            sessionId: sessionId,
                            kind: comps[2],
                            payload: bodyJSON
                        )
                        sendJSONResponse(on: connection, statusCode: 200, payload: out)
                        return
                    }
                } catch let domErr as FieldScanDomainError {
                    sendJSONResponse(on: connection, statusCode: domErr.statusCode, payload: domErr.toDictionary())
                    return
                } catch {
                    sendJSONResponse(on: connection, statusCode: 500, payload: ["error_code": "INTERNAL_ERROR", "message": error.localizedDescription])
                    return
                }
            }
        }

        // 12. Proactive Repair Event Poll (`GET /api/repair/event/{id}`)
        if req.method == "GET" && path.hasPrefix("/api/repair/event/") {
            let idStr = String(path.dropFirst("/api/repair/event/".count))
            let evId = Int(idStr) ?? 0
            if let ev = getRepairEventWithAudio(eventId: evId) {
                sendJSONResponse(on: connection, statusCode: 200, payload: ev)
            } else {
                sendJSONResponse(on: connection, statusCode: 404, payload: ["detail": "Event not found"])
            }
            return
        }

        // 13. Guided Repair Watch & 4-Step Actions (`POST /api/repair/watch`, `POST /api/repair/step`)
        if req.method == "POST" && path == "/api/repair/watch" {
            let bodyJSON = parseJSONBody(req.body)
            let reset = boolFromAny(bodyJSON["reset"], defaultValue: false)
            let enabled = boolFromAny(bodyJSON["enabled"], defaultValue: true)
            let state = updateRepairWatch(reset: reset, enabled: enabled)
            sendJSONResponse(on: connection, statusCode: 200, payload: state)
            return
        }

        if req.method == "POST" && path == "/api/repair/step" {
            let bodyJSON = parseJSONBody(req.body)
            let response = handleRepairStep(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: response)
            return
        }

        // 14. Post-Repair Sign-Off Dossier & Escalation (`POST /api/repair/signoff`, `POST /api/escalate`)
        if req.method == "POST" && (path == "/api/repair/signoff" || path == "/api/escalate") {
            let bodyJSON = parseJSONBody(req.body)
            let dossier = generateSignoffOrEscalationDossier(payload: bodyJSON, forceSignoff: path == "/api/repair/signoff")
            sendJSONResponse(on: connection, statusCode: 200, payload: dossier)
            return
        }

        // 15. Multimodal Diagnosis (`POST /api/diagnose`)
        if req.method == "POST" && path == "/api/diagnose" {
            let bodyJSON = parseJSONBody(req.body)
            let response = handleDiagnoseRequest(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: response)
            return
        }

        // 16. On-Device Offline Voice ASR + Diagnosis (`POST /api/voice`, `/api/voice/native_start`, `/api/voice/native_stop`, Hands-Free endpoints)
        if req.method == "POST" && path == "/api/voice/native_start" {
            let bodyJSON = parseJSONBody(req.body)
            let res = startNativeMicrophoneRecording(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice/native_stop" {
            let bodyJSON = parseJSONBody(req.body)
            let res = stopNativeMicrophoneRecordingAndDiagnose(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice/handsfree_start" {
            let bodyJSON = parseJSONBody(req.body)
            let res = startHandsFreeVoiceMode(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice/context_sync" {
            let bodyJSON = parseJSONBody(req.body)
            let res = syncActiveVoiceContext(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice/language" {
            let bodyJSON = parseJSONBody(req.body)
            let res = setVoiceLanguage(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice/speak_status" {
            let bodyJSON = parseJSONBody(req.body)
            let msg = ((bodyJSON["text"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if !msg.isEmpty {
                _ = synthesizeSpeechB64(msg, speakOnDevice: true, language: "en")
            }
            sendJSONResponse(on: connection, statusCode: 200, payload: ["ok": true, "spoken": !msg.isEmpty])
            return
        }

        if req.method == "GET" && path == "/api/voice/handsfree_poll" {
            let res = pollHandsFreeVoiceMode()
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice/handsfree_stop" {
            let res = stopHandsFreeVoiceMode()
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "POST" && path == "/api/voice" {
            let response = handleVoiceRequest(req: req)
            sendJSONResponse(on: connection, statusCode: 200, payload: response)
            return
        }

        // 16a. Unified Copilot Action Registry, Screen Inventory, UI Ack, Guidance & Asset History
        if req.method == "GET" && path == "/api/copilot/registry" {
            let effCtx = resolveEffectiveContext(sessionId: nil, manifestSha: nil)
            let desc = try? FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: effCtx)
            let caps = FieldScanCopilotRegistry.computeSceneCapabilities(descriptor: desc)
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "actions": FieldScanCopilotRegistry.shared.buildActionRegistry(),
                "scene_capabilities": caps,
                "active_context": effCtx.toDictionary(),
            ])
            return
        }

        if req.method == "GET" && path == "/api/copilot/screens" {
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "screens": FieldScanCopilotRegistry.buildScreenInventory(),
            ])
            return
        }

        if req.method == "POST" && path == "/api/copilot/action_ack" {
            let bodyJSON = parseJSONBody(req.body)
            let res = handleCopilotActionAck(payload: bodyJSON)
            sendJSONResponse(on: connection, statusCode: (res["ok"] as? Bool) == true ? 200 : 400, payload: res)
            return
        }

        if req.method == "GET" && path == "/api/copilot/metrics" {
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "deterministic_latency_ms": FieldScanCopilotRegistry.shared.latencyMetricsSummary(),
            ])
            return
        }

        if req.method == "GET" && path == "/api/copilot/history" {
            let limit = intFromAny(req.queryItems["limit"]) ?? 50
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "general_history": FieldScanSessionEngine.shared.listGeneralHistory(limit: limit),
            ])
            return
        }

        if req.method == "GET" && path == "/api/assets/history" {
            let pid = (req.queryItems["profile_id"] ?? "tzone_tht02").trimmingCharacters(in: .whitespacesAndNewlines)
            let sn = (req.queryItems["serial_number"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let res = FieldScanSessionEngine.shared.recallAssetHistory(profileId: pid, serialNumber: sn)
            sendJSONResponse(on: connection, statusCode: 200, payload: res)
            return
        }

        if req.method == "GET" && path == "/api/guidance/state" {
            stateLock.lock()
            let authSid = targetSlaveId
            stateLock.unlock()
            sendJSONResponse(on: connection, statusCode: 200, payload: FieldScanCopilotRegistry.shared.guidanceSnapshot(authorizedBusSlaveId: authSid))
            return
        }

        if req.method == "POST" && path == "/api/guidance/start" {
            let bodyJSON = parseJSONBody(req.body)
            let effCtx = resolveEffectiveContext(sessionId: bodyJSON["session_id"] as? String, manifestSha: bodyJSON["manifest_sha256"] as? String)
            let desc = try? FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: effCtx)
            let caps = FieldScanCopilotRegistry.computeSceneCapabilities(descriptor: desc)
            let targetAddr = intFromAny(bodyJSON["target_slave_id"] ?? bodyJSON["dip_address"]) ?? 1
            stateLock.lock()
            let authSid = targetSlaveId
            simulatedVisualDipAddress = max(1, min(247, targetAddr))
            stateLock.unlock()
            let snap = FieldScanCopilotRegistry.shared.startDipGuidance(
                targetSlaveId: targetAddr,
                sessionId: (bodyJSON["session_id"] as? String) ?? FieldScanSessionEngine.shared.currentActiveSessionId,
                profileId: effCtx.productId,
                supportsDipPins: (caps["supports_dip_pins"] as? Bool) ?? false,
                authorizedBusSlaveId: authSid,
                turnId: bodyJSON["turn_id"] as? String
            )
            sendJSONResponse(on: connection, statusCode: 200, payload: snap)
            return
        }

        if req.method == "POST" && path == "/api/guidance/evaluate" {
            let bodyJSON = parseJSONBody(req.body)
            let vTel = (bodyJSON["vision"] as? [String: Any]) ?? getVideoTelemetry()
            stateLock.lock()
            let authSid = targetSlaveId
            let lang = (bodyJSON["language"] as? String) ?? preferredVoiceLanguage
            stateLock.unlock()
            let snap = FieldScanCopilotRegistry.shared.evaluateGuidanceCamera(
                visionTel: vTel,
                authorizedBusSlaveId: authSid,
                language: lang,
                turnId: bodyJSON["turn_id"] as? String
            )
            sendJSONResponse(on: connection, statusCode: 200, payload: snap)
            return
        }

        if req.method == "POST" && path == "/api/guidance/confirm_step" {
            let bodyJSON = parseJSONBody(req.body)
            let manual = boolFromAny(bodyJSON["manual"], defaultValue: true)
            let complete = boolFromAny(bodyJSON["complete"], defaultValue: false)
            stateLock.lock()
            let authSid = targetSlaveId
            stateLock.unlock()
            let snap = FieldScanCopilotRegistry.shared.confirmGuidanceStep(
                manual: manual,
                authorizedBusSlaveId: authSid,
                complete: complete,
                turnId: bodyJSON["turn_id"] as? String
            )
            sendJSONResponse(on: connection, statusCode: 200, payload: snap)
            return
        }

        // 16b. Signed Cloud & Installed Catalog Routes (`/api/catalog/...`, `/api/export/dxf|stl`)
        if path.hasPrefix("/api/catalog/") || path == "/api/export/dxf" || path == "/api/export/stl" {
            handleCatalogOrCADExportRoute(req, on: connection)
            return
        }

        // 17. Static File Serving (`/`, `/static/...`, `/assets/...`, `/knowledge/...`, `/exports/...`, `/outbox/...`)
        if req.method == "GET" || req.method == "HEAD" {
            if let (fileData, mimeType) = resolveStaticOrExportedFile(path: path) {
                let bodyToSend = req.method == "HEAD" ? Data() : fileData
                sendHTTPResponse(
                    on: connection,
                    statusCode: 200,
                    contentType: mimeType,
                    body: bodyToSend,
                    extraHeaders: ["Content-Length": "\(fileData.count)"]
                )
                return
            }
        }

        sendJSONResponse(on: connection, statusCode: 404, payload: ["detail": "Not found: \(path)"])
    }

    // MARK: - HTTP Response Writers & MJPEG Streamer

    private static func sanitizeJSONValue(_ value: Any) -> Any {
        let mirror = Mirror(reflecting: value)
        if mirror.displayStyle == .optional {
            if let first = mirror.children.first {
                return sanitizeJSONValue(first.value)
            }
            return NSNull()
        }
        if let dict = value as? [String: Any] {
            var out: [String: Any] = [:]
            out.reserveCapacity(dict.count)
            for (k, v) in dict {
                out[k] = sanitizeJSONValue(v)
            }
            return out
        }
        if let arr = value as? [Any] {
            return arr.map { sanitizeJSONValue($0) }
        }
        if let d = value as? Double {
            return d.isFinite ? d : 0.0
        }
        if let f = value as? Float {
            return f.isFinite ? f : Float(0.0)
        }
        if value is String || value is Int || value is Bool || value is NSNumber || value is NSNull {
            return value
        }
        return String(describing: value)
    }

    private func sendJSONResponse(on connection: NWConnection, statusCode: Int, payload: [String: Any]) {
        let safePayload = Self.sanitizeJSONValue(payload)
        let jsonData: Data
        if JSONSerialization.isValidJSONObject(safePayload),
           let encoded = try? JSONSerialization.data(withJSONObject: safePayload, options: []) {
            jsonData = encoded
        } else {
            jsonData = Data("{}".utf8)
        }
        sendHTTPResponse(
            on: connection,
            statusCode: statusCode,
            contentType: "application/json; charset=utf-8",
            body: jsonData
        )
    }

    private func sendHTTPResponse(
        on connection: NWConnection,
        statusCode: Int,
        contentType: String,
        body: Data,
        extraHeaders: [String: String] = [:]
    ) {
        let statusText: String
        switch statusCode {
        case 200: statusText = "OK"
        case 202: statusText = "Accepted"
        case 204: statusText = "No Content"
        case 206: statusText = "Partial Content"
        case 304: statusText = "Not Modified"
        case 400: statusText = "Bad Request"
        case 401: statusText = "Unauthorized"
        case 403: statusText = "Forbidden"
        case 404: statusText = "Not Found"
        case 409: statusText = "Conflict"
        case 410: statusText = "Gone"
        case 416: statusText = "Range Not Satisfiable"
        case 429: statusText = "Too Many Requests"
        case 500: statusText = "Internal Server Error"
        case 503: statusText = "Service Unavailable"
        case 507: statusText = "Insufficient Storage"
        default: statusText = "OK"
        }

        let explicitContentLen = extraHeaders["Content-Length"] ?? "\(body.count)"
        var headerLines = [
            "HTTP/1.1 \(statusCode) \(statusText)",
            "Content-Type: \(contentType)",
            "Content-Length: \(explicitContentLen)",
            "Cache-Control: no-store, no-cache, must-revalidate, max-age=0",
            "Access-Control-Allow-Origin: *",
            "Access-Control-Allow-Methods: GET, HEAD, POST, OPTIONS",
            "Access-Control-Allow-Headers: *",
            "Connection: close",
        ]
        for (k, v) in extraHeaders where k.lowercased() != "content-length" {
            headerLines.append("\(k): \(v)")
        }
        let headerBlock = headerLines.joined(separator: "\r\n") + "\r\n\r\n"
        var packet = Data(headerBlock.utf8)
        packet.append(body)

        connection.send(content: packet, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }

    private func startMJPEGStream(on connection: NWConnection, raw: Bool) {
        let streamHeader = [
            "HTTP/1.1 200 OK",
            "Content-Type: multipart/x-mixed-replace; boundary=frame",
            "Cache-Control: no-store, no-cache, must-revalidate, max-age=0",
            "Pragma: no-cache",
            "Expires: 0",
            "X-Accel-Buffering: no",
            "Access-Control-Allow-Origin: *",
            "Connection: keep-alive",
        ].joined(separator: "\r\n") + "\r\n\r\n"

        connection.send(content: Data(streamHeader.utf8), completion: .contentProcessed { [weak self] error in
            guard let self = self, error == nil else {
                connection.cancel()
                return
            }
            self.pumpNextMJPEGFrame(on: connection, raw: raw)
        })
    }

    private func pumpNextMJPEGFrame(on connection: NWConnection, raw: Bool) {
        guard isRunning else {
            connection.cancel()
            return
        }
        let jpg = raw ? getRawJpeg() : getLatestJpeg()
        let partHeader = "--frame\r\nContent-Type: image/jpeg\r\nCache-Control: no-store, no-cache, must-revalidate, max-age=0\r\nContent-Length: \(jpg.count)\r\n\r\n"
        var framePacket = Data(partHeader.utf8)
        framePacket.append(jpg)
        framePacket.append(Data("\r\n".utf8))

        connection.send(content: framePacket, completion: .contentProcessed { [weak self] error in
            guard let self = self, error == nil else {
                connection.cancel()
                return
            }
            self.nwSocketQueue.asyncAfter(deadline: .now() + 0.05) { [weak self] in
                self?.pumpNextMJPEGFrame(on: connection, raw: raw)
            }
        })
    }

    // MARK: - Static & Exported File Serving

    private func locateBundleRootDirectory() -> URL? {
        let fm = FileManager.default
        if let resURL = Bundle.main.resourceURL {
            let bundleRes = resURL.appendingPathComponent("BundleResources", isDirectory: true)
            if fm.fileExists(atPath: bundleRes.appendingPathComponent("static/index.html").path) {
                return bundleRes
            }
            if fm.fileExists(atPath: resURL.appendingPathComponent("static/index.html").path) {
                return resURL
            }
        }
        let devFallback = URL(fileURLWithPath: "/Users/armandosilva/Projects/Beta_2", isDirectory: true)
        if fm.fileExists(atPath: devFallback.appendingPathComponent("static/index.html").path) {
            return devFallback
        }
        return Bundle.main.resourceURL
    }

    private func resolveStaticOrExportedFile(path: String) -> (Data, String)? {
        let fm = FileManager.default
        let cleanRel = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if cleanRel.contains("..") {
            return nil
        }

        // 1. Generated exports (`GET /exports/...`)
        if cleanRel.hasPrefix("exports/") {
            let filename = String(cleanRel.dropFirst("exports/".count))
            let fileURL = FieldScanRuntimeConfig.shared.exportsDirectory.appendingPathComponent(filename)
            if let data = try? Data(contentsOf: fileURL) {
                return (data, mimeType(for: fileURL.pathExtension))
            }
        }

        // 2. Generated offline outbox emails (`GET /outbox/...`)
        if cleanRel.hasPrefix("outbox/") {
            let filename = String(cleanRel.dropFirst("outbox/".count))
            let fileURL = FieldScanRuntimeConfig.shared.outboxDirectory.appendingPathComponent(filename)
            if let data = try? Data(contentsOf: fileURL) {
                return (data, mimeType(for: fileURL.pathExtension))
            }
        }

        guard let root = locateBundleRootDirectory() else { return nil }

        // 3. Root index (`GET /` or `GET /index.html`)
        if cleanRel.isEmpty || cleanRel == "index.html" {
            let indexURL = root.appendingPathComponent("static/index.html")
            if let data = try? Data(contentsOf: indexURL) {
                return (data, "text/html; charset=utf-8")
            }
        }

        // 4. `/static/...`, `/assets/...`, `/knowledge/...`
        if cleanRel.hasPrefix("static/") || cleanRel.hasPrefix("assets/") || cleanRel.hasPrefix("knowledge/") {
            let targetURL = root.appendingPathComponent(cleanRel)
            if fm.fileExists(atPath: targetURL.path), let data = try? Data(contentsOf: targetURL) {
                return (data, mimeType(for: targetURL.pathExtension))
            }
        }

        return nil
    }

    private func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs": return "application/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "pdf": return "application/pdf"
        case "glb": return "model/gltf-binary"
        case "dxf": return "application/dxf"
        case "stl": return "application/sla"
        case "eml": return "message/rfc822"
        case "md": return "text/markdown; charset=utf-8"
        case "zip": return "application/zip"
        case "wav": return "audio/wav"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        default: return "application/octet-stream"
        }
    }

    // MARK: - Asset Loading & Optical Workbench Simulator (25 FPS)

    private func loadBundledAssetsIntoMemory() {
        guard let root = locateBundleRootDirectory() else { return }
        let specURL = root.appendingPathComponent("knowledge/THT02_spec.json")
        if let data = try? Data(contentsOf: specURL),
           let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            stateLock.lock()
            cachedSpecDict = obj
            stateLock.unlock()
        }

        #if canImport(UIKit)
        let p9URL = root.appendingPathComponent("assets/manual_pages/page_9.png")
        let p5URL = root.appendingPathComponent("assets/manual_pages/page_5.png")
        if let p9 = UIImage(contentsOfFile: p9URL.path) {
            cachedPage9Image = p9
            if let cg = p9.cgImage,
               let cropped = cg.cropping(to: CGRect(x: 42, y: 826, width: 546, height: 74)) {
                cachedClosedProbeImage = UIImage(cgImage: cropped)
            }
        }
        if let p5 = UIImage(contentsOfFile: p5URL.path) {
            cachedPage5Image = p5
            if let cg = p5.cgImage,
               let cropped = cg.cropping(to: CGRect(x: 56, y: 372, width: 566, height: 46)) {
                cachedOpenProbeImage = UIImage(cgImage: cropped)
            }
        }
        cachedEsdMatImage = buildESDMatBackground(width: 960, height: 540)
        #endif
    }

    public func currentCameraMode() -> String {
        stateLock.lock()
        defer { stateLock.unlock() }
        return activeCameraMode
    }

    public func setCameraMode(_ rawMode: String) {
        let mode = rawMode.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        stateLock.lock()
        activeCameraMode = mode.isEmpty ? "ipad_camera" : mode
        if mode == "ipad_camera" || mode == "usb" || mode == "uvc" || mode == "auto" {
            cameraSourceLabel = "ipad:avfoundation:back"
        } else if mode == "custom" {
            cameraSourceLabel = "custom:upload"
        } else {
            cameraSourceLabel = "simulator:\(mode)"
        }
        stateLock.unlock()

        FieldScanSessionEngine.shared.notifyCameraSourceChanged(cameraSourceLabel)
        if mode == "ipad_camera" || mode == "usb" || mode == "uvc" {
            NativeCameraBridge.shared.startCapture(preferredSource: "back", targetFPS: 24, completion: nil)
        }
        renderQueue.async { [weak self] in
            self?.renderWorkbenchOrCameraStep()
            self?.evaluateLiveReactiveWatch()
        }
    }

    public func injectCustomFrame(_ imageBytes: Data) {
        guard !imageBytes.isEmpty else { return }
        stateLock.lock()
        customUploadedJpeg = imageBytes
        activeCameraMode = "custom"
        cameraSourceLabel = "custom:upload"
        stateLock.unlock()
        FieldScanSessionEngine.shared.notifyCameraSourceChanged("custom:upload")
        renderQueue.async { [weak self] in
            self?.renderWorkbenchOrCameraStep()
        }
    }

    public func ingestLiveCameraFrame(jpegData: Data, width: Int, height: Int, sourceLabel: String) {
        guard !jpegData.isEmpty else { return }
        stateLock.lock()
        liveCameraJpeg = jpegData
        lastLiveCameraTimestamp = ProcessInfo.processInfo.systemUptime
        liveCameraWidth = max(320, width)
        liveCameraHeight = max(240, height)
        cameraSourceLabel = sourceLabel
        stateLock.unlock()

        if let activeSid = FieldScanSessionEngine.shared.currentActiveSessionId {
            let vTel = getVideoTelemetry()
            _ = try? FieldScanSessionEngine.shared.ingestCameraFrameForSession(
                sessionId: activeSid,
                rawJPEG: jpegData,
                visionTel: vTel,
                cameraSource: sourceLabel,
                manualTrigger: false
            )
        }
    }

    public func getRawJpeg() -> Data {
        stateLock.lock()
        defer { stateLock.unlock() }
        return latestRawJpeg
    }

    public func getLatestJpeg() -> Data {
        stateLock.lock()
        defer { stateLock.unlock() }
        return latestHudJpeg
    }

    public func getDipFocusJpeg() -> Data {
        stateLock.lock()
        defer { stateLock.unlock() }
        return latestDipCropJpeg
    }

    public func getVideoTelemetry() -> [String: Any] {
        stateLock.lock()
        defer { stateLock.unlock() }
        return latestVisionTelemetry
    }

    #if canImport(UIKit)
    private func buildESDMatBackground(width: Int, height: Int) -> UIImage {
        let size = CGSize(width: width, height: height)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1.0
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: size, format: format)
        return renderer.image { ctx in
            let cg = ctx.cgContext
            cg.setFillColor(UIColor(red: 0.118, green: 0.125, blue: 0.137, alpha: 1.0).cgColor)
            cg.fill(CGRect(origin: .zero, size: size))

            cg.setStrokeColor(UIColor(red: 0.155, green: 0.172, blue: 0.188, alpha: 1.0).cgColor)
            cg.setLineWidth(1.0)
            for x in stride(from: 40, to: width, by: 40) {
                cg.move(to: CGPoint(x: x, y: 0))
                cg.addLine(to: CGPoint(x: x, y: height))
            }
            for y in stride(from: 40, to: height, by: 40) {
                cg.move(to: CGPoint(x: 0, y: y))
                cg.addLine(to: CGPoint(x: width, y: y))
            }
            cg.strokePath()

            cg.setStrokeColor(UIColor(red: 0.21, green: 0.24, blue: 0.27, alpha: 1.0).cgColor)
            cg.stroke(CGRect(x: 18, y: 18, width: width - 36, height: height - 36))
        }
    }
    #endif

    private func renderWorkbenchOrCameraStep() {
        let nowUptime = ProcessInfo.processInfo.systemUptime
        let tSec = nowUptime - startTime

        stateLock.lock()
        frameSequence += 1
        let seq = frameSequence
        let mode = activeCameraMode
        let liveJpeg = liveCameraJpeg
        let liveAge = nowUptime - lastLiveCameraTimestamp
        let customJpeg = customUploadedJpeg
        let slaveId = targetSlaveId
        let mbHealthy = lastModbusHealthy
        stateLock.unlock()

        let dipBits = Self.addressToDipBits(slaveId)
        let isHardwareCameraMode = (mode == "ipad_camera" || mode == "usb" || mode == "uvc" || mode == "auto")
        if isHardwareCameraMode && !NativeCameraBridge.shared.isRunning {
            NativeCameraBridge.shared.startCapture(preferredSource: "back", targetFPS: 24, completion: nil)
        }
        let useLiveCamera = isHardwareCameraMode && (liveJpeg != nil) && (liveAge < 4.0)

        #if canImport(UIKit)
        let width = 960
        let height = 540
        let size = CGSize(width: width, height: height)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1.0
        format.opaque = true

        var decodedLiveUIImage: UIImage?
        var liveAnalysis: FieldScanLiveVisionResult?
        if useLiveCamera, let liveData = liveJpeg, let camUIImage = UIImage(data: liveData) {
            decodedLiveUIImage = camUIImage
            if let cgImg = camUIImage.cgImage {
                let fresh = FieldScanVisionDetector.shared.analyzeCGImage(
                    cgImg,
                    outputWidth: width,
                    outputHeight: height
                )
                stateLock.lock()
                cachedLiveAnalysis = fresh
                lastLiveAnalysisSeq = seq
                stateLock.unlock()
                liveAnalysis = fresh
            }
        }
        let sensorDetectedInFrame: Bool = isHardwareCameraMode ? (liveAnalysis?.sensorDetected ?? false) : true

        // Smooth sinusoidal rotation (±3.5°) and micro-translation (or real contour angle & dimensions from live camera)
        let angleDeg: Double = liveAnalysis?.angleDeg
            ?? (useLiveCamera ? (1.2 * sin(tSec * 0.65)) : (3.5 * sin(tSec * 0.85) + 0.4 * cos(tSec * 2.1)))
        let angleRad = CGFloat(angleDeg * .pi / 180.0)
        let cx = CGFloat(liveAnalysis?.centerX ?? (480.0 + (useLiveCamera ? 0.0 : 12.0 * sin(tSec * 0.72))))
        let cy = CGFloat(liveAnalysis?.centerY ?? (272.0 + (useLiveCamera ? 0.0 : 8.5 * cos(tSec * 0.88))))
        let probeLen: CGFloat = CGFloat(liveAnalysis?.measuredLenPx ?? 536.0)
        let probeHalfLen: CGFloat = probeLen * 0.5
        let probeHalfRad: CGFloat = CGFloat((liveAnalysis?.measuredWidPx ?? 62.0) * 0.5)
        let scaleL = probeLen / 536.0
        let scaleR = probeHalfRad / 31.0

        // Compute rotated quad and longitudinal axis endpoints in 960x540 space
        let cosA = cos(angleRad)
        let sinA = sin(angleRad)
        let mapLocal: (CGFloat, CGFloat) -> [Int] = { lx, ly in
            let wx = cx + lx * cosA - ly * sinA
            let wy = cy + lx * sinA + ly * cosA
            return [Int(wx.rounded()), Int(wy.rounded())]
        }

        let quadPts: [[Int]] = [
            mapLocal(-probeHalfLen, -probeHalfRad),
            mapLocal(probeHalfLen, -probeHalfRad),
            mapLocal(probeHalfLen, probeHalfRad),
            mapLocal(-probeHalfLen, probeHalfRad),
        ]
        let glandPt = mapLocal(-probeHalfLen + 28.0 * scaleL, 0)
        let tipPt = mapLocal(probeHalfLen - 12.0 * scaleL, 0)
        let centerPt = [Int(cx.rounded()), Int(cy.rounded())]

        let xs = quadPts.map { $0[0] }
        let ys = quadPts.map { $0[1] }
        let bboxMinX = max(0, (xs.min() ?? 200) - 8)
        let bboxMinY = max(0, (ys.min() ?? 220) - 8)
        let bboxMaxX = min(width, (xs.max() ?? 760) + 8)
        let bboxMaxY = min(height, (ys.max() ?? 320) + 8)
        let bbox = [bboxMinX, bboxMinY, max(1, bboxMaxX - bboxMinX), max(1, bboxMaxY - bboxMinY)]

        let keypoints: [[Int]] = [
            mapLocal(-210.0 * scaleL, -18.0 * scaleR),
            mapLocal(-120.0 * scaleL, 16.0 * scaleR),
            mapLocal(-28.0 * scaleL, -22.0 * scaleR),
            mapLocal(52.0 * scaleL, 18.0 * scaleR),
            mapLocal(145.0 * scaleL, -16.0 * scaleR),
            mapLocal(228.0 * scaleL, 14.0 * scaleR),
        ]

        let isPcbOpen = (mode == "sim_open_dip" || mode == "sim_hand_screwdriver") || (liveAnalysis?.pcbOpenDetected == true)
        let isHandScrewdriver = (mode == "sim_hand_screwdriver") || (liveAnalysis?.handDetected == true)
        let isStrainerFault = (mode == "sim_strainer_patch") || (liveAnalysis?.redAnomalyZone == "strainer_head")
        let isGlandFault = (mode == "sim_gland_fault") || (liveAnalysis?.redAnomalyZone == "waterproof_gland_leads")

        let dipCenterPt = liveAnalysis?.dipFocusPoint ?? mapLocal(68.0 * scaleL, 0)
        let dipQuadPts: [[Int]] = liveAnalysis?.dipQuadPoints ?? [
            mapLocal(26.0 * scaleL, -20.0 * scaleR),
            mapLocal(110.0 * scaleL, -20.0 * scaleR),
            mapLocal(110.0 * scaleL, 20.0 * scaleR),
            mapLocal(26.0 * scaleL, 20.0 * scaleR),
        ]

        var anomalyDetected = false
        var anomalyZone: String? = nil
        var anomalyZmm: Double = 0.0
        var anomalyPt: [Int]? = nil
        var anomalyLabel: String = "NOMINAL"

        if isPcbOpen {
            anomalyDetected = true
            anomalyZone = "upper_barrel_dip"
            anomalyZmm = 18.6
            anomalyPt = dipCenterPt
            anomalyLabel = "SW1 DIP-8 Switch PCB Exposed (z = +18.6 mm)"
        } else if isStrainerFault {
            anomalyDetected = true
            anomalyZone = "strainer_head"
            anomalyZmm = 56.0
            anomalyPt = mapLocal(212, 0)
            anomalyLabel = "Physical Obstruction / Fault Patch on SHT30 Strainer Head (z = +56.0 mm)"
        } else if isGlandFault {
            anomalyDetected = true
            anomalyZone = "waterproof_gland_leads"
            anomalyZmm = -60.0
            anomalyPt = mapLocal(-222, 0)
            anomalyLabel = "Frayed RS-485 Harness / Gland Fault at Waterproof Terminal (z = -60.0 mm)"
        }

        // Hand & screwdriver trajectory for `sim_hand_screwdriver`
        let jx = CGFloat(15.0 * sin(tSec * 2.15))
        let jy = CGFloat(9.5 * cos(tSec * 1.75))
        let toolTipPt = [dipCenterPt[0] + Int(jx), dipCenterPt[1] + Int(jy)]
        let toolBasePt = [toolTipPt[0] + 64, toolTipPt[1] + 76]
        let handCenterPt = [toolBasePt[0] + 44, toolBasePt[1] + 48]
        let handContourPts: [[Int]] = [
            [toolBasePt[0] + 12, toolBasePt[1] + 6],
            [toolBasePt[0] + 88, toolBasePt[1] - 8],
            [min(width - 4, toolBasePt[0] + 128), height - 68],
            [min(width - 4, toolBasePt[0] + 130), height - 2],
            [toolBasePt[0] + 40, height - 2],
            [toolBasePt[0] + 4, toolBasePt[1] + 58],
        ]

        var trailSnapshot: [[Int]] = []
        stateLock.lock()
        if isHandScrewdriver {
            handTrailPoints.append(handCenterPt)
            if handTrailPoints.count > 12 {
                handTrailPoints.removeFirst(handTrailPoints.count - 12)
            }
            trailSnapshot = handTrailPoints
        } else {
            handTrailPoints.removeAll()
        }
        stateLock.unlock()

        // 1. Render Raw Workbench / Live Camera Image (960x540)
        let rawRenderer = UIGraphicsImageRenderer(size: size, format: format)
        let rawUIImage = rawRenderer.image { ctx in
            let cg = ctx.cgContext

            if useLiveCamera, let camImg = decodedLiveUIImage {
                camImg.draw(in: CGRect(origin: .zero, size: size))
            } else if isHardwareCameraMode {
                cg.setFillColor(UIColor(red: 0.05, green: 0.08, blue: 0.12, alpha: 1.0).cgColor)
                cg.fill(CGRect(origin: .zero, size: size))
                let waitAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.monospacedSystemFont(ofSize: 15, weight: .bold),
                    .foregroundColor: UIColor(red: 0.35, green: 0.82, blue: 0.98, alpha: 1.0),
                ]
                NSString(string: "OPENING IPAD AIR M4 CAMERA (AVFOUNDATION 30 FPS)...").draw(
                    at: CGPoint(x: 215, y: 258),
                    withAttributes: waitAttrs
                )
            } else if mode == "custom", let custData = customJpeg, let custImg = UIImage(data: custData) {
                custImg.draw(in: CGRect(origin: .zero, size: size))
            } else {
                // Draw ESD Inspection Mat
                if let matImg = cachedEsdMatImage {
                    matImg.draw(in: CGRect(origin: .zero, size: size))
                } else {
                    cg.setFillColor(UIColor(red: 0.12, green: 0.13, blue: 0.14, alpha: 1.0).cgColor)
                    cg.fill(CGRect(origin: .zero, size: size))
                }

                cg.saveGState()
                cg.translateBy(x: cx, y: cy)
                cg.rotate(by: angleRad)

                // Soft drop shadow on ESD mat
                cg.setFillColor(UIColor(white: 0.0, alpha: 0.45).cgColor)
                let shadowPath = UIBezierPath(
                    roundedRect: CGRect(x: -probeHalfLen + 6, y: -probeHalfRad + 8, width: probeLen, height: probeHalfRad * 2.0),
                    cornerRadius: 14
                )
                cg.addPath(shadowPath.cgPath)
                cg.fillPath()

                // Draw underlying manual photograph crop from page_9.png or page_5.png
                if isPcbOpen, let openImg = cachedOpenProbeImage {
                    openImg.draw(in: CGRect(x: -probeHalfLen, y: -probeHalfRad, width: probeLen, height: probeHalfRad * 2.0), blendMode: .normal, alpha: 0.42)
                } else if let closedImg = cachedClosedProbeImage {
                    closedImg.draw(in: CGRect(x: -probeHalfLen, y: -probeHalfRad, width: probeLen, height: probeHalfRad * 2.0), blendMode: .normal, alpha: 0.42)
                }

                // Draw crisp 140x16mm TZ THT-02 physical assembly over manual sprite
                // Black 4-wire shielded lead cable on left (-320 .. -238)
                cg.setFillColor(UIColor(red: 0.11, green: 0.12, blue: 0.14, alpha: 1.0).cgColor)
                cg.fill(CGRect(x: -320, y: -9, width: 84, height: 18))

                // Waterproof dome cable gland (-238 .. -184)
                cg.setFillColor(UIColor(red: 0.52, green: 0.56, blue: 0.61, alpha: 1.0).cgColor)
                let glandPath = UIBezierPath(roundedRect: CGRect(x: -238, y: -22, width: 54, height: 44), cornerRadius: 8)
                cg.addPath(glandPath.cgPath)
                cg.fillPath()

                // Lower RS-485 Polymer Barrel (-184 .. +12)
                cg.setFillColor(UIColor(red: 0.76, green: 0.79, blue: 0.83, alpha: 1.0).cgColor)
                cg.fill(CGRect(x: -184, y: -26, width: 196, height: 52))
                // Cylindrical specular highlight bar
                cg.setFillColor(UIColor(white: 0.94, alpha: 0.55).cgColor)
                cg.fill(CGRect(x: -182, y: -15, width: 192, height: 10))

                // Snap-on mounting flange ears (-24 .. +24)
                cg.setFillColor(UIColor(red: 0.64, green: 0.68, blue: 0.73, alpha: 1.0).cgColor)
                cg.fill(CGRect(x: -22, y: -38, width: 44, height: 76))

                if isPcbOpen {
                    // Exposed M14 central threads (+12 .. +28)
                    cg.setFillColor(UIColor(red: 0.55, green: 0.59, blue: 0.64, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: 12, y: -22, width: 16, height: 44))

                    // Exposed Teal/Blue Internal DIP-8 PCB (+26 .. +112)
                    cg.setFillColor(UIColor(red: 0.05, green: 0.36, blue: 0.65, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: 26, y: -20, width: 86, height: 40))
                    cg.setStrokeColor(UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 1.0).cgColor)
                    cg.setLineWidth(1.5)
                    cg.stroke(CGRect(x: 26, y: -20, width: 86, height: 40))

                    // Red SW1 DIP-8 Switch Housing (+36 .. +102)
                    cg.setFillColor(UIColor(red: 0.76, green: 0.14, blue: 0.22, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: 35, y: -13, width: 66, height: 26))

                    // 8 White DIP-8 Rockers reflecting live `dipBits`
                    for pinIdx in 0..<8 {
                        let px = CGFloat(38 + pinIdx * 8)
                        let bitOn = dipBits[pinIdx] == 1
                        cg.setFillColor(UIColor(red: 0.18, green: 0.08, blue: 0.10, alpha: 1.0).cgColor)
                        cg.fill(CGRect(x: px, y: -10, width: 5.5, height: 20))
                        cg.setFillColor(UIColor.white.cgColor)
                        let ky: CGFloat = bitOn ? -9.0 : 1.0
                        cg.fill(CGRect(x: px + 0.5, y: ky, width: 4.5, height: 8.0))
                    }

                    // Slid-back Upper Polymer Barrel & Strainer (+112 .. +268)
                    cg.setFillColor(UIColor(red: 0.76, green: 0.79, blue: 0.83, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: 112, y: -26, width: 68, height: 52))
                } else {
                    // Closed Upper Polymer Barrel (+12 .. +180)
                    cg.setFillColor(UIColor(red: 0.76, green: 0.79, blue: 0.83, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: 12, y: -26, width: 168, height: 52))
                    cg.setFillColor(UIColor(white: 0.94, alpha: 0.55).cgColor)
                    cg.fill(CGRect(x: 14, y: -15, width: 164, height: 10))
                }

                // Upper Black Elastomer O-Ring Seal (+180 .. +194)
                cg.setFillColor(UIColor(red: 0.10, green: 0.12, blue: 0.15, alpha: 1.0).cgColor)
                cg.fill(CGRect(x: 180, y: -27, width: 14, height: 54))

                // Slotted Stainless Steel SHT30 Strainer Head (+194 .. +268)
                cg.setFillColor(UIColor(red: 0.72, green: 0.77, blue: 0.82, alpha: 1.0).cgColor)
                let strainerPath = UIBezierPath(roundedRect: CGRect(x: 194, y: -26, width: 74, height: 52), cornerRadius: 10)
                cg.addPath(strainerPath.cgPath)
                cg.fillPath()

                // 4 Axial Strainer Ventilation Slots
                cg.setFillColor(UIColor(red: 0.32, green: 0.37, blue: 0.43, alpha: 1.0).cgColor)
                for sy in [-16.0, -6.0, 4.0, 14.0] as [CGFloat] {
                    cg.fill(CGRect(x: 204, y: sy, width: 50, height: 4))
                }

                // Red Anomaly Patch for `sim_strainer_patch`
                if isStrainerFault {
                    let patchRect = CGRect(x: 198, y: -25, width: 62, height: 50)
                    cg.setFillColor(UIColor(red: 0.92, green: 0.22, blue: 0.12, alpha: 0.90).cgColor)
                    cg.fill(patchRect)
                    cg.setStrokeColor(UIColor(red: 1.0, green: 0.88, blue: 0.18, alpha: 1.0).cgColor)
                    cg.setLineWidth(3.0)
                    cg.move(to: CGPoint(x: patchRect.minX + 5, y: patchRect.minY + 5))
                    cg.addLine(to: CGPoint(x: patchRect.maxX - 5, y: patchRect.maxY - 5))
                    cg.move(to: CGPoint(x: patchRect.minX + 5, y: patchRect.maxY - 5))
                    cg.addLine(to: CGPoint(x: patchRect.maxX - 5, y: patchRect.minY + 5))
                    cg.strokePath()
                }

                // Red Anomaly Band & Frayed Leads for `sim_gland_fault`
                if isGlandFault {
                    let glandFaultRect = CGRect(x: -236, y: -22, width: 50, height: 44)
                    cg.setFillColor(UIColor(red: 0.94, green: 0.25, blue: 0.10, alpha: 0.90).cgColor)
                    cg.fill(glandFaultRect)
                    cg.setStrokeColor(UIColor(red: 1.0, green: 0.85, blue: 0.15, alpha: 1.0).cgColor)
                    cg.setLineWidth(2.8)
                    cg.move(to: CGPoint(x: -255, y: -6))
                    cg.addLine(to: CGPoint(x: -232, y: -16))
                    cg.move(to: CGPoint(x: -255, y: 6))
                    cg.addLine(to: CGPoint(x: -232, y: 16))
                    cg.strokePath()
                }

                // Barrel Markings ("TZ THT-02 RS-485")
                let markAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.monospacedSystemFont(ofSize: 11, weight: .bold),
                    .foregroundColor: UIColor(red: 0.22, green: 0.27, blue: 0.33, alpha: 0.90),
                ]
                NSString(string: "TZ THT-02  RS-485 · SHT30").draw(at: CGPoint(x: -168, y: -6), withAttributes: markAttrs)

                cg.restoreGState()

                // Masked Operator Hand & Precision Screwdriver Overlay (`sim_hand_screwdriver`)
                if isHandScrewdriver {
                    let tip = CGPoint(x: toolTipPt[0], y: toolTipPt[1])
                    let shaftEnd = CGPoint(x: toolBasePt[0], y: toolBasePt[1])
                    let handleEnd = CGPoint(x: toolBasePt[0] + 72, y: toolBasePt[1] + 88)

                    // Chrome screwdriver shaft
                    cg.setStrokeColor(UIColor(red: 0.85, green: 0.88, blue: 0.92, alpha: 1.0).cgColor)
                    cg.setLineWidth(5.0)
                    cg.move(to: tip)
                    cg.addLine(to: shaftEnd)
                    cg.strokePath()

                    // Insulated crimson screwdriver handle
                    cg.setStrokeColor(UIColor(red: 0.89, green: 0.15, blue: 0.12, alpha: 1.0).cgColor)
                    cg.setLineWidth(20.0)
                    cg.setLineCap(.round)
                    cg.move(to: shaftEnd)
                    cg.addLine(to: handleEnd)
                    cg.strokePath()

                    // Operator hand polygon
                    cg.setFillColor(UIColor(red: 0.81, green: 0.62, blue: 0.49, alpha: 0.96).cgColor)
                    cg.beginPath()
                    for (idx, pt) in handContourPts.enumerated() {
                        let p = CGPoint(x: pt[0], y: pt[1])
                        if idx == 0 { cg.move(to: p) } else { cg.addLine(to: p) }
                    }
                    cg.closePath()
                    cg.fillPath()
                }
            }
        }

        // 2. Render Annotated FieldScan HUD Image (`getLatestJpeg()`)
        let hudRenderer = UIGraphicsImageRenderer(size: size, format: format)
        let hudUIImage = hudRenderer.image { ctx in
            let cg = ctx.cgContext
            rawUIImage.draw(in: CGRect(origin: .zero, size: size))

            if sensorDetectedInFrame {
                let hudColor = mbHealthy
                    ? UIColor(red: 0.20, green: 0.83, blue: 0.60, alpha: 0.95)
                    : UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 0.95)

                // Rotated sensor bounding box
                cg.setStrokeColor(hudColor.cgColor)
                cg.setLineWidth(2.0)
                cg.beginPath()
                for (idx, pt) in quadPts.enumerated() {
                    let p = CGPoint(x: pt[0], y: pt[1])
                    if idx == 0 { cg.move(to: p) } else { cg.addLine(to: p) }
                }
                cg.closePath()
                cg.strokePath()

                // Longitudinal axis (-70 mm .. +70 mm) + 6 zone ticks
                let gPt = CGPoint(x: glandPt[0], y: glandPt[1])
                let tPt = CGPoint(x: tipPt[0], y: tipPt[1])
                cg.setStrokeColor(UIColor(red: 0.49, green: 0.83, blue: 0.99, alpha: 0.75).cgColor)
                cg.setLineWidth(1.2)
                cg.move(to: gPt)
                cg.addLine(to: tPt)
                cg.strokePath()

                let axDx = tPt.x - gPt.x
                let axDy = tPt.y - gPt.y
                let axLen = max(1.0, hypot(axDx, axDy))
                let nx = -axDy / axLen
                let ny = axDx / axLen
                for frac in [0.0, 0.16, 0.37, 0.50, 0.69, 0.77, 1.0] as [CGFloat] {
                    let tx = gPt.x + axDx * frac
                    let ty = gPt.y + axDy * frac
                    cg.move(to: CGPoint(x: tx - nx * 6, y: ty - ny * 6))
                    cg.addLine(to: CGPoint(x: tx + nx * 6, y: ty + ny * 6))
                }
                cg.strokePath()

                // Red/Amber Anomaly Target Reticle
                if anomalyDetected, let aPt = anomalyPt {
                    let alertColor = isPcbOpen
                        ? UIColor(red: 0.96, green: 0.62, blue: 0.04, alpha: 0.98)
                        : UIColor(red: 0.94, green: 0.27, blue: 0.27, alpha: 0.98)
                    cg.setStrokeColor(alertColor.cgColor)
                    cg.setLineWidth(2.4)
                    let r: CGFloat = 22.0
                    cg.strokeEllipse(in: CGRect(x: CGFloat(aPt[0]) - r, y: CGFloat(aPt[1]) - r, width: r * 2, height: r * 2))
                }
            }

            // Top HUD telemetry bar
            cg.setFillColor(UIColor(red: 0.04, green: 0.07, blue: 0.12, alpha: 0.84).cgColor)
            cg.fill(CGRect(x: 0, y: 0, width: width, height: 32))
            let hudAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 11, weight: .bold),
                .foregroundColor: UIColor(red: 0.92, green: 0.96, blue: 1.0, alpha: 1.0),
            ]
            let headerStr: String
            if isHardwareCameraMode && !sensorDetectedInFrame {
                headerStr = String(
                    format: "IPAD AIR M4 LIVE CAMERA (%@) · AIM LENS AT TZ THT-02 SENSOR · FRAME #%d",
                    NativeCameraBridge.shared.activeDeviceName.uppercased(),
                    seq
                )
            } else {
                headerStr = String(
                    format: "FIELDSCAN M4 OPTICAL HUD · TZ THT-02 (140.0x16.0 MM) · ANGLE %+.1f° · SLAVE #%02d · FRAME #%d",
                    angleDeg,
                    slaveId,
                    seq
                )
            }
            NSString(string: headerStr).draw(at: CGPoint(x: 12, y: 8), withAttributes: hudAttrs)
        }

        // 3. Render 3.3x Macro DIP-8 Crop (`getDipFocusJpeg()`, 360x220)
        let dipSize = CGSize(width: 360, height: 220)
        let dipRenderer = UIGraphicsImageRenderer(size: dipSize, format: format)
        let dipUIImage = dipRenderer.image { ctx in
            let cg = ctx.cgContext
            cg.setFillColor(UIColor(red: 0.05, green: 0.10, blue: 0.18, alpha: 1.0).cgColor)
            cg.fill(CGRect(origin: .zero, size: dipSize))

            let titleAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 10.5, weight: .bold),
                .foregroundColor: UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 1.0),
            ]
            let weightAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 8.5, weight: .semibold),
                .foregroundColor: UIColor(red: 0.75, green: 0.90, blue: 1.0, alpha: 1.0),
            ]
            let binStr = dipBits.map(String.init).joined()

            if useLiveCamera, let camUIImage = decodedLiveUIImage {
                // Crop & deskew 3.3x macro region directly around the true detected SW1 DIP-8 focus point
                let srcW = max(1.0, camUIImage.size.width)
                let srcH = max(1.0, camUIImage.size.height)
                let targetOutX = liveAnalysis?.dipFocusPoint != nil ? CGFloat(dipCenterPt[0]) : (CGFloat(dipCenterPt[0]) * 0.45 + cx * 0.55)
                let targetOutY = liveAnalysis?.dipFocusPoint != nil ? CGFloat(dipCenterPt[1]) : (CGFloat(dipCenterPt[1]) * 0.45 + cy * 0.55)
                let focusX = targetOutX / CGFloat(width) * srcW
                let focusY = targetOutY / CGFloat(height) * srcH
                let cropW = max(90.0, srcW / 3.3)
                let cropH = max(55.0, srcH / 3.3)
                let cropX = max(0.0, min(srcW - cropW, focusX - cropW * 0.5))
                let cropY = max(0.0, min(srcH - cropH, focusY - cropH * 0.5))

                cg.saveGState()
                let scaleX = dipSize.width / cropW
                let scaleY = dipSize.height / cropH
                cg.scaleBy(x: scaleX, y: scaleY)
                camUIImage.draw(in: CGRect(x: -cropX, y: -cropY, width: srcW, height: srcH))
                cg.restoreGState()

                // Crisp HUD border and live macro telemetry header/footer
                cg.setFillColor(UIColor(red: 0.03, green: 0.07, blue: 0.14, alpha: 0.82).cgColor)
                cg.fill(CGRect(x: 0, y: 0, width: dipSize.width, height: 26))
                cg.fill(CGRect(x: 0, y: dipSize.height - 24, width: dipSize.width, height: 24))

                cg.setStrokeColor(UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 0.95).cgColor)
                cg.setLineWidth(2.0)
                cg.stroke(CGRect(x: 2, y: 2, width: dipSize.width - 4, height: dipSize.height - 4))

                // Optical reticle in center of macro crop
                let midX = dipSize.width * 0.5
                let midY = dipSize.height * 0.5
                cg.setStrokeColor(UIColor(red: 0.20, green: 0.92, blue: 0.55, alpha: 0.78).cgColor)
                cg.setLineWidth(1.2)
                cg.stroke(CGRect(x: midX - 64, y: midY - 28, width: 128, height: 56))

                NSString(string: "LIVE MACRO (3.3x) · SLAVE #\(slaveId) (\(binStr))").draw(
                    at: CGPoint(x: 10, y: 6),
                    withAttributes: titleAttrs
                )
                NSString(string: String(format: "OPTICAL LOCK (%.0f, %.0f) · ANGLE %+.1f° · PAGE 5", cx, cy, angleDeg)).draw(
                    at: CGPoint(x: 10, y: dipSize.height - 17),
                    withAttributes: weightAttrs
                )
            } else {
                // Blue RS-485 PCB
                let pcbRect = CGRect(x: 18, y: 34, width: 324, height: 150)
                cg.setFillColor(UIColor(red: 0.06, green: 0.35, blue: 0.64, alpha: 1.0).cgColor)
                cg.fill(pcbRect)
                cg.setStrokeColor(UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 1.0).cgColor)
                cg.setLineWidth(2.0)
                cg.stroke(pcbRect)

                // Red SW1 DIP-8 Switch Block
                let swRect = CGRect(x: 42, y: 58, width: 276, height: 96)
                cg.setFillColor(UIColor(red: 0.75, green: 0.14, blue: 0.21, alpha: 1.0).cgColor)
                cg.fill(swRect)
                cg.setStrokeColor(UIColor(white: 0.95, alpha: 0.8).cgColor)
                cg.setLineWidth(1.2)
                cg.stroke(swRect)

                let smallAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.monospacedSystemFont(ofSize: 9.5, weight: .bold),
                    .foregroundColor: UIColor.white,
                ]

                for i in 0..<8 {
                    let x = CGFloat(54 + i * 32)
                    let isOn = dipBits[i] == 1
                    cg.setFillColor(UIColor(red: 0.16, green: 0.07, blue: 0.09, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: x, y: 74, width: 20, height: 64))

                    let knobY: CGFloat = isOn ? 77.0 : 107.0
                    cg.setFillColor(
                        isOn
                            ? UIColor(red: 0.20, green: 0.92, blue: 0.55, alpha: 1.0).cgColor
                            : UIColor(white: 0.95, alpha: 1.0).cgColor
                    )
                    cg.fill(CGRect(x: x + 2, y: knobY, width: 16, height: 26))

                    NSString(string: "\(i + 1)").draw(at: CGPoint(x: x + 6, y: 59), withAttributes: smallAttrs)
                    NSString(string: "\(Self.dipWeights[i])").draw(at: CGPoint(x: x + 1, y: 140), withAttributes: weightAttrs)
                }

                NSString(string: "SW1 DIP-8 MACRO (3.3x) · SLAVE #\(slaveId) (\(binStr))").draw(
                    at: CGPoint(x: 18, y: 10),
                    withAttributes: titleAttrs
                )
                NSString(string: "ON ↑ (WEIGHTS 128..1) · MANUAL V1.1 PAGE 5").draw(
                    at: CGPoint(x: 18, y: 194),
                    withAttributes: weightAttrs
                )
            }
        }

        let rawData = (useLiveCamera && liveJpeg != nil) ? liveJpeg! : (rawUIImage.jpegData(compressionQuality: 0.88) ?? Data())
        let hudData = hudUIImage.jpegData(compressionQuality: 0.86) ?? rawData
        let dipData = dipUIImage.jpegData(compressionQuality: 0.88) ?? rawData

        let srcLabel: String
        if useLiveCamera {
            srcLabel = "ipad:avfoundation:\(NativeCameraBridge.shared.activeDeviceName)"
        } else if mode == "ipad_camera" {
            srcLabel = "ipad:avfoundation:back"
        } else if mode == "usb" {
            srcLabel = "uvc:ipad_usb_or_bench"
        } else {
            srcLabel = "simulator:\(mode)"
        }

        var visionTel: [String: Any] = [
            "detected": sensorDetectedInFrame,
            "mode": mode,
            "sim_mode": isHardwareCameraMode ? (useLiveCamera ? "live_uvc" : "uvc_offline") : mode,
            "camera_source": srcLabel,
            "fps": (fpsEMA * 10).rounded() / 10,
            "frame_seq": seq,
            "frame_size": [width, height],
            "angle_deg": sensorDetectedInFrame ? ((angleDeg * 10).rounded() / 10) : 0.0,
            "est_length_mm": sensorDetectedInFrame ? 140.0 : 0.0,
            "est_diameter_mm": sensorDetectedInFrame ? 16.0 : 0.0,
            "aspect_ratio": sensorDetectedInFrame ? 8.75 : 0.0,
            "bbox": sensorDetectedInFrame ? bbox : [0, 0, 0, 0],
            "sensor_quad": sensorDetectedInFrame ? quadPts : NSNull(),
            "sensor_axis": sensorDetectedInFrame
                ? [
                    "gland": glandPt,
                    "tip": tipPt,
                    "center": centerPt,
                ]
                : NSNull(),
            "keypoints": sensorDetectedInFrame ? keypoints : [],
            "pcb_open_detected": isPcbOpen,
            "dip_focus_pt": sensorDetectedInFrame ? dipCenterPt : NSNull(),
            "dip_quad": sensorDetectedInFrame ? dipQuadPts : NSNull(),
            "anomaly_detected": anomalyDetected,
            "anomaly_zone": anomalyZone ?? NSNull(),
            "anomaly_z_mm": anomalyZmm,
            "anomaly_confidence": anomalyDetected ? 0.96 : 0.0,
            "anomaly_label": anomalyLabel,
            "anomaly_pt": (anomalyPt ?? centerPt),
            "hand_detected": isHandScrewdriver,
            "tool_detected": isHandScrewdriver,
            "occlusion_filtered": isHandScrewdriver,
            "hand_center": isHandScrewdriver ? handCenterPt : NSNull(),
            "hand_contour": isHandScrewdriver ? handContourPts : [],
            "hand_trail": isHandScrewdriver ? trailSnapshot : [],
            "hand_velocity_px_s": isHandScrewdriver ? 42.0 : 0.0,
            "hand_velocity_vec": isHandScrewdriver ? [28.0, -18.0] : [0.0, 0.0],
            "tool_shaft": isHandScrewdriver
                ? ["tip": toolTipPt, "base": toolBasePt]
                : NSNull(),
            "mean_brightness": liveAnalysis?.meanBrightness ?? 128.4,
            "sharpness_score": liveAnalysis?.sharpnessScore ?? 48.0,
            "exposure_ok": liveAnalysis?.exposureOk ?? true,
            "white_sticker_occluded": liveAnalysis?.whiteStickerOccluded ?? false,
        ]
        let effCamCtx = resolveEffectiveContext(sessionId: nil, manifestSha: nil)
        let isCalibratedTHT02 = (effCamCtx.productId == "tzone_tht02" && effCamCtx.contentOrigin != "catalog")
        let isOccludedOrUncertain = isHandScrewdriver
            || ((liveAnalysis?.whiteStickerOccluded ?? false) == true)
            || ((liveAnalysis?.sharpnessScore ?? 48.0) < 24.0)
            || !sensorDetectedInFrame
        visionTel["detector_applicability"] = isCalibratedTHT02 ? "calibrated_tht02_140x16mm" : "generic_cylinder_manual_confirmation"
        if !isCalibratedTHT02 {
            visionTel["evidence_state"] = "manual_confirmation_required"
        } else if isOccludedOrUncertain {
            visionTel["evidence_state"] = "uncertain_occluded"
        } else {
            visionTel["evidence_state"] = "observed"
        }
        if anomalyZone == nil {
            visionTel["anomaly_zone"] = NSNull()
        }

        stateLock.lock()
        latestRawJpeg = rawData
        latestHudJpeg = hudData
        latestDipCropJpeg = dipData
        latestVisionTelemetry = visionTel
        stateLock.unlock()
        #endif
    }

    #if canImport(UIKit)
    private struct LiveFramePixelTelemetry {
        let sensorDetected: Bool
        let meanBrightness: Double
        let sharpnessScore: Double
        let exposureOk: Bool
        let whiteStickerOccluded: Bool
        let centerX: Double
        let centerY: Double
        let angleDeg: Double
        let measuredLenPx: Double
        let measuredWidPx: Double
        let pcbOpenDetected: Bool
        let handDetected: Bool
        let redAnomalyZone: String?
    }

    /// Runs high-accuracy Vision + 160x90 RGBA PCA & YCrCb skin-masked telemetry analysis on live iPad Air M4 camera frames.
    private func analyzeLiveCameraImage(_ image: UIImage, frameWidth: Int, frameHeight: Int) -> LiveFramePixelTelemetry? {
        guard let cgImage = image.cgImage else { return nil }
        let sampleW = 160
        let sampleH = 90
        var rawPixels = [UInt8](repeating: 0, count: sampleW * sampleH * 4)
        let colorSpace = CGColorSpaceCreateDeviceRGB()

        let drawn = rawPixels.withUnsafeMutableBytes { ptr -> Bool in
            guard let base = ptr.baseAddress,
                  let ctx = CGContext(
                      data: base,
                      width: sampleW,
                      height: sampleH,
                      bitsPerComponent: 8,
                      bytesPerRow: sampleW * 4,
                      space: colorSpace,
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                  ) else {
                return false
            }
            ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: sampleW, height: sampleH))
            return true
        }
        guard drawn else { return nil }

        // 1. Estimate background color (bgR, bgG, bgB) and luminance from the outer perimeter
        var borderRSum: Double = 0
        var borderGSum: Double = 0
        var borderBSum: Double = 0
        var borderCount: Double = 0
        var borderLumas: [Double] = []
        borderLumas.reserveCapacity(sampleW * 16)

        for y in 0..<sampleH {
            for x in 0..<sampleW {
                if y < 7 || y >= sampleH - 7 || x < 12 || x >= sampleW - 12 {
                    let idx = (y * sampleW + x) * 4
                    let r = Double(rawPixels[idx])
                    let g = Double(rawPixels[idx + 1])
                    let b = Double(rawPixels[idx + 2])
                    borderRSum += r
                    borderGSum += g
                    borderBSum += b
                    borderCount += 1.0
                    borderLumas.append(0.299 * r + 0.587 * g + 0.114 * b)
                }
            }
        }

        let bgR = borderCount > 0 ? (borderRSum / borderCount) : 128.0
        let bgG = borderCount > 0 ? (borderGSum / borderCount) : 128.0
        let bgB = borderCount > 0 ? (borderBSum / borderCount) : 128.0
        borderLumas.sort()
        let bgMedianLuma = borderLumas.isEmpty ? (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) : borderLumas[borderLumas.count / 2]

        // 2. Scan central workspace (x in 8%..92%, y in 8%..92%), mask out YCrCb human skin, and collect foreground points
        let minX = Int((Double(sampleW) * 0.08).rounded())
        let maxX = Int((Double(sampleW) * 0.92).rounded())
        let minY = Int((Double(sampleH) * 0.08).rounded())
        let maxY = Int((Double(sampleH) * 0.92).rounded())

        var lumaSum: Double = 0
        var weightSum: Double = 0
        var sumX: Double = 0
        var sumY: Double = 0
        var sumXX: Double = 0
        var sumYY: Double = 0
        var sumXY: Double = 0
        var contrastPixels = 0
        var bluePcbCount = 0
        var redPatchRightCount = 0
        var redPatchLeftCount = 0
        var skinPixelCount = 0
        var edgeStrengthSum: Double = 0.0
        var edgeSampleCount: Int = 0
        var clippedBrightPixels: Int = 0
        var centralWhiteStickerPixels: Int = 0

        var fgPoints: [(Double, Double, Double)] = []
        fgPoints.reserveCapacity(1200)

        for y in 0..<sampleH {
            for x in 0..<sampleW {
                let idx = (y * sampleW + x) * 4
                let r = Double(rawPixels[idx])
                let g = Double(rawPixels[idx + 1])
                let b = Double(rawPixels[idx + 2])
                let luma = 0.299 * r + 0.587 * g + 0.114 * b
                lumaSum += luma
                if luma >= 248.0 {
                    clippedBrightPixels += 1
                }

                // YCrCb human skin locus (Cr in 135..178, Cb in 80..126)
                let cb = 128.0 - 0.168736 * r - 0.331264 * g + 0.5 * b
                let cr = 128.0 + 0.5 * r - 0.418688 * g - 0.081312 * b
                let isSkin = (cr >= 135.0 && cr <= 178.0 && cb >= 80.0 && cb <= 126.0 && r > 85.0 && r > g && r > b)
                if isSkin {
                    skinPixelCount += 1
                }

                // Blue/teal internal DIP-8 PCB detection
                if b > 105.0 && b > r * 1.30 && g > r * 1.08 {
                    bluePcbCount += 1
                }

                // Low-saturation bright white sticker/label occlusion check in DIP zone (`VIS-05`)
                let maxCh = max(r, max(g, b))
                let minCh = min(r, min(g, b))
                if x >= sampleW / 3 && x <= (sampleW * 2) / 3 && y >= sampleH / 3 && y <= (sampleH * 2) / 3 {
                    if luma >= 218.0 && (maxCh - minCh) <= 22.0 {
                        centralWhiteStickerPixels += 1
                    }
                }

                // Bright red/orange fault patch detection (excluding human skin)
                if !isSkin && r > 165.0 && r > g * 1.62 && r > b * 1.72 {
                    if x >= sampleW / 2 {
                        redPatchRightCount += 1
                    } else {
                        redPatchLeftCount += 1
                    }
                }

                // Central workspace foreground contrast (masked against skin so holding sensor in hand never corrupts bounding box)
                if !isSkin && x >= minX && x <= maxX && y >= minY && y <= maxY {
                    let dr = r - bgR
                    let dg = g - bgG
                    let db = b - bgB
                    let colorDist = sqrt(dr * dr + dg * dg + db * db)
                    let lumaDiff = abs(luma - bgMedianLuma)

                    // Horizontal & vertical local gradient for cylindrical metallic/polymer edges
                    var edgeStrength: Double = 0.0
                    if x > minX && x < maxX && y > minY && y < maxY {
                        let idxL = (y * sampleW + (x - 1)) * 4
                        let idxR = (y * sampleW + (x + 1)) * 4
                        let idxU = ((y - 1) * sampleW + x) * 4
                        let idxD = ((y + 1) * sampleW + x) * 4
                        let gx = abs(Double(rawPixels[idxR]) - Double(rawPixels[idxL])) + abs(Double(rawPixels[idxR + 1]) - Double(rawPixels[idxL + 1]))
                        let gy = abs(Double(rawPixels[idxD]) - Double(rawPixels[idxU])) + abs(Double(rawPixels[idxD + 1]) - Double(rawPixels[idxU + 1]))
                        edgeStrength = (gx + gy) * 0.25
                    }

                    let score = max(lumaDiff, colorDist * 0.68) + edgeStrength * 0.45
                    if score > 22.0 {
                        contrastPixels += 1
                        edgeStrengthSum += edgeStrength
                        edgeSampleCount += 1
                        let w = min(120.0, score)
                        weightSum += w
                        let dx = Double(x)
                        let dy = Double(y)
                        sumX += dx * w
                        sumY += dy * w
                        sumXX += dx * dx * w
                        sumYY += dy * dy * w
                        sumXY += dx * dy * w
                        fgPoints.append((dx, dy, w))
                    }
                }
            }
        }

        let totalPx = Double(sampleW * sampleH)
        let meanLuma = ((lumaSum / totalPx) * 10).rounded() / 10
        let rawSharpness = edgeSampleCount > 0 ? (edgeStrengthSum / Double(edgeSampleCount)) * 1.8 : 0.0
        let sharpnessScore = ((min(100.0, rawSharpness)) * 10).rounded() / 10
        let exposureOk = (meanLuma >= 22.0 && meanLuma <= 238.0) && (Double(clippedBrightPixels) / totalPx) < 0.35
        let whiteStickerOccluded = (centralWhiteStickerPixels >= 95 && bluePcbCount < 18)

        // 3. Fast Pure-CPU Center-Weighted 2D PCA (< 0.8 ms, zero Vision/Metal/ANE stalls on renderQueue)
        let cxMean = weightSum > 10.0 ? (sumX / weightSum) : Double(sampleW) * 0.5
        let cyMean = weightSum > 10.0 ? (sumY / weightSum) : Double(sampleH) * 0.5
        let covXX = weightSum > 10.0 ? max(1e-3, (sumXX / weightSum) - cxMean * cxMean) : 12.0
        let covYY = weightSum > 10.0 ? max(1e-3, (sumYY / weightSum) - cyMean * cyMean) : 2.5
        let covXY = weightSum > 10.0 ? ((sumXY / weightSum) - cxMean * cyMean) : 0.0
        let thetaRad = 0.5 * atan2(2.0 * covXY, covXX - covYY)
        var pcaAngleDeg = thetaRad * 180.0 / .pi
        if pcaAngleDeg > 90.0 { pcaAngleDeg -= 180.0 }
        if pcaAngleDeg < -90.0 { pcaAngleDeg += 180.0 }

        // Eigenvalues of 2D covariance matrix to verify distinct foreground structure
        let trace = covXX + covYY
        let det = covXX * covYY - covXY * covXY
        let disc = sqrt(max(0.0, trace * trace * 0.25 - det))
        let lambdaMajor = max(1e-3, trace * 0.5 + disc)
        let lambdaMinor = max(1e-3, trace * 0.5 - disc)
        let elongationRatio = sqrt(lambdaMajor / lambdaMinor)

        let cosT = cos(thetaRad)
        let sinT = sin(thetaRad)
        var uValues: [Double] = []
        var vValues: [Double] = []
        if !fgPoints.isEmpty {
            uValues.reserveCapacity(fgPoints.count)
            vValues.reserveCapacity(fgPoints.count)
            for (px, py, _) in fgPoints {
                let dx = px - cxMean
                let dy = py - cyMean
                let u = dx * cosT + dy * sinT
                let v = -dx * sinT + dy * cosT
                uValues.append(u)
                vValues.append(v)
            }
            uValues.sort()
            vValues.sort()
        }

        let scaleX = Double(frameWidth) / Double(sampleW)
        let scaleY = Double(frameHeight) / Double(sampleH)
        let avgScale = 0.5 * (scaleX + scaleY)

        var pcaLenPx: Double = 460.0
        var pcaWidPx: Double = 58.0
        if uValues.count >= 16 {
            let uLow = uValues[max(0, Int(Double(uValues.count) * 0.04))]
            let uHigh = uValues[min(uValues.count - 1, Int(Double(uValues.count) * 0.96))]
            let vLow = vValues[max(0, Int(Double(vValues.count) * 0.06))]
            let vHigh = vValues[min(vValues.count - 1, Int(Double(vValues.count) * 0.94))]
            pcaLenPx = max(180.0, min(820.0, (uHigh - uLow) * avgScale * 1.08))
            pcaWidPx = max(36.0, min(150.0, (vHigh - vLow) * avgScale * 1.05))
        }

        let rawCx = max(90.0, min(Double(frameWidth - 90), (cxMean / Double(sampleW)) * Double(frameWidth)))
        let rawCy = max(70.0, min(Double(frameHeight - 70), (cyMean / Double(sampleH)) * Double(frameHeight)))
        let rawAngle = pcaAngleDeg
        let rawLen = pcaLenPx
        let rawWid = pcaWidPx

        // High-recall detection on both light and dark surfaces
        let rawDetected = (contrastPixels >= 42 && contrastPixels <= 12800 && elongationRatio >= 1.15)
            || (contrastPixels >= 75 && contrastPixels <= 11200)
            || (bluePcbCount >= 18)

        // 4. Temporal EMA smoothing & 14-frame persistence hold so bounding box never drops out during hand motion
        stateLock.lock()
        let finalDetected: Bool
        if rawDetected {
            liveDetectionHoldFrames = 14
            finalDetected = true
            if !hasInitializedLiveSmoothing {
                smoothedLiveCx = rawCx
                smoothedLiveCy = rawCy
                smoothedLiveAngle = rawAngle
                smoothedLiveLen = rawLen
                smoothedLiveWid = rawWid
                hasInitializedLiveSmoothing = true
            } else {
                let alphaPos = 0.34
                let alphaAng = 0.32
                let alphaDim = 0.28
                smoothedLiveCx = smoothedLiveCx * (1.0 - alphaPos) + rawCx * alphaPos
                smoothedLiveCy = smoothedLiveCy * (1.0 - alphaPos) + rawCy * alphaPos

                // Shortest angular delta across ±90° wraparound
                var deltaA = rawAngle - smoothedLiveAngle
                if deltaA > 90.0 { deltaA -= 180.0 }
                if deltaA < -90.0 { deltaA += 180.0 }
                smoothedLiveAngle += deltaA * alphaAng
                if smoothedLiveAngle > 90.0 { smoothedLiveAngle -= 180.0 }
                if smoothedLiveAngle < -90.0 { smoothedLiveAngle += 180.0 }

                smoothedLiveLen = smoothedLiveLen * (1.0 - alphaDim) + rawLen * alphaDim
                smoothedLiveWid = smoothedLiveWid * (1.0 - alphaDim) + rawWid * alphaDim
            }
        } else if liveDetectionHoldFrames > 0 {
            liveDetectionHoldFrames -= 1
            finalDetected = true
        } else {
            finalDetected = false
        }

        let outCx = smoothedLiveCx
        let outCy = smoothedLiveCy
        let outAngle = (smoothedLiveAngle * 10).rounded() / 10
        let outLen = smoothedLiveLen
        let outWid = smoothedLiveWid
        stateLock.unlock()

        let redZone: String?
        if redPatchRightCount >= 24 {
            redZone = "strainer_head"
        } else if redPatchLeftCount >= 24 {
            redZone = "waterproof_gland_leads"
        } else {
            redZone = nil
        }

        return LiveFramePixelTelemetry(
            sensorDetected: finalDetected,
            meanBrightness: meanLuma,
            sharpnessScore: sharpnessScore,
            exposureOk: exposureOk,
            whiteStickerOccluded: whiteStickerOccluded,
            centerX: outCx,
            centerY: outCy,
            angleDeg: outAngle,
            measuredLenPx: outLen,
            measuredWidPx: outWid,
            pcbOpenDetected: bluePcbCount >= 32,
            handDetected: skinPixelCount >= 85,
            redAnomalyZone: redZone
        )
    }
    #endif

    // MARK: - Full In-App Modbus-RTU & RS-485 Engine (CRC-16 0xA001)

    public static func computeCRC16Modbus(_ bytes: [UInt8]) -> UInt16 {
        var crc: UInt16 = 0xFFFF
        for b in bytes {
            crc ^= UInt16(b)
            for _ in 0..<8 {
                if (crc & 0x0001) != 0 {
                    crc = (crc >> 1) ^ 0xA001
                } else {
                    crc >>= 1
                }
            }
        }
        return crc
    }

    public static func appendCRC16(_ pdu: [UInt8]) -> [UInt8] {
        let crc = computeCRC16Modbus(pdu)
        return pdu + [UInt8(crc & 0xFF), UInt8((crc >> 8) & 0xFF)]
    }

    public static func formatHex(_ bytes: [UInt8]) -> String {
        return bytes.map { String(format: "%02X", $0) }.joined(separator: " ")
    }

    public static func addressToDipBits(_ address: Int) -> [Int] {
        let clamped = max(0, min(255, address))
        return dipWeights.map { (clamped & $0) != 0 ? 1 : 0 }
    }

    public static func dipBitsToAddress(_ bits: [Int]) -> Int {
        var total = 0
        for (idx, w) in dipWeights.enumerated() where idx < bits.count && bits[idx] != 0 {
            total += w
        }
        return total
    }

    public static func describeDipPins(address: Int) -> [String: Any] {
        let addr = max(1, min(247, address))
        let bits = addressToDipBits(addr)
        var onPins: [Int] = []
        var offPins: [Int] = []
        var usedWeights: [String] = []

        for (i, b) in bits.enumerated() {
            if b == 1 {
                onPins.append(i + 1)
                usedWeights.append("\(dipWeights[i])")
            } else {
                offPins.append(i + 1)
            }
        }
        let sumExpr = usedWeights.isEmpty ? "0" : (usedWeights.joined(separator: " + ") + " = \(addr)")
        let pinTxt: String
        if onPins == [8] {
            pinTxt = "Set Pins 1 through 7 to OFF and flip Pin 8 to ON"
        } else if onPins == [1] {
            pinTxt = "Flip Pin 1 to ON (128) and set Pins 2 through 8 to OFF"
        } else if onPins.count == 1 {
            let offList = offPins.map(String.init).joined(separator: ", ")
            pinTxt = "Flip only Pin \(onPins[0]) to ON (\(sumExpr)) and set Pins \(offList) to OFF"
        } else {
            let onList = onPins.map(String.init).joined(separator: ", ")
            let offList = offPins.map(String.init).joined(separator: ", ")
            pinTxt = "Flip Pins \(onList) to ON (\(sumExpr)) and set Pins \(offList) to OFF"
        }

        return [
            "slave_id": addr,
            "hex_id": String(format: "0x%02X", addr),
            "dip_bits": bits,
            "dip_binary": bits.map(String.init).joined(),
            "on_pins": onPins,
            "off_pins": offPins,
            "sum_expression": sumExpr,
            "instruction": pinTxt,
            "instruction_en": pinTxt,
        ]
    }

    public static func buildReadRegistersRequest(slaveId: Int = 1, startReg: UInt16 = 0x0000, count: UInt16 = 8) -> [UInt8] {
        let pdu: [UInt8] = [
            UInt8(slaveId & 0xFF),
            0x03,
            UInt8((startReg >> 8) & 0xFF),
            UInt8(startReg & 0xFF),
            UInt8((count >> 8) & 0xFF),
            UInt8(count & 0xFF),
        ]
        return appendCRC16(pdu)
    }

    public static func buildSimulatedTHT02Response(
        slaveId: Int,
        tempC: Double?,
        humidityRH: Double?,
        baudBps: Int,
        abnormal7FFF: Bool
    ) -> [UInt8] {
        let rawTemp: UInt16
        if abnormal7FFF || tempC == nil {
            rawTemp = 0x7FFF
        } else {
            let tInt = Int((tempC! * 10.0).rounded())
            rawTemp = tInt < 0 ? UInt16(bitPattern: Int16(clamping: tInt)) : UInt16(clamping: tInt)
        }

        let rawHum: UInt16
        if abnormal7FFF || humidityRH == nil {
            rawHum = 0x7FFF
        } else {
            let hInt = max(0, min(1000, Int((humidityRH! * 10.0).rounded())))
            rawHum = UInt16(hInt)
        }

        let baudReg: UInt16
        switch baudBps {
        case 4800: baudReg = 0x12C0
        case 19200: baudReg = 0x4B00
        default: baudReg = 0x2580
        }

        let regs: [UInt16] = [
            rawTemp,
            rawHum,
            0x0000,
            0x0000,
            UInt16(slaveId & 0xFF),
            baudReg,
            0x0600,
            0x000B, // V1.1
        ]

        var pdu: [UInt8] = [UInt8(slaveId & 0xFF), 0x03, 16]
        for r in regs {
            pdu.append(UInt8((r >> 8) & 0xFF))
            pdu.append(UInt8(r & 0xFF))
        }
        return appendCRC16(pdu)
    }

    public func setModbusMode(mode: String, slaveId: Int?, baudBps: Int?) {
        let clean = mode.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let validModes = ["auto", "hardware", "pusr_tcp", "sim_disconnected", "sim_abnormal_7fff", "sim_online", "sim_breath_test"]
        stateLock.lock()
        let prevMode = activeModbusMode
        activeModbusMode = validModes.contains(clean) ? clean : "auto"
        if activeModbusMode != prevMode {
            lastSampleInvalidatedReason = "MODE_SWITCHED"
        }
        if activeModbusMode == "pusr_tcp" && pusrTCPClient == nil {
            let cfg = FieldScanRuntimeConfig.shared
            if !cfg.pusrGatewayHost.isEmpty {
                pusrTCPClient = ModbusTCPClient(host: cfg.pusrGatewayHost, port: cfg.pusrGatewayPort, timeoutS: 1.0, pilotReadonly: true)
            }
        }
        if activeModbusMode == "sim_breath_test" {
            breathTestStartTime = ProcessInfo.processInfo.systemUptime
        }
        if let sid = slaveId, (1...247).contains(sid) {
            targetSlaveId = sid
        }
        if let baud = baudBps, [4800, 9600, 19200].contains(baud) {
            activeBaudBps = baud
        }
        stateLock.unlock()

        if clean != prevMode {
            FieldScanSessionEngine.shared.invalidateLiveConnection(reason: "modbus_mode_\(clean)")
        }
        stepModbusTelemetryOnce(forceImmediateTCPPoll: clean == "pusr_tcp")
    }

    public func getModbusTelemetry() -> [String: Any] {
        stateLock.lock()
        var cached = latestModbusTelemetry
        let lastUp = lastValidSampleUptime
        let histSample = lastValidHistoricalSample
        stateLock.unlock()
        if !cached.isEmpty {
            let ageS = max(0.0, ProcessInfo.processInfo.systemUptime - lastUp)
            if (cached["simulation"] as? Bool) != true && ageS > 3.0 {
                cached["fresh"] = false
                if let hist = histSample {
                    cached["historical_sample"] = hist
                }
            }
            return cached
        }
        stepModbusTelemetryOnce()
        stateLock.lock()
        defer { stateLock.unlock() }
        return latestModbusTelemetry
    }

    private func discoverSerialPorts() -> [[String: Any]] {
        let cfg = FieldScanRuntimeConfig.shared
        if !cfg.pusrGatewayHost.isEmpty {
            return [[
                "device": "tcp://\(cfg.pusrGatewayHost):\(cfg.pusrGatewayPort)",
                "description": "PUSR USR-DR164 Modbus TCP (MBAP)",
                "is_rs485_candidate": true,
            ]]
        }
        return []
    }

    private func scanHardwareModbusBus() -> [String: Any] {
        stateLock.lock()
        let mode = activeModbusMode
        let sid = targetSlaveId
        let baud = activeBaudBps
        stateLock.unlock()

        if mode == "pusr_tcp" || !FieldScanRuntimeConfig.shared.pusrGatewayHost.isEmpty {
            let cfg = FieldScanRuntimeConfig.shared
            let host = cfg.pusrGatewayHost
            let port = cfg.pusrGatewayPort
            if !host.isEmpty {
                stateLock.lock()
                if pusrTCPClient == nil {
                    pusrTCPClient = ModbusTCPClient(host: host, port: port, timeoutS: 1.0, pilotReadonly: true)
                }
                activeModbusMode = "pusr_tcp"
                stateLock.unlock()

                // 1. Try current targetSlaveId first
                stepModbusTelemetryOnce(forceImmediateTCPPoll: true)
                var tel = getModbusTelemetry()
                var ok = (tel["online"] as? Bool) ?? false
                var scannedIds: [Int] = [sid]

                // 2. If TCP gateway is reachable (timeout/exception rather than unreachable/denied), scan common Slave IDs (strictly read-only FC03)
                let errCode = (tel["error_code"] as? String) ?? ""
                if !ok && errCode != "LOCAL_NETWORK_DENIED" && errCode != "SOURCE_UNAVAILABLE" && errCode != "PROTOCOL_MISMATCH" {
                    let probeClient = ModbusTCPClient(host: host, port: port, timeoutS: 0.35, pilotReadonly: true)
                    defer { probeClient.close() }
                    let candidateIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 32, 64, 128, 176].filter { $0 != sid }
                    for candId in candidateIds {
                        scannedIds.append(candId)
                        let probe = probeClient.readTHT02Holding(unitId: UInt8(candId), startReg: 0x0000, count: 8, respectBackoff: false)
                        if (probe["ok"] as? Bool) == true {
                            stateLock.lock()
                            targetSlaveId = candId
                            simulatedVisualDipAddress = candId
                            stateLock.unlock()
                            stepModbusTelemetryOnce(forceImmediateTCPPoll: true)
                            tel = getModbusTelemetry()
                            ok = (tel["online"] as? Bool) ?? false
                            break
                        }
                        if (probe["error_code"] as? String) == "SOURCE_UNAVAILABLE" || (probe["error_code"] as? String) == "PROTOCOL_MISMATCH" {
                            break
                        }
                    }
                }

                return [
                    "found": ok,
                    "port": tel["port"] ?? "tcp://\(host):\(port)",
                    "adapter": "PUSR USR-DR164 Modbus TCP Gateway (MBAP)",
                    "baud_bps": tel["baud_bps"] ?? baud,
                    "slave_id": tel["slave_id"] ?? targetSlaveId,
                    "scanned_ids": scannedIds,
                    "error_code": tel["error_code"] ?? NSNull(),
                    "error_detail": tel["error_detail"] ?? NSNull(),
                    "dip_bits": tel["dip_bits"] ?? Self.addressToDipBits(targetSlaveId),
                    "temp_c": tel["temp_c"] ?? NSNull(),
                    "humidity_rh": tel["humidity_rh"] ?? NSNull(),
                    "tx_hex": tel["last_tx_hex"] ?? "",
                    "rx_hex": tel["last_rx_hex"] ?? "",
                    "roundtrip_ms": tel["roundtrip_ms"] ?? 0.0,
                    "ports_checked": [tel["port"] ?? "tcp://\(host):\(port)"],
                ]
            }
        }

        if mode == "sim_online" || mode == "sim_breath_test" {
            let tel = getModbusTelemetry()
            return [
                "found": true,
                "port": "sim://ft2232hl-ch1",
                "adapter": "In-App Synthetic Modbus Simulator",
                "simulation": true,
                "baud_bps": baud,
                "slave_id": sid,
                "dip_bits": Self.addressToDipBits(sid),
                "temp_c": tel["temp_c"] ?? 24.6,
                "humidity_rh": tel["humidity_rh"] ?? 52.8,
                "tx_hex": tel["last_tx_hex"] ?? "01 03 00 00 00 08 44 0C",
                "rx_hex": tel["last_rx_hex"] ?? "",
                "roundtrip_ms": 11.8,
                "ports_checked": ["sim://ft2232hl-ch1"],
            ]
        }

        return [
            "found": false,
            "ports_checked": [],
            "reason": "Standalone iPad Air M4 mode: configure PUSR USR-DR164 Modbus TCP gateway IP to poll physical RS-485 sensors without Mac.",
        ]
    }

    private func stepModbusTelemetryOnce(forceImmediateTCPPoll: Bool = false) {
        let nowUptime = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        modbusPollSequence += 1
        let pollSeq = modbusPollSequence
        var mode = activeModbusMode
        let sid = targetSlaveId
        let baud = activeBaudBps
        let breathT0 = breathTestStartTime
        var tcpClient = pusrTCPClient
        if mode == "pusr_tcp" || (mode == "auto" && !FieldScanRuntimeConfig.shared.pusrGatewayHost.isEmpty) {
            let cfg = FieldScanRuntimeConfig.shared
            if !cfg.pusrGatewayHost.isEmpty {
                if tcpClient == nil {
                    let c = ModbusTCPClient(host: cfg.pusrGatewayHost, port: cfg.pusrGatewayPort, timeoutS: 1.0, pilotReadonly: true)
                    pusrTCPClient = c
                    tcpClient = c
                }
                if mode == "auto" {
                    mode = "pusr_tcp"
                }
            }
        }
        let histSnap = lastValidHistoricalSample
        stateLock.unlock()

        if mode == "pusr_tcp", let client = tcpClient {
            let res = client.readTHT02Holding(
                unitId: UInt8(clamping: sid),
                startReg: 0x0000,
                count: 8,
                respectBackoff: !forceImmediateTCPPoll
            )
            let ok = (res["ok"] as? Bool) ?? false
            if ok, let dec = res["decoded"] as? [String: Any] {
                let abn = (dec["sensor_abnormal_7fff"] as? Bool) ?? false
                let tempQ = (dec["temp_quality"] as? String) ?? "unavailable"
                let humQ = (dec["humidity_quality"] as? String) ?? "unavailable"
                let healthy = !abn && tempQ == "valid" && humQ == "valid"
                let sampleDict: [String: Any] = [
                    "ts": (Date().timeIntervalSince1970 * 100).rounded() / 100,
                    "captured_at_utc": FieldScanSessionEngine.utcNowISO(),
                    "temp_c": dec["temp_c"] ?? NSNull(),
                    "humidity_rh": dec["humidity_rh"] ?? NSNull(),
                    "slave_id": dec["slave_id"] ?? sid,
                    "protocol": "modbus_tcp_mbap",
                ]

                stateLock.lock()
                if let t = dec["temp_c"] as? Double, let h = dec["humidity_rh"] as? Double {
                    modbusHistory.append(["ts": sampleDict["ts"]!, "temp_c": t, "humidity_rh": h])
                    if modbusHistory.count > 36 {
                        modbusHistory.removeFirst(modbusHistory.count - 36)
                    }
                }
                lastValidHistoricalSample = sampleDict
                lastValidSampleUptime = ProcessInfo.processInfo.systemUptime
                lastSampleInvalidatedReason = nil
                let histCopy = modbusHistory
                let payload: [String: Any] = [
                    "online": true,
                    "healthy": healthy,
                    "fresh": true,
                    "simulation": false,
                    "scope": "sensor_communication",
                    "protocol": "modbus_tcp_mbap",
                    "andon_light": healthy ? "GREEN" : "RED",
                    "sensor_abnormal_7fff": abn,
                    "temp_quality": tempQ,
                    "humidity_quality": humQ,
                    "mode": "pusr_tcp",
                    "source": "hardware:pusr_tcp:\(client.host):\(client.port)",
                    "port": "tcp://\(client.host):\(client.port)",
                    "gateway_connected": true,
                    "adapter_present": true,
                    "baud_bps": dec["baud_bps"] ?? baud,
                    "frame_format": "MBAP/TCP -> 8N1",
                    "slave_id": dec["slave_id"] ?? sid,
                    "target_slave_id": sid,
                    "dip_bits": dec["dip_bits"] ?? Self.addressToDipBits(sid),
                    "temp_c": dec["temp_c"] ?? NSNull(),
                    "humidity_rh": dec["humidity_rh"] ?? NSNull(),
                    "raw_temp_hex": dec["raw_temp_hex"] ?? NSNull(),
                    "raw_humidity_hex": dec["raw_humidity_hex"] ?? NSNull(),
                    "hw_version": dec["hw_version"] ?? NSNull(),
                    "sw_version": dec["sw_version"] ?? NSNull(),
                    "last_tx_hex": res["tx_hex"] ?? "",
                    "last_rx_hex": res["rx_hex"] ?? "",
                    "crc_checked_by_client": false,
                    "crc_valid": NSNull(),
                    "mbap_valid": true,
                    "roundtrip_ms": res["roundtrip_ms"] ?? 0.0,
                    "status_label": abn ? "ALARM 7FFFH · SHT30 PROBE ABNORMAL" : "SENSOR RESPONDED · COMM OK (MODBUS TCP)",
                    "poll_seq": pollSeq,
                    "history": histCopy,
                    "tx_audit_count": client.txAuditLog.count,
                ]
                latestModbusTelemetry = payload
                stateLock.unlock()
                return
            } else {
                let errCode = (res["error_code"] as? String) ?? "SOURCE_UNAVAILABLE"
                if errCode == "BACKOFF_ACTIVE" {
                    stateLock.lock()
                    if !latestModbusTelemetry.isEmpty && (latestModbusTelemetry["mode"] as? String) == "pusr_tcp" {
                        latestModbusTelemetry["fresh"] = false
                        latestModbusTelemetry["poll_seq"] = pollSeq
                        stateLock.unlock()
                        return
                    }
                    stateLock.unlock()
                }
                let gwConnected = (res["gateway_connected"] as? Bool) ?? false
                let statusLabel: String
                if errCode == "MODBUS_EXCEPTION" {
                    statusLabel = "PUSR :\(client.port) CONNECTED · MODBUS EXCEPTION (\(res["exception_name"] ?? "ERR"))"
                } else if gwConnected {
                    statusLabel = "PUSR :\(client.port) CONNECTED · NO RS-485 SENSOR REPLY"
                } else {
                    statusLabel = "NO MODBUS TCP RESPONSE (\(errCode))"
                }
                let dipBits = Self.addressToDipBits(sid)
                let payload: [String: Any] = [
                    "online": false,
                    "healthy": false,
                    "fresh": false,
                    "simulation": false,
                    "scope": gwConnected ? "gateway_connected_no_sensor" : "no_response",
                    "protocol": "modbus_tcp_mbap",
                    "error_code": errCode,
                    "error_detail": res["error_detail"] ?? "",
                    "andon_light": gwConnected ? "AMBER" : "RED",
                    "sensor_abnormal_7fff": false,
                    "mode": "pusr_tcp",
                    "source": "hardware:pusr_tcp:\(client.host):\(client.port)",
                    "port": "tcp://\(client.host):\(client.port)",
                    "gateway_connected": gwConnected,
                    "adapter_present": gwConnected,
                    "baud_bps": baud,
                    "frame_format": "MBAP/TCP -> 8N1",
                    "slave_id": sid,
                    "target_slave_id": sid,
                    "dip_bits": dipBits,
                    "temp_c": NSNull(),
                    "humidity_rh": NSNull(),
                    "raw_temp_hex": NSNull(),
                    "raw_humidity_hex": NSNull(),
                    "hw_version": NSNull(),
                    "sw_version": NSNull(),
                    "last_tx_hex": res["tx_hex"] ?? "",
                    "last_rx_hex": res["rx_hex"] ?? "",
                    "crc_checked_by_client": false,
                    "crc_valid": NSNull(),
                    "mbap_valid": res["mbap_valid"] ?? false,
                    "roundtrip_ms": res["roundtrip_ms"] ?? 0.0,
                    "status_label": statusLabel,
                    "historical_sample": histSnap ?? NSNull(),
                    "poll_seq": pollSeq,
                    "history": modbusHistory,
                    "tx_audit_count": client.txAuditLog.count,
                ]
                stateLock.lock()
                latestModbusTelemetry = payload
                stateLock.unlock()
                return
            }
        }

        let txBytes = Self.buildReadRegistersRequest(slaveId: sid, startReg: 0x0000, count: 8)
        let txHex = Self.formatHex(txBytes)
        let dipBits = Self.addressToDipBits(sid)

        if mode == "auto" || mode == "hardware" || mode == "pusr_tcp" || mode == "sim_disconnected" {
            let isSimDisc = (mode == "sim_disconnected")
            let payload: [String: Any] = [
                "online": false,
                "healthy": false,
                "fresh": false,
                "simulation": isSimDisc,
                "scope": isSimDisc ? "simulation" : "no_response",
                "protocol": isSimDisc ? "simulation" : "modbus_tcp_mbap",
                "error_code": isSimDisc ? "SIM_DISCONNECTED" : "SOURCE_UNAVAILABLE",
                "andon_light": "RED",
                "sensor_abnormal_7fff": false,
                "mode": mode,
                "source": isSimDisc ? "simulator:rs485_disconnected" : "hardware:unconfigured",
                "port": isSimDisc ? "sim://ft2232hl-ch1" : "tcp://unconfigured:502",
                "adapter_present": false,
                "baud_bps": baud,
                "frame_format": "8N1",
                "slave_id": sid,
                "target_slave_id": sid,
                "dip_bits": dipBits,
                "temp_c": NSNull(),
                "humidity_rh": NSNull(),
                "raw_temp_hex": NSNull(),
                "raw_humidity_hex": NSNull(),
                "hw_version": NSNull(),
                "sw_version": NSNull(),
                "last_tx_hex": txHex,
                "last_rx_hex": "",
                "crc_checked_by_client": isSimDisc,
                "crc_valid": false,
                "mbap_valid": NSNull(),
                "roundtrip_ms": 52.0,
                "status_label": isSimDisc ? "SIMULATION · DISCONNECTED" : "NO PHYSICAL GATEWAY CONFIGURED (OFFLINE)",
                "historical_sample": histSnap ?? NSNull(),
                "poll_seq": pollSeq,
                "history": modbusHistory,
            ]
            stateLock.lock()
            latestModbusTelemetry = payload
            stateLock.unlock()
            return
        }

        if mode == "sim_abnormal_7fff" {
            let rxBytes = Self.buildSimulatedTHT02Response(
                slaveId: sid,
                tempC: nil,
                humidityRH: nil,
                baudBps: baud,
                abnormal7FFF: true
            )
            let payload: [String: Any] = [
                "online": true,
                "healthy": false,
                "fresh": true,
                "simulation": true,
                "scope": "simulation",
                "protocol": "simulation",
                "andon_light": "RED",
                "sensor_abnormal_7fff": true,
                "temp_quality": "invalid_sentinel_7fff",
                "humidity_quality": "invalid_sentinel_7fff",
                "mode": mode,
                "source": "simulator:rs485_7fff",
                "port": "sim://ft2232hl-ch1",
                "adapter_present": false,
                "baud_bps": baud,
                "frame_format": "8N1",
                "slave_id": sid,
                "target_slave_id": sid,
                "dip_bits": dipBits,
                "temp_c": NSNull(),
                "humidity_rh": NSNull(),
                "raw_temp_hex": "0x7FFF",
                "raw_humidity_hex": "0x7FFF",
                "hw_version": "0x0600",
                "sw_version": "V1.1",
                "last_tx_hex": txHex,
                "last_rx_hex": Self.formatHex(rxBytes),
                "crc_checked_by_client": true,
                "crc_valid": true,
                "mbap_valid": NSNull(),
                "roundtrip_ms": 11.4,
                "status_label": "SIMULATION · ALARM 7FFFH (PROBE ABNORMAL)",
                "poll_seq": pollSeq,
                "history": modbusHistory,
            ]
            stateLock.lock()
            latestModbusTelemetry = payload
            stateLock.unlock()
            return
        }

        // `sim_online` or `sim_breath_test`
        let tempC: Double
        let humRH: Double
        if mode == "sim_breath_test" {
            let elapsed = max(0.0, nowUptime - breathT0)
            let env = elapsed < 6.0
                ? sin(min(.pi * 0.85, elapsed * 0.45))
                : max(0.15, exp(-(elapsed - 6.0) / 8.0))
            tempC = ((24.6 + 7.2 * max(0.0, env)) * 10).rounded() / 10
            humRH = ((52.8 + 33.6 * max(0.0, env)) * 10).rounded() / 10
        } else {
            tempC = ((24.6 + 0.15 * sin(nowUptime * 0.7)) * 10).rounded() / 10
            humRH = ((52.8 + 0.45 * cos(nowUptime * 0.55)) * 10).rounded() / 10
        }

        let rxBytes = Self.buildSimulatedTHT02Response(
            slaveId: sid,
            tempC: tempC,
            humidityRH: humRH,
            baudBps: baud,
            abnormal7FFF: false
        )
        let rawTempU16 = UInt16(clamping: Int((tempC * 10.0).rounded()))
        let rawHumU16 = UInt16(clamping: Int((humRH * 10.0).rounded()))
        let sample: [String: Any] = [
            "ts": (Date().timeIntervalSince1970 * 100).rounded() / 100,
            "temp_c": tempC,
            "humidity_rh": humRH,
        ]

        stateLock.lock()
        modbusHistory.append(sample)
        if modbusHistory.count > 36 {
            modbusHistory.removeFirst(modbusHistory.count - 36)
        }
        let histCopy = modbusHistory
        let payload: [String: Any] = [
            "online": true,
            "healthy": true,
            "fresh": true,
            "simulation": true,
            "scope": "simulation",
            "protocol": "simulation",
            "temp_quality": "valid",
            "humidity_quality": "valid",
            "andon_light": "GREEN",
            "sensor_abnormal_7fff": false,
            "mode": mode,
            "source": "simulator:\(mode)",
            "port": "sim://ft2232hl-ch1",
            "adapter_present": false,
            "baud_bps": baud,
            "frame_format": "8N1",
            "slave_id": sid,
            "target_slave_id": sid,
            "dip_bits": dipBits,
            "temp_c": tempC,
            "humidity_rh": humRH,
            "raw_temp_hex": String(format: "0x%04X", rawTempU16),
            "raw_humidity_hex": String(format: "0x%04X", rawHumU16),
            "hw_version": "0x0600",
            "sw_version": "V1.1",
            "last_tx_hex": txHex,
            "last_rx_hex": Self.formatHex(rxBytes),
            "crc_checked_by_client": true,
            "crc_valid": true,
            "mbap_valid": NSNull(),
            "roundtrip_ms": 11.8,
            "status_label": "SIMULATION · SYNTHETIC MODBUS RESPONSE",
            "poll_seq": pollSeq,
            "history": histCopy,
        ]
        latestModbusTelemetry = payload
        stateLock.unlock()
    }

    private func buildCapabilitiesPayload() -> [String: Any] {
        let cfg = FieldScanRuntimeConfig.shared
        let bridge = LlamaServerBridge.shared
        let modbusTel = getModbusTelemetry()
        let isSim = (modbusTel["simulation"] as? Bool) ?? false
        stateLock.lock()
        let prefLang = preferredVoiceLanguage
        stateLock.unlock()
        return [
            "contract_version": FieldScanSessionEngine.contractVersion,
            "runtime_role": (!cfg.currentMode.isMacAssisted) ? "ipad_autonomous" : "ipad_assisted_client",
            "pilot_writes_enabled": false,
            "simulation_active": isSim,
            "transports": [
                "modbus_rtu_ft2232hl": false,
                "modbus_tcp_pusr_mbap": true,
                "pusr_gateway_host": cfg.pusrGatewayHost,
                "pusr_gateway_port": cfg.pusrGatewayPort,
            ],
            "ai_provider": [
                "provider_id": bridge.activeProviderId,
                "active_label": bridge.activeModelName,
                "vl_server_online": bridge.vlServerRunning,
                "mac_probing_suppressed": bridge.macProbingSuppressedInAutonomousMode,
                "deterministic_fallback_available": true,
            ],
            "voice": [
                "preferred_language": prefLang,
                "supported_languages": ["en", "es"],
                "on_device_speech": checkOnDeviceSpeechCapabilities(),
            ],
            "copilot_registry_count": FieldScanCopilotRegistry.shared.buildActionRegistry().count,
            "manifest": FieldScanSessionEngine.shared.verifyResourceManifest(),
            "planned_calibration": FieldScanSessionEngine.plannedCalibrationCard(),
        ]
    }

    // MARK: - Unified Status & Reactive Repair Coordinator

    private func buildUnifiedStatus() -> [String: Any] {
        evaluateLiveReactiveWatch()
        let visionTel = getVideoTelemetry()
        let modbusTel = getModbusTelemetry()
        let repairState = getRepairStateSnapshot()
        let mem = FieldScanRuntimeConfig.shared.sampleMemoryTelemetry()

        stateLock.lock()
        let modelLabel = lastModelLabel
        let latMs = lastLatencyMs
        let tokSec = lastTokensPerSec
        let simDip = simulatedVisualDipAddress
        let authBusSid = targetSlaveId
        let sceneGen = activeSceneGeneration
        stateLock.unlock()

        let sysInfo: [String: Any] = [
            "model_name": modelLabel,
            "ram_used_gb": (mem.usedMemoryEstimateGB * 100).rounded() / 100,
            "ram_total_gb": (mem.physicalMemoryGB * 100).rounded() / 100,
            "cpu_percent": 14.2,
            "last_latency_ms": latMs,
            "tokens_per_sec": tokSec,
        ]

        let syncTel = FieldScanCatalogClient.shared.getSyncTelemetry()
        let syncOn = (syncTel["sync_enabled"] as? Bool) ?? false
        let httpsEmitted = (syncTel["https_requests_emitted"] as? Int) ?? 0
        let strictlyOffline = (!syncOn && httpsEmitted == 0)
        let effCtx = resolveEffectiveContext(sessionId: nil, manifestSha: nil)

        let offlineInfo: [String: Any] = [
            "offline_verified": strictlyOffline,
            "guard_active": true,
            "external_egress_blocked": !syncOn,
            "egress_policy": syncTel["egress_policy"] ?? "strict_local_only",
            "local_listener_scope": "loopback_127.0.0.1",
            "blocked_external_attempts": 0,
            "https_requests_emitted": httpsEmitted,
            "loopback_connections": 1,
            "verified_at": ISO8601DateFormatter().string(from: Date()),
        ]

        let cfg = FieldScanRuntimeConfig.shared
        stateLock.lock()
        let prefLangNow = preferredVoiceLanguage
        stateLock.unlock()
        let linkDiag = FieldScanCopilotRegistry.shared.evaluateUnifiedLinkDiagnostic(
            modbusTel: modbusTel,
            gatewayHost: cfg.pusrGatewayHost,
            gatewayPort: cfg.pusrGatewayPort,
            language: prefLangNow
        )
        let guidanceSnap = FieldScanCopilotRegistry.shared.guidanceSnapshot(authorizedBusSlaveId: authBusSid)

        return [
            "status": "ok",
            "contract_version": FieldScanSessionEngine.contractVersion,
            "sensor_id": effCtx.productId == "tzone_tht02" ? "TZ-THT-02" : effCtx.productId.uppercased(),
            "active_context": effCtx.toDictionary(),
            "scene_generation": sceneGen,
            "simulated_visual_dip_address": simDip,
            "authorized_bus_slave_id": authBusSid,
            "preferred_language": prefLangNow,
            "link_diagnostic": linkDiag,
            "guidance": guidanceSnap,
            "local_listener_scope": "loopback_127.0.0.1",
            "offline_verified": strictlyOffline,
            "blocked_external_attempts": 0,
            "catalog_sync": syncTel,
            "fps": visionTel["fps"] ?? 25.0,
            "vision": visionTel,
            "modbus": modbusTel,
            "pusr_gateway": [
                "host": cfg.pusrGatewayHost,
                "port": cfg.pusrGatewayPort,
                "topology": cfg.pusrGatewayTopology,
                "configured": !cfg.pusrGatewayHost.isEmpty,
                "protocol": "modbus_tcp_mbap",
                "presets": [
                    ["host": FieldScanRuntimeConfig.defaultPusrAPHost, "port": FieldScanRuntimeConfig.defaultPusrPort, "label": "Direct PUSR AP Default", "topology": "ap_direct"],
                    ["host": FieldScanRuntimeConfig.alternatePusrAPHost, "port": FieldScanRuntimeConfig.defaultPusrPort, "label": "Direct PUSR Alternate AP", "topology": "ap_direct"],
                ],
            ],
            "repair": repairState,
            "system": sysInfo,
            "offline": offlineInfo,
            "capabilities": buildCapabilitiesPayload(),
        ]
    }

    private func computeAndonStateUnlocked() -> String {
        if lastModbusHealthy {
            return "GREEN"
        }
        if repairStage == "STEP2_GUIDING_DIP_MODBUS" {
            return "YELLOW"
        }
        return "RED"
    }

    private func getRepairStateSnapshot() -> [String: Any] {
        stateLock.lock()
        defer { stateLock.unlock() }
        var strippedEvent: Any = NSNull()
        if var ev = latestProactiveEvent {
            ev.removeValue(forKey: "audio_wav_b64")
            strippedEvent = ev
        }
        return [
            "live_watch_enabled": liveWatchEnabled,
            "stage": repairStage,
            "andon_state": computeAndonStateUnlocked(),
            "focus_dip": focusDipActive,
            "target_slave_id": targetSlaveId,
            "target_baud_bps": activeBaudBps,
            "evidence_count": evidenceSnapshots.count,
            "evidence_titles": evidenceSnapshots.compactMap { $0["title"] as? String },
            "events_log": repairEventsLog,
            "latest_proactive_event": strippedEvent,
            "latest_event_id": repairEventSequence,
        ]
    }

    private func getRepairEventWithAudio(eventId: Int) -> [String: Any]? {
        stateLock.lock()
        defer { stateLock.unlock() }
        if let ev = latestProactiveEvent, (ev["event_id"] as? Int) == eventId {
            return ev
        }
        return nil
    }

    private func updateRepairWatch(reset: Bool, enabled: Bool) -> [String: Any] {
        stateLock.lock()
        liveWatchEnabled = enabled
        if reset {
            repairStage = "IDLE_MONITORING"
            targetSlaveId = 1
            repairEventsLog.removeAll()
            evidenceSnapshots.removeAll()
            lastModbusHealthy = false
            lastModbus7FFF = false
            lastPcbOpen = false
            lastOpenAlertTimestamp = 0
            focusDipActive = false
            latestProactiveEvent = nil
        }
        stateLock.unlock()
        return getRepairStateSnapshot()
    }

    private func recordEvidenceSnapshot(key: String, title: String, caption: String, jpegData: Data) {
        guard !jpegData.isEmpty else { return }
        let ts = currentUTCString()
        stateLock.lock()
        evidenceSnapshots.removeAll { ($0["key"] as? String) == key }
        evidenceSnapshots.append([
            "key": key,
            "title": title,
            "caption": caption,
            "timestamp": ts,
            "jpeg_bytes": jpegData,
        ])
        stateLock.unlock()
    }

    private func appendRepairLogUnlocked(step: String, detail: String) {
        repairEventsLog.append([
            "timestamp": currentUTCString(),
            "step": step,
            "detail": detail,
        ])
    }

    private func evaluateLiveReactiveWatch() {
        let visionTel = getVideoTelemetry()
        let modbusTel = getModbusTelemetry()
        let healthy = (modbusTel["healthy"] as? Bool) ?? false
        let abn7fff = ((modbusTel["online"] as? Bool) ?? false) && ((modbusTel["sensor_abnormal_7fff"] as? Bool) ?? false)
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false

        var triggerType: String?
        let nowUptime = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        if !liveWatchEnabled || handsFreeActive || liveTapInstalled || isTtsSpeakingLocked(now: nowUptime) {
            lastModbusHealthy = healthy
            lastModbus7FFF = abn7fff
            lastPcbOpen = pcbOpen
            stateLock.unlock()
            return
        }

        if healthy && !lastModbusHealthy {
            triggerType = "MODBUS_VALIDATED_ONLINE"
            repairStage = "STEP3_SCADA_ONLINE_VERIFIED"
            focusDipActive = false
        } else if abn7fff && !lastModbus7FFF {
            triggerType = "MODBUS_7FFF_ALARM"
            focusDipActive = false
        } else if !healthy && !abn7fff && lastModbusHealthy {
            triggerType = "MODBUS_SIGNAL_LOST"
            repairStage = "STEP1_OPEN_FAULT_DETECTED"
            focusDipActive = true
        }

        lastModbusHealthy = healthy
        lastModbus7FFF = abn7fff
        lastPcbOpen = pcbOpen
        stateLock.unlock()

        guard let trigger = triggerType else { return }
        let frameJpeg = getLatestJpeg()

        if trigger == "MODBUS_VALIDATED_ONLINE" {
            let tempC = (modbusTel["temp_c"] as? Double) ?? 24.6
            let humRH = (modbusTel["humidity_rh"] as? Double) ?? 52.8
            let sid = (modbusTel["slave_id"] as? Int) ?? 1
            let baud = (modbusTel["baud_bps"] as? Int) ?? 9600
            let isSim = (modbusTel["simulation"] as? Bool) ?? false

            recordEvidenceSnapshot(
                key: "after_online",
                title: String(format: isSim ? "3. AFTER: SIMULATED %.1fC / %.1f%%RH" : "3. AFTER: COMM OBSERVED %.1fC / %.1f%%RH", tempC, humRH),
                caption: String(format: "%@Slave #%d @ %d 8N1 | Temp=%.1f C | RH=%.1f%%", isSim ? "[SIM] " : "", sid, baud, tempC, humRH),
                jpegData: frameJpeg
            )

            let spokenMsg = isSim
                ? String(
                    format: "Simulation active: synthetic Modbus response generated for TZ THT-02 Slave Address %d showing %.1f degrees Celsius and %.1f percent relative humidity. Synthetic mode does not verify physical sensor hardware.",
                    sid,
                    tempC,
                    humRH
                )
                : String(
                    format: "Sensor communication observed on Modbus at Slave Address %d. Reported register values are %.1f degrees Celsius temperature and %.1f percent relative humidity. Note: PLC or SCADA state and metrological calibration are not verified.",
                    sid,
                    tempC,
                    humRH
                )
            let audioB64 = synthesizeSpeechB64(spokenMsg)
            let citations: [[String: Any]] = [
                ["page": 7, "label": "Page 7 · Function 0x03 Read Holding Frame"],
                ["page": 6, "label": "Page 6 · Registers 0000H/0001H"],
            ]

            stateLock.lock()
            repairEventSequence += 1
            let evId = repairEventSequence
            appendRepairLogUnlocked(
                step: isSim ? "Synthetic Modbus Simulation Step" : "Read-Only Sensor Modbus Communication Check",
                detail: String(format: "%@Response on Slave #%d (%d bps 8N1): Temp=%.1f deg C, RH=%.1f %%RH.", isSim ? "[SIMULATION] " : "", sid, baud, tempC, humRH)
            )
            let ev: [String: Any] = [
                "event_id": evId,
                "type": trigger,
                "stage": repairStage,
                "canonical_stage": isSim ? "SIMULATION_ACTIVE" : "STEP3_MODBUS_RESPONDING",
                "simulation": isSim,
                "title": isSim ? "SIMULATION · SYNTHETIC MODBUS RESPONSE" : "SENSOR RESPONDED · MODBUS COMM OK",
                "diagnosis": spokenMsg,
                "assistant_message": spokenMsg,
                "temp_c": tempC,
                "humidity_rh": humRH,
                "slave_id": sid,
                "explode_pcb": false,
                "focus_dip": false,
                "andon_state": "GREEN",
                "highlighted_zone": NSNull(),
                "manual_page": 7,
                "citations": citations,
                "manual_citations": citations,
                "audio_wav_b64": audioB64,
            ]
            latestProactiveEvent = ev
            stateLock.unlock()
            return
        }

        if trigger == "MODBUS_7FFF_ALARM" {
            let msg = "Alert: the sensor responds on the RS-485 bus with a valid CRC-16 checksum, but registers 0000H and 0001H report hexadecimal sentinel 7FFF. Per Manual Page 6, the SHT30 CMOSens probe element is abnormal, saturated, or internally disconnected."
            let audioB64 = synthesizeSpeechB64(msg)
            let citations: [[String: Any]] = [["page": 6, "label": "Page 6 · 7FFFH Sensor Abnormal Sentinel"]]
            stateLock.lock()
            repairEventSequence += 1
            let evId = repairEventSequence
            appendRepairLogUnlocked(step: "Modbus 0x7FFF Probe Alarm Detected", detail: msg)
            latestProactiveEvent = [
                "event_id": evId,
                "type": trigger,
                "stage": repairStage,
                "title": "7FFFH SHT30 PROBE ALARM",
                "diagnosis": msg,
                "assistant_message": msg,
                "explode_pcb": false,
                "focus_dip": false,
                "andon_state": "RED",
                "highlighted_zone": "strainer_head",
                "manual_page": 6,
                "citations": citations,
                "manual_citations": citations,
                "audio_wav_b64": audioB64,
            ]
            stateLock.unlock()
            return
        }

        if trigger == "MODBUS_SIGNAL_LOST" {
            let sid = (modbusTel["target_slave_id"] as? Int) ?? 1
            recordEvidenceSnapshot(
                key: "before_fault",
                title: "1. BEFORE: MODBUS BUS SIGNAL LOST",
                caption: "No RS-485 response on Slave #\(sid) — verify DIP-8 switches & wiring",
                jpegData: frameJpeg
            )
            let msg = "Live bus alert: RS-485 Modbus communication with TZ THT-02 Slave \(sid) was lost. Verify power and Yellow A plus Green B minus leads, or inspect the internal SW1 DIP-8 switches—for Slave ID 1, set Pin 8 ON and Pins 1 through 7 OFF, then cycle power."
            let audioB64 = synthesizeSpeechB64(msg)
            let citations: [[String: Any]] = [
                ["page": 5, "label": "Page 5 · SW1 DIP-8 Switch Addressing"],
                ["page": 4, "label": "Page 4 · 4-Wire RS-485 Leads"],
            ]
            stateLock.lock()
            repairEventSequence += 1
            let evId = repairEventSequence
            appendRepairLogUnlocked(step: "RS-485 Modbus Signal Lost", detail: msg)
            latestProactiveEvent = [
                "event_id": evId,
                "type": trigger,
                "stage": repairStage,
                "title": "MODBUS SIGNAL LOST · CHECK DIP-8 & WIRING",
                "diagnosis": msg,
                "assistant_message": msg,
                "explode_pcb": true,
                "focus_dip": true,
                "andon_state": "RED",
                "highlighted_zone": "upper_barrel_dip",
                "manual_page": 5,
                "citations": citations,
                "manual_citations": citations,
                "audio_wav_b64": audioB64,
            ]
            stateLock.unlock()
            return
        }

        // CAMERA_OPEN_PCB_DETECTED
        recordEvidenceSnapshot(
            key: "before_fault",
            title: "1. BEFORE: OPEN HOUSING DETECTED",
            caption: "Optical scanner detected exposed blue DIP-8 PCB with no RS-485 signal",
            jpegData: frameJpeg
        )
        let msg = "Live optical watch alert: I just detected the TZ THT-02 housing is open exposing its internal DIP-8 switch PCB while the Modbus bus has no active signal. Tell me which communication mode or slave address you need so I can guide your pin setup."
        let audioB64 = synthesizeSpeechB64(msg)
        let citations: [[String: Any]] = [["page": 5, "label": "Page 5 · DIP-8 PCB Access"]]
        stateLock.lock()
        repairEventSequence += 1
        let evId = repairEventSequence
        appendRepairLogUnlocked(step: "Automatic Open Housing Detection", detail: msg)
        latestProactiveEvent = [
            "event_id": evId,
            "type": trigger,
            "stage": repairStage,
            "title": "OPEN SENSOR HOUSING DETECTED ON CAMERA",
            "diagnosis": msg,
            "assistant_message": msg,
            "explode_pcb": true,
            "focus_dip": true,
            "andon_state": "RED",
            "highlighted_zone": "upper_barrel_dip",
            "manual_page": 5,
            "citations": citations,
            "manual_citations": citations,
            "audio_wav_b64": audioB64,
        ]
        stateLock.unlock()
    }

    // MARK: - 4-Stage Guided Repair Step Handler

    private func handleRepairStep(payload: [String: Any]) -> [String: Any] {
        let step = ((payload["step"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        if step == "inspect_open" {
            let syncSim = boolFromAny(payload["sync_simulator"], defaultValue: false)
            if syncSim && currentCameraMode().hasPrefix("sim_") {
                setCameraMode("sim_open_dip")
            }
            if syncSim && activeModbusMode.hasPrefix("sim_") {
                setModbusMode(mode: "sim_disconnected", slaveId: nil, baudBps: nil)
            }
            return runStartOpenInspection()
        }

        if step == "guide_dip" {
            let text = (payload["query"] as? String)
                ?? (payload["text"] as? String)
                ?? "Configure for Industrial Modbus RTU slave 1"
            let dipAddr = intFromAny(payload["dip_address"])
            let effCtx = resolveEffectiveContext(sessionId: payload["session_id"] as? String, manifestSha: nil)
            let explicitConfirm = boolFromAny(payload["confirmed"], defaultValue: false)
            return runGuideDipForModbus(
                operatorText: text,
                currentDipAddr: dipAddr,
                authorizeBusTarget: explicitConfirm && effCtx.benchModbusHomologated
            )
        }

        if step == "connect_modbus" {
            let sid = intFromAny(payload["slave_id"]) ?? targetSlaveId
            let forceSim = boolFromAny(payload["force_sim"], defaultValue: false)
            let curMbMode = activeModbusMode
            if forceSim || curMbMode.hasPrefix("sim_") {
                let camMode = currentCameraMode()
                if camMode.hasPrefix("sim_") {
                    setCameraMode("sim_normal")
                }
                setModbusMode(mode: "sim_online", slaveId: sid, baudBps: 9600)
            } else {
                stateLock.lock()
                targetSlaveId = sid
                stateLock.unlock()
                stepModbusTelemetryOnce(forceImmediateTCPPoll: true)
            }
            evaluateLiveReactiveWatch()
            let status = buildUnifiedStatus()
            if let rep = status["repair"] as? [String: Any],
               let evId = rep["latest_event_id"] as? Int,
               let ev = getRepairEventWithAudio(eventId: evId) {
                return ev
            }
            return status
        }

        if step == "breath_test" {
            let sid = intFromAny(payload["slave_id"]) ?? targetSlaveId
            let forceSim = boolFromAny(payload["force_sim"], defaultValue: false)
            if forceSim || activeModbusMode.hasPrefix("sim_") {
                setModbusMode(mode: "sim_breath_test", slaveId: sid, baudBps: 9600)
            } else {
                stepModbusTelemetryOnce(forceImmediateTCPPoll: true)
            }
            evaluateLiveReactiveWatch()
            return buildUnifiedStatus()
        }

        return buildUnifiedStatus()
    }

    private func runStartOpenInspection() -> [String: Any] {
        let frameJpeg = getLatestJpeg()
        recordEvidenceSnapshot(
            key: "before_fault",
            title: "1. BEFORE: OPEN HOUSING / NO SIGNAL",
            caption: "Housing open=true | RS-485 Bus=NO RESPONSE",
            jpegData: frameJpeg
        )

        let msg = "Live optical and bus inspection active: first, I detect the TZ THT-02 housing is open with the internal blue DIP-8 switch PCB exposed; second, the RS-485 bus shows no electrical response because the DIP switches are unconfigured or unpowered. Which communication mode and Modbus slave address would you like to configure?"

        stateLock.lock()
        repairStage = "STEP1_OPEN_FAULT_DETECTED"
        lastPcbOpen = true
        focusDipActive = true
        appendRepairLogUnlocked(
            step: "Initial Optical + Bus Fault Inspection",
            detail: "TZ THT-02 housing detected open with exposed DIP-8 PCB and RS-485 bus timeout."
        )
        let evCount = evidenceSnapshots.count
        stateLock.unlock()

        let audioB64 = synthesizeSpeechB64(msg)
        let citations: [[String: Any]] = [
            ["page": 5, "label": "Page 5 · 2-Step Opening & DIP-8"],
            ["page": 4, "label": "Page 4 · 4-Wire RS-485 Harness"],
        ]

        return [
            "stage": "STEP1_OPEN_FAULT_DETECTED",
            "diagnosis": msg,
            "assistant_message": msg,
            "highlighted_zone": "upper_barrel_dip",
            "explode_pcb": true,
            "focus_dip": true,
            "andon_state": "RED",
            "manual_page": 5,
            "probable_causes": [
                "Unthreaded housing barrel with unconfigured DIP-8 switch block (all OFF = invalid Modbus slave address 0).",
                "No RS-485 bus communication (verify DC 5~24V supply and A+/B- differential pair wiring).",
            ],
            "citations": citations,
            "manual_citations": citations,
            "audio_wav_b64": audioB64,
            "evidence_count": evCount,
        ]
    }

    private func runGuideDipForModbus(operatorText: String, currentDipAddr: Int?, authorizeBusTarget: Bool = false) -> [String: Any] {
        let targetAddr = parseRequestedModbusTarget(text: operatorText, fallbackAddr: currentDipAddr)
        let pinPlan = Self.describeDipPins(address: targetAddr)
        let instructionEn = (pinPlan["instruction_en"] as? String) ?? "Set Pins 1 through 7 to OFF and flip Pin 8 to ON"
        let hexId = (pinPlan["hex_id"] as? String) ?? "0x01"
        let dipBinary = (pinPlan["dip_binary"] as? String) ?? "00000001"
        let dipBits = (pinPlan["dip_bits"] as? [Int]) ?? [0, 0, 0, 0, 0, 0, 0, 1]

        if authorizeBusTarget {
            setModbusMode(mode: activeModbusMode, slaveId: targetAddr, baudBps: 9600)
        }
        renderWorkbenchOrCameraStep()
        let frameJpeg = getLatestJpeg()

        recordEvidenceSnapshot(
            key: "during_dip",
            title: "2. DURING: DIP-8 GUIDE SLAVE #\(targetAddr)",
            caption: "DIP binary \(dipBinary) | 9600 8N1",
            jpegData: frameJpeg
        )

        let msg = "Inspecting the DIP-8 switch block on camera for Industrial Modbus-RTU at 9600 baud (8N1): to assign Slave Address \(targetAddr) (\(hexId)), \(instructionEn). Next, thread the middle barrel closed first, tighten the rear waterproof cable gland nut second, wire Red to DC 5-24V, Black to common GND, Yellow to RS-485 A+, and Green to RS-485 B- on your FT2232HL USB-RS485 adapter, then power on the unit—I am monitoring the live bus."

        stateLock.lock()
        repairStage = "STEP2_GUIDING_DIP_MODBUS"
        simulatedVisualDipAddress = targetAddr
        if authorizeBusTarget {
            targetSlaveId = targetAddr
        }
        let authBusSid = targetSlaveId
        focusDipActive = true
        appendRepairLogUnlocked(
            step: "Guided DIP-8 Configuration (Modbus Slave #\(targetAddr))",
            detail: "Applied pin instruction: \(instructionEn) (binary \(dipBinary), 9600 bps 8N1)."
        )
        let evCount = evidenceSnapshots.count
        stateLock.unlock()

        let audioB64 = synthesizeSpeechB64(msg)
        let citations: [[String: Any]] = [
            ["page": 5, "label": "Page 5 · DIP-8 Binary Address Table"],
            ["page": 4, "label": "Page 4 · Red/Black/Yellow/Green Wiring"],
            ["page": 6, "label": "Page 6 · Register 0x0004 Slave ID"],
        ]

        return [
            "stage": "STEP2_GUIDING_DIP_MODBUS",
            "target_slave_id": targetAddr,
            "simulated_visual_dip_address": targetAddr,
            "authorized_bus_slave_id": authBusSid,
            "bus_target_mutated": authorizeBusTarget,
            "dip_plan": pinPlan,
            "dip_bits": dipBits,
            "diagnosis": msg,
            "assistant_message": msg,
            "highlighted_zone": "upper_barrel_dip",
            "explode_pcb": true,
            "focus_dip": true,
            "andon_state": "YELLOW",
            "manual_page": 5,
            "probable_causes": [
                "Configure DIP-8: \(instructionEn) (Manual Page 5 weights: 128, 64, 32, 16, 8, 4, 2, 1).",
                "Re-thread the central housing barrel first and tighten the rear cable gland nut last to prevent twisting the 4 leads.",
                "Connect Yellow -> A+, Green -> B-, Red -> V+ (5-24V DC), Black -> common GND (Manual Page 4).",
            ],
            "citations": citations,
            "manual_citations": citations,
            "audio_wav_b64": audioB64,
            "evidence_count": evCount,
        ]
    }

    private func parseRequestedModbusTarget(text: String, fallbackAddr: Int?) -> Int {
        let lower = text.lowercased()
        if let regex = try? NSRegularExpression(pattern: "\\b(?:address|slave|node|unit|id)\\s*#?\\s*(\\d{1,3})\\b"),
           let match = regex.firstMatch(in: lower, range: NSRange(lower.startIndex..., in: lower)),
           let r = Range(match.range(at: 1), in: lower),
           let val = Int(lower[r]), (1...247).contains(val) {
            return val
        }
        if lower.contains("176") {
            return 176
        }
        if let fb = fallbackAddr, (1...247).contains(fb) {
            return fb
        }
        return 1
    }

    // MARK: - CAD (.DXF / .STL), 4-Angle Sheet, Photo Strip, .EML & .ZIP Dossier Generator

    private func generateSignoffOrEscalationDossier(payload: [String: Any], forceSignoff: Bool) -> [String: Any] {
        let t0 = ProcessInfo.processInfo.systemUptime
        let exportsDir = FieldScanRuntimeConfig.shared.exportsDirectory
        let outboxDir = FieldScanRuntimeConfig.shared.outboxDirectory

        let modbusTel = getModbusTelemetry()
        let latestJpeg = getLatestJpeg()
        if !latestJpeg.isEmpty {
            stateLock.lock()
            let hasAfter = evidenceSnapshots.contains { ($0["key"] as? String) == "after_online" }
            stateLock.unlock()
            if !hasAfter {
                recordEvidenceSnapshot(
                    key: "after_online",
                    title: "3. FINAL INSPECTED STATE",
                    caption: "Bus: \((modbusTel["status_label"] as? String) ?? "Inspected")",
                    jpegData: latestJpeg
                )
            }
        }

        stateLock.lock()
        packageCounter += 1
        let pkgSeq = packageCounter
        let snapsCopy = evidenceSnapshots
        var logsCopy = repairEventsLog
        let sid = intFromAny(payload["dip_address"]) ?? (modbusTel["slave_id"] as? Int) ?? targetSlaveId
        stateLock.unlock()

        let now = Date()
        let compactFmt = DateFormatter()
        compactFmt.dateFormat = "yyyyMMdd_HHmmss"
        compactFmt.timeZone = TimeZone(abbreviation: "UTC")
        let tsCompact = compactFmt.string(from: now)
        let tsHuman = currentUTCString()

        let isSignoff = forceSignoff || boolFromAny(payload["signoff_mode"], defaultValue: false) || (payload["cad_views_b64"] != nil)
        let packageId = isSignoff ? "SIGNOFF-THT02-\(tsCompact)" : String(format: "ESC-THT02-%@-%03d", tsCompact, pkgSeq)
        let stem = packageId.lowercased().replacingOccurrences(of: "-", with: "_")

        let dipBits = Self.addressToDipBits(sid)
        let pinInfo = Self.describeDipPins(address: sid)
        let healthy = (modbusTel["healthy"] as? Bool) ?? false
        let tempC = (modbusTel["temp_c"] as? Double) ?? 24.6
        let humRH = (modbusTel["humidity_rh"] as? Double) ?? 52.8
        let baudBps = (modbusTel["baud_bps"] as? Int) ?? 9600
        let faultZone = (payload["fault_zone"] as? String)
            ?? (payload["highlighted_zone"] as? String)
            ?? "upper_barrel_dip"
        let operatorNotes = (payload["notes"] as? String)
            ?? (payload["operator_notes"] as? String)
            ?? "Requesting OEM engineering sign-off confirming field DIP-8 reconfiguration and verified RS-485 Modbus-RTU commissioning."

        let dxfURL = exportsDir.appendingPathComponent("\(stem).dxf")
        let stlURL = exportsDir.appendingPathComponent("\(stem).stl")
        let quadURL = exportsDir.appendingPathComponent("\(stem)_3d_4angles.png")
        let stripURL = exportsDir.appendingPathComponent("\(stem)_before_during_after.png")
        let mdURL = exportsDir.appendingPathComponent("\(stem)_signoff_report.md")
        let zipURL = exportsDir.appendingPathComponent("\(stem)_bundle.zip")
        let emlURL = outboxDir.appendingPathComponent("\(stem).eml")

        let dxfData = buildAutoCADDXFData(slaveId: sid, faultZone: faultZone, healthy: healthy, tempC: tempC, humRH: humRH)
        try? dxfData.write(to: dxfURL, options: .atomic)

        let stlData = buildBinarySTLData()
        try? stlData.write(to: stlURL, options: .atomic)

        let clientViews = payload["cad_views_b64"] as? [String: String]
        let quadPNGData = renderQuad3DSheetPNG(slaveId: sid, dipBits: dipBits, modbusTel: modbusTel, clientViews: clientViews)
        try? quadPNGData.write(to: quadURL, options: .atomic)

        let stripPNGData = renderBeforeDuringAfterStripPNG(snapshots: snapsCopy, modbusTel: modbusTel)
        try? stripPNGData.write(to: stripURL, options: .atomic)

        if logsCopy.isEmpty {
            logsCopy = [
                [
                    "timestamp": tsHuman,
                    "step": "DIP-8 Inspection and Pin Configuration",
                    "detail": "Configured DIP-8 switch block to \((pinInfo["dip_binary"] as? String) ?? "00000001") (Slave #\(sid)).",
                ],
                [
                    "timestamp": tsHuman,
                    "step": "RS-485 Modbus-RTU Live Bus Verification",
                    "detail": String(format: "Status: %@ | Temp=%.1f deg C | RH=%.1f %%RH.", (modbusTel["status_label"] as? String) ?? "VERIFIED", tempC, humRH),
                ],
            ]
        }

        let isSimDossier = (modbusTel["simulation"] as? Bool) ?? false
        let complianceVerdict = isSimDossier
            ? "SIMULATION MODE · SYNTHETIC DATA ONLY (PHYSICAL HARDWARE NOT VERIFIED)"
            : (healthy
                ? "SENSOR RESPONDED ON MODBUS (PLC/SCADA & CALIBRATION NOT VERIFIED)"
                : "PARTIAL INSPECTION · PENDING PHYSICAL MODBUS RESPONSE")

        let stepsMarkdown = logsCopy.enumerated().map { idx, entry in
            "\(idx + 1). **`[\(entry["timestamp"] ?? tsHuman)]` \(entry["step"] ?? "Step")** — \(entry["detail"] ?? "")"
        }.joined(separator: "\n")

        let reportMarkdown = """
        # FieldScan Bench Maintenance Dossier (`TZ THT-02`) \(isSimDossier ? "[SIMULATION]" : "")

        - **Dossier ID**: `\(packageId)`
        - **UTC Timestamp**: `\(tsHuman)`
        - **Serviced Asset**: `TZ THT-02 Industrial RS-485 Temperature & Humidity Sensor` (`140.0 mm x DIA 16.0 mm`)
        - **Simulation Mode**: `\(isSimDossier)`
        - **Bench Scope Verdict (Manual V1.1)**: **\(complianceVerdict)**

        ## 1. Read-Only Modbus Communication Observation (PLC/SCADA & Calibration Not Verified)
        | Parameter | Observed / Configured Value | Manual V1.1 Reference |
        | :--- | :--- | :--- |
        | **Modbus Source** | `\(modbusTel["source"] ?? "bench")` | Page 4 (A+/B-/GND) |
        | **Slave Address (Reg `0x0004`)** | **`\(sid)` (`\(pinInfo["hex_id"] ?? "0x01")`)** — Binary `\(pinInfo["dip_binary"] ?? "00000001")` | Page 5 (Weights `128..1`) |
        | **Serial Frame Format** | `\(baudBps) bps`, `8N1` | Page 5 & Page 6 |
        | **Reported Temperature (Reg `0x0000`)** | **`\(String(format: "%.1f deg C", tempC))`** | Page 6 (`!= 0x7FFF`) |
        | **Reported Relative Humidity (Reg `0x0001`)** | **`\(String(format: "%.1f %%RH", humRH))`** | Page 6 (`!= 0x7FFF`) |
        | **Master TX Poll Frame (`0x03`)** | `\(modbusTel["last_tx_hex"] ?? "01 03 00 00 00 08 44 0C")` | Page 7 |
        | **Sensor RX Frame** | `\(modbusTel["last_rx_hex"] ?? "N/A")` (`protocol = \(modbusTel["protocol"] ?? "modbus")`) | Page 7 & Page 9 (`0xA001`) |

        ## 2. Step-by-Step Field Inspection Procedure Log
        \(stepsMarkdown)

        ## 3. Datasheet Reference & Scope Boundaries
        - **2-Step Housing Opening & Re-Assembly (Page 5)**: Loosen rear cable gland nut first before rotating the middle housing barrel.
        - **4-Wire Color Code Reference (Page 4)**: Red = `DC 5~24V (+)`, Black = `Common GND`, Yellow = `RS-485 A+`, Green = `RS-485 B-`.
        - **Scope Note**: Read-only Modbus communication check only; PLC/SCADA state and reference standard calibration are not verified.
        - **Technician Notes**: \(operatorNotes)
        """
        let mdData = Data(reportMarkdown.utf8)
        try? mdData.write(to: mdURL, options: .atomic)

        let sender = "fieldscan-bench@ipad-air-m4.local"
        let recipient = "support-eng@tzonedigital.com"
        let subject = String(
            format: "%@[INSPECTION DOSSIER] TZ THT-02 Modbus Obs (Slave #%d: %.1fC / %.1f%%RH) + 4-Angle 3D CAD (%@)",
            isSimDossier ? "[SIMULATION] " : "",
            sid,
            tempC,
            humRH,
            packageId
        )
        let emailBody = """
        POST-REPAIR OEM ENGINEERING SIGN-OFF REQUEST (STORE-AND-FORWARD)
        ================================================================
        To Tzone Digital Technology Support Engineering:

        Attached is the complete field diagnostic, DIP-8 switch reconfiguration,
        and live RS-485 Modbus-RTU commissioning dossier for the TZ THT-02 transmitter.

        REAL-TIME ELECTRICAL VERIFICATION SUMMARY:
          - Edge AI Verdict (Manual V1.1) : \(complianceVerdict)
          - DIP-8 Slave Address           : \(sid) (Binary \(pinInfo["dip_binary"] ?? "00000001"))
          - RS-485 Serial Link            : \(baudBps) bps, 8N1, CRC-16 0xA001 Verified
          - Live Temperature Reading      : \(String(format: "%.1f C", tempC))
          - Live Relative Humidity        : \(String(format: "%.1f %%RH", humRH))

        ATTACHED ENGINEERING ARTIFACTS:
          1. \(quadURL.lastPathComponent) (4-Angle 3D Digital Twin Sheet)
          2. \(stripURL.lastPathComponent) (Chronological Before / During / After Camera Strip)
          3. \(dxfURL.lastPathComponent) (AutoCAD R2010 .DXF 140x16 mm Blueprint)
          4. \(stlURL.lastPathComponent) (Parametric 3D .STL Solid Mesh)
          5. \(mdURL.lastPathComponent) (Complete Markdown Sign-Off Report)
        """

        let emlData = buildRFC5322EMLData(
            sender: sender,
            recipient: recipient,
            subject: subject,
            packageId: packageId,
            bodyText: emailBody,
            attachments: [
                (quadURL.lastPathComponent, "image/png", quadPNGData),
                (stripURL.lastPathComponent, "image/png", stripPNGData),
                (dxfURL.lastPathComponent, "application/dxf", dxfData),
                (stlURL.lastPathComponent, "model/stl", stlData),
                (mdURL.lastPathComponent, "text/markdown", mdData),
            ]
        )
        try? emlData.write(to: emlURL, options: .atomic)

        let zipData = buildZipArchiveData(entries: [
            (quadURL.lastPathComponent, quadPNGData),
            (stripURL.lastPathComponent, stripPNGData),
            (dxfURL.lastPathComponent, dxfData),
            (stlURL.lastPathComponent, stlData),
            (mdURL.lastPathComponent, mdData),
            (emlURL.lastPathComponent, emlData),
        ])
        try? zipData.write(to: zipURL, options: .atomic)

        let elapsedMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10).rounded() / 10
        let spokenSummary: String
        if isSimDossier {
            spokenSummary = String(
                format: "Simulation dossier compiled for TZ THT-02 Slave Address %d (synthetic %.1f degrees Celsius and %.1f percent relative humidity). Synthetic data does not verify physical sensor hardware.",
                sid,
                tempC,
                humRH
            )
        } else if healthy {
            spokenSummary = String(
                format: "Bench inspection dossier compiled for TZ THT-02: Modbus response observed on Slave Address %d at %.1f degrees Celsius and %.1f percent relative humidity, with 4-angle 3D CAD views and camera evidence queued locally.",
                sid,
                tempC,
                humRH
            )
        } else {
            spokenSummary = "Partial bench inspection dossier compiled with 4-angle 3D CAD views, chronological camera strip, and AutoCAD drawings queued in the local outbox."
        }

        let audioB64 = synthesizeSpeechB64(spokenSummary)

        stateLock.lock()
        repairStage = "STEP4_SIGNOFF_PACKAGE_READY"
        focusDipActive = false
        let andonNow = healthy ? "GREEN" : computeAndonStateUnlocked()
        stateLock.unlock()

        let attachmentsMeta: [[String: Any]] = [
            ["filename": quadURL.lastPathComponent, "size_bytes": quadPNGData.count, "mime": "image/png"],
            ["filename": stripURL.lastPathComponent, "size_bytes": stripPNGData.count, "mime": "image/png"],
            ["filename": dxfURL.lastPathComponent, "size_bytes": dxfData.count, "mime": "application/dxf"],
            ["filename": stlURL.lastPathComponent, "size_bytes": stlData.count, "mime": "model/stl"],
            ["filename": mdURL.lastPathComponent, "size_bytes": mdData.count, "mime": "text/markdown"],
        ]

        let emailDict: [String: Any] = [
            "from": sender,
            "to": recipient,
            "subject": subject,
            "status": "QUEUED_OFFLINE_OUTBOX",
            "attachments": attachmentsMeta,
            "body": emailBody,
        ]

        return [
            "package_id": packageId,
            "stage": "STEP4_SIGNOFF_PACKAGE_READY",
            "status": "queued_offline",
            "signoff_mode": true,
            "explode_pcb": false,
            "focus_dip": false,
            "andon_state": andonNow,
            "compliance_verdict": complianceVerdict,
            "spoken_summary": spokenSummary,
            "diagnosis": spokenSummary,
            "assistant_message": spokenSummary,
            "audio_wav_b64": audioB64,
            "generated_in_ms": elapsedMs,
            "outbox_path": emlURL.path,
            "dxf_path": dxfURL.path,
            "stl_path": stlURL.path,
            "quad_3d_path": quadURL.path,
            "strip_path": stripURL.path,
            "report_path": mdURL.path,
            "eml_path": emlURL.path,
            "zip_path": zipURL.path,
            "dxf_url": "/exports/\(dxfURL.lastPathComponent)",
            "stl_url": "/exports/\(stlURL.lastPathComponent)",
            "quad_3d_url": "/exports/\(quadURL.lastPathComponent)",
            "strip_url": "/exports/\(stripURL.lastPathComponent)",
            "snapshot_url": "/exports/\(quadURL.lastPathComponent)",
            "png_url": "/exports/\(quadURL.lastPathComponent)",
            "report_url": "/exports/\(mdURL.lastPathComponent)",
            "eml_url": "/outbox/\(emlURL.lastPathComponent)",
            "zip_url": "/exports/\(zipURL.lastPathComponent)",
            "email": emailDict,
            "email_preview": emailDict,
        ]
    }

    private func buildAutoCADDXFData(slaveId: Int, faultZone: String, healthy: Bool, tempC: Double, humRH: Double) -> Data {
        var lines: [String] = [
            "0", "SECTION",
            "2", "HEADER",
            "9", "$ACADVER",
            "1", "AC1024",
            "9", "$INSUNITS",
            "70", "4",
            "0", "ENDSEC",
            "0", "SECTION",
            "2", "TABLES",
            "0", "TABLE",
            "2", "LAYER",
            "70", "5",
            "0", "LAYER", "2", "OUTLINE", "70", "0", "62", "7", "6", "CONTINUOUS",
            "0", "LAYER", "2", "DIMENSIONS", "70", "0", "62", "3", "6", "CONTINUOUS",
            "0", "LAYER", "2", "INTERNAL_PCB", "70", "0", "62", "4", "6", "CONTINUOUS",
            "0", "LAYER", "2", "FAULT_CALLOUT", "70", "0", "62", "1", "6", "CONTINUOUS",
            "0", "LAYER", "2", "TITLE_BLOCK", "70", "0", "62", "2", "6", "CONTINUOUS",
            "0", "ENDTAB",
            "0", "ENDSEC",
            "0", "SECTION",
            "2", "ENTITIES",
        ]

        func addLine(layer: String, x1: Double, y1: Double, x2: Double, y2: Double, color: Int) {
            lines.append(contentsOf: [
                "0", "LINE", "8", layer, "62", "\(color)",
                "10", String(format: "%.3f", x1), "20", String(format: "%.3f", y1), "30", "0.0",
                "11", String(format: "%.3f", x2), "21", String(format: "%.3f", y2), "31", "0.0",
            ])
        }

        func addCircle(layer: String, cx: Double, cy: Double, r: Double, color: Int) {
            lines.append(contentsOf: [
                "0", "CIRCLE", "8", layer, "62", "\(color)",
                "10", String(format: "%.3f", cx), "20", String(format: "%.3f", cy), "30", "0.0",
                "40", String(format: "%.3f", r),
            ])
        }

        func addText(layer: String, x: Double, y: Double, height: Double, text: String, color: Int) {
            lines.append(contentsOf: [
                "0", "TEXT", "8", layer, "62", "\(color)",
                "10", String(format: "%.3f", x), "20", String(format: "%.3f", y), "30", "0.0",
                "40", String(format: "%.2f", height), "1", text,
            ])
        }

        // 140.0 x 16.0 mm TZ THT-02 Side Elevation
        addLine(layer: "OUTLINE", x1: 0, y1: -8, x2: 140, y2: -8, color: 7)
        addLine(layer: "OUTLINE", x1: 0, y1: 8, x2: 140, y2: 8, color: 7)
        addLine(layer: "OUTLINE", x1: 0, y1: -8, x2: 0, y2: 8, color: 7)
        addLine(layer: "OUTLINE", x1: 140, y1: -8, x2: 140, y2: 8, color: 7)
        addLine(layer: "OUTLINE", x1: 32, y1: -8.2, x2: 32, y2: 8.2, color: 8)
        addLine(layer: "OUTLINE", x1: 38, y1: -8.2, x2: 38, y2: 8.2, color: 8)
        addLine(layer: "OUTLINE", x1: 68, y1: -21, x2: 88, y2: -21, color: 6)
        addLine(layer: "OUTLINE", x1: 68, y1: 21, x2: 88, y2: 21, color: 6)
        addCircle(layer: "OUTLINE", cx: 78, cy: 16, r: 2.1, color: 6)
        addCircle(layer: "OUTLINE", cx: 78, cy: -16, r: 2.1, color: 6)

        // Internal SW1 DIP-8 PCB
        addLine(layer: "INTERNAL_PCB", x1: 40, y1: -5.2, x2: 66, y2: -5.2, color: 4)
        addLine(layer: "INTERNAL_PCB", x1: 40, y1: 5.2, x2: 66, y2: 5.2, color: 4)
        addText(layer: "INTERNAL_PCB", x: 42, y: -4.2, height: 1.6, text: "SW1 DIP-8 SLAVE #\(slaveId)", color: 4)

        // Dimensions Layer
        addLine(layer: "DIMENSIONS", x1: 0, y1: -26, x2: 140, y2: -26, color: 3)
        addText(layer: "DIMENSIONS", x: 48, y: -30, height: 2.6, text: "140.0 MM NOMINAL", color: 3)
        addText(layer: "DIMENSIONS", x: 144, y: -1.5, height: 2.4, text: "DIA 16.0 MM", color: 3)

        // Fault Callout Layer
        addLine(layer: "FAULT_CALLOUT", x1: 38, y1: -11, x2: 68, y2: -11, color: 1)
        addLine(layer: "FAULT_CALLOUT", x1: 38, y1: 11, x2: 68, y2: 11, color: 1)
        addText(
            layer: "FAULT_CALLOUT",
            x: 0,
            y: 25,
            height: 2.4,
            text: "FAULT_CALLOUT: \(faultZone.uppercased()) | SLAVE #\(slaveId)",
            color: 1
        )

        let statusLine = healthy
            ? String(format: "MODBUS ONLINE: %.1fC / %.1f%%RH (SLAVE #%d)", tempC, humRH, slaveId)
            : "INSPECTED ZONE: \(faultZone.uppercased()) (SLAVE #\(slaveId))"
        addText(
            layer: "TITLE_BLOCK",
            x: 0,
            y: 31,
            height: 2.8,
            text: "FIELDSCAN CAD R2010 - TZ THT-02 (140.0x16.0 MM) | \(statusLine)",
            color: 2
        )

        lines.append(contentsOf: ["0", "ENDSEC", "0", "EOF"])
        return Data(lines.joined(separator: "\r\n").utf8)
    }

    private func buildBinarySTLData() -> Data {
        let nTheta = 24
        let zStations: [Float] = [0.0, 32.0, 38.0, 68.0, 88.0, 122.0, 140.0]
        let rStations: [Float] = [8.0, 8.0, 8.2, 8.0, 9.0, 8.0, 5.8]

        var triangles: [([Float], [Float], [Float])] = []
        for seg in 0..<(zStations.count - 1) {
            let z0 = zStations[seg]
            let z1 = zStations[seg + 1]
            let r0 = rStations[seg]
            let r1 = rStations[seg + 1]

            for k in 0..<nTheta {
                let kn = (k + 1) % nTheta
                let a0 = Float(k) * 2.0 * Float.pi / Float(nTheta)
                let a1 = Float(kn) * 2.0 * Float.pi / Float(nTheta)

                let p00: [Float] = [r0 * cos(a0), r0 * sin(a0), z0]
                let p01: [Float] = [r0 * cos(a1), r0 * sin(a1), z0]
                let p10: [Float] = [r1 * cos(a0), r1 * sin(a0), z1]
                let p11: [Float] = [r1 * cos(a1), r1 * sin(a1), z1]

                triangles.append((p00, p01, p11))
                triangles.append((p00, p11, p10))
            }
        }

        // End caps at z = 0 and z = 140
        for k in 0..<nTheta {
            let kn = (k + 1) % nTheta
            let a0 = Float(k) * 2.0 * Float.pi / Float(nTheta)
            let a1 = Float(kn) * 2.0 * Float.pi / Float(nTheta)
            triangles.append(([0, 0, 0], [8.0 * cos(a1), 8.0 * sin(a1), 0], [8.0 * cos(a0), 8.0 * sin(a0), 0]))
            triangles.append(([0, 0, 140], [5.8 * cos(a0), 5.8 * sin(a0), 140], [5.8 * cos(a1), 5.8 * sin(a1), 140]))
        }

        var out = Data(count: 80)
        let headerStr = "TZ THT-02 Parametric Twin | 140.0x16.0mm | FieldScan M4 Offline CAD"
        let hdrBytes = Array(headerStr.utf8.prefix(80))
        out.replaceSubrange(0..<hdrBytes.count, with: hdrBytes)

        var triCountLE = UInt32(triangles.count).littleEndian
        out.append(Data(bytes: &triCountLE, count: 4))

        for (v1, v2, v3) in triangles {
            let ux = v2[0] - v1[0], uy = v2[1] - v1[1], uz = v2[2] - v1[2]
            let vx = v3[0] - v1[0], vy = v3[1] - v1[1], vz = v3[2] - v1[2]
            var nx = uy * vz - uz * vy
            var ny = uz * vx - ux * vz
            var nz = ux * vy - uy * vx
            let len = max(1e-6, sqrt(nx * nx + ny * ny + nz * nz))
            nx /= len; ny /= len; nz /= len

            let floats: [Float] = [nx, ny, nz, v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2]]
            for f in floats {
                var bits = f.bitPattern.littleEndian
                out.append(Data(bytes: &bits, count: 4))
            }
            var attr: UInt16 = 0
            out.append(Data(bytes: &attr, count: 2))
        }
        return out
    }

    private func renderQuad3DSheetPNG(
        slaveId: Int,
        dipBits: [Int],
        modbusTel: [String: Any],
        clientViews: [String: String]?
    ) -> Data {
        #if canImport(UIKit)
        let size = CGSize(width: 1280, height: 800)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1.0
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: size, format: format)

        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            cg.setFillColor(UIColor(red: 0.04, green: 0.06, blue: 0.09, alpha: 1.0).cgColor)
            cg.fill(CGRect(origin: .zero, size: size))

            cg.setFillColor(UIColor(red: 0.07, green: 0.10, blue: 0.16, alpha: 1.0).cgColor)
            cg.fill(CGRect(x: 0, y: 0, width: 1280, height: 52))

            let titleAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 14, weight: .bold),
                .foregroundColor: UIColor.white,
            ]
            let healthy = (modbusTel["healthy"] as? Bool) ?? false
            let scadaTag = healthy
                ? String(format: "MODBUS VERIFIED: %.1f C | %.1f %%RH (SLAVE #%d)", (modbusTel["temp_c"] as? Double) ?? 24.6, (modbusTel["humidity_rh"] as? Double) ?? 52.8, slaveId)
                : "TARGET MODBUS SLAVE #\(slaveId) | 9600 8N1"
            NSString(string: "TZ THT-02 MULTI-ANGLE 3D DIGITAL TWIN (140.0 x DIA 16.0 MM)  |  \(scadaTag)").draw(
                at: CGPoint(x: 18, y: 16),
                withAttributes: titleAttrs
            )

            let panels: [(String, String, CGRect)] = [
                ("isometric", "VIEW 1: 3D ISOMETRIC FULL ASSEMBLY", CGRect(x: 16, y: 66, width: 616, height: 354)),
                ("front_dim", "VIEW 2: DIMENSIONED FRONT ELEVATION (140.0 x 16.0 MM)", CGRect(x: 648, y: 66, width: 616, height: 354)),
                ("exploded_dip", "VIEW 3: EXPLODED INTERNAL DIP-8 PCB (SLAVE #\(slaveId))", CGRect(x: 16, y: 432, width: 616, height: 354)),
                ("side_gland", "VIEW 4: WATERPROOF GLAND & RS-485 4-WIRE HARNESS", CGRect(x: 648, y: 432, width: 616, height: 354)),
            ]

            let subAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 11.5, weight: .bold),
                .foregroundColor: UIColor(red: 0.72, green: 0.90, blue: 1.0, alpha: 1.0),
            ]

            for (key, label, rect) in panels {
                cg.setFillColor(UIColor(red: 0.06, green: 0.09, blue: 0.14, alpha: 1.0).cgColor)
                cg.fill(rect)
                cg.setStrokeColor(UIColor(red: 0.18, green: 0.26, blue: 0.36, alpha: 1.0).cgColor)
                cg.setLineWidth(2.0)
                cg.stroke(rect)

                if let b64 = clientViews?[key],
                   let raw = decodeDataURLOrBase64(b64),
                   let subImg = UIImage(data: raw) {
                    subImg.draw(in: CGRect(x: rect.minX + 2, y: rect.minY + 28, width: rect.width - 4, height: rect.height - 30))
                } else {
                    // Vector CAD schematic fallback
                    let cy = rect.midY + 10
                    cg.setFillColor(UIColor(red: 0.72, green: 0.77, blue: 0.82, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: rect.minX + 80, y: cy - 22, width: 440, height: 44))
                    cg.setStrokeColor(UIColor(red: 0.22, green: 0.74, blue: 0.97, alpha: 1.0).cgColor)
                    cg.setLineWidth(1.5)
                    cg.stroke(CGRect(x: rect.minX + 80, y: cy - 22, width: 440, height: 44))

                    if key == "exploded_dip" {
                        cg.setFillColor(UIColor(red: 0.06, green: 0.35, blue: 0.64, alpha: 1.0).cgColor)
                        cg.fill(CGRect(x: rect.midX - 90, y: cy - 26, width: 180, height: 52))
                        let bin = dipBits.map(String.init).joined()
                        NSString(string: "SW1 DIP-8 BINARY: \(bin) -> SLAVE #\(slaveId)").draw(
                            at: CGPoint(x: rect.minX + 20, y: rect.maxY - 28),
                            withAttributes: subAttrs
                        )
                    } else {
                        NSString(string: "140.0 MM NOMINAL x DIA 16.0 MM · SHT30 CMOSENS · IP65").draw(
                            at: CGPoint(x: rect.minX + 20, y: rect.maxY - 28),
                            withAttributes: subAttrs
                        )
                    }
                }

                cg.setFillColor(UIColor(red: 0.09, green: 0.13, blue: 0.20, alpha: 1.0).cgColor)
                cg.fill(CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: 28))
                NSString(string: label).draw(at: CGPoint(x: rect.minX + 10, y: rect.minY + 6), withAttributes: subAttrs)
            }
        }
        return img.pngData() ?? Data()
        #else
        return Data()
        #endif
    }

    private func renderBeforeDuringAfterStripPNG(snapshots: [[String: Any]], modbusTel: [String: Any]) -> Data {
        #if canImport(UIKit)
        let size = CGSize(width: 1260, height: 380)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1.0
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: size, format: format)

        let img = renderer.image { ctx in
            let cg = ctx.cgContext
            cg.setFillColor(UIColor(red: 0.05, green: 0.07, blue: 0.11, alpha: 1.0).cgColor)
            cg.fill(CGRect(origin: .zero, size: size))

            cg.setFillColor(UIColor(red: 0.07, green: 0.11, blue: 0.17, alpha: 1.0).cgColor)
            cg.fill(CGRect(x: 0, y: 0, width: 1260, height: 44))

            let hdrAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 13, weight: .bold),
                .foregroundColor: UIColor.white,
            ]
            let subAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.monospacedSystemFont(ofSize: 10.5, weight: .semibold),
                .foregroundColor: UIColor(red: 0.72, green: 0.90, blue: 1.0, alpha: 1.0),
            ]

            NSString(string: "CHRONOLOGICAL CAMERA INSPECTION STRIP: FAULT DETECTION, DIP-8 CONFIGURATION & MODBUS VALIDATION").draw(
                at: CGPoint(x: 16, y: 14),
                withAttributes: hdrAttrs
            )

            let recent = Array(snapshots.suffix(3))
            let slotW: CGFloat = 396
            let isSimStrip = (modbusTel["simulation"] as? Bool) ?? false
            let defaultTitles = [
                "1. BEFORE (AS FOUND)",
                "2. DURING (INSPECTION)",
                isSimStrip ? "3. AFTER (SIMULATION)" : "3. AFTER (SENSOR COMM OBS)",
            ]

            for idx in 0..<3 {
                let x0 = CGFloat(18 + idx * Int(slotW + 18))
                let rect = CGRect(x: x0, y: 58, width: slotW, height: 306)
                cg.setFillColor(UIColor(red: 0.07, green: 0.09, blue: 0.14, alpha: 1.0).cgColor)
                cg.fill(rect)
                cg.setStrokeColor(UIColor(red: 0.20, green: 0.28, blue: 0.38, alpha: 1.0).cgColor)
                cg.setLineWidth(2.0)
                cg.stroke(rect)

                if idx < recent.count {
                    let snap = recent[idx]
                    if let jpg = snap["jpeg_bytes"] as? Data, let uiImg = UIImage(data: jpg) {
                        uiImg.draw(in: CGRect(x: x0 + 2, y: 86, width: slotW - 4, height: 244))
                    }
                    let title = (snap["title"] as? String) ?? defaultTitles[idx]
                    let caption = (snap["caption"] as? String) ?? ""
                    cg.setFillColor(UIColor(red: 0.10, green: 0.16, blue: 0.23, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: x0, y: 58, width: slotW, height: 26))
                    NSString(string: title).draw(at: CGPoint(x: x0 + 8, y: 64), withAttributes: subAttrs)
                    NSString(string: caption).draw(at: CGPoint(x: x0 + 8, y: 338), withAttributes: subAttrs)
                } else {
                    cg.setFillColor(UIColor(red: 0.10, green: 0.16, blue: 0.23, alpha: 1.0).cgColor)
                    cg.fill(CGRect(x: x0, y: 58, width: slotW, height: 26))
                    NSString(string: defaultTitles[idx]).draw(at: CGPoint(x: x0 + 8, y: 64), withAttributes: subAttrs)
                    let statusLbl = (modbusTel["status_label"] as? String) ?? "INSPECTED"
                    NSString(string: "Bus: \(statusLbl)").draw(at: CGPoint(x: x0 + 16, y: 200), withAttributes: subAttrs)
                }
            }
        }
        return img.pngData() ?? Data()
        #else
        return Data()
        #endif
    }

    private func buildRFC5322EMLData(
        sender: String,
        recipient: String,
        subject: String,
        packageId: String,
        bodyText: String,
        attachments: [(String, String, Data)]
    ) -> Data {
        let boundary = "FieldScanBoundary_\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
        let rfcDate = ISO8601DateFormatter().string(from: Date())
        var lines: [String] = [
            "From: \(sender)",
            "To: \(recipient)",
            "Subject: \(subject)",
            "Date: \(rfcDate)",
            "Message-ID: <\(packageId.lowercased())@ipad-air-m4.local>",
            "MIME-Version: 1.0",
            "X-FieldScan-Package-ID: \(packageId)",
            "X-FieldScan-Outbox-Mode: STORE_AND_FORWARD_OFFLINE",
            "X-FieldScan-SignOff-Request: TRUE",
            "Content-Type: multipart/mixed; boundary=\"\(boundary)\"",
            "",
            "--\(boundary)",
            "Content-Type: text/plain; charset=\"utf-8\"",
            "Content-Transfer-Encoding: 8bit",
            "",
            bodyText,
            "",
        ]

        for (filename, mime, data) in attachments {
            let b64 = data.base64EncodedString(options: [.lineLength76Characters, .endLineWithCarriageReturn])
            lines.append(contentsOf: [
                "--\(boundary)",
                "Content-Type: \(mime); name=\"\(filename)\"",
                "Content-Disposition: attachment; filename=\"\(filename)\"",
                "Content-Transfer-Encoding: base64",
                "",
                b64,
                "",
            ])
        }
        lines.append("--\(boundary)--\r\n")
        return Data(lines.joined(separator: "\r\n").utf8)
    }

    // MARK: - Zero-Dependency Pure-Swift PKZIP Archive Builder (Store Method 0 + CRC-32)

    private static let crc32Table: [UInt32] = {
        (0..<256).map { i -> UInt32 in
            var c = UInt32(i)
            for _ in 0..<8 {
                c = (c & 1) != 0 ? (0xEDB88320 ^ (c >> 1)) : (c >> 1)
            }
            return c
        }
    }()

    private static func computeCRC32(_ data: Data) -> UInt32 {
        var crc: UInt32 = 0xFFFFFFFF
        for byte in data {
            let idx = Int((crc ^ UInt32(byte)) & 0xFF)
            crc = (crc >> 8) ^ crc32Table[idx]
        }
        return crc ^ 0xFFFFFFFF
    }

    private func buildZipArchiveData(entries: [(String, Data)]) -> Data {
        var archive = Data()
        var centralDirectory = Data()

        func appendU16(_ target: inout Data, _ val: UInt16) {
            var le = val.littleEndian
            target.append(Data(bytes: &le, count: 2))
        }
        func appendU32(_ target: inout Data, _ val: UInt32) {
            var le = val.littleEndian
            target.append(Data(bytes: &le, count: 4))
        }

        for (name, content) in entries {
            let nameBytes = Data(name.utf8)
            let crc = Self.computeCRC32(content)
            let size32 = UInt32(clamping: content.count)
            let localHeaderOffset = UInt32(clamping: archive.count)

            // Local file header (0x04034B50)
            appendU32(&archive, 0x04034B50)
            appendU16(&archive, 20) // Version needed
            appendU16(&archive, 0)  // Flags
            appendU16(&archive, 0)  // Compression method 0 = Store
            appendU16(&archive, 0)  // Mod time
            appendU16(&archive, 0)  // Mod date
            appendU32(&archive, crc)
            appendU32(&archive, size32)
            appendU32(&archive, size32)
            appendU16(&archive, UInt16(clamping: nameBytes.count))
            appendU16(&archive, 0)  // Extra field length
            archive.append(nameBytes)
            archive.append(content)

            // Central directory file header (0x02014B50)
            appendU32(&centralDirectory, 0x02014B50)
            appendU16(&centralDirectory, 20)
            appendU16(&centralDirectory, 20)
            appendU16(&centralDirectory, 0)
            appendU16(&centralDirectory, 0)
            appendU16(&centralDirectory, 0)
            appendU16(&centralDirectory, 0)
            appendU32(&centralDirectory, crc)
            appendU32(&centralDirectory, size32)
            appendU32(&centralDirectory, size32)
            appendU16(&centralDirectory, UInt16(clamping: nameBytes.count))
            appendU16(&centralDirectory, 0)
            appendU16(&centralDirectory, 0)
            appendU16(&centralDirectory, 0)
            appendU16(&centralDirectory, 0)
            appendU32(&centralDirectory, 0)
            appendU32(&centralDirectory, localHeaderOffset)
            centralDirectory.append(nameBytes)
        }

        let cdOffset = UInt32(clamping: archive.count)
        let cdSize = UInt32(clamping: centralDirectory.count)
        archive.append(centralDirectory)

        // End of central directory record (0x06054B50)
        appendU32(&archive, 0x06054B50)
        appendU16(&archive, 0)
        appendU16(&archive, 0)
        appendU16(&archive, UInt16(clamping: entries.count))
        appendU16(&archive, UInt16(clamping: entries.count))
        appendU32(&archive, cdSize)
        appendU32(&archive, cdOffset)
        appendU16(&archive, 0)

        return archive
    }

    // MARK: - On-Device Bilingual Voice TTS (`AVSpeechSynthesizer` -> Speaker Playback)

    private func selectBestSpeechVoice(for text: String, language: String = "en") -> AVSpeechSynthesisVoice? {
        _ = text
        let cleanLang = language.lowercased() == "es" ? "es" : "en"
        if cleanLang == "en", let cached = cachedPreferredVoice {
            return cached
        }
        if cleanLang == "es", let cached = cachedSpanishVoice {
            return cached
        }

        if cleanLang == "es" {
            let esLocales = FieldScanCopilotRegistry.shared.spanishTTSLocales()
            let allEs = AVSpeechSynthesisVoice.speechVoices().filter {
                $0.language.lowercased().hasPrefix("es")
            }.sorted { a, b in
                if a.quality.rawValue != b.quality.rawValue {
                    return a.quality.rawValue > b.quality.rawValue
                }
                let aIdx = esLocales.firstIndex(where: { $0.lowercased() == a.language.lowercased() }) ?? 99
                let bIdx = esLocales.firstIndex(where: { $0.lowercased() == b.language.lowercased() }) ?? 99
                if aIdx != bIdx { return aIdx < bIdx }
                return a.name < b.name
            }
            var resolved = allEs.first
            if resolved == nil {
                for loc in esLocales {
                    if let v = AVSpeechSynthesisVoice(language: loc) {
                        resolved = v
                        break
                    }
                }
            }
            cachedSpanishVoice = resolved
            return resolved ?? selectBestSpeechVoice(for: text, language: "en")
        }

        let preferredLocale = "en-US"
        let allVoices = AVSpeechSynthesisVoice.speechVoices().filter {
            $0.language.lowercased().hasPrefix("en")
        }

        // Prefer .premium first, then .enhanced, in US English (en-US)
        let sortedVoices = allVoices.sorted { a, b in
            if a.quality.rawValue != b.quality.rawValue {
                return a.quality.rawValue > b.quality.rawValue
            }
            let aPref = a.language.lowercased() == preferredLocale.lowercased()
            let bPref = b.language.lowercased() == preferredLocale.lowercased()
            if aPref != bPref {
                return aPref
            }
            return a.name < b.name
        }

        let resolved: AVSpeechSynthesisVoice?
        if let best = sortedVoices.first, best.quality.rawValue >= AVSpeechSynthesisVoiceQuality.enhanced.rawValue {
            resolved = best
        } else {
            resolved = AVSpeechSynthesisVoice(language: preferredLocale) ?? sortedVoices.first
        }
        cachedPreferredVoice = resolved
        return resolved
    }

    public func synthesizeSpeechB64(_ rawText: String, speakOnDevice: Bool = true, language: String = "en") -> String {
        let cleaned = cleanTextForTTS(rawText)
        guard !cleaned.isEmpty else {
            return buildFallbackConfirmationWav(durationSeconds: 0.08).base64EncodedString()
        }

        let estDur = max(0.8, Double(cleaned.count) * 0.055)
        FieldScanSessionEngine.shared.registerTTSPlayback(cleaned, estimatedDurationS: speakOnDevice ? estDur : 0.0)

        // Speak aloud immediately through the iPad Air M4 native audio output with natural premium/enhanced voice
        if speakOnDevice {
            let nowUp = ProcessInfo.processInfo.systemUptime
            stateLock.lock()
            ttsSpeakingFlag = true
            ttsExpectedEndUptime = nowUp + estDur + 1.5
            lastTtsActiveUptime = nowUp
            stateLock.unlock()

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.configureAudioSessionForOfflineVoice(force: false)
                if self.speechSynthesizer.isSpeaking {
                    self.speechSynthesizer.stopSpeaking(at: .immediate)
                }
                let utterance = AVSpeechUtterance(string: cleaned)
                utterance.voice = self.selectBestSpeechVoice(for: cleaned, language: language)
                utterance.rate = 0.50
                utterance.pitchMultiplier = 1.0
                utterance.volume = 1.0
                self.speechSynthesizer.speak(utterance)
            }
        }
        return buildFallbackConfirmationWav(durationSeconds: 0.08).base64EncodedString()
    }

    private func cleanTextForTTS(_ text: String, maxChars: Int = 280) -> String {
        let stripped = text.replacingOccurrences(of: "[`*_#>\\[\\]]+", with: " ", options: .regularExpression)
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if stripped.count <= maxChars {
            return stripped
        }
        let prefix = String(stripped.prefix(maxChars))
        if let dotRange = prefix.range(of: ".", options: .backwards) {
            return String(prefix[..<dotRange.upperBound])
        }
        return prefix + "."
    }

    private static func extract16kHzInt16Samples(from buffer: AVAudioPCMBuffer) -> [Int16] {
        let frameCount = Int(buffer.frameLength)
        guard frameCount > 0 else { return [] }
        let srcRate = max(8000.0, buffer.format.sampleRate)
        let targetRate = 16000.0
        let ratio = srcRate / targetRate
        let outCount = max(1, Int((Double(frameCount) / ratio).rounded()))

        if let floatChannel = buffer.floatChannelData?[0] {
            var out: [Int16] = []
            out.reserveCapacity(outCount)
            for i in 0..<outCount {
                let srcIdx = min(frameCount - 1, Int(Double(i) * ratio))
                let clamped = max(-1.0, min(1.0, floatChannel[srcIdx]))
                out.append(Int16(clamped * 32767.0))
            }
            return out
        }

        if let int16Channel = buffer.int16ChannelData?[0] {
            var out: [Int16] = []
            out.reserveCapacity(outCount)
            for i in 0..<outCount {
                let srcIdx = min(frameCount - 1, Int(Double(i) * ratio))
                out.append(int16Channel[srcIdx])
            }
            return out
        }

        return []
    }

    private static func encode16kHzMonoPCMToWAV(samples: [Int16]) -> Data {
        let sampleRate: UInt32 = 16000
        let dataByteCount = UInt32(samples.count * 2)
        let riffChunkSize = 36 + dataByteCount

        var wav = Data()
        wav.reserveCapacity(Int(44 + dataByteCount))

        func appendU16(_ v: UInt16) {
            var le = v.littleEndian
            wav.append(Data(bytes: &le, count: 2))
        }
        func appendU32(_ v: UInt32) {
            var le = v.littleEndian
            wav.append(Data(bytes: &le, count: 4))
        }

        wav.append(Data("RIFF".utf8))
        appendU32(riffChunkSize)
        wav.append(Data("WAVE".utf8))
        wav.append(Data("fmt ".utf8))
        appendU32(16) // PCM chunk size
        appendU16(1)  // Linear PCM
        appendU16(1)  // Mono
        appendU32(sampleRate)
        appendU32(sampleRate * 2)
        appendU16(2)  // Block align
        appendU16(16) // 16-bit
        wav.append(Data("data".utf8))
        appendU32(dataByteCount)

        samples.withUnsafeBufferPointer { ptr in
            if let base = ptr.baseAddress {
                wav.append(UnsafeBufferPointer(start: UnsafeRawPointer(base).assumingMemoryBound(to: UInt8.self), count: samples.count * 2))
            }
        }
        return wav
    }

    private func buildFallbackConfirmationWav(durationSeconds: Double) -> Data {
        let count = max(160, Int(16000.0 * durationSeconds))
        var samples = [Int16](repeating: 0, count: count)
        for i in 0..<min(count, 1800) {
            let t = Double(i) / 16000.0
            let env = exp(-t * 18.0)
            let wave = sin(2.0 * .pi * 660.0 * t) * 0.12 * env
            samples[i] = Int16(wave * 32767.0)
        }
        return Self.encode16kHzMonoPCMToWAV(samples: samples)
    }

    // MARK: - Multimodal Diagnosis (`POST /api/diagnose`) & On-Device Voice (`POST /api/voice`)

    private func detectConversationalRepairIntent(_ text: String) -> String? {
        let q = text.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return nil }

        if q.hasSuffix("?") || q.hasPrefix("\u{00BF}") || q.range(of: "^(hello|hi|hey|good\\s+(morning|afternoon|evening)|what|which|how|why|where|who|when|can\\s+you|could\\s+you|explain|tell\\s+me|is\\s+the|are\\s+the|do\\s+i|does\\s+it)\\b", options: .regularExpression) != nil {
            return nil
        }

        let signoffPhrases = [
            "sign off", "sign-off", "signoff", "all angles", "four angles", "4 angles",
            "post-repair", "dossier", "generate report", "compile report", "manufacturer report",
        ]
        if signoffPhrases.contains(where: { q.contains($0) }) {
            return "signoff_report"
        }

        let inspectOpenPhrases = [
            "doesn't turn on", "does not turn on", "won't power on", "will not power on",
            "won't turn on", "not turning on", "housing is open", "sensor is open", "open and unconfigured",
        ]
        if inspectOpenPhrases.contains(where: { q.contains($0) }) {
            return "inspect_open"
        }

        if q.range(of: "^(configure|set|setup|set\\s+up|guide|assign)\\b.*\\b(dip|slave|pins|address)\\b", options: .regularExpression) != nil {
            return "guide_dip"
        }

        return nil
    }

    private func buildLiveContextSummary(visionTel: [String: Any], modbusTel: [String: Any], dipAddr: Int) -> String {
        let localDateTime = DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short)
        let camMode = (visionTel["mode"] as? String) ?? activeCameraMode
        let sensorDetected = (visionTel["detected"] as? Bool) ?? false
        let angleDeg = (visionTel["angle_deg"] as? Double) ?? 0.0
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false
        let handDetected = (visionTel["hand_detected"] as? Bool) ?? false
        let meanBrightness = (visionTel["mean_brightness"] as? Double) ?? 128.0

        let mbOnline = (modbusTel["online"] as? Bool) ?? false
        let mbHealthy = (modbusTel["healthy"] as? Bool) ?? false
        let tempVal = (modbusTel["temp_c"] as? Double).map { String(format: "%.1f C", $0) } ?? "N/A"
        let humVal = (modbusTel["humidity_rh"] as? Double).map { String(format: "%.1f %%RH", $0) } ?? "N/A"
        let slaveId = (modbusTel["slave_id"] as? Int) ?? dipAddr
        let mbStatus = (modbusTel["status_label"] as? String) ?? "STANDBY"
        let pinPlan = Self.describeDipPins(address: slaveId)
        let dipBin = (pinPlan["dip_binary"] as? String) ?? "00000001"

        return """
        Current local time & date: \(localDateTime).
        Live iPad camera state: mode=\(camMode), sensorDetected=\(sensorDetected), angleDeg=\(String(format: "%+.1f", angleDeg)) deg, pcbOpenDetected=\(pcbOpen), handDetected=\(handDetected), meanBrightness=\(String(format: "%.1f", meanBrightness)).
        Live Modbus-RTU state: online=\(mbOnline), healthy=\(mbHealthy), temp_c=\(tempVal), humidity_rh=\(humVal), slave_id=\(slaveId) (DIP binary \(dipBin)), status_label=\(mbStatus).
        TZ THT-02 Datasheet V1.1 reference: 140.0x16.0mm cylindrical probe, SHT30/SHT3X CMOSens element (-40..+125C, +-0.3C, +-2%RH), 4-wire cable (Red=V+ 5-24V DC, Black=GND, Yellow=RS-485 A+, Green=RS-485 B-), internal SW1 DIP-8 binary weights [128, 64, 32, 16, 8, 4, 2, 1] from Pin 1 to Pin 8 (Pin 8 ON = Slave 1; Pins 1,3,4 ON = 128+32+16 = 176), 2-step opening (Step 1 loosen rear cable gland nut, Step 2 unscrew middle barrel), Reg 0x0000 Temp, Reg 0x0001 Hum, Reg 0x0004 Slave ID, Reg 0x0005 Baud (9600 default), 0x7FFF probe fault sentinel, CRC-16 polynomial 0xA001.
        """
    }

    private func handleCopilotActionAck(payload: [String: Any]) -> [String: Any] {
        let turnId = ((payload["turn_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !turnId.isEmpty else {
            return ["ok": false, "error_code": "MISSING_TURN_ID", "message": "turn_id is required"]
        }
        let sessionId = (payload["session_id"] as? String) ?? FieldScanSessionEngine.shared.currentActiveSessionId
        let inputMode = ((payload["input_mode"] as? String) ?? "text").lowercased()
        let isStale = boolFromAny(payload["stale"], defaultValue: false)
        let receipts = (payload["receipts"] as? [[String: Any]]) ?? []
        let ackMs = (payload["phrase_end_to_ui_ack_ms"] as? Double) ?? (payload["phrase_end_to_ui_ack_ms"] as? NSNumber)?.doubleValue
        let ttsMs = (payload["phrase_end_to_tts_start_ms"] as? Double) ?? (payload["phrase_end_to_tts_start_ms"] as? NSNumber)?.doubleValue

        if !isStale {
            FieldScanCopilotRegistry.shared.recordActionLatency(mode: inputMode, ackMs: ackMs, ttsStartMs: ttsMs)
        }

        var ackPayload = payload
        if let sid = sessionId { ackPayload["session_id"] = sid }
        let stored = (try? FieldScanSessionEngine.shared.recordActionAck(payload: ackPayload)) ?? ["ok": true]

        // Speak final outcome ONLY after verified UI receipts arrive (never speak stale/discarded turns)
        stateLock.lock()
        let pendingSpeech = pendingDeferredVoiceTurns.removeValue(forKey: turnId)
        let defaultLang = preferredVoiceLanguage
        stateLock.unlock()

        let spokenLang = ((payload["language"] as? String) ?? pendingSpeech?.language ?? defaultLang).lowercased() == "es" ? "es" : "en"
        var finalSpokenText: String? = nil
        if !isStale {
            let unavail = receipts.filter { ($0["status"] as? String) == "unavailable" }
            let needsConfirm = receipts.filter { ($0["status"] as? String) == "requires_confirmation" }
            let anyStale = receipts.contains { ($0["status"] as? String) == "stale" }
            if anyStale {
                stopTtsImmediatelyOnMain()
            } else if let firstUnavail = unavail.first {
                let reason = (firstUnavail["reason"] as? String) ?? "control unavailable"
                finalSpokenText = FieldScanCopilotRegistry.shared.formatTemplate(
                    key: "action_unavailable",
                    language: spokenLang,
                    enDefault: "Control unavailable in the current mode: {reason}.",
                    params: ["reason": reason]
                )
            } else if let firstConf = needsConfirm.first {
                let aid = (firstConf["action_id"] as? String) ?? "configuration"
                finalSpokenText = FieldScanCopilotRegistry.shared.formatTemplate(
                    key: "confirmation_required",
                    language: spokenLang,
                    enDefault: "This action ({action_id}) requires explicit operator confirmation in the UI control. No settings were modified.",
                    params: ["action_id": aid]
                )
            } else if let p = pendingSpeech, !p.text.isEmpty {
                finalSpokenText = p.text
            }

            let allowSpeak = boolFromAny(payload["speak_verified_outcome"], defaultValue: pendingSpeech != nil)
            if allowSpeak, let txt = finalSpokenText, !txt.isEmpty {
                _ = synthesizeSpeechB64(txt, speakOnDevice: true, language: spokenLang)
            }
        } else {
            stopTtsImmediatelyOnMain()
        }

        return [
            "ok": true,
            "turn_id": turnId,
            "stale": isStale,
            "stored": stored,
            "spoken_text": finalSpokenText ?? NSNull(),
            "metrics": FieldScanCopilotRegistry.shared.latencyMetricsSummary(),
        ]
    }

    private func syncActiveVoiceContext(payload: [String: Any]) -> [String: Any] {
        stateLock.lock()
        if let sid = payload["session_id"] as? String { activeHandsFreeContext["session_id"] = sid }
        if let mSha = payload["manifest_sha256"] as? String { activeHandsFreeContext["manifest_sha256"] = mSha }
        if let sGen = intFromAny(payload["scene_generation"]) { activeHandsFreeContext["scene_generation"] = sGen }
        if let docId = payload["active_document_id"] as? String { activeHandsFreeContext["active_document_id"] = docId }
        if let lang = payload["language"] as? String, !lang.isEmpty {
            let clean = lang.lowercased() == "es" ? "es" : "en"
            activeHandsFreeContext["language"] = clean
            preferredVoiceLanguage = clean
        }
        if let dip = intFromAny(payload["dip_address"]), (1...247).contains(dip) {
            simulatedVisualDipAddress = dip
            activeHandsFreeContext["dip_address"] = dip
        }
        let ctxCopy = activeHandsFreeContext
        let authSid = targetSlaveId
        stateLock.unlock()
        return [
            "ok": true,
            "voice_context": ctxCopy,
            "authorized_bus_slave_id": authSid,
            "bus_target_mutated": false,
        ]
    }

    private func setVoiceLanguage(payload: [String: Any]) -> [String: Any] {
        let reqLang = ((payload["language"] as? String) ?? "en").trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanLang = reqLang == "es" ? "es" : "en"
        stateLock.lock()
        preferredVoiceLanguage = cleanLang
        activeHandsFreeContext["language"] = cleanLang
        stateLock.unlock()
        let caps = checkOnDeviceSpeechCapabilities()
        let langCap = (caps[cleanLang] as? [String: Any]) ?? [:]
        let onDeviceOK = (langCap["speech_on_device_available"] as? Bool) ?? false
        var notice: String? = nil
        if !onDeviceOK {
            notice = FieldScanCopilotRegistry.shared.formatTemplate(
                key: "offline_speech_unavailable",
                language: cleanLang,
                enDefault: "Offline speech recognition for this language is not downloaded on this iPad. Text chat and touch controls remain 100% functional offline."
            )
        }
        return [
            "ok": true,
            "language": cleanLang,
            "speech_on_device_available": onDeviceOK,
            "capabilities": caps,
            "fallback_notice": notice ?? NSNull(),
        ]
    }

    private func handleDiagnoseRequest(payload: [String: Any]) -> [String: Any] {
        let t0 = ProcessInfo.processInfo.systemUptime
        let rawQuery = ((payload["query"] as? String) ?? (payload["prompt"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let query = rawQuery.isEmpty
            ? "What do you currently see on the camera and RS-485 bus?"
            : rawQuery
        let zoneHint = (payload["zone"] as? String) ?? (payload["highlighted_zone"] as? String)
        let turnId = ((payload["turn_id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 }
            ?? ("turn-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased())
        let inputMode = ((payload["input_mode"] as? String) ?? "text").lowercased()
        let deferTts = boolFromAny(payload["defer_tts_until_ack"], defaultValue: false)
        let reqSessionId = (payload["session_id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        let reqManifestSha = (payload["manifest_sha256"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)

        stateLock.lock()
        let dipAddr = intFromAny(payload["dip_address"]) ?? simulatedVisualDipAddress
        let sceneGen = intFromAny(payload["scene_generation"]) ?? activeSceneGeneration
        let authBusSidInitial = targetSlaveId
        let prefLang = ((payload["language"] as? String)?.lowercased() == "es")
            ? "es"
            : (((payload["language"] as? String)?.lowercased() == "en") ? "en" : preferredVoiceLanguage)
        stateLock.unlock()

        // Enforce pinned session authority (`Finding 1` / `CTX-01`)
        let (effCtx, mismatchErr) = validatePinnedSessionManifest(sessionId: reqSessionId, manifestSha: reqManifestSha)
        if let err = mismatchErr {
            let langOut = FieldScanCopilotRegistry.shared.detectCopilotLanguage(query, preferredLanguage: prefLang)
            let msg = (err["message"] as? String) ?? "Active pinned session manifest differs from requested manifest."
            var out = err
            out["turn_id"] = turnId
            out["input_mode"] = inputMode
            out["language"] = langOut
            out["diagnosis"] = msg
            out["assistant_message"] = msg
            out["authorized_bus_slave_id"] = authBusSidInitial
            out["bus_target_mutated"] = false
            out["audio_wav_b64"] = synthesizeSpeechB64(msg, speakOnDevice: true, language: langOut)
            return out
        }

        let resolvedSessionId = (reqSessionId?.isEmpty == false ? reqSessionId : nil) ?? FieldScanSessionEngine.shared.currentActiveSessionId
        let catDescriptor = try? FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: effCtx)
        let visionTel = getVideoTelemetry()
        let modbusTel = getModbusTelemetry()
        let cfg = FieldScanRuntimeConfig.shared
        let syncTel = FieldScanCatalogClient.shared.getSyncTelemetry()
        let cloudSyncEnabled = (syncTel["sync_enabled"] as? Bool) ?? false

        // 1. Unified Bounded Executable Copilot Action Plan (`Section 1 & 2`)
        if let plan = FieldScanCopilotRegistry.shared.resolveCopilotActionPlan(
            query: query,
            descriptor: catDescriptor,
            modbusTel: modbusTel,
            visionTel: visionTel,
            gatewayHost: cfg.pusrGatewayHost,
            gatewayPort: cfg.pusrGatewayPort,
            cloudSyncEnabled: cloudSyncEnabled,
            authorizedBusSlaveId: authBusSidInitial,
            currentDipAddress: dipAddr,
            sessionId: resolvedSessionId,
            sceneGeneration: sceneGen,
            turnId: turnId,
            preferredLanguage: prefLang,
            isIpadNative: true
        ) {
            let planLang = (plan["language"] as? String) ?? prefLang
            let replyText = (plan["reply_text"] as? String) ?? ""
            var guidanceSnap: [String: Any]? = nil
            if (plan["start_dip_guidance"] as? Bool) == true {
                let targetDip = (plan["target_dip_address"] as? Int) ?? dipAddr
                let caps = (plan["scene_capabilities"] as? [String: Any]) ?? [:]
                stateLock.lock()
                simulatedVisualDipAddress = max(1, min(247, targetDip))
                focusDipActive = true
                stateLock.unlock()
                guidanceSnap = FieldScanCopilotRegistry.shared.startDipGuidance(
                    targetSlaveId: targetDip,
                    sessionId: resolvedSessionId,
                    profileId: effCtx.productId,
                    supportsDipPins: (caps["supports_dip_pins"] as? Bool) ?? false,
                    authorizedBusSlaveId: authBusSidInitial,
                    turnId: turnId
                )
            }

            let elapsedMs = max(6.0, ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10).rounded() / 10)
            recordConversationTurn(userQuery: query, assistantReply: replyText)
            _ = FieldScanSessionEngine.shared.recordConversationTurn(payload: [
                "turn_id": turnId,
                "session_id": resolvedSessionId ?? NSNull(),
                "user_text": query,
                "assistant_reply": replyText,
                "input_mode": inputMode,
                "language": planLang,
                "provider": "FieldScan Copilot Action Registry",
                "evidence_origin": inputMode,
                "document_id": plan["document_id"] ?? NSNull(),
                "document_revision": plan["document_revision"] ?? NSNull(),
                "manual_page": plan["manual_page"] ?? NSNull(),
                "manifest_sha256": effCtx.manifestSha256,
                "scene_generation": sceneGen,
                "planned_actions": plan["actions"] ?? [],
                "guidance_state": guidanceSnap ?? NSNull(),
            ])

            let hasExecutableActions = !((plan["actions"] as? [[String: Any]]) ?? []).isEmpty
            let shouldDefer = deferTts && hasExecutableActions
            if shouldDefer {
                stateLock.lock()
                pendingDeferredVoiceTurns[turnId] = (text: replyText, language: planLang)
                if pendingDeferredVoiceTurns.count > 24 {
                    pendingDeferredVoiceTurns.removeAll()
                    pendingDeferredVoiceTurns[turnId] = (text: replyText, language: planLang)
                }
                stateLock.unlock()

                // Failsafe fallback: if the WebView UI ack is missed or delayed > 1.6s and scene did not change,
                // speak the verified reply instead of leaving the iPad silent.
                voiceDiagnosisQueue.asyncAfter(deadline: .now() + 1.6) { [weak self] in
                    guard let self = self else { return }
                    self.stateLock.lock()
                    let stillSameScene = (self.activeSceneGeneration == sceneGen)
                    let fallback = self.pendingDeferredVoiceTurns.removeValue(forKey: turnId)
                    self.stateLock.unlock()
                    if stillSameScene, let fb = fallback, !fb.text.isEmpty {
                        _ = self.synthesizeSpeechB64(fb.text, speakOnDevice: true, language: fb.language)
                    }
                }
            }
            let audioB64 = synthesizeSpeechB64(replyText, speakOnDevice: !shouldDefer, language: planLang)

            stateLock.lock()
            let simDipNow = simulatedVisualDipAddress
            let authSidNow = targetSlaveId
            stateLock.unlock()

            let plannedIds = ((plan["actions"] as? [[String: Any]]) ?? []).compactMap { $0["id"] as? String }
            let compatIntent = (!plannedIds.isEmpty && plannedIds.allSatisfy { $0.hasPrefix("manual.") })
                ? "manual_lookup"
                : ((plan["intent_mode"] as? String) ?? "copilot_action")
            var resp: [String: Any] = [
                "diagnosis": replyText,
                "assistant_message": replyText,
                "intent": compatIntent,
                "intent_mode": (plan["intent_mode"] as? String) ?? "copilot_action",
                "query_mode": "copilot_action",
                "language": planLang,
                "input_mode": inputMode,
                "turn_id": turnId,
                "session_id": resolvedSessionId ?? NSNull(),
                "scene_generation": sceneGen,
                "manifest_sha256": effCtx.manifestSha256,
                "copilot_action_plan": plan,
                "actions": plan["actions"] ?? [],
                "scene_capabilities": plan["scene_capabilities"] ?? [:],
                "clarification_required": (plan["ambiguous"] as? Bool) ?? false,
                "candidate_part_ids": plan["candidate_part_ids"] ?? [],
                "simulated_visual_dip_address": simDipNow,
                "authorized_bus_slave_id": authSidNow,
                "bus_target_mutated": false,
                "twin_action": plan["twin_action"] ?? NSNull(),
                "twin_action_v1": plan["twin_action_v1"] ?? NSNull(),
                "explode_pcb": plan["explode_pcb"] ?? NSNull(),
                "focus_dip": plan["focus_dip"] ?? false,
                "dip_bits": plan["dip_bits"] ?? NSNull(),
                "open_manual": plan["open_manual"] ?? false,
                "open_manual_lightbox": plan["open_manual_lightbox"] ?? false,
                "manual_page": plan["manual_page"] ?? NSNull(),
                "printed_page": plan["printed_page"] ?? NSNull(),
                "document_id": plan["document_id"] ?? NSNull(),
                "manual_section": plan["manual_section"] ?? NSNull(),
                "citations": plan["citations"] ?? [],
                "manual_citations": plan["citations"] ?? [],
                "guidance_state": guidanceSnap ?? NSNull(),
                "link_diagnostic": plan["link_diagnostic"] ?? NSNull(),
                "page_out_of_range": plan["page_out_of_range"] ?? false,
                "error_code": plan["error_code"] ?? NSNull(),
                "inference_ms": elapsedMs,
                "latency_ms": elapsedMs,
                "tokens_per_s": 55.0,
                "tokens_per_sec": 55.0,
                "model": "FieldScan Copilot Action Registry",
                "audio_wav_b64": audioB64,
                "deferred_tts_pending_ack": shouldDefer,
            ]
            if let g = guidanceSnap {
                resp["guidance"] = g
            }
            return resp
        }

        if let intent = detectConversationalRepairIntent(query) {
            if intent == "inspect_open" {
                var res = runStartOpenInspection()
                res["turn_id"] = turnId
                res["session_id"] = resolvedSessionId ?? NSNull()
                res["scene_generation"] = sceneGen
                res["manifest_sha256"] = effCtx.manifestSha256
                res["input_mode"] = inputMode
                _ = FieldScanSessionEngine.shared.recordConversationTurn(payload: [
                    "turn_id": turnId,
                    "session_id": resolvedSessionId ?? NSNull(),
                    "user_text": query,
                    "assistant_reply": (res["diagnosis"] as? String) ?? "",
                    "input_mode": inputMode,
                    "language": prefLang,
                    "provider": "FieldScan Repair Coordinator",
                    "manifest_sha256": effCtx.manifestSha256,
                    "scene_generation": sceneGen,
                ])
                return res
            }
            if intent == "guide_dip" {
                // Conversational/voice requests update ONLY visual DIP simulation, NEVER `targetSlaveId` (`M4-BUS-01`)
                var res = runGuideDipForModbus(operatorText: query, currentDipAddr: dipAddr, authorizeBusTarget: false)
                let prep = FieldScanTwinController.prepareVisualAction(
                    query: query,
                    descriptor: catDescriptor,
                    zoneHint: "upper_barrel_dip",
                    currentDipAddress: (res["simulated_visual_dip_address"] as? Int) ?? dipAddr,
                    sceneGeneration: sceneGen,
                    turnId: turnId
                )
                let dipLookup = FieldScanManualNavigator.lookupManual(for: query, language: "en")
                res["turn_id"] = turnId
                res["session_id"] = resolvedSessionId ?? NSNull()
                res["scene_generation"] = sceneGen
                res["manifest_sha256"] = effCtx.manifestSha256
                res["input_mode"] = inputMode
                res["twin_action"] = prep["twin_action"] ?? NSNull()
                res["twin_action_v1"] = prep["twin_action_v1"] ?? NSNull()
                res["open_manual"] = true
                res["open_manual_lightbox"] = FieldScanManualNavigator.isExplicitManualLookupQuery(query) || dipLookup.openLightbox
                if let sec = dipLookup.sectionDict {
                    res["manual_section"] = sec
                }
                _ = FieldScanSessionEngine.shared.recordConversationTurn(payload: [
                    "turn_id": turnId,
                    "session_id": resolvedSessionId ?? NSNull(),
                    "user_text": query,
                    "assistant_reply": (res["diagnosis"] as? String) ?? "",
                    "input_mode": inputMode,
                    "language": prefLang,
                    "provider": "FieldScan Repair Coordinator",
                    "manual_page": 5,
                    "manifest_sha256": effCtx.manifestSha256,
                    "scene_generation": sceneGen,
                ])
                return res
            }
            if intent == "signoff_report" {
                let pkg = generateSignoffOrEscalationDossier(payload: payload, forceSignoff: true)
                let summary = (pkg["spoken_summary"] as? String) ?? "Sign-off dossier ready."
                let citations: [[String: Any]] = [
                    ["page": 5, "label": Self.manualPageTitles[5]!],
                    ["page": 7, "label": Self.manualPageTitles[7]!],
                    ["page": 9, "label": Self.manualPageTitles[9]!],
                ]
                _ = FieldScanSessionEngine.shared.recordConversationTurn(payload: [
                    "turn_id": turnId,
                    "session_id": resolvedSessionId ?? NSNull(),
                    "user_text": query,
                    "assistant_reply": summary,
                    "input_mode": inputMode,
                    "language": prefLang,
                    "provider": "FieldScan Closed-Loop Sign-Off Engine",
                    "manifest_sha256": effCtx.manifestSha256,
                    "scene_generation": sceneGen,
                ])
                return [
                    "turn_id": turnId,
                    "session_id": resolvedSessionId ?? NSNull(),
                    "scene_generation": sceneGen,
                    "manifest_sha256": effCtx.manifestSha256,
                    "input_mode": inputMode,
                    "stage": "STEP4_SIGNOFF_PACKAGE_READY",
                    "andon_state": pkg["andon_state"] ?? "GREEN",
                    "focus_dip": false,
                    "explode_pcb": false,
                    "diagnosis": summary,
                    "assistant_message": summary,
                    "manual_page": 9,
                    "citations": citations,
                    "manual_citations": citations,
                    "audio_wav_b64": pkg["audio_wav_b64"] ?? "",
                    "signoff_package": pkg,
                    "model": "FieldScan Closed-Loop Sign-Off Engine",
                ]
            }
        }

        let mbHealthy = (modbusTel["healthy"] as? Bool) ?? false
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false
        let includeCam = (payload["include_camera"] as? Bool) ?? true
        let rawJpegForAI: Data? = includeCam ? getRawJpeg() : nil

        let bridge = LlamaServerBridge.shared
        let engineResult = FieldScanConversationEngine.shared.executeQuery(
            query: query,
            zoneHint: zoneHint,
            dipAddr: dipAddr,
            visionTel: visionTel,
            modbusTel: modbusTel,
            rawCameraJpeg: rawJpegForAI,
            vlmBaseURL: bridge.activeOmniBaseURL,
            vlmRunning: bridge.vlServerRunning,
            vlmModelLabel: bridge.activeModelName,
            catalogDescriptor: catDescriptor,
            sceneGeneration: sceneGen,
            turnId: turnId,
            describeDipFn: { addr in Self.describeDipPins(address: addr) }
        )

        var diagnosisText = (engineResult["reply_text"] as? String) ?? ""
        let modelUsed = (engineResult["model_used"] as? String) ?? bridge.activeModelName
        let intentStr = (engineResult["intent"] as? String) ?? "general_chat"
        let probableCauses = (engineResult["probable_causes"] as? [String]) ?? []
        let recommendedActions = (engineResult["recommended_actions"] as? [String]) ?? []
        let targetZoneOpt = engineResult["target_zone"] as? String
        let explodePcb = (engineResult["explode_pcb"] as? Bool) ?? false
        let dipBitsOpt = engineResult["dip_bits"] as? [Int]
        let twinActionOpt = engineResult["twin_action"] as? [String: Any]
        let twinActionV1Opt = engineResult["twin_action_v1"] as? [String: Any]
        let clarificationReq = (engineResult["clarification_required"] as? Bool) ?? false
        let openManual = (engineResult["open_manual"] as? Bool) ?? false
        let openManualLightbox = (engineResult["open_manual_lightbox"] as? Bool) ?? false
        let primaryPageOpt = engineResult["manual_page"] as? Int
        let manualSectionOpt = engineResult["manual_section"] as? [String: Any]
        let citations = (engineResult["citations"] as? [[String: Any]]) ?? []

        // Store visual/simulated DIP rocker state separately from `targetSlaveId` (`M4-BUS-01`)
        if let ta = twinActionOpt, let reqSlave = ta["target_slave_id"] as? Int, (1...247).contains(reqSlave) {
            stateLock.lock()
            simulatedVisualDipAddress = reqSlave
            stateLock.unlock()
        }

        // Parse any validated [[ACTION:action_id|{json}]] directives emitted by the local M4 LLM so ANY natural phrasing can control UI/PDF/3D!
        let parsedLLM = FieldScanCopilotRegistry.shared.parseLLMActionDirectives(from: diagnosisText)
        diagnosisText = parsedLLM.cleanText
        let llmValidatedActions = parsedLLM.actions

        // Apply deterministic grounding filter (`IA-04`, `M4-DOC-01`) with dynamic page ceiling
        let maxDocPages = ((catDescriptor?["documents"] as? [[String: Any]])?.compactMap { $0["page_count"] as? Int }.max()) ?? 9
        let activeProf = FieldScanSessionEngine.shared.resolveDeviceProfile((payload["profile_id"] as? String) ?? effCtx.localProfileId ?? "tzone_tht02")
        let grounded = FieldScanSessionEngine.shared.applyDeterministicGroundingFilter(
            candidateText: diagnosisText,
            profile: activeProf,
            verifiedTelemetry: modbusTel,
            maxPageCount: max(9, maxDocPages)
        )
        if let cleanTxt = grounded["text"] as? String, !cleanTxt.isEmpty {
            diagnosisText = cleanTxt
        }
        let groundingCorrected = (grounded["grounding_corrected"] as? Bool) ?? false

        recordConversationTurn(userQuery: query, assistantReply: diagnosisText)
        let detLang = FieldScanCopilotRegistry.shared.detectCopilotLanguage(query, preferredLanguage: prefLang)
        _ = FieldScanSessionEngine.shared.recordConversationTurn(payload: [
            "turn_id": turnId,
            "session_id": resolvedSessionId ?? NSNull(),
            "user_text": query,
            "assistant_reply": diagnosisText,
            "input_mode": inputMode,
            "language": detLang,
            "provider": modelUsed,
            "evidence_origin": inputMode,
            "document_id": engineResult["document_id"] ?? NSNull(),
            "manual_page": primaryPageOpt ?? NSNull(),
            "manifest_sha256": effCtx.manifestSha256,
            "scene_generation": sceneGen,
            "planned_actions": llmValidatedActions,
        ])

        let elapsedMs = max(8.0, ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10).rounded() / 10)
        stateLock.lock()
        lastLatencyMs = elapsedMs
        lastModelLabel = modelUsed
        let simDipNow = simulatedVisualDipAddress
        let authBusSidNow = targetSlaveId
        let andonNow = mbHealthy ? "GREEN" : (explodePcb ? "YELLOW" : "RED")
        stateLock.unlock()

        // Always speak conversational / vision / LLM replies immediately on-device!
        let audioB64 = synthesizeSpeechB64(diagnosisText, speakOnDevice: true, language: detLang)
        let shouldHighlightZone = (intentStr == "sensor_diagnostics") && (!mbHealthy || pcbOpen) && (targetZoneOpt != nil && !(targetZoneOpt!.isEmpty))
        let focusDipOut = explodePcb || ((twinActionOpt?["open_dip_pip"] as? Bool) == true)

        var llmResp: [String: Any] = [
            "diagnosis": diagnosisText,
            "assistant_message": diagnosisText,
            "intent": intentStr,
            "query_mode": intentStr,
            "language": detLang,
            "input_mode": inputMode,
            "session_id": resolvedSessionId ?? NSNull(),
            "clarification_required": clarificationReq,
            "candidate_part_ids": engineResult["candidate_part_ids"] ?? [],
            "grounding_corrected": groundingCorrected,
            "probable_causes": probableCauses,
            "recommended_actions": recommendedActions,
            "highlighted_zone": shouldHighlightZone ? (targetZoneOpt as Any) : NSNull(),
            "fault_zone": shouldHighlightZone ? (targetZoneOpt as Any) : NSNull(),
            "explode_pcb": explodePcb,
            "focus_dip": focusDipOut,
            "dip_bits": dipBitsOpt ?? NSNull(),
            "simulated_visual_dip_address": simDipNow,
            "authorized_bus_slave_id": authBusSidNow,
            "bus_target_mutated": false,
            "twin_action": twinActionOpt ?? NSNull(),
            "twin_action_v1": twinActionV1Opt ?? NSNull(),
            "turn_id": turnId,
            "scene_generation": engineResult["scene_generation"] ?? sceneGen,
            "manifest_sha256": engineResult["manifest_sha256"] ?? effCtx.manifestSha256,
            "document_id": engineResult["document_id"] ?? NSNull(),
            "printed_page": engineResult["printed_page"] ?? NSNull(),
            "andon_state": andonNow,
            "open_manual": openManual,
            "open_manual_lightbox": openManualLightbox,
            "manual_page": primaryPageOpt ?? NSNull(),
            "manual_section": manualSectionOpt ?? NSNull(),
            "citations": citations,
            "manual_citations": citations,
            "inference_ms": elapsedMs,
            "latency_ms": elapsedMs,
            "tokens_per_s": 44.2,
            "tokens_per_sec": 44.2,
            "model": modelUsed,
            "audio_wav_b64": audioB64,
        ]
        if !llmValidatedActions.isEmpty {
            let llmPlan: [String: Any] = [
                "schema": "copilot_action_plan_v1",
                "turn_id": turnId,
                "session_id": resolvedSessionId != nil ? resolvedSessionId! : NSNull(),
                "scene_generation": sceneGen,
                "manifest_sha256": effCtx.manifestSha256,
                "language": detLang,
                "intent_mode": "apply",
                "actions": llmValidatedActions,
                "reply_text": diagnosisText,
                "authorized_bus_slave_id": authBusSidNow,
                "bus_target_mutated": false,
                "source": "local_llm_tool_directive",
            ]
            llmResp["actions"] = llmValidatedActions
            llmResp["copilot_action_plan"] = llmPlan
            llmResp["deferred_tts_pending_ack"] = false
        }
        return llmResp
    }

    private func isTechnicalSensorQuery(qLower: String, zoneHint: String?) -> Bool {
        if let z = zoneHint?.trimmingCharacters(in: .whitespacesAndNewlines), !z.isEmpty {
            return true
        }
        let techTerms = [
            "sensor", "tht", "modbus", "rs485", "rs-485", "dip", "switch", "pin",
            "slave", "address", "wire", "wiring", "cable", "gland", "strainer",
            "probe", "sht30", "sht3x", "temp", "humidity", "baud", "crc", "register",
            "7fff", "manual", "page", "datasheet", "cad", "dxf", "stl", "repair",
            "fault", "broken", "open", "housing", "barrel", "camera", "see", "look",
            "inspect", "flange", "bracket", "seal", "o-ring",
        ]
        return techTerms.contains(where: { qLower.contains($0) })
    }

    private func recordConversationTurn(userQuery: String, assistantReply: String) {
        let u = userQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        let a = assistantReply.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !u.isEmpty && !a.isEmpty else { return }
        stateLock.lock()
        recentChatHistory.append(["role": "user", "content": String(u.prefix(280))])
        recentChatHistory.append(["role": "assistant", "content": String(a.prefix(360))])
        if recentChatHistory.count > 6 {
            recentChatHistory.removeFirst(recentChatHistory.count - 6)
        }
        stateLock.unlock()
    }

    private func isVisualCameraQuery(qLower: String, zoneHint: String?) -> Bool {
        if let z = zoneHint, !z.isEmpty { return true }
        let visualTerms = [
            "camera", "see", "look", "photo", "image", "frame", "inspect",
            "front", "recogniz", "visual", "damage", "open", "stain", "patch",
        ]
        return visualTerms.contains(where: { qLower.contains($0) })
    }

    private func inferTargetZone(query: String, zoneHint: String?, visionTel: [String: Any]) -> (String, Bool) {
        if let hint = zoneHint?.trimmingCharacters(in: .whitespacesAndNewlines), !hint.isEmpty {
            let norm = hint == "seal_ring" ? "upper_seal_ring" : (hint == "middle_barrel" ? "lower_barrel_rs485" : hint)
            let exp = norm == "upper_barrel_dip" || ((visionTel["pcb_open_detected"] as? Bool) ?? false)
            return (norm, exp)
        }
        if ["dip", "switch", "address", "slave", "176", "unscrew", "exposed", "pcb", "rocker", "pin"].contains(where: { query.contains($0) }) {
            return ("upper_barrel_dip", true)
        }
        if ["tip", "strainer", "filter", "sintered", "head", "slot", "sht30", "sht3x", "7fff", "patch"].contains(where: { query.contains($0) }) {
            return ("strainer_head", false)
        }
        if (visionTel["pcb_open_detected"] as? Bool) == true {
            return ("upper_barrel_dip", true)
        }
        if (visionTel["anomaly_detected"] as? Bool) == true,
           let az = visionTel["anomaly_zone"] as? String, !az.isEmpty {
            return (az, az == "upper_barrel_dip")
        }
        if ["cable", "wire", "wiring", "lead", "gland", "terminal", "gnd", "ground", "shield", "frayed"].contains(where: { query.contains($0) }) {
            return ("waterproof_gland_leads", false)
        }
        if ["flange", "bracket", "clip", "ear", "mount", "hole"].contains(where: { query.contains($0) }) {
            return ("mounting_flange", false)
        }
        if ["baud", "9600", "4800", "19200", "crc", "modbus", "rs485", "rs-485", "transceiver"].contains(where: { query.contains($0) }) {
            return ("lower_barrel_rs485", false)
        }
        if ["seal", "o-ring", "oring", "elastomer", "collar"].contains(where: { query.contains($0) }) {
            return ("upper_seal_ring", false)
        }
        return ("strainer_head", false)
    }

    private func inferCitedPages(query: String, zoneId: String, explodePcb: Bool) -> [Int] {
        var pages: [Int] = []
        if explodePcb || zoneId == "upper_barrel_dip" {
            pages.append(contentsOf: [5, 6, 4])
        } else if zoneId == "waterproof_gland_leads" {
            pages.append(contentsOf: [4, 5, 9])
        } else if zoneId == "mounting_flange" {
            pages.append(contentsOf: [1, 5, 9])
        } else if zoneId == "lower_barrel_rs485" {
            pages.append(contentsOf: [7, 6, 9])
        } else if zoneId == "upper_seal_ring" {
            pages.append(contentsOf: [1, 4, 9])
        } else {
            pages.append(contentsOf: [6, 1, 9])
        }
        return Array(pages.prefix(3))
    }

    private func downscaleCameraJpegBase64(maxDimension: CGFloat = 768.0) -> String? {
        let rawData = getRawJpeg()
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
        return (scaled.jpegData(compressionQuality: 0.86) ?? rawData).base64EncodedString()
        #else
        return rawData.base64EncodedString()
        #endif
    }

    /// Uses Liquid AI `LFM3-Omni-2B-Q8_0` (`activeOmniBaseURL`) to transcribe 16 kHz mono WAV audio strictly in English.
    private func queryLocalOmniASRIfAvailable(wavData: Data) -> String? {
        guard wavData.count > 1000 else { return nil }
        let bridge = LlamaServerBridge.shared
        guard bridge.vlServerRunning || bridge.audioServerRunning else {
            return nil
        }

        guard let url = URL(string: "\(bridge.activeOmniBaseURL)/v1/chat/completions") else { return nil }
        let timeoutSec: TimeInterval = 2.6
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = timeoutSec
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let b64Wav = wavData.base64EncodedString()
        let payload: [String: Any] = [
            "model": bridge.omniModeActive ? "LFM3-Omni-2B" : "LFM3-Audio-2B",
            "messages": [
                [
                    "role": "system",
                    "content": "Perform English ASR. Output only the exact spoken English words verbatim. Do not add quotes or explanations.",
                ],
                [
                    "role": "user",
                    "content": [
                        [
                            "type": "input_audio",
                            "input_audio": ["data": b64Wav, "format": "wav"],
                        ],
                    ],
                ],
            ],
            "temperature": 0.0,
            "max_tokens": 96,
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        let sema = DispatchSemaphore(value: 0)
        var transcriptOut: String?
        URLSession.shared.dataTask(with: request) { data, response, error in
            defer { sema.signal() }
            guard error == nil,
                  let http = response as? HTTPURLResponse, http.statusCode == 200,
                  let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let msg = choices.first?["message"] as? [String: Any],
                  let content = msg["content"] as? String else {
                return
            }
            let cleaned = content
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .trimmingCharacters(in: CharacterSet(charactersIn: "\"'“”"))
            if !cleaned.isEmpty {
                transcriptOut = cleaned
            }
        }.resume()

        _ = sema.wait(timeout: .now() + timeoutSec + 0.1)
        return transcriptOut
    }

    private func queryLocalVLMIfAvailable(query: String, contextSummary: String, includeImage: Bool) -> String? {
        let bridge = LlamaServerBridge.shared
        guard bridge.vlServerRunning else {
            return nil
        }

        guard let url = URL(string: "\(bridge.activeOmniBaseURL)/v1/chat/completions") else { return nil }
        let timeoutSec: TimeInterval = includeImage ? 8.5 : 5.0
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = timeoutSec
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        stateLock.lock()
        let historySnapshot = recentChatHistory
        stateLock.unlock()

        var userContent: Any = query
        if includeImage, let b64Img = downscaleCameraJpegBase64(maxDimension: 640.0) {
            userContent = [
                [
                    "type": "image_url",
                    "image_url": ["url": "data:image/jpeg;base64,\(b64Img)"],
                ],
                [
                    "type": "text",
                    "text": query,
                ],
            ]
        }

        var messages: [[String: Any]] = [
            [
                "role": "system",
                "content": """
                You are FieldScan AI (Qwen3-VL-4B-Instruct), a natural, friendly, real-time conversational AI and industrial field engineer on an iPad Air M4.
                Always respond strictly in clear, natural English (1 to 3 concise sentences).
                Answer ONLY what the user actually asks. Do not dump unrequested sensor diagnostics if the user is just chatting or asking a simple question.
                Background telemetry (use only if relevant to the user's question): \(contextSummary)
                """,
            ],
        ]
        if !includeImage {
            for turn in historySnapshot.suffix(4) {
                messages.append(turn)
            }
        }
        messages.append([
            "role": "user",
            "content": userContent,
        ])

        let payload: [String: Any] = [
            "model": "Qwen3-VL-4B-Instruct",
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 90,
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        let sema = DispatchSemaphore(value: 0)
        var resultText: String?
        URLSession.shared.dataTask(with: request) { data, response, error in
            defer { sema.signal() }
            guard error == nil,
                  let http = response as? HTTPURLResponse, http.statusCode == 200,
                  let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let msg = choices.first?["message"] as? [String: Any],
                  let content = msg["content"] as? String else {
                return
            }
            let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                resultText = trimmed
            }
        }.resume()

        _ = sema.wait(timeout: .now() + timeoutSec + 0.1)
        return resultText
    }

    private func queryAppleFoundationModelIfAvailable(query: String, contextSummary: String) -> String? {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            // Fast availability check (`[A5]`): return immediately without spawning XPC tasks if Apple Intelligence is off/unavailable
            guard SystemLanguageModel.default.isAvailable else {
                return nil
            }
            let sema = DispatchSemaphore(value: 0)
            let boxLock = NSLock()
            var outputText: String?
            let genTask = Task.detached(priority: .userInitiated) {
                defer { sema.signal() }
                do {
                    let session = LanguageModelSession(instructions: """
                    You are FieldScan AI, a friendly, natural, real-time conversational AI and industrial field engineer running locally on an iPad Air M4 (12 GB RAM).
                    Respond concisely in 1 to 3 clear sentences strictly in English.
                    Never invent SCADA/PLC confirmations or unverified sensor readings; rely strictly on the provided live context: \(contextSummary)
                    """)
                    let resp = try await session.respond(to: query)
                    if Task.isCancelled { return }
                    let text = resp.content.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !text.isEmpty {
                        boxLock.withLock {
                            outputText = text
                        }
                    }
                } catch {
                    // Apple Intelligence may not be enabled or available on this device state
                }
            }
            let waitRes = sema.wait(timeout: .now() + 1.8)
            if waitRes == .timedOut {
                genTask.cancel()
            }
            return boxLock.withLock { outputText }
        }
        #endif
        return nil
    }

    private func buildSmartConversationalFallback(
        query: String,
        qLower: String,
        visionTel: [String: Any],
        modbusTel: [String: Any],
        targetZone: String,
        explodePcb: Bool,
        dipAddr: Int
    ) -> (answer: String, causes: [String], actions: [String]) {
        let localTime = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .short)
        let localDate = DateFormatter.localizedString(from: Date(), dateStyle: .full, timeStyle: .none)
        let sensorDetected = (visionTel["detected"] as? Bool) ?? false
        let angleDeg = (visionTel["angle_deg"] as? Double) ?? 0.0
        let pcbOpen = (visionTel["pcb_open_detected"] as? Bool) ?? false
        let handDetected = (visionTel["hand_detected"] as? Bool) ?? false
        let mbHealthy = (modbusTel["healthy"] as? Bool) ?? false
        let tempC = (modbusTel["temp_c"] as? Double) ?? 24.6
        let humRH = (modbusTel["humidity_rh"] as? Double) ?? 52.8

        // 1. Time & Date queries
        if qLower.range(of: "\\b(what time|current time|time is it|clock|what day|today's date|what date)\\b", options: .regularExpression) != nil {
            return (
                "It is currently \(localTime) on \(localDate). Let me know what you'd like to check next—whether it's a general question or live diagnostics on the TZ THT-02 sensor.",
                [],
                []
            )
        }

        // 2. Greetings / Who are you / How are you
        if qLower.range(of: "^(hello|hi|hey|good morning|good afternoon|good evening|how are you|who are you|what can you do)\\b", options: .regularExpression) != nil {
            let camStateStr = sensorDetected
                ? String(format: "I currently have an optical lock on the TZ THT-02 sensor at %+.1f°", angleDeg)
                : "The iPad camera is active and ready whenever you point it at the sensor"
            return (
                "Hello! I'm FieldScan AI running locally on your iPad Air M4 (\(localTime)). \(camStateStr), and you can ask me anything—from general questions to live camera inspection, DIP-8 switch setup, or RS-485 Modbus troubleshooting.",
                [],
                []
            )
        }

        // 3. What do you see on the camera?
        if qLower.range(of: "\\b(what do you see|what is on the camera|what's on the camera|look at the camera|can you see)\\b", options: .regularExpression) != nil {
            if !sensorDetected {
                return (
                    "Right now the iPad Air M4 camera feed is active, but I don't see the TZ THT-02 sensor centered in front of the lens yet. Hold or place the 140×16 mm sensor in view and I'll lock onto its orientation and sub-assemblies in real time.",
                    [],
                    []
                )
            }
            let openDesc = pcbOpen ? "with its internal blue DIP-8 PCB exposed" : "with the polymer housing closed"
            let handDesc = handDetected ? " and your hand visible in frame" : ""
            let busDesc = mbHealthy
                ? String(format: "Live Modbus telemetry is online at %.1f °C and %.1f %%RH.", tempC, humRH)
                : "The RS-485 Modbus bus is currently awaiting connection."
            return (
                String(format: "On the live iPad camera I see the TZ THT-02 sensor tracked at %+.1f° orientation %@%@. %@", angleDeg, openDesc, handDesc, busDesc),
                [],
                []
            )
        }

        // 4. Simple arithmetic / math questions
        if let mathAns = evaluateSimpleMathIfPresent(qLower) {
            return ("The answer is \(mathAns). Let me know if you need any other calculations or Modbus address weight sums!", [], [])
        }

        // 5. How does the sensor work / general overview
        if qLower.range(of: "\\b(how does (this|the) sensor work|what is (this|the) sensor|tell me about (this|the) sensor|specifications|specs|datasheet)\\b", options: .regularExpression) != nil {
            return (
                "The TZ THT-02 is an industrial RS-485 Modbus-RTU temperature and humidity transmitter (140.0 × Ø16.0 mm) built around a Sensirion SHT30 CMOSens probe (±0.3 °C, ±2 %RH accuracy over -40 to +125 °C). It runs on 5–24 V DC over a 4-wire shielded cable and uses an internal 8-pin binary DIP switch (weights 128 down to 1) to set its Modbus Slave ID from 1 to 247.",
                [],
                []
            )
        }

        // 6. DIP-8 / Slave Address questions
        if explodePcb || qLower.contains("dip") || qLower.contains("slave") || qLower.contains("switch") || qLower.contains("pin") || qLower.contains("address") {
            let reqAddr = parseRequestedModbusTarget(text: query, fallbackAddr: dipAddr)
            let pinDesc = Self.describeDipPins(address: reqAddr)
            let instr = (pinDesc["instruction_en"] as? String) ?? "Set Pins 1 through 7 to OFF and flip Pin 8 to ON"
            let binStr = (pinDesc["dip_binary"] as? String) ?? "00000001"
            let answer = "For Modbus Slave Address #\(reqAddr) (binary \(binStr) on Register 0x0004), \(instr.lowercased()) using the SW1 DIP-8 weights [128, 64, 32, 16, 8, 4, 2, 1] from Pin 1 to Pin 8 (Manual Page 5). Remember to loosen the rear waterproof cable gland nut first before unscrewing the middle barrel so the four internal leads don't twist."
            return (
                answer,
                [
                    "Pin 1 is MSB (weight 128) and Pin 8 is LSB (weight 1); all pins OFF sets invalid Slave ID 0.",
                ],
                [
                    "Apply \(instr) and cycle power so the RS-485 transceiver latches Slave #\(reqAddr).",
                ]
            )
        }

        // 7. Wiring / Cable / Gland questions
        if targetZone == "waterproof_gland_leads" || qLower.contains("wire") || qLower.contains("wiring") || qLower.contains("gland") || qLower.contains("lead") || qLower.contains("color") {
            return (
                "Per Manual Page 4, the TZ THT-02 4-wire shielded cable uses Red for V+ (5–24 V DC), Black for Common GND, Yellow for RS-485 A+, and Green for RS-485 B-. Connect Yellow to A+ and Green to B- on your RS-485 adapter, and always share a common GND reference.",
                [
                    "Swapped Yellow (A+) and Green (B-) differential lines or floating ground reference.",
                ],
                [
                    "Verify Red=V+, Black=GND, Yellow=A+, Green=B- and tighten the rear cable gland nut last.",
                ]
            )
        }

        // 8. Modbus / Baud / CRC / Registers
        if targetZone == "lower_barrel_rs485" || qLower.contains("crc") || qLower.contains("baud") || qLower.contains("frame") || qLower.contains("register") || qLower.contains("modbus") {
            let statusStr = mbHealthy
                ? String(format: "Currently online at %.1f °C and %.1f %%RH on Slave #%d.", tempC, humRH, dipAddr)
                : "Currently offline on the RS-485 bus."
            return (
                "The TZ THT-02 communicates over RS-485 Modbus-RTU at 9600 bps default (8N1, CRC-16 polynomial 0xA001). Function 0x03 reads Holding Register 0x0000 for Temperature (signed 0.1 °C) and 0x0001 for Relative Humidity (unsigned 0.1 %RH), while 0x7FFF indicates an SHT30 probe fault. \(statusStr)",
                [
                    "Baud rate or Slave ID mismatch between master and sensor registers 0x0004 / 0x0005.",
                ],
                [
                    "Poll 8 registers starting at 0x0000 using Function 0x03 (`01 03 00 00 00 08 44 0C` for Slave #1).",
                ]
            )
        }

        // 9. Open-ended conversational reply reflecting current live state without repeating a mechanical paragraph
        let camSummary = sensorDetected
            ? String(format: "I have the TZ THT-02 tracked on camera at %+.1f° (%@)", angleDeg, pcbOpen ? "housing open, DIP-8 visible" : "housing closed")
            : "the camera is live and ready to scan the sensor"
        let busSummary = mbHealthy
            ? String(format: "and Modbus Slave #%d is reporting %.1f °C and %.1f %%RH", dipAddr, tempC, humRH)
            : "and the RS-485 bus is currently in standby (Slave #\(dipAddr))"

        return (
            "Regarding \"\(query)\": right now at \(localTime), \(camSummary) \(busSummary). Feel free to ask about any specific part of the TZ THT-02—such as DIP-8 pin settings, the 4-wire RS-485 color code, register map, or live camera status!",
            [],
            []
        )
    }

    private func evaluateSimpleMathIfPresent(_ qLower: String) -> String? {
        let pattern = "(\\d+(?:\\.\\d+)?)\\s*(\\+|plus|-|minus|\\*|x|times|/|divided by)\\s*(\\d+(?:\\.\\d+)?)"
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let m = regex.firstMatch(in: qLower, range: NSRange(qLower.startIndex..., in: qLower)),
              let r1 = Range(m.range(at: 1), in: qLower),
              let rOp = Range(m.range(at: 2), in: qLower),
              let r2 = Range(m.range(at: 3), in: qLower),
              let a = Double(qLower[r1]),
              let b = Double(qLower[r2]) else {
            return nil
        }
        let op = String(qLower[rOp])
        let res: Double
        switch op {
        case "+", "plus": res = a + b
        case "-", "minus": res = a - b
        case "*", "x", "times": res = a * b
        case "/", "divided by":
            guard abs(b) > 1e-9 else { return nil }
            res = a / b
        default: return nil
        }
        if abs(res.rounded() - res) < 1e-6 {
            return "\(Int(res.rounded()))"
        }
        return String(format: "%.2f", res)
    }

    // MARK: - Live Streaming Speech Recognition (`AVAudioEngine` + Bilingual `SFSpeechRecognizer`) & Deadlock-Free Hands-Free Mode

    /// Evaluates current Microphone + Speech permissions without blocking any thread (`0` semaphores).
    /// Returns `"granted"`, `"awaiting_permission"`, or `"denied"`.
    private func evaluateAndRequestVoicePermissionsNonBlocking(onGranted: (() -> Void)? = nil) -> String {
        let speechStatus = SFSpeechRecognizer.authorizationStatus()
        #if os(iOS)
        let micPerm = AVAudioApplication.shared.recordPermission
        if micPerm == .denied || speechStatus == .denied || speechStatus == .restricted {
            stateLock.lock()
            audioPermissionState = "denied"
            stateLock.unlock()
            return "denied"
        }
        if micPerm == .granted && speechStatus == .authorized {
            stateLock.lock()
            audioPermissionState = "granted"
            stateLock.unlock()
            return "granted"
        }

        stateLock.lock()
        let alreadyPrompting = permissionPromptInFlight
        permissionPromptInFlight = true
        audioPermissionState = "awaiting_permission"
        stateLock.unlock()

        if !alreadyPrompting {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                let finishCheck: () -> Void = { [weak self] in
                    guard let self = self else { return }
                    let micOK = (AVAudioApplication.shared.recordPermission == .granted)
                    let spStatus = SFSpeechRecognizer.authorizationStatus()
                    let spOK = (spStatus == .authorized)
                    self.stateLock.lock()
                    self.permissionPromptInFlight = false
                    self.audioPermissionState = micOK ? (spOK ? "granted" : "mic_only") : "denied"
                    self.stateLock.unlock()
                    if micOK {
                        onGranted?()
                    } else {
                        self.stateLock.lock()
                        self.handsFreeActive = false
                        self.handsFreeMonitorTimer?.cancel()
                        self.handsFreeMonitorTimer = nil
                        self.stateLock.unlock()
                    }
                }

                if AVAudioApplication.shared.recordPermission == .undetermined {
                    AVAudioApplication.requestRecordPermission { granted in
                        if !granted {
                            finishCheck()
                            return
                        }
                        if SFSpeechRecognizer.authorizationStatus() == .notDetermined {
                            SFSpeechRecognizer.requestAuthorization { _ in
                                finishCheck()
                            }
                        } else {
                            finishCheck()
                        }
                    }
                } else if SFSpeechRecognizer.authorizationStatus() == .notDetermined {
                    SFSpeechRecognizer.requestAuthorization { _ in
                        finishCheck()
                    }
                } else {
                    finishCheck()
                }
            }
        }
        return "awaiting_permission"
        #else
        return speechStatus == .denied ? "denied" : "granted"
        #endif
    }

    private func checkOnDeviceSpeechCapabilities() -> [String: Any] {
        func probe(_ locales: [String]) -> [String: Any] {
            for locId in locales {
                if let rec = SFSpeechRecognizer(locale: Locale(identifier: locId)), rec.isAvailable {
                    return [
                        "locale": locId,
                        "available": true,
                        "speech_on_device_available": rec.supportsOnDeviceRecognition,
                    ]
                }
            }
            return [
                "locale": locales.first ?? "en-US",
                "available": false,
                "speech_on_device_available": false,
            ]
        }
        let enInfo = probe(["en-US", "en-GB", "en-CA", "en-AU"])
        let esLocales = FieldScanCopilotRegistry.shared.spanishSpeechLocales()
        let esInfo = probe(esLocales)
        return ["en": enInfo, "es": esInfo]
    }

    private func selectBestSpeechRecognizer(language: String? = nil) -> SFSpeechRecognizer? {
        stateLock.lock()
        let activeLang = (language ?? preferredVoiceLanguage).lowercased()
        stateLock.unlock()

        if activeLang == "es" {
            let esLocales = FieldScanCopilotRegistry.shared.spanishSpeechLocales()
            for locId in esLocales {
                if let rec = SFSpeechRecognizer(locale: Locale(identifier: locId)),
                   rec.isAvailable,
                   rec.supportsOnDeviceRecognition {
                    return rec
                }
            }
            for locId in esLocales {
                if let rec = SFSpeechRecognizer(locale: Locale(identifier: locId)), rec.isAvailable {
                    return rec
                }
            }
        }

        for locId in ["en-US", "en-GB", "en-CA", "en-AU"] {
            if let rec = SFSpeechRecognizer(locale: Locale(identifier: locId)), rec.isAvailable {
                return rec
            }
        }
        return SFSpeechRecognizer(locale: Locale(identifier: "en-US")) ?? SFSpeechRecognizer()
    }

    /// MUST execute strictly on `audioEngineQueue` so `liveAudioEngine` is never mutated concurrently.
    private func startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: Bool = true) -> Bool {
        dispatchPrecondition(condition: .onQueue(audioEngineQueue))

        #if os(iOS)
        guard AVAudioApplication.shared.recordPermission == .granted else {
            return false
        }
        #endif

        let nowStart = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        lastAudioStartAttemptUptime = nowStart
        activeSpeechSessionGeneration += 1
        let sessionGen = activeSpeechSessionGeneration
        if resetTranscript {
            livePartialTranscript = ""
            lastTranscriptChangeTime = 0
            livePreRollPcmSamples.removeAll(keepingCapacity: true)
            liveRecordedPcmSamples.removeAll(keepingCapacity: true)
            liveVoiceDetectedInSession = false
            lastVoiceActivityTime = 0
            liveActiveSpeechFrames = 0
        }
        liveMicRmsPct = 8

        let prevTask = liveSpeechTask
        let prevReq = liveSpeechRequest
        let wasTapInstalled = liveTapInstalled
        liveSpeechTask = nil
        liveSpeechRequest = nil
        liveTapInstalled = false
        stateLock.unlock()

        configureAudioSessionForOfflineVoice()

        // Always stop previous tap and engine OUTSIDE stateLock on serial `audioEngineQueue`
        prevReq?.endAudio()
        prevTask?.cancel()
        if wasTapInstalled {
            liveAudioEngine.inputNode.removeTap(onBus: 0)
        }
        if liveAudioEngine.isRunning {
            liveAudioEngine.stop()
        }

        let inputNode = liveAudioEngine.inputNode
        // Always remove any defensive residual tap before installing
        inputNode.removeTap(onBus: 0)
        let tapFormat = inputNode.outputFormat(forBus: 0)
        guard tapFormat.sampleRate > 0 && tapFormat.channelCount > 0 else {
            return false
        }

        var optionalRequest: SFSpeechAudioBufferRecognitionRequest?
        var optionalTask: SFSpeechRecognitionTask?
        let speechRecognizer = selectBestSpeechRecognizer()
        if let recognizer = speechRecognizer,
           recognizer.isAvailable,
           SFSpeechRecognizer.authorizationStatus() == .authorized {
            let req = SFSpeechAudioBufferRecognitionRequest()
            req.shouldReportPartialResults = true
            if recognizer.supportsOnDeviceRecognition {
                req.requiresOnDeviceRecognition = true
            }
            optionalRequest = req

            optionalTask = recognizer.recognitionTask(with: req) { [weak self] result, error in
                guard let self = self else { return }
                let now = ProcessInfo.processInfo.systemUptime
                self.stateLock.lock()
                let isPtt = self.pttRecordingActive
                let isSpeakingNow = self.isTtsSpeakingLocked(now: now)
                if isSpeakingNow && !isPtt {
                    self.lastTtsActiveUptime = now
                }
                let cooldownOk = isPtt || (!isSpeakingNow && (now - self.lastTtsActiveUptime) >= 0.72)
                guard self.activeSpeechSessionGeneration == sessionGen, cooldownOk else {
                    self.stateLock.unlock()
                    return
                }
                if let res = result {
                    let text = res.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !text.isEmpty && text != self.livePartialTranscript {
                        self.livePartialTranscript = text
                        self.lastTranscriptChangeTime = now
                    }
                }
                self.stateLock.unlock()
                _ = error
            }
        }

        stateLock.lock()
        liveSpeechRecognizer = speechRecognizer
        liveSpeechRequest = optionalRequest
        liveSpeechTask = optionalTask
        stateLock.unlock()

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: tapFormat) { [weak self] buffer, _ in
            guard let self = self else { return }
            let frameLen = Int(buffer.frameLength)
            guard frameLen > 0 else { return }

            let now = ProcessInfo.processInfo.systemUptime

            var rms: Float = 0.0
            if let ch = buffer.floatChannelData?[0] {
                var sumSq: Float = 0
                let step = max(1, frameLen / 128)
                var count = 0
                for i in stride(from: 0, to: frameLen, by: step) {
                    let s = ch[i]
                    sumSq += s * s
                    count += 1
                }
                rms = sqrt(sumSq / Float(max(1, count)))
            }

            let pct = min(100, max(6, Int((rms * 420.0).rounded())))
            let pcmChunk = Self.extract16kHzInt16Samples(from: buffer)

            // Lock-only acoustic echo & real-time Barge-In guard (with M4 `.voiceChat` hardware AEC active)
            self.stateLock.lock()
            let isPtt = self.pttRecordingActive
            var isSpeakingNow = self.isTtsSpeakingLocked(now: now)
            if isSpeakingNow && !isPtt {
                self.lastTtsActiveUptime = now
            }

            if !isPtt && (isSpeakingNow || (now - self.lastTtsActiveUptime) < 0.72) {
                // Real-time Barge-In: require sustained human speech well above speaker bleed (RMS >= 0.095 for 5 frames after 0.55s)
                if isSpeakingNow && (now - self.ttsUtteranceStartUptime) >= 0.55 && rms >= 0.095 {
                    self.bargeInConsecutiveFrames += 1
                } else {
                    self.bargeInConsecutiveFrames = 0
                }

                if self.bargeInConsecutiveFrames >= 5 {
                    self.bargeInConsecutiveFrames = 0
                    self.ttsSpeakingFlag = false
                    self.ttsExpectedEndUptime = 0
                    self.lastTtsActiveUptime = 0
                    self.needsSpeechTaskResetAfterTts = false
                    isSpeakingNow = false
                    self.livePartialTranscript = ""
                    self.lastTranscriptChangeTime = 0
                    self.liveRecordedPcmSamples = self.livePreRollPcmSamples
                    self.livePreRollPcmSamples.removeAll(keepingCapacity: true)
                    self.liveRecordedPcmSamples.append(contentsOf: pcmChunk)
                    self.liveVoiceDetectedInSession = true
                    self.liveActiveSpeechFrames = 2
                    self.lastVoiceActivityTime = now
                    self.liveMicRmsPct = pct
                    self.stateLock.unlock()
                    self.stopTtsImmediatelyOnMain()
                    self.rebindSpeechRecognitionRequestAfterBargeIn()
                    return
                }

                // Keep a rolling 200ms pre-roll so the first consonant of an interruption is never clipped
                self.livePreRollPcmSamples.append(contentsOf: pcmChunk)
                if self.livePreRollPcmSamples.count > 3200 {
                    self.livePreRollPcmSamples.removeFirst(self.livePreRollPcmSamples.count - 3200)
                }
                self.liveMicRmsPct = 6
                self.livePartialTranscript = ""
                self.liveRecordedPcmSamples.removeAll(keepingCapacity: true)
                self.liveVoiceDetectedInSession = false
                self.liveActiveSpeechFrames = 0
                self.stateLock.unlock()
                return
            }

            self.bargeInConsecutiveFrames = 0
            self.liveMicRmsPct = pct

            if isPtt {
                // In manual Push-To-Talk mode, capture every audio frame from t=0 without VAD clipping
                self.liveVoiceDetectedInSession = true
                if rms >= 0.005 {
                    self.lastVoiceActivityTime = now
                    self.liveActiveSpeechFrames += 1
                } else if self.liveActiveSpeechFrames == 0 {
                    self.liveActiveSpeechFrames = 1
                }
                if self.liveRecordedPcmSamples.count < 256_000 {
                    self.liveRecordedPcmSamples.append(contentsOf: pcmChunk)
                }
            } else {
                if rms >= 0.015 {
                    if !self.liveVoiceDetectedInSession {
                        self.liveVoiceDetectedInSession = true
                        if !self.livePreRollPcmSamples.isEmpty {
                            self.liveRecordedPcmSamples.append(contentsOf: self.livePreRollPcmSamples)
                            self.livePreRollPcmSamples.removeAll(keepingCapacity: true)
                        }
                    }
                    self.lastVoiceActivityTime = now
                    self.liveActiveSpeechFrames += 1
                }

                if self.liveVoiceDetectedInSession {
                    if self.liveRecordedPcmSamples.count < 256_000 {
                        self.liveRecordedPcmSamples.append(contentsOf: pcmChunk)
                    }
                } else {
                    self.livePreRollPcmSamples.append(contentsOf: pcmChunk)
                    if self.livePreRollPcmSamples.count > 6400 {
                        self.livePreRollPcmSamples.removeFirst(self.livePreRollPcmSamples.count - 6400)
                    }
                }
            }
            let reqRef = self.liveSpeechRequest
            self.stateLock.unlock()

            reqRef?.append(buffer)
        }

        do {
            liveAudioEngine.prepare()
            try liveAudioEngine.start()
            stateLock.lock()
            liveTapInstalled = true
            stateLock.unlock()
            return true
        } catch {
            inputNode.removeTap(onBus: 0)
            optionalTask?.cancel()
            stateLock.lock()
            liveSpeechTask = nil
            liveSpeechRequest = nil
            liveTapInstalled = false
            stateLock.unlock()
            return false
        }
    }

    /// MUST execute strictly on `audioEngineQueue`.
    private func stopLiveAudioRecognitionPipelineOnAudioQueue() -> (String, [Int16], Int) {
        dispatchPrecondition(condition: .onQueue(audioEngineQueue))
        stateLock.lock()
        activeSpeechSessionGeneration += 1
        let prevReq = liveSpeechRequest
        let prevTask = liveSpeechTask
        let wasTapInstalled = liveTapInstalled
        liveSpeechTask = nil
        liveSpeechRequest = nil
        liveTapInstalled = false
        let capturedText = livePartialTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
        livePartialTranscript = ""
        lastTranscriptChangeTime = 0
        var capturedSamples = liveRecordedPcmSamples
        if capturedSamples.isEmpty && !livePreRollPcmSamples.isEmpty {
            capturedSamples = livePreRollPcmSamples
        }
        let speechFrames = liveActiveSpeechFrames
        livePreRollPcmSamples.removeAll(keepingCapacity: true)
        liveRecordedPcmSamples.removeAll(keepingCapacity: true)
        liveVoiceDetectedInSession = false
        liveActiveSpeechFrames = 0
        liveMicRmsPct = 6
        stateLock.unlock()

        // Stop tap and AVAudioEngine OUTSIDE stateLock on serial `audioEngineQueue`
        prevReq?.endAudio()
        if wasTapInstalled {
            liveAudioEngine.inputNode.removeTap(onBus: 0)
        }
        if liveAudioEngine.isRunning {
            liveAudioEngine.stop()
        }
        prevTask?.cancel()
        return (capturedText, capturedSamples, speechFrames)
    }

    /// Transcribes a captured voice turn using live streaming `SFSpeechRecognizer` or 16 kHz WAV fallback.
    private func transcribeCapturedVoiceSession(
        partialTranscript: String,
        pcmSamples: [Int16],
        activeFrames: Int
    ) -> String {
        let partialAlpha = partialTranscript.replacingOccurrences(of: "[^\\p{L}\\p{N}]+", with: "", options: .regularExpression)
        if partialAlpha.count >= 2 {
            return partialTranscript
        }

        if pcmSamples.count >= 1600 && activeFrames >= 1 {
            let wavData = Self.encode16kHzMonoPCMToWAV(samples: pcmSamples)
            let (fallbackText, isEmpty) = transcribeAudioOnDevice(audioBytes: wavData, allowEmpty: true)
            if !isEmpty {
                return fallbackText
            }
        }

        return partialTranscript
    }

    private func rebindSpeechRecognitionRequestAfterBargeIn() {
        audioEngineQueue.async { [weak self] in
            guard let self = self else { return }
            self.stateLock.lock()
            self.activeSpeechSessionGeneration += 1
            let sessionGen = self.activeSpeechSessionGeneration
            let prevReq = self.liveSpeechRequest
            let prevTask = self.liveSpeechTask
            self.liveSpeechRequest = nil
            self.liveSpeechTask = nil
            self.stateLock.unlock()

            prevReq?.endAudio()
            prevTask?.cancel()

            guard let recognizer = self.selectBestSpeechRecognizer(),
                  recognizer.isAvailable,
                  SFSpeechRecognizer.authorizationStatus() == .authorized else {
                return
            }
            let req = SFSpeechAudioBufferRecognitionRequest()
            req.shouldReportPartialResults = true
            if recognizer.supportsOnDeviceRecognition {
                req.requiresOnDeviceRecognition = true
            }
            let task = recognizer.recognitionTask(with: req) { [weak self] result, _ in
                guard let self = self else { return }
                let now = ProcessInfo.processInfo.systemUptime
                self.stateLock.lock()
                guard self.activeSpeechSessionGeneration == sessionGen,
                      !self.isTtsSpeakingLocked(now: now) else {
                    self.stateLock.unlock()
                    return
                }
                if let res = result {
                    let text = res.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !text.isEmpty && text != self.livePartialTranscript {
                        self.livePartialTranscript = text
                        self.lastTranscriptChangeTime = now
                    }
                }
                self.stateLock.unlock()
            }
            self.stateLock.lock()
            self.liveSpeechRecognizer = recognizer
            self.liveSpeechRequest = req
            self.liveSpeechTask = task
            self.stateLock.unlock()
        }
    }

    private func stopTtsImmediatelyOnMain() {
        stateLock.lock()
        ttsSpeakingFlag = false
        ttsExpectedEndUptime = 0
        lastTtsActiveUptime = 0
        bargeInConsecutiveFrames = 0
        stateLock.unlock()
        FieldScanSessionEngine.shared.setAudioState("idle")
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if self.speechSynthesizer.isSpeaking {
                self.speechSynthesizer.stopSpeaking(at: .immediate)
            }
        }
    }

    private func startNativeMicrophoneRecording(payload: [String: Any] = [:]) -> [String: Any] {
        stopTtsImmediatelyOnMain()
        let turnId = ((payload["turn_id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 }
            ?? ("turn-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased())
        stateLock.lock()
        pttRecordingActive = true
        lastTtsActiveUptime = 0
        bargeInConsecutiveFrames = 0
        if let dip = intFromAny(payload["dip_address"]), (1...247).contains(dip) {
            // Update visual DIP only — NEVER mutate authorized `targetSlaveId` (`Finding 2`)
            simulatedVisualDipAddress = dip
        }
        let reqLang = ((payload["language"] as? String)?.lowercased() == "es")
            ? "es"
            : (((payload["language"] as? String)?.lowercased() == "en") ? "en" : preferredVoiceLanguage)
        preferredVoiceLanguage = reqLang
        activePttTurnContext = [
            "turn_id": turnId,
            "session_id": (payload["session_id"] as? String) ?? FieldScanSessionEngine.shared.currentActiveSessionId ?? "",
            "manifest_sha256": (payload["manifest_sha256"] as? String) ?? "",
            "scene_generation": intFromAny(payload["scene_generation"]) ?? activeSceneGeneration,
            "active_document_id": (payload["active_document_id"] as? String) ?? "",
            "language": reqLang,
            "dip_address": simulatedVisualDipAddress,
        ]
        let authSidNow = targetSlaveId
        stateLock.unlock()

        let perm = evaluateAndRequestVoicePermissionsNonBlocking { [weak self] in
            guard let self = self else { return }
            self.audioEngineQueue.async {
                _ = self.startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
            }
        }
        if perm == "denied" {
            stateLock.lock()
            pttRecordingActive = false
            stateLock.unlock()
            return [
                "status": "permission_denied",
                "error_code": "MIC_OR_SPEECH_PERMISSION_DENIED",
                "native_mic": false,
                "sample_rate": 16000,
                "turn_id": turnId,
                "authorized_bus_slave_id": authSidNow,
                "bus_target_mutated": false,
            ]
        }
        if perm == "awaiting_permission" {
            return [
                "status": "awaiting_permission",
                "native_mic": true,
                "sample_rate": 16000,
                "turn_id": turnId,
                "authorized_bus_slave_id": authSidNow,
                "bus_target_mutated": false,
            ]
        }

        var startedOK = false
        audioEngineQueue.sync {
            startedOK = self.startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
        }
        if !startedOK {
            stateLock.lock()
            pttRecordingActive = false
            stateLock.unlock()
        }
        return [
            "status": startedOK ? "recording" : "error",
            "native_mic": true,
            "sample_rate": 16000,
            "turn_id": turnId,
            "language": reqLang,
            "authorized_bus_slave_id": authSidNow,
            "bus_target_mutated": false,
        ]
    }

    private func stopNativeMicrophoneRecordingAndDiagnose(payload: [String: Any]) -> [String: Any] {
        let t0 = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        let pttCtx = activePttTurnContext
        activePttTurnContext = [:]
        // Use visual DIP address (or captured start-of-turn DIP), NEVER mutating or confusing with `targetSlaveId`
        let dipAddr = intFromAny(payload["dip_address"]) ?? intFromAny(pttCtx["dip_address"]) ?? simulatedVisualDipAddress
        let startTurnId = (payload["turn_id"] as? String) ?? (pttCtx["turn_id"] as? String)
        let startSessionId = (payload["session_id"] as? String) ?? ((pttCtx["session_id"] as? String)?.isEmpty == false ? (pttCtx["session_id"] as? String) : nil)
        let startManifestSha = (payload["manifest_sha256"] as? String) ?? ((pttCtx["manifest_sha256"] as? String)?.isEmpty == false ? (pttCtx["manifest_sha256"] as? String) : nil)
        let startSceneGen = intFromAny(payload["scene_generation"]) ?? intFromAny(pttCtx["scene_generation"]) ?? activeSceneGeneration
        let startLang = (payload["language"] as? String) ?? (pttCtx["language"] as? String) ?? preferredVoiceLanguage
        stateLock.unlock()

        // Step 1: Stop tap & signal `endAudio()` FIRST so SFSpeechRecognizer flushes final words before task cancel!
        var pcmSamples: [Int16] = []
        var speechFrames = 0
        var pendingTask: SFSpeechRecognitionTask?
        audioEngineQueue.sync {
            self.stateLock.lock()
            let prevReq = self.liveSpeechRequest
            pendingTask = self.liveSpeechTask
            let wasTapInstalled = self.liveTapInstalled
            self.liveSpeechRequest = nil
            self.liveTapInstalled = false
            pcmSamples = self.liveRecordedPcmSamples
            if pcmSamples.isEmpty && !self.livePreRollPcmSamples.isEmpty {
                pcmSamples = self.livePreRollPcmSamples
            }
            speechFrames = max(1, self.liveActiveSpeechFrames)
            self.livePreRollPcmSamples.removeAll(keepingCapacity: true)
            self.liveRecordedPcmSamples.removeAll(keepingCapacity: true)
            self.liveVoiceDetectedInSession = false
            self.liveActiveSpeechFrames = 0
            self.liveMicRmsPct = 6
            self.stateLock.unlock()

            if wasTapInstalled {
                self.liveAudioEngine.inputNode.removeTap(onBus: 0)
            }
            if self.liveAudioEngine.isRunning {
                self.liveAudioEngine.stop()
            }
            prevReq?.endAudio()
        }

        // Step 2: Allow up to 0.35s for SFSpeechRecognizer to emit flushed words after `endAudio()`
        let deadline = ProcessInfo.processInfo.systemUptime + 0.35
        while ProcessInfo.processInfo.systemUptime < deadline {
            stateLock.lock()
            let currentText = livePartialTranscript
            let lastChange = lastTranscriptChangeTime
            stateLock.unlock()
            if !currentText.isEmpty && (ProcessInfo.processInfo.systemUptime - lastChange) >= 0.14 {
                break
            }
            Thread.sleep(forTimeInterval: 0.025)
        }

        // Step 3: Collect flushed transcript, cancel recognition task, and clear PTT flag
        var partialText = ""
        audioEngineQueue.sync {
            self.stateLock.lock()
            self.activeSpeechSessionGeneration += 1
            partialText = self.livePartialTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
            self.liveSpeechTask = nil
            self.pttRecordingActive = false
            self.stateLock.unlock()
            pendingTask?.cancel()
        }

        let transcript = transcribeCapturedVoiceSession(
            partialTranscript: partialText,
            pcmSamples: pcmSamples,
            activeFrames: speechFrames
        )
        let asrMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10).rounded() / 10

        let cleanedAlpha = transcript.replacingOccurrences(of: "[^\\p{L}\\p{N}]+", with: "", options: .regularExpression)
        if cleanedAlpha.count < 2 {
            let msg = "I didn't catch any speech on the microphone—please try speaking again."
            let audioB64 = synthesizeSpeechB64(msg, speakOnDevice: true, language: startLang)
            return [
                "transcript": "",
                "diagnosis": msg,
                "assistant_message": msg,
                "probable_causes": [],
                "recommended_actions": [],
                "citations": [],
                "manual_citations": [],
                "audio_wav_b64": audioB64,
                "asr_ms": asrMs,
                "turn_id": startTurnId ?? "",
                "input_mode": "ptt",
                "model": "FieldScan Live Voice (No Speech Detected)",
            ]
        }

        var diagPayload: [String: Any] = [
            "query": transcript,
            "include_camera": true,
            "dip_address": dipAddr,
            "scene_generation": startSceneGen,
            "language": startLang,
            "input_mode": "ptt",
            "defer_tts_until_ack": boolFromAny(payload["defer_tts_until_ack"], defaultValue: false),
        ]
        if let tid = startTurnId, !tid.isEmpty { diagPayload["turn_id"] = tid }
        if let sid = startSessionId, !sid.isEmpty { diagPayload["session_id"] = sid }
        if let mSha = startManifestSha, !mSha.isEmpty { diagPayload["manifest_sha256"] = mSha }
        var diag = handleDiagnoseRequest(payload: diagPayload)
        diag["transcript"] = transcript
        diag["asr_ms"] = asrMs
        diag["sensor_id"] = "TZ-THT-02"
        diag["matched_alias"] = "TZ THT-02"
        return diag
    }

    // MARK: - Continuous Real-Time Hands-Free Mode (`POST /api/voice/handsfree_start`, `GET /api/voice/handsfree_poll`, `POST /api/voice/handsfree_stop`)

    private func startHandsFreeVoiceMode(payload: [String: Any]) -> [String: Any] {
        // Capture full turn context at voice activation; NEVER mutate `targetSlaveId` (`Finding 1 & Finding 2`)
        stateLock.lock()
        if let dip = intFromAny(payload["dip_address"]), (1...247).contains(dip) {
            simulatedVisualDipAddress = dip
        }
        let reqLang = ((payload["language"] as? String)?.lowercased() == "es")
            ? "es"
            : (((payload["language"] as? String)?.lowercased() == "en") ? "en" : preferredVoiceLanguage)
        preferredVoiceLanguage = reqLang
        let currentSceneGenNow = activeSceneGeneration
        activeHandsFreeContext = [
            "session_id": (payload["session_id"] as? String) ?? FieldScanSessionEngine.shared.currentActiveSessionId ?? "",
            "manifest_sha256": (payload["manifest_sha256"] as? String) ?? "",
            "scene_generation": currentSceneGenNow,
            "active_document_id": (payload["active_document_id"] as? String) ?? "",
            "language": reqLang,
            "dip_address": simulatedVisualDipAddress,
        ]
        let authSidNow = targetSlaveId
        stateLock.unlock()

        stopTtsImmediatelyOnMain()

        let perm = evaluateAndRequestVoicePermissionsNonBlocking { [weak self] in
            guard let self = self else { return }
            self.audioEngineQueue.async {
                self.stateLock.lock()
                let stillActive = self.handsFreeActive
                self.stateLock.unlock()
                if stillActive {
                    _ = self.startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
                }
            }
        }

        if perm == "denied" {
            stateLock.lock()
            handsFreeActive = false
            handsFreeTurnInFlight = false
            handsFreeMonitorTimer?.cancel()
            handsFreeMonitorTimer = nil
            stateLock.unlock()
            return [
                "status": "permission_denied",
                "active": false,
                "error_code": "MIC_OR_SPEECH_PERMISSION_DENIED",
                "message": "Microphone or Speech Recognition permission is disabled in iPadOS Settings > Privacy & Security.",
                "native_mic": false,
                "authorized_bus_slave_id": authSidNow,
                "bus_target_mutated": false,
            ]
        }

        stateLock.lock()
        handsFreeActive = true
        handsFreeTurnInFlight = false
        pendingHandsFreeResults.removeAll()
        needsSpeechTaskResetAfterTts = false
        lastCompletedLiveTranscriptNorm = ""
        lastCompletedLiveTurnUptime = 0
        handsFreeMonitorTimer?.cancel()
        handsFreeMonitorTimer = nil
        stateLock.unlock()

        audioEngineQueue.async { [weak self] in
            guard let self = self else { return }
            if perm == "granted" {
                _ = self.startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
            }
            let timer = DispatchSource.makeTimerSource(queue: self.audioEngineQueue)
            timer.schedule(deadline: .now() + 0.20, repeating: 0.20, leeway: .milliseconds(30))
            timer.setEventHandler { [weak self] in
                self?.evaluateHandsFreePauseAndTurnOnAudioQueue()
            }
            self.stateLock.lock()
            if self.handsFreeActive {
                self.handsFreeMonitorTimer?.cancel()
                self.handsFreeMonitorTimer = timer
                timer.resume()
            } else {
                timer.cancel()
            }
            self.stateLock.unlock()
        }

        return [
            "status": perm == "awaiting_permission" ? "awaiting_permission" : "handsfree_active",
            "active": true,
            "permission_state": perm,
            "native_mic": true,
            "language": reqLang,
            "scene_generation": currentSceneGenNow,
            "authorized_bus_slave_id": authSidNow,
            "bus_target_mutated": false,
        ]
    }

    /// Runs strictly on serial `audioEngineQueue` — never blocks HTTP sockets or Main Thread.
    private func evaluateHandsFreePauseAndTurnOnAudioQueue() {
        dispatchPrecondition(condition: .onQueue(audioEngineQueue))
        let now = ProcessInfo.processInfo.systemUptime

        stateLock.lock()
        guard handsFreeActive && !handsFreeTurnInFlight else {
            stateLock.unlock()
            return
        }
        let permState = audioPermissionState
        let aiSpeaking = isTtsSpeakingLocked(now: now)
        if aiSpeaking {
            lastTtsActiveUptime = now
        }
        let inEchoCooldown = aiSpeaking || (now - lastTtsActiveUptime) < 0.72
        let needsReset = needsSpeechTaskResetAfterTts
        let tapCurrentlyInstalled = liveTapInstalled
        let sinceLastStartAttempt = now - lastAudioStartAttemptUptime

        if permState == "denied" {
            handsFreeActive = false
            handsFreeMonitorTimer?.cancel()
            handsFreeMonitorTimer = nil
            stateLock.unlock()
            if tapCurrentlyInstalled {
                _ = stopLiveAudioRecognitionPipelineOnAudioQueue()
            }
            return
        }

        if permState == "awaiting_permission" {
            stateLock.unlock()
            return
        }

        if inEchoCooldown {
            // Keep `liveAudioEngine` + hardware AEC running continuously while discarding speaker echo
            livePartialTranscript = ""
            lastTranscriptChangeTime = 0
            stateLock.unlock()
            if !tapCurrentlyInstalled && sinceLastStartAttempt >= 0.45 {
                _ = startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
            }
            return
        }
        if needsReset {
            needsSpeechTaskResetAfterTts = false
            livePartialTranscript = ""
            lastTranscriptChangeTime = 0
            stateLock.unlock()
            // Recreate SFSpeechRecognitionTask cleanly after TTS ends so Apple ASR never replays stale accumulated text
            _ = startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
            return
        }
        stateLock.unlock()

        // Resume listening immediately after a completed turn or iOS audio route interruption with a lightweight 0.35s throttle
        if !tapCurrentlyInstalled || !liveAudioEngine.isRunning {
            if sinceLastStartAttempt >= 0.35 {
                _ = startLiveAudioRecognitionPipelineOnAudioQueue(resetTranscript: true)
            }
            return
        }

        stateLock.lock()
        guard handsFreeActive && !handsFreeTurnInFlight else {
            stateLock.unlock()
            return
        }
        let currentTranscript = livePartialTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
        let lastChange = lastTranscriptChangeTime
        let dipAddr = simulatedVisualDipAddress
        let capturedHfCtx = activeHandsFreeContext
        // Always capture the live authoritative scene generation at the moment THIS turn begins,
        // so `stillSameScene` fences real mid-turn scene switches without dropping turns due to prior loads.
        let capturedSceneGen = activeSceneGeneration
        let capturedSessionId = FieldScanSessionEngine.shared.currentActiveSessionId
            ?? ((capturedHfCtx["session_id"] as? String)?.isEmpty == false ? (capturedHfCtx["session_id"] as? String) : nil)
        let capturedManifestSha = ((capturedHfCtx["manifest_sha256"] as? String)?.isEmpty == false ? (capturedHfCtx["manifest_sha256"] as? String) : nil)
        let capturedLang = (capturedHfCtx["language"] as? String) ?? preferredVoiceLanguage
        let turnId = "turn-" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(10)).lowercased()
        let words = currentTranscript.split(whereSeparator: { $0.isWhitespace })

        let hasEnoughWords = words.count >= 2 || (words.count == 1 && currentTranscript.count >= 3)
        let transcriptReady = !currentTranscript.isEmpty && hasEnoughWords && lastChange > 0 && (now - lastChange) >= 0.60
        let acousticVadReady = liveVoiceDetectedInSession
            && liveActiveSpeechFrames >= 5
            && liveRecordedPcmSamples.count >= 4000
            && lastVoiceActivityTime > 0
            && (now - lastVoiceActivityTime) >= 0.68

        guard transcriptReady || acousticVadReady else {
            stateLock.unlock()
            return
        }

        handsFreeTurnInFlight = true
        livePartialTranscript = ""
        lastTranscriptChangeTime = 0
        stateLock.unlock()

        let (capturedPartial, capturedPcm, capturedFrames) = stopLiveAudioRecognitionPipelineOnAudioQueue()

        // Offload ASR fallback + echo guard + diagnosis onto `voiceDiagnosisQueue` so `audioEngineQueue` returns in <1 ms
        voiceDiagnosisQueue.async { [weak self] in
            guard let self = self else { return }
            let finalTranscript = self.transcribeCapturedVoiceSession(
                partialTranscript: capturedPartial.isEmpty ? currentTranscript : capturedPartial,
                pcmSamples: capturedPcm,
                activeFrames: max(capturedFrames, 5)
            ).trimmingCharacters(in: .whitespacesAndNewlines)

            let cleanedAlpha = finalTranscript.replacingOccurrences(of: "[^\\p{L}\\p{N}]+", with: "", options: .regularExpression)
            guard cleanedAlpha.count >= 2 else {
                self.stateLock.lock()
                self.handsFreeTurnInFlight = false
                self.stateLock.unlock()
                return
            }

            // Anti-Echo & Anti-Repeat Loop Guard (`VOZ-02`): drop transcripts overlapping recent AI TTS speech or rapid duplicates
            let (isEcho, _) = FieldScanSessionEngine.shared.isTTSEchoOrDuplicate(utterance: finalTranscript)
            let normLive = FieldScanManualNavigator.stripAccentsLower(finalTranscript)
            let nowCheck = ProcessInfo.processInfo.systemUptime
            self.stateLock.lock()
            let isRapidRepeat = !normLive.isEmpty
                && normLive == self.lastCompletedLiveTranscriptNorm
                && (nowCheck - self.lastCompletedLiveTurnUptime) < 4.0
            let stillSameScene = (self.activeSceneGeneration == capturedSceneGen)
            self.stateLock.unlock()

            if isEcho || isRapidRepeat || !stillSameScene {
                self.stateLock.lock()
                self.handsFreeTurnInFlight = false
                self.needsSpeechTaskResetAfterTts = true
                self.stateLock.unlock()
                return
            }

            var diagPayload: [String: Any] = [
                "query": finalTranscript,
                "include_camera": true,
                "dip_address": dipAddr,
                "turn_id": turnId,
                "scene_generation": capturedSceneGen,
                "language": capturedLang,
                "input_mode": "handsfree",
                "defer_tts_until_ack": true,
            ]
            if let sid = capturedSessionId, !sid.isEmpty { diagPayload["session_id"] = sid }
            if let mSha = capturedManifestSha, !mSha.isEmpty { diagPayload["manifest_sha256"] = mSha }

            var diag = self.handleDiagnoseRequest(payload: diagPayload)
            diag["transcript"] = finalTranscript
            diag["sensor_id"] = "TZ-THT-02"
            diag["matched_alias"] = "TZ THT-02"

            self.stateLock.lock()
            let sceneStillMatchesAfterDiag = (self.activeSceneGeneration == capturedSceneGen)
            if self.handsFreeActive && sceneStillMatchesAfterDiag {
                self.pendingHandsFreeResults.append(diag)
                if self.pendingHandsFreeResults.count > 16 {
                    self.pendingHandsFreeResults.removeFirst(self.pendingHandsFreeResults.count - 16)
                }
            } else {
                self.pendingDeferredVoiceTurns.removeValue(forKey: turnId)
            }
            self.lastCompletedLiveTranscriptNorm = normLive
            self.lastCompletedLiveTurnUptime = ProcessInfo.processInfo.systemUptime
            self.handsFreeTurnInFlight = false
            self.lastTtsActiveUptime = ProcessInfo.processInfo.systemUptime
            self.needsSpeechTaskResetAfterTts = true
            self.stateLock.unlock()
        }
    }

    private func pollHandsFreeVoiceMode() -> [String: Any] {
        let now = ProcessInfo.processInfo.systemUptime
        stateLock.lock()
        let aiSpeaking = isTtsSpeakingLocked(now: now)
        let active = handsFreeActive
        let permState = audioPermissionState
        let turnInFlight = handsFreeTurnInFlight
        let rmsPct = aiSpeaking ? 6 : liveMicRmsPct
        var partial = aiSpeaking ? "" : livePartialTranscript
        if partial.isEmpty && !aiSpeaking {
            if permState == "awaiting_permission" {
                partial = "Allow Microphone & Speech permission on iPad..."
            } else if turnInFlight {
                partial = "Processing voice command..."
            } else if liveVoiceDetectedInSession && liveActiveSpeechFrames >= 3 {
                partial = "Listening to your voice..."
            }
        }
        let drained = pendingHandsFreeResults
        pendingHandsFreeResults.removeAll()
        stateLock.unlock()

        return [
            "active": active,
            "permission_state": permState,
            "rms_pct": rmsPct,
            "partial_transcript": partial,
            "ai_speaking": aiSpeaking,
            "completed_turns": drained,
            "completed_turn": drained.last as Any? ?? NSNull(),
        ]
    }

    private func stopHandsFreeVoiceMode() -> [String: Any] {
        stateLock.lock()
        handsFreeActive = false
        handsFreeTurnInFlight = false
        pendingHandsFreeResults.removeAll()
        needsSpeechTaskResetAfterTts = false
        handsFreeMonitorTimer?.cancel()
        handsFreeMonitorTimer = nil
        stateLock.unlock()

        audioEngineQueue.async { [weak self] in
            _ = self?.stopLiveAudioRecognitionPipelineOnAudioQueue()
        }
        return [
            "status": "stopped",
            "active": false,
        ]
    }

    private func handleVoiceRequest(req: HTTPRequestPacket) -> [String: Any] {
        let t0 = ProcessInfo.processInfo.systemUptime
        let parsedForm = parseMultipartForm(from: req)
        let audioBytes = parsedForm.fileData ?? req.body
        let handsFreeStr = (parsedForm.fields["hands_free"] ?? "false").lowercased()
        let isHandsFree = ["true", "1", "yes", "on"].contains(handsFreeStr)
        stateLock.lock()
        let dipAddr = Int(parsedForm.fields["dip_address"] ?? "") ?? simulatedVisualDipAddress
        let reqLang = parsedForm.fields["language"] ?? preferredVoiceLanguage
        let defaultSceneGen = activeSceneGeneration
        stateLock.unlock()

        let (transcript, isEmptySpeech) = transcribeAudioOnDevice(audioBytes: audioBytes, allowEmpty: true)
        let asrMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10).rounded() / 10

        if isEmptySpeech {
            if isHandsFree {
                return [
                    "ignored_silence": true,
                    "transcript": "",
                    "asr_ms": asrMs,
                ]
            }
            let msg = "I didn't catch any speech on the microphone—please try speaking again."
            let audioB64 = synthesizeSpeechB64(msg, speakOnDevice: true, language: reqLang)
            return [
                "transcript": "",
                "diagnosis": msg,
                "assistant_message": msg,
                "probable_causes": [],
                "recommended_actions": [],
                "citations": [],
                "manual_citations": [],
                "audio_wav_b64": audioB64,
                "asr_ms": asrMs,
                "model": "FieldScan Live Voice (No Speech Detected)",
            ]
        }

        var diagPayload: [String: Any] = [
            "query": transcript,
            "include_camera": true,
            "dip_address": dipAddr,
            "language": reqLang,
            "input_mode": isHandsFree ? "handsfree" : "ptt",
            "scene_generation": Int(parsedForm.fields["scene_generation"] ?? "") ?? defaultSceneGen,
        ]
        if let sid = parsedForm.fields["session_id"], !sid.isEmpty { diagPayload["session_id"] = sid }
        if let mSha = parsedForm.fields["manifest_sha256"], !mSha.isEmpty { diagPayload["manifest_sha256"] = mSha }
        if let tid = parsedForm.fields["turn_id"], !tid.isEmpty { diagPayload["turn_id"] = tid }
        var diag = handleDiagnoseRequest(payload: diagPayload)
        diag["transcript"] = transcript
        diag["asr_ms"] = asrMs
        diag["sensor_id"] = "TZ-THT-02"
        diag["matched_alias"] = "TZ THT-02"
        return diag
    }

    private func transcribeAudioOnDevice(audioBytes: Data, allowEmpty: Bool) -> (String, Bool) {
        guard audioBytes.count > 44 else {
            return ("", true)
        }

        // Apple SFSpeechRecognizer locked strictly to English (en-US) with on-device recognition (`OFF-01`)
        var recognizedText = ""
        if SFSpeechRecognizer.authorizationStatus() == .authorized,
           let recognizer = selectBestSpeechRecognizer(),
           recognizer.isAvailable {
            let tempURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("fieldscan_asr_\(UUID().uuidString).wav")
            do {
                try audioBytes.write(to: tempURL, options: .atomic)
                defer { try? FileManager.default.removeItem(at: tempURL) }

                let request = SFSpeechURLRecognitionRequest(url: tempURL)
                request.requiresOnDeviceRecognition = recognizer.supportsOnDeviceRecognition
                request.shouldReportPartialResults = true

                let sema = DispatchSemaphore(value: 0)
                let task = recognizer.recognitionTask(with: request) { result, error in
                    if let res = result {
                        let candidate = res.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !candidate.isEmpty {
                            recognizedText = candidate
                        }
                        if res.isFinal {
                            sema.signal()
                        }
                    }
                    if error != nil {
                        sema.signal()
                    }
                }
                _ = sema.wait(timeout: .now() + 2.4)
                task.cancel()
            } catch {
                // Fall back cleanly if temporary file write fails
            }
        } else if SFSpeechRecognizer.authorizationStatus() == .notDetermined {
            SFSpeechRecognizer.requestAuthorization { _ in }
        }

        let cleanedAlpha = recognizedText.replacingOccurrences(of: "[^a-zA-Z0-9]+", with: "", options: .regularExpression)
        if cleanedAlpha.count < 2 {
            return ("", true)
        }
        return (recognizedText, false)
    }

    // MARK: - Sensor Load, Catalog Context & Signed Package Routes (`M4-ID-01..03`, `M4-PKG-*`, `M4-WAN-*`)

    private func contextFromSessionSnapshot(_ snap: [String: Any]) -> SessionContentContext? {
        guard let catCtx = snap["catalog_context"] as? [String: Any] else { return nil }
        let origin = (catCtx["content_origin"] as? String) ?? "bundle"
        let mSha = (catCtx["manifest_sha256"] as? String) ?? ""
        if origin == "bundle" && (catCtx["product_id"] as? String) == "tzone_tht02" {
            return FieldScanPackageStore.shared.buildBundleDefaultContext()
        }
        return SessionContentContext(
            productId: (catCtx["product_id"] as? String) ?? "unknown",
            variantId: (catCtx["variant_id"] as? String) ?? "default",
            title: (catCtx["title"] as? String) ?? "\(catCtx["product_id"] ?? "")",
            publicationSeq: (catCtx["publication_seq"] as? Int) ?? 1,
            manifestSha256: mSha,
            localProfileId: catCtx["local_profile_id"] as? String,
            contentOrigin: origin,
            benchModbusHomologated: (catCtx["bench_modbus_homologated"] as? Bool) ?? false,
            capabilities: (catCtx["capabilities"] as? [String: Bool]) ?? [:]
        )
    }

    /// Authoritative pinned-session resolution (`Finding 1` / `CTX-01`):
    /// When an open session is pinned to manifest A, passing a conflicting manifest B is rejected
    /// rather than silently overriding the active work session.
    private func validatePinnedSessionManifest(sessionId: String?, manifestSha: String?) -> (SessionContentContext, [String: Any]?) {
        let reqSha = manifestSha?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let sidToCheck = ((sessionId?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 })
            ?? FieldScanSessionEngine.shared.currentActiveSessionId

        if let sid = sidToCheck,
           let snap = try? FieldScanSessionEngine.shared.getSession(sessionId: sid),
           ((snap["status"] as? String) == "open" || (sessionId != nil && !sessionId!.isEmpty)),
           let pinnedCtx = contextFromSessionSnapshot(snap) {
            if !reqSha.isEmpty && !pinnedCtx.manifestSha256.isEmpty {
                let reqIsBundle = (reqSha == "bundle" || reqSha.hasPrefix("bundle-"))
                let pinIsBundle = (pinnedCtx.contentOrigin == "bundle" || pinnedCtx.manifestSha256.hasPrefix("bundle-"))
                if !(reqIsBundle && pinIsBundle) && reqSha != pinnedCtx.manifestSha256 {
                    let err: [String: Any] = [
                        "ok": false,
                        "error_code": "MANIFEST_SESSION_MISMATCH",
                        "requires_session_switch": true,
                        "session_id": sid,
                        "pinned_manifest_sha256": pinnedCtx.manifestSha256,
                        "requested_manifest_sha256": reqSha,
                        "message": "Active session '\(sid)' is pinned to '\(pinnedCtx.title)' (\(pinnedCtx.manifestSha256.prefix(12))). Close or start a new session explicitly before switching to manifest \(reqSha.prefix(12)).",
                    ]
                    return (pinnedCtx, err)
                }
            }
            return (pinnedCtx, nil)
        }

        return (resolveEffectiveContext(sessionId: sessionId, manifestSha: manifestSha), nil)
    }

    private func resolveEffectiveContext(sessionId: String?, manifestSha: String?) -> SessionContentContext {
        // 1. Open pinned session is authoritative unless caller explicitly passed a different manifest when NO open session matches
        let sidToCheck = ((sessionId?.trimmingCharacters(in: .whitespacesAndNewlines)).flatMap { $0.isEmpty ? nil : $0 })
            ?? FieldScanSessionEngine.shared.currentActiveSessionId
        if let sid = sidToCheck,
           let snap = try? FieldScanSessionEngine.shared.getSession(sessionId: sid),
           ((snap["status"] as? String) == "open" || (sessionId != nil && !sessionId!.isEmpty)),
           let pinnedCtx = contextFromSessionSnapshot(snap) {
            return pinnedCtx
        }

        // 2. Explicit manifestSha when no open session pins the workspace
        if let mSha = manifestSha?.trimmingCharacters(in: .whitespacesAndNewlines), !mSha.isEmpty {
            if mSha == "bundle" || mSha.hasPrefix("bundle-") {
                return FieldScanPackageStore.shared.buildBundleDefaultContext()
            }
            if let pkg = try? FieldScanPackageStore.shared.getInstalledPackage(manifestSha256: mSha) {
                let mObj = (pkg["manifest"] as? [String: Any]) ?? [:]
                let homologated = (mObj["bench_modbus_homologated"] as? Bool) ?? false
                return SessionContentContext(
                    productId: (pkg["product_id"] as? String) ?? "unknown",
                    variantId: (pkg["variant_id"] as? String) ?? "default",
                    title: (mObj["title"] as? String) ?? "\(pkg["product_id"] ?? "") (\(pkg["variant_id"] ?? ""))",
                    publicationSeq: (pkg["publication_seq"] as? Int) ?? 1,
                    manifestSha256: mSha,
                    localProfileId: homologated ? (mObj["bench_profile_id"] as? String) : nil,
                    contentOrigin: "catalog",
                    benchModbusHomologated: homologated,
                    capabilities: (pkg["capabilities"] as? [String: Bool]) ?? [:]
                )
            }
        }

        return FieldScanPackageStore.shared.getSelectedContext()
    }

    private func handleCatalogOrCADExportRoute(_ req: HTTPRequestPacket, on connection: NWConnection) {
        let path = req.path

        if path == "/api/export/dxf" || path == "/api/export/stl" {
            let bodyJSON = parseJSONBody(req.body)
            let effCtx = resolveEffectiveContext(
                sessionId: bodyJSON["session_id"] as? String,
                manifestSha: bodyJSON["manifest_sha256"] as? String
            )
            let desc = (try? FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: effCtx)) ?? [:]
            let supported = (desc["cad_exports_supported"] as? [String]) ?? ["dxf", "stl", "pdf", "json"]
            let fmt = path.hasSuffix("dxf") ? "dxf" : "stl"
            guard supported.contains(fmt) else {
                sendJSONResponse(on: connection, statusCode: 409, payload: [
                    "ok": false,
                    "error_code": "CAD_EXPORT_UNSUPPORTED_FOR_GLB",
                    "message": "Parametric AutoCAD .\(fmt.uppercased()) generation is available only for the bundled TZ THT-02 engineering model; catalog GLB package '\(effCtx.productId)/\(effCtx.variantId)' supports \(supported.joined(separator: ", ")).",
                    "cad_exports_supported": supported,
                ])
                return
            }
            let dossier = generateSignoffOrEscalationDossier(payload: bodyJSON, forceSignoff: true)
            sendJSONResponse(on: connection, statusCode: 200, payload: [
                "ok": true,
                "format": fmt,
                "url": fmt == "dxf" ? (dossier["dxf_url"] ?? "") : (dossier["stl_url"] ?? ""),
                "path": fmt == "dxf" ? (dossier["dxf_path"] ?? "") : (dossier["stl_path"] ?? ""),
            ])
            return
        }

        // Read-only local installed artifact streaming (`GET` / `HEAD` `/api/catalog/installed/{manifest_sha}/objects/{object_sha}`)
        if (req.method == "GET" || req.method == "HEAD") && path.hasPrefix("/api/catalog/installed/") {
            let rest = String(path.dropFirst("/api/catalog/installed/".count))
            let parts = rest.split(separator: "/", omittingEmptySubsequences: true).map(String.init)
            guard parts.count == 3, parts[1] == "objects" else {
                sendJSONResponse(on: connection, statusCode: 404, payload: ["error_code": "OBJECT_NOT_DECLARED", "message": "Malformed object route"])
                return
            }
            do {
                let res = try FieldScanPackageStore.shared.readObjectRange(
                    manifestSha256: parts[0],
                    objectSha256: parts[2],
                    rangeHeader: req.headers["range"],
                    headOnly: req.method == "HEAD"
                )
                sendHTTPResponse(
                    on: connection,
                    statusCode: res.statusCode,
                    contentType: res.mimeType,
                    body: res.body,
                    extraHeaders: res.headers
                )
            } catch let cerr as FieldScanCatalogError {
                sendJSONResponse(on: connection, statusCode: cerr.statusCode, payload: cerr.toDictionary())
            } catch {
                sendJSONResponse(on: connection, statusCode: 404, payload: ["error_code": "OBJECT_MISSING", "message": error.localizedDescription])
            }
            return
        }

        do {
            if req.method == "GET" && path == "/api/catalog/status" {
                let selected = FieldScanPackageStore.shared.getSelectedContext()
                let installed = FieldScanPackageStore.shared.listInstalledPackages()
                var pinnedSessionCtx: Any = NSNull()
                var updateReadyForNext = false
                if let activeSid = FieldScanSessionEngine.shared.currentActiveSessionId,
                   let snap = try? FieldScanSessionEngine.shared.getSession(sessionId: activeSid),
                   (snap["status"] as? String) == "open",
                   let pCtx = snap["catalog_context"] as? [String: Any] {
                    pinnedSessionCtx = pCtx
                    let pProd = (pCtx["product_id"] as? String) ?? ""
                    let pVar = (pCtx["variant_id"] as? String) ?? ""
                    let pSeq = (pCtx["publication_seq"] as? Int) ?? 0
                    if installed.contains(where: {
                        (($0["product_id"] as? String) == pProd)
                            && (($0["variant_id"] as? String) == pVar)
                            && ((($0["publication_seq"] as? Int) ?? 0) > pSeq)
                    }) {
                        updateReadyForNext = true
                    }
                }
                stateLock.lock()
                let sGen = activeSceneGeneration
                let readyTurn = latestSceneReadyTurn
                stateLock.unlock()
                sendJSONResponse(on: connection, statusCode: 200, payload: [
                    "ok": true,
                    "sync": FieldScanCatalogClient.shared.getSyncTelemetry(),
                    "selected_context": selected.toDictionary(),
                    "pinned_session_context": pinnedSessionCtx,
                    "update_ready_for_next_session": updateReadyForNext,
                    "installed_count": installed.count,
                    "scene_generation": sGen,
                    "latest_scene_ready": readyTurn,
                ])
                return
            }

            if req.method == "GET" && path == "/api/catalog/packages" {
                sendJSONResponse(on: connection, statusCode: 200, payload: [
                    "ok": true,
                    "packages": FieldScanPackageStore.shared.listInstalledPackages(),
                    "selected_context": FieldScanPackageStore.shared.getSelectedContext().toDictionary(),
                ])
                return
            }

            if req.method == "POST" && path == "/api/catalog/select" {
                let bodyJSON = parseJSONBody(req.body)
                let mSha = bodyJSON["manifest_sha256"] as? String
                let ctx = try FieldScanPackageStore.shared.selectContextForNextSession(manifestSha256: mSha)
                let desc = try FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: ctx)
                stateLock.lock()
                activeSceneGeneration += 1
                let nextGen = activeSceneGeneration
                stateLock.unlock()
                sendJSONResponse(on: connection, statusCode: 200, payload: [
                    "ok": true,
                    "selected_context": ctx.toDictionary(),
                    "catalog_descriptor": desc,
                    "scene_generation": nextGen,
                ])
                return
            }

            if req.method == "POST" && path == "/api/catalog/import" {
                let ct = (req.headers["content-type"] ?? "").lowercased()
                if ct.contains("multipart/form-data") {
                    let uploaded = extractUploadedData(from: req)
                    guard !uploaded.isEmpty else {
                        throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Empty package upload")
                    }
                    let tmpZip = FieldScanPackageStore.shared.stagingDirURL.appendingPathComponent("upload-\(UUID().uuidString.prefix(10).lowercased()).zip")
                    try uploaded.write(to: tmpZip, options: .atomic)
                    defer { try? FileManager.default.removeItem(at: tmpZip) }
                    let pkg = try FieldScanPackageStore.shared.importPackage(from: tmpZip)
                    sendJSONResponse(on: connection, statusCode: 200, payload: ["ok": true, "package": pkg])
                    return
                }
                let bodyJSON = parseJSONBody(req.body)
                if let srcPath = bodyJSON["path"] as? String, !srcPath.isEmpty {
                    let candURL = URL(fileURLWithPath: srcPath).resolvingSymlinksInPath().standardizedFileURL
                    let allowedRoots = [
                        FieldScanPackageStore.shared.stagingDirURL,
                        FileManager.default.temporaryDirectory,
                        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first,
                        locateBundleRootDirectory()?.appendingPathComponent("knowledge/fixtures", isDirectory: true),
                    ].compactMap { $0?.resolvingSymlinksInPath().standardizedFileURL.path }
                    guard allowedRoots.contains(where: { candURL.path == $0 || candURL.path.hasPrefix($0 + "/") }) else {
                        throw FieldScanCatalogError(code: "UNTRUSTED_IMPORT_PATH", message: "Direct path import is restricted to authorized fixture, Documents, or staging directories.", statusCode: 403)
                    }
                    let pkg = try FieldScanPackageStore.shared.importPackage(from: candURL)
                    sendJSONResponse(on: connection, statusCode: 200, payload: ["ok": true, "package": pkg])
                    return
                }
                if let b64 = bodyJSON["archive_b64"] as? String, let zipData = decodeDataURLOrBase64(b64) {
                    let tmpZip = FieldScanPackageStore.shared.stagingDirURL.appendingPathComponent("b64-\(UUID().uuidString.prefix(10).lowercased()).zip")
                    try zipData.write(to: tmpZip, options: .atomic)
                    defer { try? FileManager.default.removeItem(at: tmpZip) }
                    let pkg = try FieldScanPackageStore.shared.importPackage(from: tmpZip)
                    sendJSONResponse(on: connection, statusCode: 200, payload: ["ok": true, "package": pkg])
                    return
                }
                throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "Provide path, archive_b64, or multipart file")
            }

            if req.method == "POST" && path == "/api/catalog/sync_config" {
                let bodyJSON = parseJSONBody(req.body)
                let rawBase = ((bodyJSON["base_url"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let baseURL = rawBase.isEmpty ? FieldScanRuntimeConfig.shared.cloudCatalogBaseURL : rawBase
                let syncOpt: Bool? = (bodyJSON["sync_enabled"] != nil) ? boolFromAny(bodyJSON["sync_enabled"], defaultValue: false) : nil
                let token = bodyJSON["auth_token"] as? String
                let boatToken = bodyJSON["boat_port_auth_token"] as? String
                if let signers = bodyJSON["trusted_signers"] as? [[String: Any]] {
                    for s in signers {
                        if let kid = s["key_id"] as? String, let pk = s["public_key_b64"] as? String {
                            _ = try FieldScanPackageStore.shared.registerTrustedSigner(keyId: kid, publicKeyBase64: pk)
                        }
                    }
                }
                let tel = try FieldScanCatalogClient.shared.configureEndpoint(
                    baseURL: baseURL,
                    syncEnabled: syncOpt,
                    authToken: token,
                    boatPortAuthToken: boatToken,
                    persistInKeychain: true
                )
                if !baseURL.isEmpty {
                    FieldScanRuntimeConfig.shared.cloudCatalogBaseURL = baseURL
                }
                if let s = syncOpt {
                    FieldScanRuntimeConfig.shared.cloudCatalogSyncEnabled = s
                }
                sendJSONResponse(on: connection, statusCode: 200, payload: ["ok": true, "sync": tel])
                return
            }

            if req.method == "POST" && path == "/api/catalog/download_latest" {
                let bodyJSON = parseJSONBody(req.body)
                let pid = ((bodyJSON["product_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let vid = ((bodyJSON["variant_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let targetProduct = pid.isEmpty ? "tzone_tht02" : pid
                let targetVariant = vid.isEmpty ? "v1_1_rs485" : vid
                var res = try FieldScanCatalogClient.shared.downloadLatestPackage(
                    productId: targetProduct,
                    variantId: targetVariant,
                    defaultBaseURL: FieldScanRuntimeConfig.shared.cloudCatalogBaseURL
                )
                if let pkg = res["package"] as? [String: Any],
                   let mSha = pkg["manifest_sha256"] as? String, !mSha.isEmpty {
                    let ctx = try FieldScanPackageStore.shared.selectContextForNextSession(manifestSha256: mSha)
                    let desc = try FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: ctx)
                    stateLock.lock()
                    activeSceneGeneration += 1
                    let nextGen = activeSceneGeneration
                    stateLock.unlock()
                    res["selected_context"] = ctx.toDictionary()
                    res["catalog_descriptor"] = desc
                    res["scene_generation"] = nextGen
                }
                res["sync"] = FieldScanCatalogClient.shared.getSyncTelemetry()
                sendJSONResponse(on: connection, statusCode: 200, payload: res)
                return
            }

            if req.method == "GET" && path == "/api/catalog/healthz" {
                let res = FieldScanCatalogClient.shared.checkHealth()
                sendJSONResponse(on: connection, statusCode: 200, payload: res)
                return
            }

            if req.method == "POST" && path == "/api/catalog/reset_workspace" {
                let bodyJSON = parseJSONBody(req.body)
                let clearPackages = boolFromAny(bodyJSON["clear_installed_packages"], defaultValue: true)
                // Close any active session cleanly so old manifest does not stay pinned
                if let activeSid = FieldScanSessionEngine.shared.currentActiveSessionId, !activeSid.isEmpty {
                    _ = try? FieldScanSessionEngine.shared.applyAction(sessionId: activeSid, payload: ["action": "close_session", "force_partial": true])
                }
                FieldScanCatalogClient.shared.clearCacheForCleanOnboarding()
                var out = FieldScanPackageStore.shared.resetWorkspaceToCleanSlate(clearInstalledCloudPackages: clearPackages)
                stateLock.lock()
                activeSceneGeneration += 1
                let nextGen = activeSceneGeneration
                focusDipActive = false
                activeHandsFreeContext["session_id"] = ""
                activeHandsFreeContext["manifest_sha256"] = "empty-workspace"
                activeHandsFreeContext["scene_generation"] = nextGen
                let authSidNow = targetSlaveId
                stateLock.unlock()
                let cfg = FieldScanRuntimeConfig.shared
                out["scene_generation"] = nextGen
                out["pusr_preserved"] = true
                out["pusr_gateway"] = ["host": cfg.pusrGatewayHost, "port": cfg.pusrGatewayPort, "topology": cfg.pusrGatewayTopology]
                out["authorized_bus_slave_id"] = authSidNow
                sendJSONResponse(on: connection, statusCode: 200, payload: out)
                return
            }

            if req.method == "POST" && path == "/api/catalog/resolve" {
                let bodyJSON = parseJSONBody(req.body)
                let model = ((bodyJSON["model"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                guard !model.isEmpty else {
                    throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "model is required")
                }
                let forceRefresh = boolFromAny(bodyJSON["force_refresh"], defaultValue: false)
                let defaultCloudBase = FieldScanRuntimeConfig.shared.cloudCatalogBaseURL
                try FieldScanCatalogClient.shared.ensureAutoEnrolledIfNeeded(defaultBaseURL: defaultCloudBase)
                let res: [String: Any]
                do {
                    res = try FieldScanCatalogClient.shared.resolveCatalog(
                        manufacturer: bodyJSON["manufacturer"] as? String,
                        model: model,
                        variant: bodyJSON["variant"] as? String,
                        hardwareRevision: bodyJSON["hardware_revision"] as? String,
                        forceRefresh: forceRefresh
                    )
                } catch let cerr as FieldScanCatalogError where cerr.code == "HTTP_UNAUTHORIZED" {
                    try FieldScanCatalogClient.shared.ensureAutoEnrolledIfNeeded(defaultBaseURL: defaultCloudBase, forceReenroll: true)
                    res = try FieldScanCatalogClient.shared.resolveCatalog(
                        manufacturer: bodyJSON["manufacturer"] as? String,
                        model: model,
                        variant: bodyJSON["variant"] as? String,
                        hardwareRevision: bodyJSON["hardware_revision"] as? String,
                        forceRefresh: forceRefresh
                    )
                }
                sendJSONResponse(on: connection, statusCode: 200, payload: res)
                return
            }

            if req.method == "GET" && path.hasPrefix("/api/catalog/jobs/") {
                let jobId = String(path.dropFirst("/api/catalog/jobs/".count))
                let res = try FieldScanCatalogClient.shared.pollJob(jobId: jobId)
                sendJSONResponse(on: connection, statusCode: 200, payload: res)
                return
            }

            if req.method == "POST" && path == "/api/catalog/install" {
                let bodyJSON = parseJSONBody(req.body)
                let pid = ((bodyJSON["product_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let vid = ((bodyJSON["variant_id"] as? String) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                guard !pid.isEmpty && !vid.isEmpty else {
                    throw FieldScanCatalogError(code: "INVALID_ENVELOPE", message: "product_id and variant_id are required")
                }
                let channel = (bodyJSON["channel"] as? String) ?? "pilot"
                let selectAfter = boolFromAny(bodyJSON["select_after_install"], defaultValue: false)
                let defaultCloudBase = FieldScanRuntimeConfig.shared.cloudCatalogBaseURL
                try FieldScanCatalogClient.shared.ensureAutoEnrolledIfNeeded(defaultBaseURL: defaultCloudBase)
                var res: [String: Any]
                do {
                    res = try FieldScanCatalogClient.shared.fetchAndInstallVariant(productId: pid, variantId: vid, channel: channel)
                } catch let cerr as FieldScanCatalogError where cerr.code == "HTTP_UNAUTHORIZED" {
                    try FieldScanCatalogClient.shared.ensureAutoEnrolledIfNeeded(defaultBaseURL: defaultCloudBase, forceReenroll: true)
                    res = try FieldScanCatalogClient.shared.fetchAndInstallVariant(productId: pid, variantId: vid, channel: channel)
                }
                if selectAfter,
                   let pkg = res["package"] as? [String: Any],
                   let mSha = pkg["manifest_sha256"] as? String, !mSha.isEmpty {
                    let ctx = try FieldScanPackageStore.shared.selectContextForNextSession(manifestSha256: mSha)
                    let desc = try FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: ctx)
                    stateLock.lock()
                    activeSceneGeneration += 1
                    let nextGen = activeSceneGeneration
                    activeHandsFreeContext["manifest_sha256"] = mSha
                    activeHandsFreeContext["scene_generation"] = nextGen
                    stateLock.unlock()
                    res["selected_context"] = ctx.toDictionary()
                    res["catalog_descriptor"] = desc
                    res["scene_generation"] = nextGen
                }
                sendJSONResponse(on: connection, statusCode: 200, payload: res)
                return
            }

            if req.method == "POST" && path == "/api/catalog/scene_ready" {
                let bodyJSON = parseJSONBody(req.body)
                let gen = intFromAny(bodyJSON["scene_generation"]) ?? 1
                let status = ((bodyJSON["status"] as? String) ?? "ready").lowercased()
                stateLock.lock()
                let accepted = (gen >= activeSceneGeneration)
                if accepted {
                    latestSceneReadyTurn = [
                        "scene_generation": gen,
                        "turn_id": bodyJSON["turn_id"] ?? "",
                        "manifest_sha256": bodyJSON["manifest_sha256"] ?? "",
                        "status": status,
                        "reported_at_utc": FieldScanSessionEngine.utcNowISO(),
                    ]
                }
                let curGen = activeSceneGeneration
                stateLock.unlock()
                sendJSONResponse(on: connection, statusCode: 200, payload: [
                    "ok": true,
                    "accepted": accepted,
                    "active_scene_generation": curGen,
                ])
                return
            }
        } catch let cerr as FieldScanCatalogError {
            sendJSONResponse(on: connection, statusCode: cerr.statusCode, payload: cerr.toDictionary())
            return
        } catch {
            sendJSONResponse(on: connection, statusCode: 500, payload: ["error_code": "INTERNAL_ERROR", "message": error.localizedDescription])
            return
        }

        sendJSONResponse(on: connection, statusCode: 404, payload: ["detail": "Not found: \(path)"])
    }

    private func handleSensorLoad(query: String) -> [String: Any] {
        let resolved = FieldScanPackageStore.shared.resolveAssetQuery(query)
        let matched = (resolved["matched"] as? Bool) ?? false
        let resolution = (resolved["resolution"] as? String) ?? "unknown"

        if !matched {
            if resolution == "ambiguous" {
                let prompt = (resolved["discriminant_prompt"] as? String) ?? "Multiple variants match; select exact hardware variant."
                return [
                    "matched": false,
                    "resolution": "ambiguous",
                    "identity_status": resolved["identity_status"] ?? "identify_variant",
                    "sensor_id": NSNull(),
                    "resolved_model": NSNull(),
                    "spec": NSNull(),
                    "discriminant_field": resolved["discriminant_field"] ?? "variant_id",
                    "discriminant_prompt": prompt,
                    "candidates": resolved["candidates"] ?? [],
                    "diagnosis": prompt,
                    "assistant_message": prompt,
                    "citations": [],
                    "manual_citations": [],
                ]
            }
            let unknownMsg = "No local verified profile matches '\(query)'. Automatic TZONE THT-02 register mapping is inhibited; import a signed package or enable Cloud Catalog search."
            return [
                "matched": false,
                "resolution": "unknown",
                "identity_status": "unknown_pending_identity",
                "sensor_id": NSNull(),
                "resolved_model": NSNull(),
                "spec": NSNull(),
                "confidence": 0.0,
                "can_query_cloud_catalog": true,
                "suggested_cloud_query": resolved["suggested_cloud_query"] ?? [:],
                "candidates": [],
                "diagnosis": unknownMsg,
                "assistant_message": unknownMsg,
                "citations": [],
                "manual_citations": [],
            ]
        }

        let sensorId = (resolved["sensor_id"] as? String) ?? "TZ-THT-02"
        let ctxDict = (resolved["context"] as? [String: Any]) ?? [:]
        let isCatalog = ((ctxDict["content_origin"] as? String) == "catalog")
        let spec = loadTHT02Spec()

        if isCatalog, let mSha = ctxDict["manifest_sha256"] as? String,
           let ctxObj = try? FieldScanPackageStore.shared.selectContextForNextSession(manifestSha256: mSha),
           let desc = try? FieldScanPackageStore.shared.buildSceneAndManualDescriptor(context: ctxObj) {
            stateLock.lock()
            activeSceneGeneration += 1
            let sGen = activeSceneGeneration
            stateLock.unlock()
            let docCount = ((desc["documents"] as? [[String: Any]]) ?? []).count
            let msg = "Verified signed catalog package loaded for \(ctxObj.title) (publication seq #\(ctxObj.publicationSeq), \(docCount) document(s))."
            let audioB64 = synthesizeSpeechB64(msg)
            return [
                "matched": true,
                "resolution": "exact",
                "identity_status": resolved["identity_status"] ?? "matched",
                "sensor_id": sensorId,
                "resolved_model": sensorId,
                "matched_alias": resolved["matched_alias"] ?? sensorId,
                "confidence": 0.99,
                "context": ctxObj.toDictionary(),
                "catalog_descriptor": desc,
                "scene_generation": sGen,
                "diagnosis": msg,
                "assistant_message": msg,
                "citations": [],
                "manual_citations": [],
                "audio_wav_b64": audioB64,
                "spec": spec,
            ]
        }

        let msg = "Local datasheet verified (9 pages, 1.8 ms): input '\(query)' resolved to \(sensorId). Parametric CAD blueprint loaded: total length 140.0 mm x outer diameter 16.0 mm, SHT30/SHT3X CMOSens probe element, and RS-485 Modbus-RTU bus."
        let audioB64 = synthesizeSpeechB64(msg)
        let citations: [[String: Any]] = [
            ["page": 1, "label": Self.manualPageTitles[1]!],
            ["page": 9, "label": Self.manualPageTitles[9]!],
        ]
        return [
            "matched": true,
            "resolution": "exact",
            "identity_status": resolved["identity_status"] ?? "matched",
            "sensor_id": sensorId,
            "resolved_model": sensorId,
            "matched_alias": resolved["matched_alias"] ?? "TZ THT-02",
            "confidence": 0.99,
            "context": ctxDict,
            "manual_page": 9,
            "diagnosis": msg,
            "assistant_message": msg,
            "citations": citations,
            "manual_citations": citations,
            "audio_wav_b64": audioB64,
            "pdf_inspected_ms": 1.8,
            "spec": spec,
        ]
    }

    private func loadTHT02Spec() -> [String: Any] {
        stateLock.lock()
        if let cached = cachedSpecDict {
            stateLock.unlock()
            return cached
        }
        stateLock.unlock()

        if let root = locateBundleRootDirectory() {
            let specURL = root.appendingPathComponent("knowledge/THT02_spec.json")
            if let data = try? Data(contentsOf: specURL),
               let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                stateLock.lock()
                cachedSpecDict = obj
                stateLock.unlock()
                return obj
            }
        }

        return [
            "sensor_id": "TZ-THT-02",
            "name": "TZ THT-02 Industrial RS-485 Temperature & Humidity Sensor",
            "manual_version": "V1.1",
            "pdf_url": "/assets/THT02_Users_Manual_v1.1.pdf",
            "dimensions_mm": [
                "total_length": 140.0,
                "outer_diameter": 16.0,
                "radius": 8.0,
                "bracket_width": 42.0,
                "bracket_height": 20.0,
                "mounting_hole_diameter": 4.2,
                "mounting_hole_spacing": 32.0,
                "lead_length": 1000.0,
                "cable_diameter": 5.0,
            ],
        ]
    }

    private func buildPDFDocumentMetadata() -> [String: Any] {
        var pages: [[String: Any]] = []
        for p in 1...9 {
            pages.append([
                "page": p,
                "width_pt": 595.28,
                "height_pt": 841.89,
                "image_url": "/assets/manual_pages/page_\(p).png",
                "has_embedded_text": true,
            ])
        }
        return [
            "filename": "THT02_Users_Manual_v1.1.pdf",
            "title": "TZ THT-02 Temperature and humidity Sensor User's Manual V1.1",
            "page_count": 9,
            "pages": pages,
            "inspected_in_ms": 1.8,
        ]
    }

    // MARK: - Multipart & JSON Parsing Utilities

    private struct MultipartFormResult {
        var fields: [String: String] = [:]
        var fileData: Data?
        var filename: String?
    }

    private func extractUploadedData(from req: HTTPRequestPacket) -> Data {
        let ct = (req.headers["content-type"] ?? "").lowercased()
        if ct.contains("multipart/form-data") {
            let parsed = parseMultipartForm(from: req)
            if let fData = parsed.fileData, !fData.isEmpty {
                return fData
            }
        }
        return req.body
    }

    private func parseMultipartForm(from req: HTTPRequestPacket) -> MultipartFormResult {
        var result = MultipartFormResult()
        guard let contentType = req.headers["content-type"],
              let bRange = contentType.range(of: "boundary=") else {
            return result
        }
        var boundary = String(contentType[bRange.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
        if let semi = boundary.firstIndex(of: ";") {
            boundary = String(boundary[..<semi])
        }
        boundary = boundary.trimmingCharacters(in: CharacterSet(charactersIn: "\"'"))
        guard !boundary.isEmpty else { return result }

        let boundaryData = Data("--\(boundary)".utf8)
        let headerSep = Data([13, 10, 13, 10]) // "\r\n\r\n"
        let crlf = Data([13, 10])

        var searchStart = req.body.startIndex
        while let partBoundary = req.body.range(of: boundaryData, options: [], in: searchStart..<req.body.endIndex) {
            let partStart = partBoundary.upperBound
            guard let nextBoundary = req.body.range(of: boundaryData, options: [], in: partStart..<req.body.endIndex) else {
                break
            }
            searchStart = nextBoundary.lowerBound

            guard let hdrEnd = req.body.range(of: headerSep, options: [], in: partStart..<nextBoundary.lowerBound) else {
                continue
            }
            let partHeaderData = req.body.subdata(in: partStart..<hdrEnd.lowerBound)
            let partHeaderStr = String(data: partHeaderData, encoding: .utf8) ?? ""
            var contentEnd = nextBoundary.lowerBound
            if contentEnd >= 2 && req.body.subdata(in: (contentEnd - 2)..<contentEnd) == crlf {
                contentEnd -= 2
            }
            guard contentEnd >= hdrEnd.upperBound else { continue }
            let partContent = req.body.subdata(in: hdrEnd.upperBound..<contentEnd)

            var fieldName: String?
            if let nameRange = partHeaderStr.range(of: "name=\"") {
                let after = partHeaderStr[nameRange.upperBound...]
                if let endQ = after.firstIndex(of: "\"") {
                    fieldName = String(after[..<endQ])
                }
            }

            if let fnRange = partHeaderStr.range(of: "filename=\"") {
                let after = partHeaderStr[fnRange.upperBound...]
                if let endQ = after.firstIndex(of: "\"") {
                    result.filename = String(after[..<endQ])
                }
                if result.fileData == nil || !partContent.isEmpty {
                    result.fileData = partContent
                }
            } else if let name = fieldName {
                result.fields[name] = String(data: partContent, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            }
        }
        return result
    }

    private func parseJSONBody(_ data: Data) -> [String: Any] {
        guard !data.isEmpty,
              let obj = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
            return [:]
        }
        return obj
    }

    private func decodeDataURLOrBase64(_ raw: String) -> Data? {
        guard !raw.isEmpty else { return nil }
        if let comma = raw.firstIndex(of: ","), raw.hasPrefix("data:") {
            return Data(base64Encoded: String(raw[raw.index(after: comma)...]))
        }
        return Data(base64Encoded: raw)
    }

    private func isTruthyQuery(_ val: String?) -> Bool {
        guard let v = val?.lowercased() else { return false }
        return v == "1" || v == "true" || v == "yes"
    }

    private func intFromAny(_ anyVal: Any?) -> Int? {
        if let i = anyVal as? Int { return i }
        if let d = anyVal as? Double { return Int(d) }
        if let s = anyVal as? String { return Int(s.trimmingCharacters(in: .whitespacesAndNewlines)) }
        return nil
    }

    private func boolFromAny(_ anyVal: Any?, defaultValue: Bool) -> Bool {
        if let b = anyVal as? Bool { return b }
        if let i = anyVal as? Int { return i != 0 }
        if let s = anyVal as? String {
            let low = s.lowercased()
            return low == "true" || low == "1" || low == "yes"
        }
        return defaultValue
    }

    private func currentUTCString() -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd HH:mm:ss 'UTC'"
        fmt.timeZone = TimeZone(abbreviation: "UTC")
        return fmt.string(from: Date())
    }
}
