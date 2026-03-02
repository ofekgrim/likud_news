import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:hive/hive.dart';
import 'package:talker_bloc_logger/talker_bloc_logger.dart';
// import 'package:firebase_core/firebase_core.dart';
// import 'firebase_options.dart';
import 'app/app.dart';
import 'app/di.dart';
// ignore: unused_import
import 'app/router.dart'; // Used when push notifications are enabled
import 'core/services/app_logger.dart';
import 'core/services/device_id_service.dart';
// import 'core/services/push_notification_service.dart';

void main() async {
  // Catch all uncaught async errors
  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      AppLogger.info('App starting...');

      // Catch Flutter framework errors (rendering, layout, etc.)
      FlutterError.onError = (details) {
        AppLogger.error(
          'Flutter error: ${details.exceptionAsString()}',
          details.exception,
          details.stack,
        );
      };

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

      // Open Hive box for tutorial overlay tracking
      await Hive.openBox('tutorial_box');

      // Initialize dependency injection
      configureDependencies();

      // Set up BLoC observer for logging state transitions
      Bloc.observer = TalkerBlocObserver(
        talker: AppLogger.instance,
        settings: const TalkerBlocLoggerSettings(
          printEvents: true,
          printTransitions: true,
          printChanges: false, // Transitions already cover this
        ),
      );

      // Firebase — uncomment after running: flutterfire configure
      // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

      // Push notifications — uncomment after Firebase is initialized
      // final pushService = getIt<PushNotificationService>();
      // await pushService.init();
      // pushService.setRouter(AppRouter.router);

      AppLogger.info('App initialized successfully');

      runApp(
        EasyLocalization(
          supportedLocales: const [Locale('he'), Locale('en')],
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
    },
  );
}
