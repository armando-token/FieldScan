import Foundation
import CryptoKit
import Security
#if canImport(UIKit)
import UIKit
import UniformTypeIdentifiers
import WebKit

/// Fullscreen Landscape Widescreen HMI Controller for FieldScan CAD v2.1 on iPad Air M4 (12 GB RAM).
///
/// Security & Field Reliability Guarantees:
/// - **WebView & JS Bridge Origin Allowlist (`OFF-05`)**: Blocks navigation to unknown external hosts
///   and verifies `message.frameInfo.securityOrigin` before granting camera, mic, endpoint, or share access.
/// - **Certificate Fingerprint Pinning (`OFF-06`)**: Evaluates self-signed TLS certificates on assisted
///   Mac tether by pinning the SHA-256 DER digest; rejects silent certificate replacement until operator reconfirms.
/// - **Canonical Share Sheet Allowlist (`EXP-05`)**: Only shares verified files inside `Documents/exports/`
///   and preserves all session records if Share Sheet is cancelled.
public final class FieldScanWebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler, UIDocumentPickerDelegate {

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
            },
            presentPackageImporter: function() {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "presentPackageImporter"
                });
            },
            presentPusrGatewayConfig: function() {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "presentPusrGatewayConfig"
                });
            }
        };
        """
        let userScript = WKUserScript(
            source: bootstrapJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        userContentController.addUserScript(userScript)

        let config = WKWebViewConfiguration()
        config.userContentController = userContentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptCanOpenWindowsAutomatically = false

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
        var btnConfig = UIButton.Configuration.plain()
        btnConfig.title = "M4 12GB · iPad Local · Bench Setup"
        btnConfig.baseForegroundColor = .white
        btnConfig.contentInsets = NSDirectionalEdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12)
        btnConfig.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var outgoing = incoming
            outgoing.font = UIFont.monospacedSystemFont(ofSize: 11.5, weight: .semibold)
            return outgoing
        }
        pillButton.configuration = btnConfig
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
            let gw = FieldScanRuntimeConfig.shared.pusrGatewayHost
            shortMode = gw.isEmpty ? "iPad Local" : "iPad · PUSR \(gw)"
        case .usbTetherSecure, .usbTetherHTTP:
            shortMode = "Mac USB-C Assisted"
        case .lanWorkstation:
            shortMode = "Mac LAN Assisted"
        case .bundledOfflineStudio:
            shortMode = "Offline Bundle"
        case .customEndpoint:
            shortMode = "Assisted Host"
        }
        let label = String(format: "M4 %.0fGB · %@ · Share", mem.physicalMemoryGB, shortMode)
        pillButton.configuration?.title = label
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

    // MARK: - Operator Control Sheet

    @objc private func presentOperatorControlSheet() {
        let cfg = FieldScanRuntimeConfig.shared
        let mem = cfg.sampleMemoryTelemetry()
        let gwDesc = cfg.pusrGatewayHost.isEmpty ? "Not configured" : "\(cfg.pusrGatewayHost):\(cfg.pusrGatewayPort)"
        let message = String(
            format: "RAM: %.2f GB (%.2f GB Avail) | Provider: %@\nTopology: %@\nPUSR Gateway: %@",
            mem.physicalMemoryGB,
            mem.availableMemoryGB,
            LlamaServerBridge.shared.activeModelName,
            cfg.currentMode.displayTitle,
            gwDesc
        )

        let sheet = UIAlertController(
            title: "FieldScan CAD v2.1 — iPad Air M4 Bench Control",
            message: message,
            preferredStyle: .actionSheet
        )

        sheet.addAction(UIAlertAction(title: "iPad Autonomous Mode (127.0.0.1:8088 · No Mac)", style: .default) { [weak self] _ in
            self?.switchEndpoint(to: cfg.localBackendURL, mode: .embeddedLocal)
        })

        sheet.addAction(UIAlertAction(title: "Configure PUSR USR-DR164 Modbus TCP Gateway...", style: .default) { [weak self] _ in
            self?.promptForPusrGateway()
        })

        sheet.addAction(UIAlertAction(title: "Mac Mini Assisted · USB-C HTTPS (\(cfg.macTetherHost):\(cfg.macHTTPSPort))", style: .default) { [weak self] _ in
            self?.switchEndpoint(to: cfg.usbTetherHTTPSURL, mode: .usbTetherSecure)
        })

        sheet.addAction(UIAlertAction(title: "Configure Assisted Mac Host / Reset TLS Pin...", style: .default) { [weak self] _ in
            self?.promptForAssistedMacEndpoint()
        })

        sheet.addAction(UIAlertAction(title: "Share Verified Dossier Files (Documents/exports)", style: .default) { [weak self] _ in
            self?.presentExportDirectoryShareSheet()
        })

        sheet.addAction(UIAlertAction(title: "Import Signed FieldScan Package (.zip / Folder)...", style: .default) { [weak self] _ in
            self?.presentSignedPackageDocumentPicker()
        })

        sheet.addAction(UIAlertAction(title: "Start Native Camera Bridge (UVC / Built-In)", style: .default) { _ in
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
        // Switching topology pauses active session & closes prior physical Modbus polling (`Phase 4.1`, `DAT-06`)
        StandaloneFieldScanServer.shared.handleTopologySwitch()
        FieldScanSessionEngine.shared.invalidateLiveConnection(reason: "topology_mode_switched")
        FieldScanRuntimeConfig.shared.currentMode = mode
        FieldScanRuntimeConfig.shared.activeEndpointURL = url
        LlamaServerBridge.shared.refreshProviderHealth { _, _ in }
        updatePillStatusLabel(mode: mode)
        loadResolvedEndpoint(mode: mode, url: url)
    }

    private func promptForPusrGateway() {
        let cfg = FieldScanRuntimeConfig.shared
        let alert = UIAlertController(
            title: "PUSR USR-DR164 Modbus TCP Gateway",
            message: "Enter isolated bench gateway IP and MBAP port (default 502; never 5502):",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.placeholder = "192.168.0.7"
            tf.text = cfg.pusrGatewayHost
            tf.keyboardType = .numbersAndPunctuation
        }
        alert.addTextField { tf in
            tf.placeholder = "502"
            tf.text = String(cfg.pusrGatewayPort)
            tf.keyboardType = .numberPad
        }
        alert.addAction(UIAlertAction(title: "Save & Select PUSR", style: .default) { [weak self] _ in
            let host = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let port = Int(alert.textFields?.last?.text ?? "502") ?? 502
            if port == ModbusTCPClient.legacyRTUBridgePort {
                let errAlert = UIAlertController(
                    title: "Invalid MBAP Port (5502)",
                    message: "Port 5502 is reserved for raw RTU-over-TCP framing. Configure PUSR USR-DR164 in Modbus TCP (MBAP) mode on port 502.",
                    preferredStyle: .alert
                )
                errAlert.addAction(UIAlertAction(title: "OK", style: .default))
                self?.present(errAlert, animated: true)
                return
            }
            StandaloneFieldScanServer.shared.configurePusrGateway(host: host, port: port, activate: !host.isEmpty)
            if let self = self {
                self.updatePillStatusLabel(mode: cfg.currentMode)
                let payload: [String: Any] = ["ok": true, "host": host, "port": port, "activated": !host.isEmpty]
                if let data = try? JSONSerialization.data(withJSONObject: payload),
                   let jsonStr = String(data: data, encoding: .utf8) {
                    let js = "window.dispatchEvent(new CustomEvent('fieldscan:gatewayConfigured', { detail: \(jsonStr) }));"
                    self.webView.evaluateJavaScript(js, completionHandler: nil)
                }
            }
        })
        alert.addAction(UIAlertAction(title: "Clear Gateway", style: .destructive) { [weak self] _ in
            StandaloneFieldScanServer.shared.configurePusrGateway(host: "", port: 502, activate: false)
            if let self = self {
                self.updatePillStatusLabel(mode: cfg.currentMode)
                let js = "window.dispatchEvent(new CustomEvent('fieldscan:gatewayConfigured', { detail: { ok: true, host: '', port: 502, activated: false } }));"
                self.webView.evaluateJavaScript(js, completionHandler: nil)
            }
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }

    private func promptForAssistedMacEndpoint() {
        let cfg = FieldScanRuntimeConfig.shared
        let alert = UIAlertController(
            title: "Assisted Mac Bench Host",
            message: "Configure USB-C link-local IP or mDNS host (resets pinned TLS certificate):",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.placeholder = "armandos-mac-mini.local or 169.254.x.x"
            tf.text = cfg.macTetherHost
            tf.keyboardType = .URL
        }
        alert.addAction(UIAlertAction(title: "Save & Connect HTTPS", style: .default) { [weak self] _ in
            if let host = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines), !host.isEmpty {
                cfg.macTetherHost = host
                cfg.pinnedTLSFingerprintSHA256 = nil
                self?.switchEndpoint(to: cfg.usbTetherHTTPSURL, mode: .usbTetherSecure)
            }
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }

    private func presentExportDirectoryShareSheet() {
        let exportsDir = FieldScanSessionEngine.shared.exportsDirectoryURL
        let files = ((try? FileManager.default.contentsOfDirectory(at: exportsDir, includingPropertiesForKeys: nil)) ?? [])
            .filter { $0.pathExtension != "tmp" && !$0.hasDirectoryPath }
        guard !files.isEmpty else {
            let emptyAlert = UIAlertController(
                title: "No Exported Files Yet",
                message: "Generate a Session PDF/JSON or 3D CAD Dossier first.",
                preferredStyle: .alert
            )
            emptyAlert.addAction(UIAlertAction(title: "OK", style: .default))
            present(emptyAlert, animated: true)
            return
        }

        let activityVC = UIActivityViewController(activityItems: files, applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(activityVC, animated: true)
    }

    // MARK: - WKUIDelegate (Trusted Local Origin Media & Native JS Dialogs, `OFF-05`)

    @available(iOS 15.0, *)
    public func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        if FieldScanRuntimeConfig.shared.isTrustedHMIHost(origin.host) {
            decisionHandler(.grant)
        } else {
            decisionHandler(.deny)
        }
    }

    public func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        guard FieldScanRuntimeConfig.shared.isTrustedHMIHost(frame.securityOrigin.host),
              presentedViewController == nil else {
            completionHandler()
            return
        }
        let alert = UIAlertController(title: "FieldScan CAD", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    public func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        guard FieldScanRuntimeConfig.shared.isTrustedHMIHost(frame.securityOrigin.host),
              presentedViewController == nil else {
            completionHandler(false)
            return
        }
        let alert = UIAlertController(title: "FieldScan CAD", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "Confirm", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    public func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        guard FieldScanRuntimeConfig.shared.isTrustedHMIHost(frame.securityOrigin.host),
              presentedViewController == nil else {
            completionHandler(nil)
            return
        }
        let alert = UIAlertController(title: "FieldScan Bench Input", message: prompt, preferredStyle: .alert)
        alert.addTextField { tf in
            tf.text = defaultText
            tf.autocapitalizationType = .none
            tf.autocorrectionType = .no
        }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "Save", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text)
        })
        present(alert, animated: true)
    }

    // MARK: - WKNavigationDelegate (Strict Origin Policy + TLS Pinning, `OFF-05`, `OFF-06`)

    public func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if url.isFileURL || url.scheme == "about" || url.scheme == "blob" || url.scheme == "data" {
            decisionHandler(.allow)
            return
        }
        if FieldScanRuntimeConfig.shared.isTrustedHMIHost(url.host) {
            decisionHandler(.allow)
        } else {
            // Block untrusted external destinations (`OFF-05`)
            decisionHandler(.cancel)
        }
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        navigationRetryCount = 0
    }

    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        retryOrFallbackNavigation()
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        retryOrFallbackNavigation()
    }

    private func retryOrFallbackNavigation() {
        navigationRetryCount += 1
        if navigationRetryCount <= 6 {
            StandaloneFieldScanServer.shared.start()
            let targetURL = FieldScanRuntimeConfig.shared.localBackendURL
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                guard let self = self else { return }
                let req = URLRequest(url: targetURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10.0)
                self.webView.load(req)
            }
        }
    }

    /// Evaluates local TLS server trust with certificate SHA-256 pinning (`OFF-06`, `[A7]`).
    public func webView(
        _ webView: WKWebView,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        let cfg = FieldScanRuntimeConfig.shared
        let host = challenge.protectionSpace.host
        guard cfg.isTrustedHMIHost(host),
              let serverTrust = challenge.protectionSpace.serverTrust else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }

        // Compute SHA-256 fingerprint of leaf DER certificate (`OFF-06`)
        guard let certChain = SecTrustCopyCertificateChain(serverTrust) as? [SecCertificate],
              let leafCert = certChain.first else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        let derData = SecCertificateCopyData(leafCert) as Data
        let certFingerprint = SHA256.hash(data: derData).map { String(format: "%02x", $0) }.joined()

        if let pinned = cfg.pinnedTLSFingerprintSHA256, !pinned.isEmpty {
            if pinned == certFingerprint {
                completionHandler(.useCredential, URLCredential(trust: serverTrust))
            } else {
                // Certificate changed unexpectedly: reject until operator explicitly resets trust (`OFF-06`)
                completionHandler(.cancelAuthenticationChallenge, nil)
            }
            return
        }

        // First connection to explicitly configured bench host: pin leaf SHA-256
        cfg.pinnedTLSFingerprintSHA256 = certFingerprint
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    }

    // MARK: - WKScriptMessageHandler (`fieldscanNative` Origin-Checked & Canonicalized)

    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        // Block native bridge access from any untrusted frame origin (`OFF-05`)
        guard FieldScanRuntimeConfig.shared.isTrustedHMIHost(message.frameInfo.securityOrigin.host) else {
            return
        }
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
            if let target = body["target"] as? String,
               let url = URL(string: target),
               FieldScanRuntimeConfig.shared.isTrustedHMIHost(url.host) {
                switchEndpoint(to: url, mode: .customEndpoint)
            }

        case "shareExportedFile":
            let rawFilename = (body["filename"] as? String) ?? ""
            let base64Data = (body["base64Data"] as? String) ?? ""
            shareAuthorizedExportFile(rawFilename: rawFilename, base64Data: base64Data)

        case "getDeviceMemoryInfo":
            let snapshot = LlamaServerBridge.shared.currentTelemetrySnapshot()
            if let jsonData = try? JSONSerialization.data(withJSONObject: snapshot, options: []),
               let jsonStr = String(data: jsonData, encoding: .utf8) {
                let js = "window.dispatchEvent(new CustomEvent('fieldscan:deviceMemoryInfo', { detail: \(jsonStr) }));"
                self.webView.evaluateJavaScript(js, completionHandler: nil)
            }

        case "presentPackageImporter":
            presentSignedPackageDocumentPicker()

        case "presentPusrGatewayConfig":
            promptForPusrGateway()

        default:
            break
        }
    }

    private func presentSignedPackageDocumentPicker() {
        var types: [UTType] = [.zip, .folder]
        if let fspkg = UTType(filenameExtension: "fspkg") {
            types.append(fspkg)
        }
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
        picker.delegate = self
        picker.allowsMultipleSelection = false
        present(picker, animated: true)
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let pickedURL = urls.first else { return }
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let payload: [String: Any]
            do {
                let pkg = try FieldScanPackageStore.shared.importPackage(from: pickedURL)
                payload = ["ok": true, "package": pkg]
            } catch let cerr as FieldScanCatalogError {
                payload = cerr.toDictionary()
            } catch {
                payload = ["ok": false, "error_code": "INVALID_ENVELOPE", "message": error.localizedDescription]
            }
            if let data = try? JSONSerialization.data(withJSONObject: payload),
               let jsonStr = String(data: data, encoding: .utf8) {
                DispatchQueue.main.async {
                    let js = "window.dispatchEvent(new CustomEvent('fieldscan:packageImported', { detail: \(jsonStr) }));"
                    self?.webView.evaluateJavaScript(js, completionHandler: nil)
                }
            }
        }
    }

    private func shareAuthorizedExportFile(rawFilename: String, base64Data: String) {
        let cleanName = URL(fileURLWithPath: rawFilename).lastPathComponent
        guard !cleanName.isEmpty, !rawFilename.contains(".."), !rawFilename.contains("/") else {
            return // Reject arbitrary or traversal paths (`EXP-05`)
        }

        // Only write client-generated DXF/STL blobs if non-empty; otherwise share existing verified server export
        if !base64Data.isEmpty {
            let exportsDir = FieldScanSessionEngine.shared.exportsDirectoryURL
            let targetURL = exportsDir.appendingPathComponent(cleanName)
            let cleanB64: String
            if let commaIdx = base64Data.firstIndex(of: ",") {
                cleanB64 = String(base64Data[base64Data.index(after: commaIdx)...])
            } else {
                cleanB64 = base64Data
            }
            if let decoded = Data(base64Encoded: cleanB64), !decoded.isEmpty {
                try? decoded.write(to: targetURL, options: .atomic)
            }
        }

        guard let verifiedURL = FieldScanSessionEngine.shared.resolveAuthorizedExportFile(named: cleanName) else {
            return
        }

        let activityVC = UIActivityViewController(activityItems: [verifiedURL], applicationActivities: nil)
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(activityVC, animated: true)
    }
}
#endif
