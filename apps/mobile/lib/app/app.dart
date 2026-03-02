import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:talker_flutter/talker_flutter.dart';

import '../core/services/app_logger.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
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
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authBloc = getIt<AuthBloc>()..add(const CheckAuthStatus());
    _router = AppRouter.createRouter(_authBloc);
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: _authBloc,
      child: MaterialApp.router(
        title: 'app_name'.tr(),
        debugShowCheckedModeBanner: false,

        // Theme
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,

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
      ),
    );
  }
}
