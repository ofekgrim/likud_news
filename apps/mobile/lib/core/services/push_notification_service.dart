import 'dart:convert';
import 'dart:io' show Platform;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';

import '../constants/api_constants.dart';
import '../network/api_client.dart';
import 'device_id_service.dart';

/// Top-level background message handler — required by Firebase Messaging.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No-op: notification is shown by the system.
  // Tap handling is done via onMessageOpenedApp.
}

/// Manages FCM token registration, foreground/background notification display,
/// and deep linking when notifications are tapped.
class PushNotificationService {
  final ApiClient _apiClient;
  final DeviceIdService _deviceIdService;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  GoRouter? _router;

  PushNotificationService(this._apiClient, this._deviceIdService);

  /// Sets the router for deep linking from notifications.
  void setRouter(GoRouter router) {
    _router = router;
  }

  /// Initializes push notifications. Call after Firebase.initializeApp().
  Future<void> init() async {
    // 1. Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      return;
    }

    // 2. Get FCM token and register with backend
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerToken(token);
    }

    // 3. Listen for token refresh
    _messaging.onTokenRefresh.listen(_registerToken);

    // 4. Setup local notifications for foreground display
    await _initLocalNotifications();

    // 5. Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 6. Handle notification tap (app was in background)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // 7. Handle notification tap that launched the app (terminated)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      Future.delayed(const Duration(milliseconds: 500), () {
        _handleNotificationTap(initialMessage);
      });
    }

    // 8. Register background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }

  Future<void> _registerToken(String token) async {
    try {
      await _apiClient.post(
        ApiConstants.pushRegister,
        data: {
          'deviceId': _deviceIdService.deviceId,
          'token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        },
      );
    } catch (_) {
      // Token registration is best-effort — don't crash the app
    }
  }

  Future<void> _initLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) {
        if (response.payload != null) {
          try {
            final data =
                jsonDecode(response.payload!) as Map<String, dynamic>;
            _navigateFromData(data);
          } catch (_) {}
        }
      },
    );

    // Create Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(
          const AndroidNotificationChannel(
            'breaking_news',
            'Breaking News',
            description: 'Push notifications for breaking news',
            importance: Importance.high,
          ),
        );
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'breaking_news',
          'Breaking News',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  void _handleNotificationTap(RemoteMessage message) {
    _navigateFromData(message.data);
  }

  void _navigateFromData(Map<String, dynamic> data) {
    if (_router == null) return;

    final articleSlug = data['articleSlug'] as String?;
    if (articleSlug != null && articleSlug.isNotEmpty) {
      _router!.push('/article/$articleSlug');
    }
  }
}
