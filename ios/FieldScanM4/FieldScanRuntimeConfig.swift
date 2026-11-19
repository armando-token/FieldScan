import Foundation
import Darwin

/// Central runtime configuration, configurable bench endpoints, and memory telemetry for FieldScan CAD v2.1 on iPad Air M4 (12 GB RAM).
public enum FieldScanEndpointMode: String, CaseIterable {
    case embeddedLocal = "embedded_local"
    case usbTetherSecure = "usb_tether_https"
    case usbTetherHTTP = "usb_tether_http"
    case lanWorkstation = "lan_workstation"
    case bundledOfflineStudio = "bundled_offline_studio"
    case customEndpoint = "custom_endpoint"

    public var displayTitle: String {
        switch self {
        case .embeddedLocal:
            return "iPad Local · Autonomous Bench (127.0.0.1:8088)"
        case .usbTetherSecure:
            return "Mac Mini Assisted · USB-C HTTPS"
        case .usbTetherHTTP:
            return "Mac Mini Assisted · USB-C HTTP"
        case .lanWorkstation:
            return "Mac Mini Assisted · LAN Bench"
        case .bundledOfflineStudio:
            return "Bundled Offline 3D & Manual"
        case .customEndpoint:
            return "Configured Assisted Endpoint"
        }
    }

    public var isMacAssisted: Bool {
        switch self {
        case .usbTetherSecure, .usbTetherHTTP, .lanWorkstation, .customEndpoint:
            return true
        case .embeddedLocal, .bundledOfflineStudio:
            return false
        }
    }
}

public struct FieldScanMemoryTelemetry: Codable {
    public let physicalMemoryBytes: UInt64
    public let physicalMemoryGB: Double
    public let availableMemoryBytes: UInt64
    public let availableMemoryGB: Double
    public let usedMemoryEstimateGB: Double
    public let increasedMemoryLimitActive: Bool
    public let deviceArchitecture: String

    public func toDictionary() -> [String: Any] {
        return [
            "physical_memory_bytes": physicalMemoryBytes,
            "physical_memory_gb": (physicalMemoryGB * 100).rounded() / 100,
            "available_memory_bytes": availableMemoryBytes,
            "available_memory_gb": (availableMemoryGB * 100).rounded() / 100,
            "used_memory_estimate_gb": (usedMemoryEstimateGB * 100).rounded() / 100,
            "increased_memory_limit_active": increasedMemoryLimitActive,
            "device_architecture": deviceArchitecture,
        ]
    }
}

public final class FieldScanRuntimeConfig {
    public static let shared = FieldScanRuntimeConfig()

    private let defaults = UserDefaults.standard
    private let kPusrHost = "fieldscan.pusr.host"
    private let kPusrPort = "fieldscan.pusr.port"
    private let kMacTetherHost = "fieldscan.mac.tether_host"
    private let kMacTetherHTTPSPort = "fieldscan.mac.https_port"
    private let kMacTetherHTTPPort = "fieldscan.mac.http_port"
    private let kPinnedTLSFingerprint = "fieldscan.tls.pinned_sha256"

    public let bundleIdentifier = "com.fieldscan.tht02.ipadm4"
    public let localBackendURL = URL(string: "http://127.0.0.1:8088")!
    public let localVisionLlamaURL = URL(string: "http://127.0.0.1:8091")!
    public let localAudioLlamaURL = URL(string: "http://127.0.0.1:8092")!

    // Configurable bench endpoints (never treated as hardcoded Mac identity; `Phase 6.2`)
    public var pusrGatewayHost: String {
        get { defaults.string(forKey: kPusrHost) ?? "" }
        set { defaults.set(newValue.trimmingCharacters(in: .whitespacesAndNewlines), forKey: kPusrHost) }
    }

    public var pusrGatewayPort: Int {
        get {
            let p = defaults.integer(forKey: kPusrPort)
            return p > 0 ? p : 502
        }
        set { defaults.set(newValue, forKey: kPusrPort) }
    }

    public var macTetherHost: String {
        get { defaults.string(forKey: kMacTetherHost) ?? "armandos-mac-mini.local" }
        set { defaults.set(newValue.trimmingCharacters(in: .whitespacesAndNewlines), forKey: kMacTetherHost) }
    }

    public var macHTTPSPort: Int {
        get {
            let p = defaults.integer(forKey: kMacTetherHTTPSPort)
            return p > 0 ? p : 8443
        }
        set { defaults.set(newValue, forKey: kMacTetherHTTPSPort) }
    }

    public var macHTTPPort: Int {
        get {
            let p = defaults.integer(forKey: kMacTetherHTTPPort)
            return p > 0 ? p : 8088
        }
        set { defaults.set(newValue, forKey: kMacTetherHTTPPort) }
    }

    public var pinnedTLSFingerprintSHA256: String? {
        get { defaults.string(forKey: kPinnedTLSFingerprint) }
        set { defaults.set(newValue, forKey: kPinnedTLSFingerprint) }
    }

    public var usbTetherHTTPSURL: URL {
        return URL(string: "https://\(macTetherHost):\(macHTTPSPort)") ?? localBackendURL
    }

    public var usbTetherHTTPURL: URL {
        return URL(string: "http://\(macTetherHost):\(macHTTPPort)") ?? localBackendURL
    }

    public var usbModbusBridgeHost: String {
        return macTetherHost
    }

    public let usbModbusBridgePort = 5502
    public let lanWorkstationURL = URL(string: "http://armandos-mac-mini.local:8088")!

    public let qwenModelFilename = "Qwen3VL-4B-Instruct-Q4_K_M.gguf"
    public let qwenMmprojFilename = "mmproj-Qwen3VL-4B-Instruct-Q8_0.gguf"
    public let omniModelFilename = "LFM3-Omni-2B-Q4_0.gguf"
    public let omniMmprojFilename = "mmproj-LFM3-Omni-2B-Q4_0.gguf"
    public let omniQ8ModelFilename = "LFM3-Omni-2B-Q8_0.gguf"
    public let omniQ8MmprojFilename = "mmproj-LFM3-Omni-2B-Q8_0.gguf"
    public let visionModelFilename = "LFM3-VL-2B-QAD-Q4_0.gguf"
    public let visionMmprojFilename = "mmproj-LFM3-VL-2B-Q8_0.gguf"
    public let audioModelFilename = "LFM3-Audio-2B-Q4_0.gguf"
    public let audioMmprojFilename = "mmproj-LFM3-Audio-2B-Q4_0.gguf"
    public let piperVoiceFilename = "en_US-lessac-medium.onnx"

    public var currentMode: FieldScanEndpointMode = .embeddedLocal
    public var activeEndpointURL: URL = URL(string: "http://127.0.0.1:8088")!

    private init() {}

    /// Returns trusted WebView hosts strictly allowed to access native bridges (`OFF-05`).
    public func isTrustedHMIHost(_ rawHost: String?) -> Bool {
        guard let h = rawHost?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(), !h.isEmpty else {
            return true // local `file://` bundle URLs have empty host
        }
        if h == "127.0.0.1" || h == "localhost" || h == "::1" {
            return true
        }
        if currentMode.isMacAssisted {
            let configuredMac = macTetherHost.lowercased()
            let activeHost = activeEndpointURL.host?.lowercased() ?? ""
            if h == configuredMac || (!activeHost.isEmpty && h == activeHost) {
                return true
            }
        }
        return false
    }

    /// Queries physical RAM (12 GB on iPad Air M4) and current process head-room via `os_proc_available_memory()`.
    public func sampleMemoryTelemetry() -> FieldScanMemoryTelemetry {
        let physicalBytes = ProcessInfo.processInfo.physicalMemory
        let physicalGB = Double(physicalBytes) / 1_073_741_824.0

        var availBytes: UInt64 = 0
        #if os(iOS) || os(tvOS) || os(watchOS)
        availBytes = UInt64(os_proc_available_memory())
        #endif
        if availBytes == 0 {
            availBytes = UInt64(Double(physicalBytes) * 0.72)
        }

        let availGB = Double(availBytes) / 1_073_741_824.0
        let usedGB = max(0.0, physicalGB - availGB)
        let increasedLimit = availGB > 4.5 || physicalGB >= 11.0

        return FieldScanMemoryTelemetry(
            physicalMemoryBytes: physicalBytes,
            physicalMemoryGB: physicalGB,
            availableMemoryBytes: availBytes,
            availableMemoryGB: availGB,
            usedMemoryEstimateGB: usedGB,
            increasedMemoryLimitActive: increasedLimit,
            deviceArchitecture: "arm64-apple-m4-metal3"
        )
    }

    public var documentsDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    }

    public func prepareSharedDirectories() {
        let fm = FileManager.default
        let modelsDir = documentsDirectory.appendingPathComponent("vendor/models", isDirectory: true)
        let piperDir = documentsDirectory.appendingPathComponent("vendor/piper", isDirectory: true)
        let exportsDir = documentsDirectory.appendingPathComponent("exports", isDirectory: true)

        for dir in [modelsDir, piperDir, exportsDir] {
            if !fm.fileExists(atPath: dir.path) {
                try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
            }
        }
    }
}
