import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:hive/hive.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:talker_bloc_logger/talker_bloc_logger.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'firebase_options.dart';
import 'app/app.dart';
import 'app/di.dart';
import 'core/remote_config/remote_config_service.dart';
import 'core/services/app_logger.dart';
import 'core/services/device_id_service.dart';
import 'core/services/notification_count_service.dart';
import 'core/services/push_notification_service.dart';

void main() async {
  // Wrap everything in SentryFlutter.init so Sentry captures startup errors too
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN', defaultValue: '');
      options.tracesSampleRate = kReleaseMode ? 0.2 : 0.0;
      options.environment = kReleaseMode ? 'production' : 'development';
      // Avoid logging personal data
      options.sendDefaultPii = false;
    },
    appRunner: () => runZonedGuarded(
      () async {
        WidgetsFlutterBinding.ensureInitialized();

        AppLogger.info('App starting...');

        // Initialize Firebase early (before Crashlytics usage)
        await Firebase.initializeApp(
            options: DefaultFirebaseOptions.currentPlatform);

        // Catch Flutter framework errors (rendering, layout, etc.)
        FlutterError.onError = (details) {
          AppLogger.error(
            'Flutter error: ${details.exceptionAsString()}',
            details.exception,
            details.stack,
          );
          FirebaseCrashlytics.instance.recordFlutterFatalError(details);
          Sentry.captureException(details.exception,
              stackTrace: details.stack);
        };

        // Initialize Remote Config (feature flags) — non-blocking
        await RemoteConfigService.instance.init();

        // Initialize Google Mobile Ads SDK
        await MobileAds.instance.initialize();

        // Force portrait orientation
        await SystemChrome.setPreferredOrientations([
          DeviceOrientation.portraitUp,
          DeviceOrientation.portraitDown,
        ]);

        // Initialize localization
        await EasyLocalization.ensureInitialized();

        // Initialize device ID (Hive + persistent UUID)
        final deviceIdService = DeviceIdService();
        await deviceIdService.init();
        getIt.registerSingleton<DeviceIdService>(deviceIdService);

        // Open Hive boxes
        await Hive.openBox('tutorial_box');
        await Hive.openBox('settings');
        final feedCacheBox = await Hive.openBox('feed_cache');

        // Register Hive boxes for DI before configureDependencies()
        getIt.registerSingleton<Box>(feedCacheBox, instanceName: 'feed_cache');

        // Register SharedPreferences for sync access in router redirect
        final prefs = await SharedPreferences.getInstance();
        getIt.registerSingleton<SharedPreferences>(prefs);

        // Initialize dependency injection
        configureDependencies();

        // Set up BLoC observer for logging state transitions
        Bloc.observer = TalkerBlocObserver(
          talker: AppLogger.instance,
          settings: const TalkerBlocLoggerSettings(
            printEvents: true,
            printTransitions: true,
            printChanges: false,
          ),
        );

        // Initialize push notifications (router set later in app.dart)
        final pushService = getIt<PushNotificationService>();
        await pushService.init();

        // Fetch initial unread notification count for bell badge
        getIt<NotificationCountService>().refresh();

        AppLogger.info('App initialized successfully');

        runApp(
          EasyLocalization(
            supportedLocales: const [Locale('he'), Locale('en'), Locale('ar')],
            path: 'assets/l10n',
            fallbackLocale: const Locale('he'),
            startLocale: const Locale('he'),
            child: const MetzudatApp(),
          ),
        );
      },
      (error, stack) {
        // Catch async errors that aren't handled anywhere else
        AppLogger.critical('Uncaught async error', error, stack);
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        Sentry.captureException(error, stackTrace: stack);
      },
    ),
  );
}
