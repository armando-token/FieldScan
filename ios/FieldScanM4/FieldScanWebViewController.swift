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

    // Native 0% -> 100% Boot Loading Overlay (renders on frame 1 so cold launch never shows a black screen)
    private let bootOverlayView = UIView()
    private let bootPercentLabel = UILabel()
    private let bootStatusLabel = UILabel()
    private let bootProgressView = UIProgressView(progressViewStyle: .default)
    private var bootDisplayPercent: Int = 0
    private var bootTargetPercent: Int = 0
    private var bootDismissed: Bool = false
    private var bootTicker: Timer?
    private var bootFailsafeWorkItem: DispatchWorkItem?
    private var webProgressObservation: NSKeyValueObservation?

    deinit {
        bootTicker?.invalidate()
        bootFailsafeWorkItem?.cancel()
        webProgressObservation?.invalidate()
    }

    public override var prefersStatusBarHidden: Bool {
        return true
    }

    public override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .all
    }

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.95, green: 0.95, blue: 0.97, alpha: 1.0)

        configureWebView()
        configureFloatingControlPill()
        configureBootOverlay()
        runStagedBootSequence()
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
            presentPackageImporter: function(requestId, turnId) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "presentPackageImporter",
                    request_id: requestId || "",
                    turn_id: turnId || ""
                });
            },
            presentPusrGatewayConfig: function(requestId, turnId) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "presentPusrGatewayConfig",
                    request_id: requestId || "",
                    turn_id: turnId || ""
                });
            },
            presentOperatorControlSheet: function(requestId, turnId) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "presentOperatorControlSheet",
                    request_id: requestId || "",
                    turn_id: turnId || ""
                });
            },
            openAppSettings: function(requestId, turnId) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "openAppSettings",
                    request_id: requestId || "",
                    turn_id: turnId || ""
                });
            },
            notifyBootProgress: function(percent, statusText) {
                window.webkit.messageHandlers.fieldscanNative.postMessage({
                    command: "notifyBootProgress",
                    percent: Number(percent) || 0,
                    status: String(statusText || "")
                });
            }
        };
        (function markNativeShell() {
            if (document.documentElement) {
                document.documentElement.classList.add("ipad-native-shell");
            }
            document.addEventListener("DOMContentLoaded", function() {
                if (document.documentElement) {
                    document.documentElement.classList.add("ipad-native-shell");
                }
            });
        })();
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
        webView.backgroundColor = UIColor(red: 0.95, green: 0.95, blue: 0.97, alpha: 1.0)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        view.addSubview(webView)

        webProgressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] wv, _ in
            DispatchQueue.main.async {
                guard let self = self, !self.bootDismissed else { return }
                let mapped = 58 + Int((wv.estimatedProgress * 26.0).rounded())
                if mapped > self.bootTargetPercent && mapped <= 84 {
                    self.setBootProgressTarget(mapped, status: "Loading FieldScan HMI & 3D modules...")
                }
            }
        }
    }

    public override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        coordinator.animate(alongsideTransition: nil) { [weak self] _ in
            self?.webView?.evaluateJavaScript("window.dispatchEvent(new Event('resize'));", completionHandler: nil)
        }
    }

    private func configureFloatingControlPill() {
        floatingPill.translatesAutoresizingMaskIntoConstraints = false
        floatingPill.backgroundColor = UIColor(red: 0.08, green: 0.11, blue: 0.16, alpha: 0.92)
        floatingPill.layer.cornerRadius = 5
        floatingPill.layer.borderWidth = 1.0
        floatingPill.layer.borderColor = UIColor(red: 0.18, green: 0.50, blue: 0.98, alpha: 0.65).cgColor

        pillButton.translatesAutoresizingMaskIntoConstraints = false
        var btnConfig = UIButton.Configuration.plain()
        btnConfig.title = "M4 · Local"
        btnConfig.baseForegroundColor = .white
        btnConfig.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 9, bottom: 4, trailing: 9)
        btnConfig.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var outgoing = incoming
            outgoing.font = UIFont.monospacedSystemFont(ofSize: 10.5, weight: .bold)
            return outgoing
        }
        pillButton.configuration = btnConfig
        pillButton.addTarget(self, action: #selector(presentOperatorControlSheet), for: .touchUpInside)

        floatingPill.addSubview(pillButton)
        view.addSubview(floatingPill)

        NSLayoutConstraint.activate([
            floatingPill.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 6),
            floatingPill.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -8),
            floatingPill.heightAnchor.constraint(equalToConstant: 26),
            pillButton.topAnchor.constraint(equalTo: floatingPill.topAnchor),
            pillButton.bottomAnchor.constraint(equalTo: floatingPill.bottomAnchor),
            pillButton.leadingAnchor.constraint(equalTo: floatingPill.leadingAnchor),
            pillButton.trailingAnchor.constraint(equalTo: floatingPill.trailingAnchor),
        ])
    }

    private func updatePillStatusLabel(mode: FieldScanEndpointMode) {
        let shortMode: String
        switch mode {
        case .embeddedLocal:
            let gw = FieldScanRuntimeConfig.shared.pusrGatewayHost
            shortMode = gw.isEmpty ? "Local" : "AP"
        case .usbTetherSecure, .usbTetherHTTP:
            shortMode = "Mac USB"
        case .lanWorkstation:
            shortMode = "Mac LAN"
        case .bundledOfflineStudio:
            shortMode = "Offline"
        case .customEndpoint:
            shortMode = "Custom"
        }
        let label = "M4 · \(shortMode) ▾"
        pillButton.configuration?.title = label
        pillButton.setTitle(label, for: .normal)
    }

    // MARK: - Native 0% -> 100% Boot Loading Overlay

    private func configureBootOverlay() {
        bootOverlayView.translatesAutoresizingMaskIntoConstraints = false
        bootOverlayView.backgroundColor = UIColor(red: 0.95, green: 0.95, blue: 0.97, alpha: 1.0)

        let card = UIView()
        card.translatesAutoresizingMaskIntoConstraints = false
        card.backgroundColor = .white
        card.layer.cornerRadius = 6
        card.layer.borderWidth = 1.0
        card.layer.borderColor = UIColor(white: 0.0, alpha: 0.09).cgColor
        card.layer.shadowColor = UIColor.black.cgColor
        card.layer.shadowOpacity = 0.08
        card.layer.shadowRadius = 18
        card.layer.shadowOffset = CGSize(width: 0, height: 8)

        let badge = UILabel()
        badge.translatesAutoresizingMaskIntoConstraints = false
        badge.text = "FS"
        badge.textAlignment = .center
        badge.font = UIFont.monospacedSystemFont(ofSize: 18, weight: .heavy)
        badge.textColor = .white
        badge.backgroundColor = UIColor(red: 0.176, green: 0.498, blue: 0.976, alpha: 1.0)
        badge.layer.cornerRadius = 5
        badge.clipsToBounds = true

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = "FIELDSCAN CAD"
        titleLabel.font = UIFont.systemFont(ofSize: 18, weight: .heavy)
        titleLabel.textColor = UIColor(red: 0.04, green: 0.04, blue: 0.04, alpha: 1.0)

        let subtitleLabel = UILabel()
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.text = "INDUSTRIAL DIGITAL TWIN · IPAD AIR M4"
        subtitleLabel.font = UIFont.monospacedSystemFont(ofSize: 10, weight: .bold)
        subtitleLabel.textColor = UIColor(red: 0.43, green: 0.43, blue: 0.45, alpha: 1.0)

        bootPercentLabel.translatesAutoresizingMaskIntoConstraints = false
        bootPercentLabel.text = "1%"
        bootPercentLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 34, weight: .bold)
        bootPercentLabel.textColor = UIColor(red: 0.176, green: 0.498, blue: 0.976, alpha: 1.0)

        bootProgressView.translatesAutoresizingMaskIntoConstraints = false
        bootProgressView.progressTintColor = UIColor(red: 0.176, green: 0.498, blue: 0.976, alpha: 1.0)
        bootProgressView.trackTintColor = UIColor(red: 0.90, green: 0.90, blue: 0.93, alpha: 1.0)
        bootProgressView.layer.cornerRadius = 2
        bootProgressView.clipsToBounds = true
        bootProgressView.setProgress(0.01, animated: false)

        bootStatusLabel.translatesAutoresizingMaskIntoConstraints = false
        bootStatusLabel.text = "Initializing local package store..."
        bootStatusLabel.font = UIFont.monospacedSystemFont(ofSize: 11.5, weight: .medium)
        bootStatusLabel.textColor = UIColor(red: 0.28, green: 0.28, blue: 0.30, alpha: 1.0)
        bootStatusLabel.numberOfLines = 2

        let headerTextStack = UIStackView(arrangedSubviews: [titleLabel, subtitleLabel])
        headerTextStack.axis = .vertical
        headerTextStack.spacing = 2

        let headerRow = UIStackView(arrangedSubviews: [badge, headerTextStack])
        headerRow.axis = .horizontal
        headerRow.alignment = .center
        headerRow.spacing = 12

        let mainStack = UIStackView(arrangedSubviews: [headerRow, bootPercentLabel, bootProgressView, bootStatusLabel])
        mainStack.translatesAutoresizingMaskIntoConstraints = false
        mainStack.axis = .vertical
        mainStack.spacing = 12
        mainStack.setCustomSpacing(16, after: headerRow)
        mainStack.setCustomSpacing(8, after: bootPercentLabel)

        card.addSubview(mainStack)
        bootOverlayView.addSubview(card)
        view.addSubview(bootOverlayView)

        let cardWidth = card.widthAnchor.constraint(equalToConstant: 360)
        cardWidth.priority = .defaultHigh

        NSLayoutConstraint.activate([
            bootOverlayView.topAnchor.constraint(equalTo: view.topAnchor),
            bootOverlayView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            bootOverlayView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bootOverlayView.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            card.centerXAnchor.constraint(equalTo: bootOverlayView.centerXAnchor),
            card.centerYAnchor.constraint(equalTo: bootOverlayView.centerYAnchor),
            cardWidth,
            card.leadingAnchor.constraint(greaterThanOrEqualTo: bootOverlayView.leadingAnchor, constant: 24),
            card.trailingAnchor.constraint(lessThanOrEqualTo: bootOverlayView.trailingAnchor, constant: -24),

            badge.widthAnchor.constraint(equalToConstant: 42),
            badge.heightAnchor.constraint(equalToConstant: 42),
            bootProgressView.heightAnchor.constraint(equalToConstant: 5),

            mainStack.topAnchor.constraint(equalTo: card.topAnchor, constant: 22),
            mainStack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -22),
            mainStack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 22),
            mainStack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -22),
        ])

        bootDisplayPercent = 1
        bootTargetPercent = 8
        bootTicker = Timer.scheduledTimer(withTimeInterval: 0.024, repeats: true) { [weak self] _ in
            self?.stepBootCounterTick()
        }
    }

    private func stepBootCounterTick() {
        guard !bootDismissed else {
            bootTicker?.invalidate()
            bootTicker = nil
            return
        }
        if bootDisplayPercent < bootTargetPercent {
            let gap = bootTargetPercent - bootDisplayPercent
            let step = gap > 18 ? 3 : (gap > 6 ? 2 : 1)
            bootDisplayPercent = min(bootTargetPercent, bootDisplayPercent + step)
            bootPercentLabel.text = "\(bootDisplayPercent)%"
            bootProgressView.setProgress(Float(bootDisplayPercent) / 100.0, animated: true)
        }
        if bootDisplayPercent >= 100 && bootTargetPercent >= 100 {
            bootTicker?.invalidate()
            bootTicker = nil
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) { [weak self] in
                self?.dismissBootOverlay()
            }
        }
    }

    private func setBootProgressTarget(_ percent: Int, status: String? = nil) {
        let clamped = min(100, max(1, percent))
        if clamped > bootTargetPercent {
            bootTargetPercent = clamped
        }
        if let s = status, !s.isEmpty {
            bootStatusLabel.text = s
        }
    }

    private func dismissBootOverlay() {
        guard !bootDismissed else { return }
        bootDismissed = true
        bootTicker?.invalidate()
        bootTicker = nil
        bootFailsafeWorkItem?.cancel()
        bootFailsafeWorkItem = nil
        UIView.animate(withDuration: 0.24, delay: 0, options: [.curveEaseOut]) {
            self.bootOverlayView.alpha = 0
        } completion: { _ in
            self.bootOverlayView.removeFromSuperview()
        }
    }

    private func scheduleBootFailsafe(after seconds: TimeInterval) {
        bootFailsafeWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self = self, !self.bootDismissed else { return }
            self.setBootProgressTarget(100, status: "Ready")
        }
        bootFailsafeWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: item)
    }

    private func runStagedBootSequence() {
        setBootProgressTarget(12, status: "Verifying local package store & Ed25519 keys...")
        scheduleBootFailsafe(after: 9.0)

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            _ = FieldScanPackageStore.shared.recoverOnBoot()
            DispatchQueue.main.async {
                self?.setBootProgressTarget(28, status: "Starting offline local server (127.0.0.1:8088) & camera...")
            }

            StandaloneFieldScanServer.shared.start()
            DispatchQueue.main.async {
                self?.setBootProgressTarget(48, status: "Preparing local AI & voice engines...")
            }

            LlamaServerBridge.shared.startEmbeddedServersIfAvailable(enableExperimentalInProcessLlama: true)
            DispatchQueue.main.async {
                self?.setBootProgressTarget(58, status: "Loading FieldScan HMI & optical canvas...")
                self?.bootFieldScanEndpoint()
            }
        }
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

    // MARK: - Operator Control Sheet & Native Panel Ack

    private func emitNativePanelAck(requestId: String?, turnId: String?, target: String, status: String, detail: String? = nil) {
        var payload: [String: Any] = [
            "request_id": requestId ?? "",
            "turn_id": turnId ?? "",
            "target": target,
            "status": status,
        ]
        if let d = detail, !d.isEmpty {
            payload["detail"] = d
        }
        if let data = try? JSONSerialization.data(withJSONObject: payload),
           let jsonStr = String(data: data, encoding: .utf8) {
            DispatchQueue.main.async { [weak self] in
                let js = "window.dispatchEvent(new CustomEvent('fieldscan:nativePanelAck', { detail: \(jsonStr) }));"
                self?.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }

    @objc private func presentOperatorControlSheet() {
        presentOperatorControlSheetWithAck(requestId: nil, turnId: nil)
    }

    private func presentOperatorControlSheetWithAck(requestId: String?, turnId: String?) {
        let cfg = FieldScanRuntimeConfig.shared
        let mem = cfg.sampleMemoryTelemetry()
        let topoBadge = cfg.pusrGatewayTopology == "sta_lan" ? "STA/LAN" : "Direct AP"
        let gwDesc = cfg.pusrGatewayHost.isEmpty ? "Not configured" : "\(cfg.pusrGatewayHost):\(cfg.pusrGatewayPort) (\(topoBadge))"
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

        sheet.addAction(UIAlertAction(title: "PUSR Direct AP / Gateway Setup (:502)...", style: .default) { [weak self] _ in
            self?.presentPusrGatewaySelector()
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

        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel) { [weak self] _ in
            self?.emitNativePanelAck(requestId: requestId, turnId: turnId, target: "native_operator_sheet", status: "cancelled")
        })

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(sheet, animated: true) { [weak self] in
            self?.emitNativePanelAck(requestId: requestId, turnId: turnId, target: "native_operator_sheet", status: "visible")
        }
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

    private func notifyWebViewGatewayConfigured(host: String, port: Int, activated: Bool, topology: String) {
        updatePillStatusLabel(mode: FieldScanRuntimeConfig.shared.currentMode)
        let payload: [String: Any] = [
            "ok": true,
            "host": host,
            "port": port,
            "activated": activated,
            "topology": topology,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: payload),
           let jsonStr = String(data: data, encoding: .utf8) {
            let js = "window.dispatchEvent(new CustomEvent('fieldscan:gatewayConfigured', { detail: \(jsonStr) }));"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private func applyPusrGatewaySelection(host: String, port: Int, topology: String) {
        let trimmed = host.trimmingCharacters(in: .whitespacesAndNewlines)
        let activate = !trimmed.isEmpty
        StandaloneFieldScanServer.shared.configurePusrGateway(
            host: trimmed,
            port: port,
            activate: activate,
            topology: topology
        )
        notifyWebViewGatewayConfigured(host: trimmed, port: port, activated: activate, topology: topology)
    }

    /// AP-First Gateway Selector for field operation without any router or internet.
    private func presentPusrGatewaySelector(requestId: String? = nil, turnId: String? = nil) {
        let cfg = FieldScanRuntimeConfig.shared
        let wifiIP = ModbusTCPClient.detectActiveWiFiIPv4() ?? "Not connected to Wi-Fi"
        let activeDesc = cfg.pusrGatewayHost.isEmpty
            ? "None"
            : "\(cfg.pusrGatewayHost):\(cfg.pusrGatewayPort) (\(cfg.pusrGatewayTopology == "sta_lan" ? "STA/LAN" : "Direct AP"))"
        let msg = "Field primary: set PUSR USR-DR164 to pure AP Mode (no router, Modbus TCP :502), join its Wi-Fi on iPad, and choose below.\n\nWi-Fi IP: \(wifiIP)\nActive Gateway: \(activeDesc)"

        let sheet = UIAlertController(
            title: "PUSR USR-DR164 — Direct AP Setup (AP-First)",
            message: msg,
            preferredStyle: .actionSheet
        )

        sheet.addAction(UIAlertAction(title: "1-Tap Auto-Setup & Connect PUSR", style: .default) { [weak self] _ in
            self?.runOneTapPusrAutoSetup()
        })

        sheet.addAction(UIAlertAction(title: "Auto-Detect Direct PUSR AP (:502)", style: .default) { [weak self] _ in
            self?.runDirectPusrAPAutoDetect()
        })

        sheet.addAction(UIAlertAction(title: "Direct PUSR AP Default (\(FieldScanRuntimeConfig.defaultPusrAPHost):502)", style: .default) { [weak self] _ in
            self?.applyPusrGatewaySelection(
                host: FieldScanRuntimeConfig.defaultPusrAPHost,
                port: FieldScanRuntimeConfig.defaultPusrPort,
                topology: "ap_direct"
            )
        })

        sheet.addAction(UIAlertAction(title: "Direct PUSR Alternate AP (\(FieldScanRuntimeConfig.alternatePusrAPHost):502)", style: .default) { [weak self] _ in
            self?.applyPusrGatewaySelection(
                host: FieldScanRuntimeConfig.alternatePusrAPHost,
                port: FieldScanRuntimeConfig.defaultPusrPort,
                topology: "ap_direct"
            )
        })

        sheet.addAction(UIAlertAction(title: "Custom IP / Lab Router (STA Mode)...", style: .default) { [weak self] _ in
            self?.promptForCustomPusrGateway()
        })

        if !cfg.pusrGatewayHost.isEmpty {
            sheet.addAction(UIAlertAction(title: "Clear Gateway (Offline / Local Sim)", style: .destructive) { [weak self] _ in
                self?.applyPusrGatewaySelection(host: "", port: FieldScanRuntimeConfig.defaultPusrPort, topology: "ap_direct")
            })
        }

        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel) { [weak self] _ in
            self?.emitNativePanelAck(requestId: requestId, turnId: turnId, target: "native_pusr_sheet", status: "cancelled")
        })

        if let popover = sheet.popoverPresentationController {
            popover.sourceView = floatingPill
            popover.sourceRect = floatingPill.bounds
        }
        present(sheet, animated: true) { [weak self] in
            self?.emitNativePanelAck(requestId: requestId, turnId: turnId, target: "native_pusr_sheet", status: "visible")
        }
    }

    private func runOneTapPusrAutoSetup() {
        let savedHost = FieldScanRuntimeConfig.shared.pusrGatewayHost
        let progress = UIAlertController(
            title: "1-Tap PUSR Auto-Setup...",
            message: "Probing UDP 48899, TCP :502 / :8899 / :80, applying 9600 8N1 + Modbus TCP :502 if needed, and scanning Slave IDs 1..10/176...",
            preferredStyle: .alert
        )
        present(progress, animated: true)

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let res = StandaloneFieldScanServer.shared.runOneTapPusrAutoSetup(
                preferredHost: savedHost.isEmpty ? nil : savedHost,
                baud: 9600,
                port: FieldScanRuntimeConfig.defaultPusrPort
            )
            DispatchQueue.main.async {
                progress.dismiss(animated: true) {
                    guard let self = self else { return }
                    let statusStr = (res["status"] as? String) ?? ""
                    let message = (res["message"] as? String) ?? "PUSR Auto-Setup completed."
                    let host = (res["host"] as? String) ?? ""
                    let port = (res["port"] as? Int) ?? FieldScanRuntimeConfig.defaultPusrPort

                    if !host.isEmpty {
                        self.notifyWebViewGatewayConfigured(
                            host: host,
                            port: port,
                            activated: statusStr == "ready_on_502",
                            topology: "ap_direct"
                        )
                    }

                    let title: String
                    switch statusStr {
                    case "ready_on_502":
                        let scanOk = ((res["scan_result"] as? [String: Any])?["found"] as? Bool) == true
                        title = scanOk ? "PUSR Connected & Sensor Live" : "PUSR :502 Live — Check RS-485"
                    case "provisioned_rebooting":
                        title = "PUSR Auto-Configured (Rebooting)"
                    case "needs_port_502":
                        title = "PUSR Found — Needs Port 502"
                    case "local_network_denied":
                        title = "Local Network Permission Off"
                    default:
                        title = "PUSR Not Reachable"
                    }

                    let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
                    if statusStr == "provisioned_rebooting" {
                        alert.addAction(UIAlertAction(title: "Run 1-Tap Setup Again", style: .default) { [weak self] _ in
                            self?.runOneTapPusrAutoSetup()
                        })
                    }
                    if statusStr == "needs_port_502", !host.isEmpty, ModbusTCPClient.isPrivateRFC1918IPv4(host),
                       let webURL = URL(string: "http://\(host)") {
                        alert.addAction(UIAlertAction(title: "Open http://\(host) in Safari", style: .default) { _ in
                            UIApplication.shared.open(webURL, options: [:], completionHandler: nil)
                        })
                    }
                    alert.addAction(UIAlertAction(title: "OK", style: .default))
                    self.present(alert, animated: true)
                }
            }
        }
    }

    private func runDirectPusrAPAutoDetect() {
        let savedHost = FieldScanRuntimeConfig.shared.pusrGatewayHost
        let progress = UIAlertController(
            title: "Scanning Direct PUSR AP (:502)...",
            message: "Probing active Wi-Fi subnet and PUSR Direct AP defaults (10.10.100.254, 192.168.0.7)...",
            preferredStyle: .alert
        )
        present(progress, animated: true)

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let res = ModbusTCPClient.discoverDirectPusrAP(
                port: FieldScanRuntimeConfig.defaultPusrPort,
                timeoutS: 0.45,
                savedHost: savedHost.isEmpty ? nil : savedHost
            )
            DispatchQueue.main.async {
                progress.dismiss(animated: true) {
                    guard let self = self else { return }
                    let message = (res["message"] as? String) ?? "Discovery complete."
                    if let foundHost = res["recommended_host"] as? String, !foundHost.isEmpty {
                        let topo = (res["recommended_topology"] as? String) ?? "ap_direct"
                        self.applyPusrGatewaySelection(
                            host: foundHost,
                            port: FieldScanRuntimeConfig.defaultPusrPort,
                            topology: topo
                        )
                        let okAlert = UIAlertController(
                            title: "Direct PUSR AP Connected",
                            message: "\(message)\nPolling live Modbus FC03 registers now.",
                            preferredStyle: .alert
                        )
                        okAlert.addAction(UIAlertAction(title: "OK", style: .default))
                        self.present(okAlert, animated: true)
                    } else {
                        let missAlert = UIAlertController(
                            title: "No Direct PUSR AP Found (:502)",
                            message: message,
                            preferredStyle: .alert
                        )
                        missAlert.addAction(UIAlertAction(title: "Use 10.10.100.254:502 Anyway", style: .default) { [weak self] _ in
                            self?.applyPusrGatewaySelection(
                                host: FieldScanRuntimeConfig.defaultPusrAPHost,
                                port: FieldScanRuntimeConfig.defaultPusrPort,
                                topology: "ap_direct"
                            )
                        })
                        missAlert.addAction(UIAlertAction(title: "Enter Custom IP...", style: .default) { [weak self] _ in
                            self?.promptForCustomPusrGateway()
                        })
                        missAlert.addAction(UIAlertAction(title: "Close", style: .cancel))
                        self.present(missAlert, animated: true)
                    }
                }
            }
        }
    }

    private func promptForCustomPusrGateway() {
        let cfg = FieldScanRuntimeConfig.shared
        let alert = UIAlertController(
            title: "Custom PUSR IP / Lab Router (STA)",
            message: "Secondary option for a custom AP IP or office router (STA mode). Enter IPv4 host and MBAP port (default 502; never 5502):",
            preferredStyle: .alert
        )
        alert.addTextField { tf in
            tf.placeholder = FieldScanRuntimeConfig.defaultPusrAPHost
            tf.text = cfg.pusrGatewayHost
            tf.keyboardType = .numbersAndPunctuation
        }
        alert.addTextField { tf in
            tf.placeholder = "502"
            tf.text = String(cfg.pusrGatewayPort)
            tf.keyboardType = .numberPad
        }
        alert.addAction(UIAlertAction(title: "Save as Direct AP", style: .default) { [weak self] _ in
            self?.handleCustomGatewaySubmit(alert: alert, topology: "ap_direct")
        })
        alert.addAction(UIAlertAction(title: "Save as Lab STA", style: .default) { [weak self] _ in
            self?.handleCustomGatewaySubmit(alert: alert, topology: "sta_lan")
        })
        alert.addAction(UIAlertAction(title: "Clear Gateway", style: .destructive) { [weak self] _ in
            self?.applyPusrGatewaySelection(host: "", port: FieldScanRuntimeConfig.defaultPusrPort, topology: "ap_direct")
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }

    private func handleCustomGatewaySubmit(alert: UIAlertController, topology: String) {
        let host = alert.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let port = Int(alert.textFields?.last?.text ?? "502") ?? 502
        if port == ModbusTCPClient.legacyRTUBridgePort {
            let errAlert = UIAlertController(
                title: "Invalid MBAP Port (5502)",
                message: "Port 5502 is reserved for raw RTU-over-TCP framing. Configure PUSR USR-DR164 in Modbus TCP (MBAP) mode on port 502.",
                preferredStyle: .alert
            )
            errAlert.addAction(UIAlertAction(title: "OK", style: .default))
            present(errAlert, animated: true)
            return
        }
        applyPusrGatewaySelection(host: host, port: port, topology: topology)
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
        if !bootDismissed {
            setBootProgressTarget(86, status: "Initializing 3D Digital Twin & live telemetry...")
            scheduleBootFailsafe(after: 4.0)
        }
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
            let reqId = body["request_id"] as? String
            let tId = body["turn_id"] as? String
            presentSignedPackageDocumentPicker(requestId: reqId, turnId: tId)

        case "presentPusrGatewayConfig":
            let reqId = body["request_id"] as? String
            let tId = body["turn_id"] as? String
            presentPusrGatewaySelector(requestId: reqId, turnId: tId)

        case "presentOperatorControlSheet":
            let reqId = body["request_id"] as? String
            let tId = body["turn_id"] as? String
            presentOperatorControlSheetWithAck(requestId: reqId, turnId: tId)

        case "openAppSettings":
            let reqId = body["request_id"] as? String
            let tId = body["turn_id"] as? String
            if let settingsURL = URL(string: UIApplication.openSettingsURLString),
               UIApplication.shared.canOpenURL(settingsURL) {
                UIApplication.shared.open(settingsURL, options: [:]) { [weak self] opened in
                    self?.emitNativePanelAck(
                        requestId: reqId,
                        turnId: tId,
                        target: "ipados_app_settings",
                        status: opened ? "opened" : "unavailable"
                    )
                }
            } else {
                emitNativePanelAck(requestId: reqId, turnId: tId, target: "ipados_app_settings", status: "unavailable")
            }

        case "notifyBootProgress":
            let pct = (body["percent"] as? Int) ?? (body["percent"] as? NSNumber)?.intValue ?? 100
            let status = (body["status"] as? String) ?? (pct >= 100 ? "System ready" : "Loading FieldScan...")
            setBootProgressTarget(pct, status: status)

        default:
            break
        }
    }

    private func presentSignedPackageDocumentPicker(requestId: String? = nil, turnId: String? = nil) {
        var types: [UTType] = [.zip, .folder]
        if let fspkg = UTType(filenameExtension: "fspkg") {
            types.append(fspkg)
        }
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
        picker.delegate = self
        picker.allowsMultipleSelection = false
        present(picker, animated: true) { [weak self] in
            self?.emitNativePanelAck(requestId: requestId, turnId: turnId, target: "native_package_importer", status: "visible")
        }
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
