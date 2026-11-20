import Foundation
import AVFoundation
import CoreImage
#if canImport(UIKit)
import UIKit
#endif

/// Captures 30 FPS optical inspection frames on iPad Air M4 using `AVCaptureSession` + `AVCaptureVideoDataOutput`.
/// Supports:
///   - External USB-C UVC cameras on iPadOS 17+ (`.external`, e.g., Acer 4K UVC macro inspection camera)
///   - iPad Air M4 rear wide-angle camera (`.builtInWideAngleCamera`)
///   - iPad Air M4 ultra-wide camera (`.builtInUltraWideCamera`)
/// Encodes JPEG frames in memory and pushes them to `/api/video/ipad_frame` on the active FieldScan backend
/// and/or invokes the `WKWebView` JavaScript callback (`window.onFieldScanNativeCameraFrame`).
public final class NativeCameraBridge: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate, URLSessionDelegate {
    public static let shared = NativeCameraBridge()

    private let captureSession = AVCaptureSession()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let sessionQueue = DispatchQueue(label: "com.fieldscan.tht02.ipadm4.camera-session", qos: .userInteractive)
    private let frameOutputQueue = DispatchQueue(label: "com.fieldscan.tht02.ipadm4.camera-frames", qos: .userInitiated)
    private let ciContext = CIContext(options: [.useSoftwareRenderer: false])

    public private(set) var isRunning: Bool = false
    public private(set) var activeDeviceName: String = "None"
    public var jpegQuality: CGFloat = 0.88
    public var targetFPS: Int32 = 25
    public var pushToBackendEnabled: Bool = false
    public var onFrameCapturedBase64: ((String, Int, Int) -> Void)?

    private var lastFrameTimestamp: TimeInterval = 0
    private var uploadInFlight: Bool = false

    private lazy var uploadSession: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 0.75
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    private override init() {
        super.init()
    }

    /// Discovers available capture devices on iPadOS 17+, prioritizing external USB-C UVC cameras first.
    public func availableCameraDevices() -> [AVCaptureDevice] {
        var deviceTypes: [AVCaptureDevice.DeviceType] = [
            .builtInWideAngleCamera,
        ]
        #if os(iOS) || targetEnvironment(macCatalyst)
        deviceTypes.append(.builtInUltraWideCamera)
        #endif
        if #available(iOS 17.0, macCatalyst 17.0, macOS 14.0, *) {
            deviceTypes.insert(.external, at: 0)
        }
        let discovery = AVCaptureDevice.DiscoverySession(
            deviceTypes: deviceTypes,
            mediaType: .video,
            position: .unspecified
        )
        return discovery.devices
    }

    /// Starts the 30 FPS capture pipeline with preferred camera (`external`, `back`, `front`).
    public func startCapture(preferredSource: String = "auto", completion: ((Bool, String) -> Void)? = nil) {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            guard let self = self else { return }
            guard granted else {
                DispatchQueue.main.async {
                    completion?(false, "Camera permission denied by user")
                }
                return
            }

            self.sessionQueue.async {
                let configured = self.configureSession(preferredSource: preferredSource)
                if configured && !self.captureSession.isRunning {
                    self.captureSession.startRunning()
                    self.isRunning = true
                }
                let deviceName = self.activeDeviceName
                DispatchQueue.main.async {
                    completion?(configured, deviceName)
                }
            }
        }
    }

    public func stopCapture() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            if self.captureSession.isRunning {
                self.captureSession.stopRunning()
            }
            self.isRunning = false
        }
    }

    private func configureSession(preferredSource: String) -> Bool {
        captureSession.beginConfiguration()
        defer { captureSession.commitConfiguration() }

        #if os(iOS) || targetEnvironment(macCatalyst)
        // Prevent AVCaptureSession from overriding or mutating AVAudioSession so AVAudioEngine live microphone works simultaneously
        captureSession.automaticallyConfiguresApplicationAudioSession = false
        #endif

        for input in captureSession.inputs {
            captureSession.removeInput(input)
        }
        for output in captureSession.outputs {
            captureSession.removeOutput(output)
        }

        if captureSession.canSetSessionPreset(.hd1280x720) {
            captureSession.sessionPreset = .hd1280x720
        } else if captureSession.canSetSessionPreset(.hd1920x1080) {
            captureSession.sessionPreset = .hd1920x1080
        }

        guard let selectedDevice = selectDevice(preferredSource: preferredSource),
              let deviceInput = try? AVCaptureDeviceInput(device: selectedDevice),
              captureSession.canAddInput(deviceInput) else {
            activeDeviceName = "Unavailable"
            return false
        }

        captureSession.addInput(deviceInput)
        activeDeviceName = selectedDevice.localizedName

        // Configure 30 FPS frame cadence and continuous auto-focus for DIP-8 macro inspection
        do {
            try selectedDevice.lockForConfiguration()
            if selectedDevice.isFocusModeSupported(.continuousAutoFocus) {
                selectedDevice.focusMode = .continuousAutoFocus
            }
            let frameDuration = CMTimeMake(value: 1, timescale: targetFPS)
            selectedDevice.activeVideoMinFrameDuration = frameDuration
            selectedDevice.activeVideoMaxFrameDuration = frameDuration
            selectedDevice.unlockForConfiguration()
        } catch {
            // Non-fatal if UVC camera locks frame rate externally
        }

        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
        ]
        videoOutput.setSampleBufferDelegate(self, queue: frameOutputQueue)

        guard captureSession.canAddOutput(videoOutput) else {
            return false
        }
        captureSession.addOutput(videoOutput)
        if let conn = videoOutput.connection(with: .video) {
            if #available(iOS 17.0, *) {
                if conn.isVideoRotationAngleSupported(0) {
                    conn.videoRotationAngle = 0
                }
            }
        }
        return true
    }

    private func selectDevice(preferredSource: String) -> AVCaptureDevice? {
        let devices = availableCameraDevices()
        let pref = preferredSource.lowercased()

        if pref == "external" || pref == "uvc" || pref == "auto" {
            if #available(iOS 17.0, macCatalyst 17.0, *) {
                if let ext = devices.first(where: { $0.deviceType == .external }) {
                    return ext
                }
            }
        }
        if pref == "front" {
            if let front = devices.first(where: { $0.position == .front }) {
                return front
            }
        }
        if let rear = devices.first(where: { $0.position == .back }) {
            return rear
        }
        return devices.first
    }

    public func captureOutput(
        _ output: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        let now = CACurrentMediaTime()
        let minInterval = 1.0 / Double(max(1, targetFPS))
        guard now - lastFrameTimestamp >= (minInterval * 0.9) else { return }
        lastFrameTimestamp = now

        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)

        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
              let jpegData = ciContext.jpegRepresentation(
                  of: ciImage,
                  colorSpace: colorSpace,
                  options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: jpegQuality]
              ) else {
            return
        }

        // Always feed the in-process StandaloneFieldScanServer directly in memory so live camera never drops
        StandaloneFieldScanServer.shared.ingestLiveCameraFrame(
            jpegData: jpegData,
            width: width,
            height: height,
            sourceLabel: "ipad:avfoundation:\(activeDeviceName)"
        )

        if let callback = onFrameCapturedBase64 {
            let b64 = jpegData.base64EncodedString()
            DispatchQueue.main.async {
                callback(b64, width, height)
            }
        }

        if pushToBackendEnabled && !uploadInFlight {
            pushJPEGFrameToBackend(jpegData, width: width, height: height)
        }
    }

    /// Pushes the raw JPEG frame to `/api/video/ipad_frame` on the active FieldScan backend.
    private func pushJPEGFrameToBackend(_ jpegData: Data, width: Int, height: Int) {
        let cfg = FieldScanRuntimeConfig.shared
        guard cfg.currentMode != .bundledOfflineStudio else { return }

        uploadInFlight = true
        let endpoint = cfg.activeEndpointURL.appendingPathComponent("api/video/ipad_frame")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        request.setValue(activeDeviceName, forHTTPHeaderField: "X-FieldScan-Camera-Device")
        request.setValue("\(width)x\(height)", forHTTPHeaderField: "X-FieldScan-Resolution")
        request.httpBody = jpegData

        uploadSession.dataTask(with: request) { [weak self] _, _, _ in
            self?.uploadInFlight = false
        }.resume()
    }

    public func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        if let trust = challenge.protectionSpace.serverTrust {
            completionHandler(.useCredential, URLCredential(trust: trust))
            return
        }
        completionHandler(.performDefaultHandling, nil)
    }
}
