import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/magazine/domain/usecases/get_featured_article.dart';
import 'package:metzudat_halikud/features/magazine/domain/usecases/get_magazine_articles.dart';
import 'package:metzudat_halikud/features/magazine/presentation/bloc/magazine_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetFeaturedArticle extends Mock implements GetFeaturedArticle {}

class MockGetMagazineArticles extends Mock implements GetMagazineArticles {}

void main() {
  late MagazineBloc bloc;
  late MockGetFeaturedArticle mockGetFeaturedArticle;
  late MockGetMagazineArticles mockGetMagazineArticles;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tFeatured = Article(id: '0', title: 'Featured', isHero: true);

  const tArticles = [
    Article(id: '1', title: 'Mag 1'),
    Article(id: '2', title: 'Mag 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const NoParams());
    registerFallbackValue(const MagazineParams(page: 1));
  });

  setUp(() {
    mockGetFeaturedArticle = MockGetFeaturedArticle();
    mockGetMagazineArticles = MockGetMagazineArticles();

    bloc = MagazineBloc(
      mockGetFeaturedArticle,
      mockGetMagazineArticles,
    );
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('MagazineBloc', () {
    test('initial state is MagazineInitial', () {
      expect(bloc.state, const MagazineInitial());
    });

    // -----------------------------------------------------------------------
    // LoadMagazine
    // -----------------------------------------------------------------------

    group('LoadMagazine', () {
      blocTest<MagazineBloc, MagazineState>(
        'emits [MagazineLoading, MagazineLoaded] on success with featured + articles',
        build: () {
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Right(tFeatured));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMagazine()),
        expect: () => [
          const MagazineLoading(),
          const MagazineLoaded(
            featuredArticle: tFeatured,
            articles: tArticles,
            hasMore: false,
            currentPage: 1,
          ),
        ],
        verify: (_) {
          verify(() => mockGetFeaturedArticle(any())).called(1);
          verify(() => mockGetMagazineArticles(any())).called(1);
        },
      );

      blocTest<MagazineBloc, MagazineState>(
        'emits [MagazineLoading, MagazineError] when articles fail',
        build: () {
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Right(tFeatured));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMagazine()),
        expect: () => [
          const MagazineLoading(),
          const MagazineError(message: 'Server error'),
        ],
      );

      blocTest<MagazineBloc, MagazineState>(
        'emits [MagazineLoading, MagazineLoaded] with null featured when featured fails but articles succeed',
        build: () {
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMagazine()),
        expect: () => [
          const MagazineLoading(),
          const MagazineLoaded(
            featuredArticle: null,
            articles: tArticles,
            hasMore: false,
            currentPage: 1,
          ),
        ],
      );

      blocTest<MagazineBloc, MagazineState>(
        'sets hasMore true when exactly page size (20) articles returned',
        build: () {
          final fullPage = List.generate(
            20,
            (i) => Article(id: '${100 + i}', title: 'Article $i'),
          );
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Right(tFeatured));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => Right(fullPage));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMagazine()),
        expect: () => [
          const MagazineLoading(),
          isA<MagazineLoaded>()
              .having((s) => s.hasMore, 'hasMore', true)
              .having((s) => s.articles.length, 'articles.length', 20),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreMagazine
    // -----------------------------------------------------------------------

    group('LoadMoreMagazine', () {
      const tNewArticles = [
        Article(id: '10', title: 'New Mag 1'),
        Article(id: '11', title: 'New Mag 2'),
      ];

      blocTest<MagazineBloc, MagazineState>(
        'appends articles to existing list on success',
        build: () {
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Right(tNewArticles));
          return bloc;
        },
        seed: () => const MagazineLoaded(
          featuredArticle: tFeatured,
          articles: tArticles,
          hasMore: true,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreMagazine()),
        expect: () => [
          const MagazineLoaded(
            featuredArticle: tFeatured,
            articles: [...tArticles, ...tNewArticles],
            hasMore: false,
            currentPage: 2,
          ),
        ],
        verify: (_) {
          verify(
            () => mockGetMagazineArticles(const MagazineParams(page: 2)),
          ).called(1);
        },
      );

      blocTest<MagazineBloc, MagazineState>(
        'does nothing when hasMore is false',
        build: () => bloc,
        seed: () => const MagazineLoaded(
          featuredArticle: tFeatured,
          articles: tArticles,
          hasMore: false,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreMagazine()),
        expect: () => <MagazineState>[],
        verify: (_) {
          verifyNever(() => mockGetMagazineArticles(any()));
        },
      );

      blocTest<MagazineBloc, MagazineState>(
        'does nothing when state is not MagazineLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const LoadMoreMagazine()),
        expect: () => <MagazineState>[],
        verify: (_) {
          verifyNever(() => mockGetMagazineArticles(any()));
        },
      );

      blocTest<MagazineBloc, MagazineState>(
        'sets hasMore false on pagination failure and keeps existing data',
        build: () {
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        seed: () => const MagazineLoaded(
          featuredArticle: tFeatured,
          articles: tArticles,
          hasMore: true,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreMagazine()),
        expect: () => [
          const MagazineLoaded(
            featuredArticle: tFeatured,
            articles: tArticles,
            hasMore: false,
            currentPage: 1,
          ),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // RefreshMagazine
    // -----------------------------------------------------------------------

    group('RefreshMagazine', () {
      const tRefreshedFeatured = Article(
        id: '99',
        title: 'Refreshed Featured',
        isHero: true,
      );

      const tRefreshedArticles = [
        Article(id: '100', title: 'Refreshed Mag 1'),
        Article(id: '101', title: 'Refreshed Mag 2'),
      ];

      blocTest<MagazineBloc, MagazineState>(
        'reloads all data and replaces old state',
        build: () {
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Right(tRefreshedFeatured));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Right(tRefreshedArticles));
          return bloc;
        },
        seed: () => const MagazineLoaded(
          featuredArticle: tFeatured,
          articles: tArticles,
          hasMore: false,
          currentPage: 3,
        ),
        act: (bloc) => bloc.add(const RefreshMagazine()),
        expect: () => [
          const MagazineLoaded(
            featuredArticle: tRefreshedFeatured,
            articles: tRefreshedArticles,
            hasMore: false,
            currentPage: 1,
          ),
        ],
        verify: (_) {
          verify(() => mockGetFeaturedArticle(any())).called(1);
          verify(() => mockGetMagazineArticles(any())).called(1);
        },
      );

      blocTest<MagazineBloc, MagazineState>(
        'keeps existing state when refresh fails and state is MagazineLoaded',
        build: () {
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Right(tFeatured));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        seed: () => const MagazineLoaded(
          featuredArticle: tFeatured,
          articles: tArticles,
          hasMore: true,
          currentPage: 2,
        ),
        act: (bloc) => bloc.add(const RefreshMagazine()),
        expect: () => <MagazineState>[],
      );

      blocTest<MagazineBloc, MagazineState>(
        'emits MagazineError when refresh fails and state is not MagazineLoaded',
        build: () {
          when(() => mockGetFeaturedArticle(any()))
              .thenAnswer((_) async => const Right(tFeatured));
          when(() => mockGetMagazineArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshMagazine()),
        expect: () => [
          const MagazineError(message: 'Server error'),
        ],
      );
    });
  });
}
