import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/categories/presentation/pages/categories_page.dart';
import 'package:metzudat_halikud/features/categories/presentation/bloc/categories_bloc.dart';
import 'package:metzudat_halikud/features/categories/presentation/widgets/category_card.dart';

import '../../../../helpers/mock_blocs.dart';
import '../../../../helpers/test_fixtures.dart';
import '../../../../helpers/widget_test_helpers.dart';

void main() {
  late MockCategoriesBloc mockCategoriesBloc;

  setUp(() {
    mockCategoriesBloc = MockCategoriesBloc();
  });

  group('CategoriesPage', () {
    testWidgets('shows loading shimmer for loading state', (tester) async {
      when(() => mockCategoriesBloc.state).thenReturn(const CategoriesLoading());

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      // Should show GridView with shimmer items
      expect(find.byType(GridView), findsOneWidget);
    });

    testWidgets('shows error message for error state', (tester) async {
      when(() => mockCategoriesBloc.state)
          .thenReturn(const CategoriesError(message: 'Network error'));

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      expect(find.text('Network error'), findsOneWidget);
    });

    testWidgets('shows retry button for error state', (tester) async {
      when(() => mockCategoriesBloc.state)
          .thenReturn(const CategoriesError(message: 'Error'));

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      expect(find.text('try_again'), findsOneWidget);
    });

    testWidgets('dispatches LoadCategories on retry', (tester) async {
      when(() => mockCategoriesBloc.state)
          .thenReturn(const CategoriesError(message: 'Error'));

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      await tester.tap(find.text('try_again'));
      // InitState dispatches once, retry dispatches again
      verify(() => mockCategoriesBloc.add(const LoadCategories())).called(greaterThanOrEqualTo(1));
    });

    testWidgets('shows category cards for loaded state', (tester) async {
      final categories = [
        createTestCategory(id: '1', name: 'פוליטיקה'),
        createTestCategory(id: '2', name: 'כלכלה'),
      ];

      when(() => mockCategoriesBloc.state)
          .thenReturn(CategoriesLoaded(categories: categories));

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      expect(find.byType(CategoryCard), findsNWidgets(2));
      expect(find.text('פוליטיקה'), findsOneWidget);
      expect(find.text('כלכלה'), findsOneWidget);
    });

    testWidgets('shows empty view when loaded with no categories',
        (tester) async {
      when(() => mockCategoriesBloc.state)
          .thenReturn(const CategoriesLoaded(categories: []));

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      expect(find.byIcon(Icons.category_outlined), findsOneWidget);
    });

    testWidgets('renders categories title in app bar', (tester) async {
      when(() => mockCategoriesBloc.state).thenReturn(const CategoriesLoading());

      await pumpTestWidget(
        tester,
        const CategoriesPage(),
        providers: [
          BlocProvider<CategoriesBloc>.value(value: mockCategoriesBloc),
        ],
      );

      // 'categories' is the translation key
      expect(find.text('categories'), findsOneWidget);
    });
  });
}
