import Foundation
import Darwin

/// Central runtime configuration and memory telemetry for FieldScan CAD v2.0 on iPad Air M4 (12 GB RAM).
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
            return "Embedded Local (127.0.0.1:8088)"
        case .usbTetherSecure:
            return "USB-C Tether HTTPS (169.254.37.69:8443)"
        case .usbTetherHTTP:
            return "USB-C Tether HTTP (169.254.37.69:8088)"
        case .lanWorkstation:
            return "LAN Workstation (10.0.0.15:8088)"
        case .bundledOfflineStudio:
            return "Bundled Offline 3D Twin & SCADA"
        case .customEndpoint:
            return "Custom Endpoint"
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

    public let bundleIdentifier = "com.fieldscan.tht02.ipadm4"
    public let localBackendURL = URL(string: "http://127.0.0.1:8088")!
    public let localVisionLlamaURL = URL(string: "http://127.0.0.1:8091")!
    public let localAudioLlamaURL = URL(string: "http://127.0.0.1:8092")!

    public let usbTetherHTTPSURL = URL(string: "https://169.254.37.69:8443")!
    public let usbTetherHTTPURL = URL(string: "http://169.254.37.69:8088")!
    public let usbModbusBridgeHost = "169.254.37.69"
    public let usbModbusBridgePort = 5502
    public let lanWorkstationURL = URL(string: "http://10.0.0.15:8088")!

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

    /// Queries physical RAM (12 GB on iPad Air M4) and current process head-room via `os_proc_available_memory()`.
    public func sampleMemoryTelemetry() -> FieldScanMemoryTelemetry {
        let physicalBytes = ProcessInfo.processInfo.physicalMemory
        let physicalGB = Double(physicalBytes) / 1_073_741_824.0

        var availBytes: UInt64 = 0
        #if os(iOS) || os(tvOS) || os(watchOS)
        availBytes = UInt64(os_proc_available_memory())
        #endif
        if availBytes == 0 {
            // Fallback estimation when running on simulator or desktop host
            availBytes = UInt64(Double(physicalBytes) * 0.72)
        }

        let availGB = Double(availBytes) / 1_073_741_824.0
        let usedGB = max(0.0, physicalGB - availGB)
        // With com.apple.developer.kernel.increased-memory-limit on 12 GB iPad Air M4,
        // available process memory exceeds the standard 3-4 GB sandbox cap (> 5.5 GB).
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

    /// Returns the Documents directory where large .gguf weights and CAD exports are shared via Files/Finder.
    public var documentsDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    }

    /// Ensures `Documents/vendor/models` and `Documents/exports` exist so the user can drop models via USB Finder.
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
