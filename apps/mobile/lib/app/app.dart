import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:talker_flutter/talker_flutter.dart';

import '../core/services/app_logger.dart';
import '../core/services/push_notification_service.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/settings/presentation/bloc/settings_bloc.dart';
import 'di.dart';
import 'router.dart';
import 'theme/app_theme.dart';

/// Root application widget.
class MetzudatApp extends StatefulWidget {
  const MetzudatApp({super.key});

  @override
  State<MetzudatApp> createState() => _MetzudatAppState();

  /// Opens the in-app log viewer (useful for QA and on-device debugging).
  /// Call via: `MetzudatApp.showLogViewer(context)`
  static void showLogViewer(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TalkerScreen(talker: AppLogger.instance),
      ),
    );
  }
}

class _MetzudatAppState extends State<MetzudatApp> {
  late final AuthBloc _authBloc;
  late final SettingsBloc _settingsBloc;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authBloc = getIt<AuthBloc>()..add(const CheckAuthStatus());
    _settingsBloc = getIt<SettingsBloc>()..add(const LoadSettings());
    _router = AppRouter.createRouter(_authBloc);
    getIt<PushNotificationService>().setRouter(_router);
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>.value(value: _authBloc),
        BlocProvider<SettingsBloc>.value(value: _settingsBloc),
      ],
      child: BlocBuilder<SettingsBloc, SettingsState>(
        builder: (context, settingsState) {
          var themeMode = settingsState is SettingsLoaded
              ? settingsState.themeMode
              : ThemeMode.system;

          // "System" = time-based: dark at night (19:00–06:00), light during day.
          if (themeMode == ThemeMode.system) {
            final hour = DateTime.now().hour;
            themeMode = (hour >= 19 || hour < 6)
                ? ThemeMode.dark
                : ThemeMode.light;
          }

          return MaterialApp.router(
            title: 'app_name'.tr(),
            debugShowCheckedModeBanner: false,

            // Theme — dynamically controlled by SettingsBloc
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeMode,

            // Localization
            locale: context.locale,
            supportedLocales: context.supportedLocales,
            localizationsDelegates: [
              ...context.localizationDelegates,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],

            // Router
            routerConfig: _router,

            // Navigation observer for logging route changes
            builder: (context, child) {
              return child ?? const SizedBox.shrink();
            },
          );
        },
      ),
    );
  }
}
