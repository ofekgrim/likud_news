import Flutter
import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {

  /// MethodChannel to send notification tap data directly to Flutter.
  private var notificationChannel: FlutterMethodChannel?

  /// Stores tap data if the user tapped a notification before Flutter was ready.
  private var pendingNotificationData: [String: String]?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Initialize Firebase BEFORE Flutter engine starts
    FirebaseApp.configure()

    // Set notification delegate for foreground display + tap handling
    UNUserNotificationCenter.current().delegate = self

    // Register for remote notifications — required for APNS token
    application.registerForRemoteNotifications()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    // Set up MethodChannel via the plugin registry's registrar.
    // With FlutterImplicitEngineDelegate, rootViewController is NOT a FlutterViewController,
    // so we use the registrar's messenger instead.
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "NotificationTapPlugin") {
      notificationChannel = FlutterMethodChannel(
        name: "com.metzudat/notification_tap",
        binaryMessenger: registrar.messenger()
      )
      NSLog("[PUSH-iOS] MethodChannel created via plugin registrar")

      // If a notification was tapped before Flutter was ready, send it now
      if let pending = pendingNotificationData {
        NSLog("[PUSH-iOS] Sending pending notification data to Flutter: \(pending)")
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
          self?.notificationChannel?.invokeMethod("onNotificationTap", arguments: pending)
          self?.pendingNotificationData = nil
        }
      }
    } else {
      NSLog("[PUSH-iOS] ERROR: Could not get plugin registrar")
    }
  }

  // Forward APNS token to Firebase
  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  // MARK: - UNUserNotificationCenterDelegate

  // Called when notification is tapped (app in background or foreground)
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    NSLog("[PUSH-iOS] === NOTIFICATION TAP ===")
    NSLog("[PUSH-iOS] userInfo keys: \(userInfo.keys)")

    // Extract string values from userInfo for Flutter
    var data: [String: String] = [:]
    for (key, value) in userInfo {
      if let k = key as? String, let v = value as? String {
        data[k] = v
      }
    }

    NSLog("[PUSH-iOS] Extracted data: \(data)")
    NSLog("[PUSH-iOS] Channel ready: \(notificationChannel != nil)")

    if notificationChannel != nil {
      // Flutter is ready — send immediately
      NSLog("[PUSH-iOS] Invoking onNotificationTap on channel")
      notificationChannel?.invokeMethod("onNotificationTap", arguments: data)
    } else {
      // Flutter not ready yet (app launched from terminated state) — store for later
      NSLog("[PUSH-iOS] Channel NOT ready, storing pending data")
      pendingNotificationData = data
    }

    // Still call super for any other plugin handling
    super.userNotificationCenter(center, didReceive: response, withCompletionHandler: completionHandler)
  }

  // Called when notification arrives while app is in foreground
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    NSLog("[PUSH-iOS] willPresent notification")

    // Forward to FlutterAppDelegate (shows banner via setForegroundNotificationPresentationOptions)
    super.userNotificationCenter(center, willPresent: notification, withCompletionHandler: completionHandler)
  }
}
