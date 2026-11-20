import Foundation
#if canImport(UIKit)
import UIKit

public final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    public var window: UIWindow?

    public func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        let mainWindow = UIWindow(windowScene: windowScene)
        mainWindow.rootViewController = FieldScanWebViewController()
        mainWindow.makeKeyAndVisible()
        self.window = mainWindow
    }

    public func sceneDidBecomeActive(_ scene: UIScene) {
        UIApplication.shared.isIdleTimerDisabled = true
        DispatchQueue.global(qos: .userInitiated).async {
            StandaloneFieldScanServer.shared.start()
        }
    }

    public func sceneWillResignActive(_ scene: UIScene) {
        // Phase 2.2.6 & FLU-06: Close active physical gateway socket and mark last sample historical on suspend
        StandaloneFieldScanServer.shared.handleAppSuspend()
    }
}
#endif
