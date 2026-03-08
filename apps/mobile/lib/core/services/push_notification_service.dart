import 'dart:convert';
import 'dart:io' show Platform;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/api_constants.dart';
import '../network/api_client.dart';
import 'app_logger.dart';
import 'device_id_service.dart';
import 'notification_count_service.dart';

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
  final NotificationCountService _notificationCountService;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  GoRouter? _router;
  Map<String, dynamic>? _pendingNavigationData;

  static const _prefKeyToken = 'fcm_token';
  static const _prefKeyTokenTimestamp = 'fcm_token_last_registered';
  static const _tokenRefreshDays = 7;

  PushNotificationService(
    this._apiClient,
    this._deviceIdService,
    this._notificationCountService,
  );

  /// Sets the router for deep linking from notifications.
  /// If there is pending navigation data (from a notification tap that
  /// launched the app before the router was ready), process it now.
  void setRouter(GoRouter router) {
    AppLogger.info('[PUSH] setRouter called — router is now SET');
    AppLogger.info('[PUSH] pendingNavigationData: ${_pendingNavigationData != null ? "YES" : "NONE"}');
    _router = router;
    if (_pendingNavigationData != null) {
      AppLogger.info('[PUSH] Processing pending navigation: $_pendingNavigationData');
      final data = _pendingNavigationData!;
      _pendingNavigationData = null;
      // Small delay to ensure the router's widget tree is fully mounted
      Future.delayed(const Duration(milliseconds: 300), () {
        _navigateFromData(data);
      });
    }
  }

  /// Initializes push notifications. Call after Firebase.initializeApp().
  Future<void> init() async {
    // 1. Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    AppLogger.info('Push permission status: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      AppLogger.warning('Push notifications denied by user');
      return;
    }

    // 2. Configure iOS foreground notification presentation (native).
    // On iOS we MUST use native presentation — initializing flutter_local_notifications
    // on iOS steals the UNUserNotificationCenter delegate from Firebase, which breaks
    // onMessageOpenedApp entirely (no tap callbacks fire at all).
    if (Platform.isIOS) {
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
      AppLogger.info('[PUSH] iOS native foreground presentation enabled');
    }

    // 3. Get FCM token and register with backend
    try {
      if (Platform.isIOS) {
        // Wait for APNS token — required before FCM token on iOS.
        // Retry up to 5 times with increasing delays.
        String? apnsToken;
        for (int i = 1; i <= 5; i++) {
          apnsToken = await _messaging.getAPNSToken();
          AppLogger.info(
              'APNS token (attempt $i): ${apnsToken != null ? "received" : "null"}');
          if (apnsToken != null) break;
          await Future.delayed(Duration(seconds: i * 2));
        }
        if (apnsToken == null) {
          AppLogger.warning('No APNS token after 5 attempts — skipping FCM registration');
          return;
        }
      }
      final token = await _messaging.getToken();
      AppLogger.info(
          'FCM token: ${token != null ? "${token.substring(0, 20)}..." : "null"}');
      if (token != null) {
        await _registerTokenIfNeeded(token);
      }
    } catch (e) {
      // Gracefully handle — push won't work on simulator but app continues
      AppLogger.error('Push init error: $e');
    }

    // 4. Listen for token refresh — always register new tokens
    _messaging.onTokenRefresh.listen((token) async {
      // Token changed — force register regardless of cache
      await _registerToken(token);
    });
    AppLogger.info('Token refresh listener set up');

    // 5. Setup local notifications for foreground display (Android only).
    // Do NOT initialize flutter_local_notifications on iOS — it replaces
    // the UNUserNotificationCenter delegate, breaking Firebase's onMessageOpenedApp.
    if (Platform.isAndroid) {
      await _initLocalNotifications();
      AppLogger.info('[PUSH] Local notifications initialized (Android)');
    }

    // 6. Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    AppLogger.info('Foreground message listener set up');

    // 7. Handle notification tap via native iOS MethodChannel.
    // On iOS, FlutterImplicitEngineDelegate registers plugins on a different
    // registry, so onMessageOpenedApp never fires. We use a MethodChannel
    // from AppDelegate to receive tap data directly.
    if (Platform.isIOS) {
      const channel = MethodChannel('com.metzudat/notification_tap');
      channel.setMethodCallHandler((call) async {
        if (call.method == 'onNotificationTap') {
          final data = Map<String, dynamic>.from(call.arguments as Map);
          AppLogger.info('[PUSH] iOS MethodChannel tap received: $data');
          _trackNotificationOpen(data);
          _navigateFromData(data);
        }
      });
      AppLogger.info('[PUSH] iOS MethodChannel listener set up');
    }

    // 8. Handle notification tap via Firebase (works on Android)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      AppLogger.info('[PUSH] onMessageOpenedApp fired!');
      AppLogger.info('[PUSH] onMessageOpenedApp data: ${message.data}');
      _handleNotificationTap(message);
    });
    AppLogger.info('Background tap listener set up');

    // 9. Handle notification tap that launched the app (terminated — Android)
    if (Platform.isAndroid) {
      try {
        final initialMessage = await _messaging.getInitialMessage()
            .timeout(const Duration(seconds: 3));
        AppLogger.info('Initial message: ${initialMessage != null ? "found" : "none"}');
        if (initialMessage != null) {
          _handleNotificationTap(initialMessage);
        }
      } catch (e) {
        AppLogger.warning('getInitialMessage timed out: $e');
      }
    }

    // 9. Register background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    AppLogger.info('Push notification setup complete');
  }

  /// Register token only if it changed or last registration was >7 days ago.
  Future<void> _registerTokenIfNeeded(String token) async {
    final prefs = await SharedPreferences.getInstance();
    final cachedToken = prefs.getString(_prefKeyToken);
    final lastRegistered = prefs.getInt(_prefKeyTokenTimestamp) ?? 0;
    final daysSinceRegistration =
        DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(lastRegistered)).inDays;

    if (cachedToken == token && daysSinceRegistration < _tokenRefreshDays) {
      AppLogger.info('FCM token unchanged and fresh ($daysSinceRegistration days) — skipping registration');
      return;
    }

    await _registerToken(token);

    // Cache token and timestamp on success
    await prefs.setString(_prefKeyToken, token);
    await prefs.setInt(_prefKeyTokenTimestamp, DateTime.now().millisecondsSinceEpoch);
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
      AppLogger.info('FCM token registered with backend');
    } catch (e) {
      AppLogger.error('FCM token registration failed: $e');
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
        AppLogger.info('[PUSH] Local notification tapped! payload: ${response.payload}');
        if (response.payload != null) {
          try {
            final data =
                jsonDecode(response.payload!) as Map<String, dynamic>;
            AppLogger.info('[PUSH] Local notification data: $data');
            _trackNotificationOpen(data);
            _navigateFromData(data);
          } catch (e) {
            AppLogger.error('[PUSH] Failed to parse local notification payload: $e');
          }
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

    AppLogger.info('[PUSH] Foreground message received: ${notification.title}');
    AppLogger.info('[PUSH] Foreground data: ${message.data}');

    // On Android, show via flutter_local_notifications (system doesn't show foreground).
    // On iOS, the native presentation is handled by setForegroundNotificationPresentationOptions.
    if (Platform.isAndroid) {
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
        ),
        payload: jsonEncode(message.data),
      );
    }

    // Update badge count immediately
    _notificationCountService.increment();
  }

  void _handleNotificationTap(RemoteMessage message) {
    AppLogger.info('[PUSH] _handleNotificationTap called');
    AppLogger.info('[PUSH] message.data: ${message.data}');
    AppLogger.info('[PUSH] _router is ${_router != null ? "SET" : "NULL"}');
    _trackNotificationOpen(message.data);
    _navigateFromData(message.data);
  }

  /// Track that a user opened a notification (send logId to backend).
  Future<void> _trackNotificationOpen(Map<String, dynamic> data) async {
    try {
      final logId = data['notificationLogId'] as String?;
      if (logId == null) return;

      await _apiClient.post(
        ApiConstants.notificationTrackOpen,
        data: {
          'logId': logId,
          'deviceId': _deviceIdService.deviceId,
        },
      );
      AppLogger.info('Notification open tracked: $logId');
    } catch (e) {
      // Best-effort — don't block navigation
      AppLogger.warning('Failed to track notification open: $e');
    }
  }

  void _navigateFromData(Map<String, dynamic> data) {
    if (_router == null) {
      AppLogger.info('Router not ready — storing pending navigation');
      _pendingNavigationData = data;
      return;
    }

    final contentType = data['contentType'] as String?;
    final contentId = data['contentId'] as String?;
    final articleSlug = data['articleSlug'] as String?;
    AppLogger.info('Navigating from notification: contentType=$contentType, contentId=$contentId, articleSlug=$articleSlug');

    // Use go() instead of push() — GoRouter's refreshListenable (AuthBloc)
    // causes router rebuilds that drop imperatively pushed routes.
    // Declarative go() navigation survives refreshes.
    switch (contentType) {
      case 'article':
        final slug = articleSlug ?? contentId;
        if (slug != null) _router!.go('/article/$slug');
        break;
      case 'poll':
        _router!.go('/polls');
        break;
      case 'event':
        _router!.go('/events');
        break;
      case 'election':
        if (contentId != null) {
          _router!.go('/election-day/$contentId');
        }
        break;
      case 'quiz':
        _router!.go('/primaries/quiz');
        break;
      case 'inbox':
        _router!.go('/notifications');
        break;
      default:
        // Backward compatibility: if only articleSlug is present
        if (articleSlug != null) {
          _router!.go('/article/$articleSlug');
        }
        break;
    }
  }
}
