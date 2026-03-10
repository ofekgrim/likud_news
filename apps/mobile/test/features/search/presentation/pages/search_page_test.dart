import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/search/presentation/pages/search_page.dart';
import 'package:metzudat_halikud/features/search/presentation/bloc/search_bloc.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockSearchBloc mockSearchBloc;

  setUp(() {
    mockSearchBloc = MockSearchBloc();
  });

  group('SearchPage', () {
    testWidgets('renders search text field', (tester) async {
      when(() => mockSearchBloc.state)
          .thenReturn(const SearchInitial());

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('renders search icon in field', (tester) async {
      when(() => mockSearchBloc.state)
          .thenReturn(const SearchInitial());

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.byIcon(Icons.search), findsOneWidget);
    });

    testWidgets('shows popular topics label in initial state', (tester) async {
      when(() => mockSearchBloc.state)
          .thenReturn(const SearchInitial());

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      // 'popular_topics' is the translation key
      expect(find.text('popular_topics'), findsOneWidget);
    });

    testWidgets('shows recent searches when available', (tester) async {
      when(() => mockSearchBloc.state).thenReturn(
        const SearchInitial(recentSearches: ['ביבי', 'בחירות']),
      );

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.text('recent_searches'), findsOneWidget);
      expect(find.text('ביבי'), findsOneWidget);
      expect(find.text('בחירות'), findsOneWidget);
    });

    testWidgets('shows history icons for recent searches', (tester) async {
      when(() => mockSearchBloc.state).thenReturn(
        const SearchInitial(recentSearches: ['test']),
      );

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.byIcon(Icons.history), findsOneWidget);
    });

    testWidgets('shows shimmer loading for loading state', (tester) async {
      when(() => mockSearchBloc.state)
          .thenReturn(const SearchLoading());

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      // Should show a ListView with shimmer items
      expect(find.byType(ListView), findsWidgets);
    });

    testWidgets('shows no results for empty state', (tester) async {
      when(() => mockSearchBloc.state).thenReturn(
        const SearchEmpty(query: 'nonexistent'),
      );

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.byIcon(Icons.search_off), findsOneWidget);
      expect(find.text('no_results'), findsOneWidget);
    });

    testWidgets('shows error message for error state', (tester) async {
      when(() => mockSearchBloc.state).thenReturn(
        const SearchError(message: 'Search failed'),
      );

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.text('Search failed'), findsOneWidget);
    });

    testWidgets('shows retry button for error state', (tester) async {
      when(() => mockSearchBloc.state).thenReturn(
        const SearchError(message: 'Error'),
      );

      await pumpTestWidget(
        tester,
        const SearchPage(),
        providers: [
          BlocProvider<SearchBloc>.value(value: mockSearchBloc),
        ],
      );

      expect(find.text('try_again'), findsOneWidget);
    });
  });
}
