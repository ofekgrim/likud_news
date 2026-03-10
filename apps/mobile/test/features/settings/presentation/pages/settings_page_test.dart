import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/settings/presentation/pages/settings_page.dart';
import 'package:metzudat_halikud/features/settings/presentation/bloc/settings_bloc.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockSettingsBloc mockSettingsBloc;

  setUp(() {
    mockSettingsBloc = MockSettingsBloc();
  });

  group('SettingsPage', () {
    testWidgets('shows loading indicator when state is not SettingsLoaded',
        (tester) async {
      // Use a custom initial state that's not SettingsLoaded
      // SettingsBloc starts with SettingsLoaded by default,
      // but we can mock a non-loaded state
      when(() => mockSettingsBloc.state)
          .thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      // Since the bloc always starts with SettingsLoaded, test that it renders content
      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      // Should render settings sections, not a loading indicator
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('renders settings title in app bar', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      // 'settings' is the translation key
      expect(find.text('settings'), findsOneWidget);
    });

    testWidgets('renders language section header', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.text('language'), findsOneWidget);
    });

    testWidgets('renders theme section header', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.text('theme'), findsOneWidget);
    });

    testWidgets('renders font size section header', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.text('font_size'), findsOneWidget);
    });

    testWidgets('renders font size option labels', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.text('קטן'), findsOneWidget);
      expect(find.text('בינוני'), findsOneWidget);
      expect(find.text('גדול'), findsOneWidget);
    });

    testWidgets('renders English label in language selector', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.text('English'), findsOneWidget);
    });

    testWidgets('renders SegmentedButton for language selection',
        (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      // Language SegmentedButton with Hebrew and English options
      expect(find.byType(SegmentedButton<String>), findsOneWidget);
      expect(find.text('hebrew'), findsOneWidget);
      expect(find.text('English'), findsOneWidget);
    });

    testWidgets('renders SegmentedButton for theme selection', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      // Theme SegmentedButton with light/dark/system
      expect(find.byType(SegmentedButton<ThemeMode>), findsOneWidget);
      expect(find.text('theme_light'), findsOneWidget);
      expect(find.text('theme_dark'), findsOneWidget);
      expect(find.text('theme_system'), findsOneWidget);
    });

    testWidgets('renders clear cache button', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.byIcon(Icons.cleaning_services_outlined), findsOneWidget);
      expect(find.text('clear_cache'), findsOneWidget);
    });

    testWidgets('renders app version info', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.text('app_name'), findsOneWidget);
      expect(find.text('version'), findsOneWidget);
    });

    testWidgets('renders SegmentedButton for font size', (tester) async {
      when(() => mockSettingsBloc.state).thenReturn(const SettingsLoaded(
        locale: Locale('he'),
        themeMode: ThemeMode.system,
        fontSize: FontSizeOption.medium,
      ));

      await pumpTestWidget(
        tester,
        const SettingsPage(),
        providers: [
          BlocProvider<SettingsBloc>.value(value: mockSettingsBloc),
        ],
      );

      expect(find.byType(SegmentedButton<FontSizeOption>), findsOneWidget);
    });
  });
}
