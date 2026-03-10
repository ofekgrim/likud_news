import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/app/theme/app_colors_extension.dart';

/// Pumps a widget wrapped in MaterialApp with RTL directionality.
///
/// Optionally wraps with BlocProviders for widgets that depend on BLoCs.
/// Uses [tester.pump()] instead of [pumpAndSettle()] by default to avoid
/// infinite waits on animations (e.g. BreakingTicker scroll loop).
Future<void> pumpTestWidget(
  WidgetTester tester,
  Widget child, {
  List<BlocProvider> providers = const [],
}) async {
  Widget app = MaterialApp(
    theme: ThemeData(
      extensions: const [AppColorsExtension.light],
    ),
    home: Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(body: child),
    ),
  );

  if (providers.isNotEmpty) {
    app = MultiBlocProvider(
      providers: providers,
      child: app,
    );
  }

  await tester.pumpWidget(app);
}

/// Same as [pumpTestWidget] but calls [pumpAndSettle] after pumping.
///
/// Only use this for widgets without infinite animations.
Future<void> pumpAndSettleTestWidget(
  WidgetTester tester,
  Widget child, {
  List<BlocProvider> providers = const [],
}) async {
  await pumpTestWidget(tester, child, providers: providers);
  await tester.pumpAndSettle();
}
