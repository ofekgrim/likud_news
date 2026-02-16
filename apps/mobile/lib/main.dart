import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/app.dart';
import 'app/di.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Force portrait orientation
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize localization
  await EasyLocalization.ensureInitialized();

  // Initialize dependency injection
  configureDependencies();

  // TODO: Initialize Firebase when credentials are available
  // await Firebase.initializeApp();

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('he'), Locale('en')],
      path: 'assets/l10n',
      fallbackLocale: const Locale('he'),
      startLocale: const Locale('he'),
      child: const MetzudatApp(),
    ),
  );
}
