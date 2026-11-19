import Foundation
import Darwin
#if canImport(UIKit)
import UIKit

@main
public final class AppDelegate: UIResponder, UIApplicationDelegate {
    public var window: UIWindow?

    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Ignore SIGPIPE globally so closed local HTTP/MJPEG sockets never pause Xcode's debugger
        signal(SIGPIPE, SIG_IGN)

        // Keep iPad Air M4 screen awake during live optical inspection & Modbus-RTU recovery
        application.isIdleTimerDisabled = true

        // Start in-process native HTTP/1.1 listener on 127.0.0.1:8088 immediately (< 5 ms)
        StandaloneFieldScanServer.shared.start()

        // Start background embedded Metal VLM (`Qwen3-VL-4B` / `LFM3-VL-2B` on :8091) when local GGUF weights exist & RAM >= 3.2 GB
        LlamaServerBridge.shared.startEmbeddedServersIfAvailable(enableExperimentalInProcessLlama: true)

        return true
    }

    public func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
#endif
