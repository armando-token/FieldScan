import Foundation
#if canImport(UIKit)
import UIKit
import WebKit

/// Fullscreen Landscape Widescreen HMI Controller for FieldScan CAD v2.0 on iPad Air M4 (12 GB RAM).
///
/// Features:
///   - 60 FPS Metal-accelerated `WKWebView` for `Three.js v0.170` 3D Digital Twin & `uPlot` SCADA telemetry
///   - Automatic camera & microphone media capture permission grant (`WKUIDelegate`)
///   - `WKScriptMessageHandler` (`fieldscanNative`) supporting:
///       * `startNativeCamera`
///       * `stopNativeCamera`
///       * `switchEndpoint`
///       * `shareExportedFile`
///       * `getDeviceMemoryInfo`
///   - Collapsible floating operator mini-pill (`M4 12GB · Local / USB-C Tether · Share CAD`)
public final class FieldScanWebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {

    private var webView: WKWebView!
    private let floatingPill = UIView()
    private let pillButton = UIButton(type: .system)
    private var navigationRetryCount: Int = 0

    public override var prefersStatusBarHidden: Bool {
        return true
    }

    public override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return [.landscapeLeft, .landscapeRight]
    }

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.04, green: 0.06, blue: 0.09, alpha: 1.0)

        configureWebView()
        configureFloatingControlPill()
        bootFieldScanEndpoint()
    }

    private func configureWebView() {
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "fieldscanNative")

        let mem = FieldScanRuntimeConfig.shared.sampleMemoryTelemetry()
        let bootstrapJS = """
        window.FIELDSCAN_IOS_NATIVE = true;
        window.FIELDSCAN_DEVICE_MODEL = "iPad Air M4 (12 GB Unified Memory)";
        window.FIELDSCAN_PHYSICAL_MEMORY_GB = \(String(format: "%.2f", mem.physicalMemoryGB));
        window.FIELDSCAN_AVAILABLE_MEMORY_GB = \(String(format: "%.2f", mem.availableMemoryGB));
        window.fieldscanNativeBridge = {
            startNativeCamera: function(source) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "startNativeCamera",
                    source: source || "auto"
                });
            },
            stopNativeCamera: function() {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "stopNativeCamera"
                });
            },
            switchEndpoint: function(urlOrMode) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "switchEndpoint",
                    target: urlOrMode
                });
            },
            shareExportedFile: function(filename, base64Data, mimeType) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "shareExportedFile",
                    filename: filename || "THT02_Export.zip",
                    base64Data: base64Data || "",
                    mimeType: mimeType || "application/octet-stream"
                });
            },
            getDeviceMemoryInfo: function() {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "getDeviceMemoryInfo"
                });
            }
        };
        """
        let userScript = WKUserScript(
            source: bootstrapJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        userContentController.addUserScript(userScript)

        let config = WKWebViewConfiguration()
        config.userContentController = userContentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptCanOpenWindowsAutomatically = true

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.uiDelegate = self
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.04, green: 0.06, blue: 0.09, alpha: 1.0)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        view.addSubview(webView)
    }

    private func configureFloatingControlPill() {
        floatingPill.translatesAutoresizingMaskIntoConstraints = false
        floatingPill.backgroundColor = UIColor(red: 0.07, green: 0.11, blue: 0.18, alpha: 0.88)
        floatingPill.layer.cornerRadius = 14
        floatingPill.layer.borderWidth = 1.0
        floatingPill.layer.borderColor = UIColor(red: 0.0, green: 0.78, blue: 0.96, alpha: 0.55).cgColor

        pillButton.translatesAutoresizingMaskIntoConstraints = false
        pillButton.setTitle("M4 12GB · Local / USB-C Tether · Share CAD", for: .normal)
        pillButton.setTitleColor(.white, for: .normal)
        pillButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 11.5, weight: .semibold)
        pillButton.contentEdgeInsets = UIEdgeInsets(top: 6, left: 12, bottom: 6, right: 12)
        pillButton.addTarget(self, action: #selector(presentOperatorControlSheet), for: .touchUpInside)

        floatingPill.addSubview(pillButton)
        view.addSubview(floatingPill)

        NSLayoutConstraint.activate([
            floatingPill.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            floatingPill.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -12),
            pillButton.topAnchor.constraint(equalTo: floatingPill.topAnchor),
            pillButton.bottomAnchor.constraint(equalTo: floatingPill.bottomAnchor),
            pillButton.leadingAnchor.constraint(equalTo: floatingPill.leadingAnchor),
            pillButton.trailingAnchor.constraint(equalTo: floatingPill.trailingAnchor),
        ])
    }

    private func updatePillStatusLabel(mode: FieldScanEndpointMode) {
        let mem = FieldScanRuntimeConfig.shared.sampleMemoryTelemetry()
        let shortMode: String
        switch mode {
        case .embeddedLocal:
            shortMode = "Local :8088"
        case .usbTetherSecure, .usbTetherHTTP:
            shortMode = "USB-C Tether 169.254.37.69"
        case .lanWorkstation:
            shortMode = "LAN 10.0.0.15"
        case .bundledOfflineStudio:
            shortMode = "Offline 3D Twin"
        case .customEndpoint:
            shortMode = "Custom Host"
        }
        let label = String(format: "M4 %.0fGB · %@ · Share CAD", mem.physicalMemoryGB, shortMode)
        pillButton.setTitle(label, for: .normal)
    }

    private func bootFieldScanEndpoint() {
        PythonRuntimeBridge.shared.resolveBestEndpoint { [weak self] mode, url in
            guard let self = self else { return }
            self.updatePillStatusLabel(mode: mode)
            self.loadResolvedEndpoint(mode: mode, url: url)
        }
    }

    private func loadResolvedEndpoint(mode: FieldScanEndpointMode, url: URL) {
        if url.isFileURL {
            let readAccessDir = url.deletingLastPathComponent().deletingLastPathComponent()
            webView.loadFileURL(url, allowingReadAccessTo: readAccessDir)
        } else {
            let request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10.0)
            webView.load(request)
        }
    }

    // MARK: - Operator Control Sheet (Endpoint Switcher + Native Share Sheet)

    @objc private func presentOperatorControlSheet() {
        let mem = FieldScanRuntimeConfig.shared.sampleMemoryTelemetry()
        let message = String(
            format: "Physical RAM: %.2f GB | Available: %.2f GB\nActive Mode: %@",
            mem.physicalMemoryGB,
            mem.availableMemoryGB,
            FieldScanRuntimeConfig.shared.currentMode.displayTitle
        )

        let sheet = UIAlertController(
            title: "FieldScan CAD v2.0 — iPad Air M4 (12 GB)",
            message: message,
            preferredStyle: .actionSheet
        )

        sheet.addAction(UIAlertAction(title: "Embedded Local Mode (127.0.0.1:8088)", style: .default) { [weak self] _ in
            self?.switchEndpoint(to: FieldScanRuntimeConfig.shared.localBackendURL, mode: .embeddedLocal)
        })

        sheet.addAction(UIAlertAction(title: "USB-C Mac Mini Tether HTTPS (169.254.37.69:8443)", style: .default) { [weak self] _ in
            self?.switchEndpoint(to: FieldScanRuntimeConfig.shared.usbTetherHTTPSURL, mode: .usbTetherSecure)
        })

        sheet.addAction(UIAlertAction(title: "USB-C Mac Mini Tether HTTP (169.254.37.69:8088)", style: .default) { [weak self] _ in
            self?.switchEndpoint(to: FieldScanRuntimeConfig.shared.usbTetherHTTPURL, mode: .usbTetherHTTP)
        })

        sheet.addAction(UIAlertAction(title: "Bundled Offline 3D Twin & SCADA Studio", style: .default) { [weak self] _ in
            let bundled = PythonRuntimeBridge.shared.locateBundledOfflineStudioURL()
            self?.switchEndpoint(to: bundled, mode: .bundledOfflineStudio)
        })

        sheet.addAction(UIAlertAction(title: "Custom IP / Host Endpoint...", style: .default) { [weak self] _ in
            self?.promptForCustomEndpoint()
        })

        sheet.addAction(UIAlertAction(title: "Share Exported CAD / Warranty Dossier (.DXF / .STL / .ZIP)", style: .default) { [weak self] _ in
            self?.presentExportDirectoryShareSheet()
        })

        sheet.addAction(UIAlertAction(title: "Start Native 30 FPS Camera Bridge", style: .default) { _ in
            NativeCameraBridge.shared.startCapture(preferredSource: "auto", completion: nil)
        })

        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(sheet, animated: true)
    }

    private func switchEndpoint(to url: URL, mode: FieldScanEndpointMode) {
        FieldScanRuntimeConfig.shared.currentMode = mode
        FieldScanRuntimeConfig.shared.activeEndpointURL = url
        updatePillStatusLabel(mode: mode)
        loadResolvedEndpoint(mode: mode, url: url)
    }

    private func promptForCustomEndpoint() {
        let alert = UIAlertController(
            title: "Custom FieldScan Endpoint",
            message: "Enter URL (e.g. https://169.254.37.69:8443 or http://10.0.0.15:8088)",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.placeholder = "https://169.254.37.69:8443"
            tf.text = FieldScanRuntimeConfig.shared.activeEndpointURL.absoluteString
            tf.keyboardType = .URL
        }
        alert.addAction(UIAlertAction(title: "Connect", style: .default) { [weak self] _ in
            if let text = alert.textFields?.first?.text, let url = URL(string: text) {
                self?.switchEndpoint(to: url, mode: .customEndpoint)
            }
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }

    private func presentExportDirectoryShareSheet() {
        let exportsDir = FieldScanRuntimeConfig.shared.documentsDirectory.appendingPathComponent("exports", isDirectory: true)
        let files = (try? FileManager.default.contentsOfDirectory(at: exportsDir, includingPropertiesForKeys: nil)) ?? []
        let itemsToShare: [Any] = files.isEmpty ? [exportsDir] : files

        let activityVC = UIActivityViewController(activityItems: itemsToShare, applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(activityVC, animated: true)
    }

    // MARK: - WKUIDelegate (Auto-Grant Camera & Microphone inside WebView)

    @available(iOS 15.0, *)
    public func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        // Automatically grant camera and microphone permissions to FieldScan HMI
        decisionHandler(.grant)
    }

    // MARK: - WKNavigationDelegate (Local TLS Trust + Automatic Retry & Offline Fallback)

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        navigationRetryCount = 0
    }

    public func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        retryOrFallbackNavigation()
    }

    public func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        retryOrFallbackNavigation()
    }

    private func retryOrFallbackNavigation() {
        navigationRetryCount += 1
        if navigationRetryCount <= 8 {
            StandaloneFieldScanServer.shared.start()
            let targetURL = FieldScanRuntimeConfig.shared.localBackendURL
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                guard let self = self else { return }
                let req = URLRequest(url: targetURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10.0)
                self.webView.load(req)
            }
        } else {
            let fm = FileManager.default
            if let resURL = Bundle.main.resourceURL {
                let bundledHTML = resURL.appendingPathComponent("BundleResources/static/index.html")
                if fm.fileExists(atPath: bundledHTML.path) {
                    let readAccessDir = bundledHTML.deletingLastPathComponent().deletingLastPathComponent()
                    webView.loadFileURL(bundledHTML, allowingReadAccessTo: readAccessDir)
                }
            }
        }
    }

    public func webView(
        _ webView: WKWebView,
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

    // MARK: - WKScriptMessageHandler (`fieldscanNative`)

    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "fieldscanNative",
              let body = message.body as? [String: Any],
              let command = body["command"] as? String else {
            return
        }

        switch command {
        case "startNativeCamera":
            let source = (body["source"] as? String) ?? "auto"
            NativeCameraBridge.shared.startCapture(preferredSource: source) { [weak self] ok, deviceName in
                let js = "window.dispatchEvent(new CustomEvent('fieldscan:nativeCameraStatus', { detail: { running: \(ok), device: '\(deviceName)' } }));"
                self?.webView.evaluateJavaScript(js, completionHandler: nil)
            }

        case "stopNativeCamera":
            NativeCameraBridge.shared.stopCapture()
            let js = "window.dispatchEvent(new CustomEvent('fieldscan:nativeCameraStatus', { detail: { running: false } }));"
            webView.evaluateJavaScript(js, completionHandler: nil)

        case "switchEndpoint":
            if let target = body["target"] as? String, let url = URL(string: target) {
                switchEndpoint(to: url, mode: .customEndpoint)
            }

        case "shareExportedFile":
            let filename = (body["filename"] as? String) ?? "THT02_Export.zip"
            let base64Data = (body["base64Data"] as? String) ?? ""
            shareBase64ExportedFile(filename: filename, base64Data: base64Data)

        case "getDeviceMemoryInfo":
            let snapshot = LlamaServerBridge.shared.currentTelemetrySnapshot()
            if let jsonData = try? JSONSerialization.data(withJSONObject: snapshot, options: []),
               let jsonStr = String(data: jsonData, encoding: .utf8) {
                let js = "window.dispatchEvent(new CustomEvent('fieldscan:deviceMemoryInfo', { detail: \(jsonStr) }));"
                webView.evaluateJavaScript(js, completionHandler: nil)
            }

        default:
            break
        }
    }

    private func shareBase64ExportedFile(filename: String, base64Data: String) {
        FieldScanRuntimeConfig.shared.prepareSharedDirectories()
        let exportsDir = FieldScanRuntimeConfig.shared.documentsDirectory.appendingPathComponent("exports", isDirectory: true)
        let targetURL = exportsDir.appendingPathComponent(filename)

        let cleanBase64: String
        if let commaIndex = base64Data.firstIndex(of: ",") {
            cleanBase64 = String(base64Data[base64Data.index(after: commaIndex)...])
        } else {
            cleanBase64 = base64Data
        }

        if let data = Data(base64Encoded: cleanBase64) {
            try? data.write(to: targetURL, options: .atomic)
        }

        let activityVC = UIActivityViewController(activityItems: [targetURL], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(activityVC, animated: true)
    }
}
#endif
