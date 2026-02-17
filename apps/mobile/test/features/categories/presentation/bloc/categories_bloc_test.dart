import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/categories/domain/usecases/get_categories.dart';
import 'package:metzudat_halikud/features/categories/domain/usecases/get_category_articles.dart';
import 'package:metzudat_halikud/features/categories/presentation/bloc/categories_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetCategories extends Mock implements GetCategories {}

class MockGetCategoryArticles extends Mock implements GetCategoryArticles {}

void main() {
  late CategoriesBloc bloc;
  late MockGetCategories mockGetCategories;
  late MockGetCategoryArticles mockGetCategoryArticles;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tCategories = [
    Category(id: '1', name: 'פוליטיקה', slug: 'politics'),
    Category(id: '2', name: 'כלכלה', slug: 'economy'),
  ];

  const tArticles = [
    Article(id: '1', title: 'Article 1'),
    Article(id: '2', title: 'Article 2'),
  ];

  const tMoreArticles = [
    Article(id: '3', title: 'Article 3'),
    Article(id: '4', title: 'Article 4'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  const tSlug = 'politics';

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const NoParams());
    registerFallbackValue(const CategoryArticlesParams(slug: '', page: 1));
  });

  setUp(() {
    mockGetCategories = MockGetCategories();
    mockGetCategoryArticles = MockGetCategoryArticles();
    bloc = CategoriesBloc(mockGetCategories, mockGetCategoryArticles);
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('CategoriesBloc', () {
    test('initial state is CategoriesInitial', () {
      expect(bloc.state, const CategoriesInitial());
    });

    // -----------------------------------------------------------------------
    // LoadCategories
    // -----------------------------------------------------------------------

    group('LoadCategories', () {
      blocTest<CategoriesBloc, CategoriesState>(
        'emits [CategoriesLoading, CategoriesLoaded] on success',
        build: () {
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadCategories()),
        expect: () => [
          const CategoriesLoading(),
          const CategoriesLoaded(categories: tCategories),
        ],
        verify: (_) {
          verify(() => mockGetCategories(any())).called(1);
        },
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'emits [CategoriesLoading, CategoriesError] on failure',
        build: () {
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadCategories()),
        expect: () => [
          const CategoriesLoading(),
          const CategoriesError(message: 'Server error'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadCategoryArticles — page 1
    // -----------------------------------------------------------------------

    group('LoadCategoryArticles (page 1)', () {
      blocTest<CategoriesBloc, CategoriesState>(
        'emits [CategoriesLoading, CategoryArticlesLoaded] on success',
        build: () {
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 1)),
        expect: () => [
          const CategoriesLoading(),
          isA<CategoryArticlesLoaded>()
              .having((s) => s.category.slug, 'category.slug', tSlug)
              .having((s) => s.articles, 'articles', tArticles)
              .having((s) => s.currentPage, 'currentPage', 1)
              .having((s) => s.hasMore, 'hasMore', false),
        ],
        verify: (_) {
          verify(() => mockGetCategories(any())).called(1);
          verify(() => mockGetCategoryArticles(any())).called(1);
        },
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'emits [CategoriesLoading, CategoriesError] on failure',
        build: () {
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 1)),
        expect: () => [
          const CategoriesLoading(),
          const CategoriesError(message: 'Server error'),
        ],
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'creates placeholder category when slug not found in loaded categories',
        build: () {
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc
            .add(const LoadCategoryArticles(slug: 'unknown-slug', page: 1)),
        expect: () => [
          const CategoriesLoading(),
          isA<CategoryArticlesLoaded>()
              .having((s) => s.category.id, 'category.id', '0')
              .having((s) => s.category.slug, 'category.slug', 'unknown-slug')
              .having(
                  (s) => s.category.name, 'category.name', 'unknown-slug'),
        ],
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'sets hasMore true when exactly 20 articles returned',
        build: () {
          final fullPage = List.generate(
            20,
            (i) => Article(id: '${100 + i}', title: 'Article $i'),
          );
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => Right(fullPage));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 1)),
        expect: () => [
          const CategoriesLoading(),
          isA<CategoryArticlesLoaded>()
              .having((s) => s.hasMore, 'hasMore', true)
              .having((s) => s.articles.length, 'articles.length', 20),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadCategoryArticles — pagination (page > 1)
    // -----------------------------------------------------------------------

    group('LoadCategoryArticles (pagination)', () {
      blocTest<CategoriesBloc, CategoriesState>(
        'appends articles on page 2',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Right(tMoreArticles));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 2)),
        expect: () => [
          isA<CategoryArticlesLoaded>()
              .having((s) => s.articles.length, 'articles.length', 4)
              .having((s) => s.currentPage, 'currentPage', 2)
              .having((s) => s.hasMore, 'hasMore', false),
        ],
        verify: (_) {
          verify(
            () => mockGetCategoryArticles(
              const CategoryArticlesParams(slug: tSlug, page: 2),
            ),
          ).called(1);
        },
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'sets hasMore false when fewer than 20 results returned',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          const fewArticles = [
            Article(id: '10', title: 'Only One'),
          ];
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Right(fewArticles));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 2)),
        expect: () => [
          isA<CategoryArticlesLoaded>()
              .having((s) => s.hasMore, 'hasMore', false)
              .having((s) => s.articles.length, 'articles.length', 3),
        ],
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'sets hasMore true when exactly 20 results returned on pagination',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          final fullPage = List.generate(
            20,
            (i) => Article(id: '${200 + i}', title: 'Page2 Article $i'),
          );
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => Right(fullPage));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 2)),
        expect: () => [
          isA<CategoryArticlesLoaded>()
              .having((s) => s.hasMore, 'hasMore', true)
              .having((s) => s.articles.length, 'articles.length', 22),
        ],
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'does nothing on pagination when hasMore is false',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 1,
          hasMore: false,
        ),
        build: () => bloc,
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 2)),
        expect: () => <CategoriesState>[],
        verify: (_) {
          verifyNever(() => mockGetCategoryArticles(any()));
        },
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'sets hasMore false on pagination failure',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const LoadCategoryArticles(slug: tSlug, page: 2)),
        expect: () => [
          isA<CategoryArticlesLoaded>()
              .having((s) => s.hasMore, 'hasMore', false)
              .having((s) => s.articles, 'articles', tArticles),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // RefreshCategoryArticles
    // -----------------------------------------------------------------------

    group('RefreshCategoryArticles', () {
      blocTest<CategoriesBloc, CategoriesState>(
        'refreshes articles from page 1 when state is CategoryArticlesLoaded',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 3,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Right(tMoreArticles));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const RefreshCategoryArticles(slug: tSlug)),
        expect: () => [
          isA<CategoryArticlesLoaded>()
              .having((s) => s.articles, 'articles', tMoreArticles)
              .having((s) => s.currentPage, 'currentPage', 1),
        ],
        verify: (_) {
          verify(
            () => mockGetCategoryArticles(
              const CategoryArticlesParams(slug: tSlug, page: 1),
            ),
          ).called(1);
        },
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'keeps existing state when refresh fails and state is CategoryArticlesLoaded',
        seed: () => const CategoryArticlesLoaded(
          category: Category(id: '1', name: 'פוליטיקה', slug: tSlug),
          articles: tArticles,
          currentPage: 2,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const RefreshCategoryArticles(slug: tSlug)),
        expect: () => <CategoriesState>[],
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'emits CategoriesError when refresh fails and state is not CategoryArticlesLoaded',
        build: () {
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const RefreshCategoryArticles(slug: tSlug)),
        expect: () => [
          const CategoriesError(message: 'Server error'),
        ],
      );

      blocTest<CategoriesBloc, CategoriesState>(
        'creates placeholder category when refreshing from non-CategoryArticlesLoaded state',
        build: () {
          when(() => mockGetCategoryArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) =>
            bloc.add(const RefreshCategoryArticles(slug: tSlug)),
        expect: () => [
          isA<CategoryArticlesLoaded>()
              .having((s) => s.category.id, 'category.id', '0')
              .having((s) => s.category.slug, 'category.slug', tSlug)
              .having((s) => s.articles, 'articles', tArticles)
              .having((s) => s.currentPage, 'currentPage', 1),
        ],
      );
    });
  });
}
