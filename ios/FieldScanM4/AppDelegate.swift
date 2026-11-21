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

        // Heavy startup (package store, local HTTP server, camera, embedded Metal AI) runs off the main thread
        // inside `FieldScanWebViewController`'s staged boot sequence so the native 0%->100% loading screen renders
        // on frame 1 (< 50 ms) with zero black screen.
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
