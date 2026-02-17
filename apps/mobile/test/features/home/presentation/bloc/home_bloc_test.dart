import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';
import 'package:metzudat_halikud/features/home/domain/usecases/get_categories.dart';
import 'package:metzudat_halikud/features/home/domain/usecases/get_feed_articles.dart';
import 'package:metzudat_halikud/features/home/domain/usecases/get_hero_article.dart';
import 'package:metzudat_halikud/features/home/domain/usecases/get_ticker_items.dart';
import 'package:metzudat_halikud/features/home/presentation/bloc/home_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetHeroArticle extends Mock implements GetHeroArticle {}

class MockGetFeedArticles extends Mock implements GetFeedArticles {}

class MockGetTickerItems extends Mock implements GetTickerItems {}

class MockGetCategories extends Mock implements GetCategories {}

void main() {
  late HomeBloc homeBloc;
  late MockGetHeroArticle mockGetHeroArticle;
  late MockGetFeedArticles mockGetFeedArticles;
  late MockGetTickerItems mockGetTickerItems;
  late MockGetCategories mockGetCategories;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tHeroArticle = Article(
    id: '1',
    title: 'Hero Article',
    isHero: true,
  );

  const tArticles = [
    Article(id: '2', title: 'Feed Article 1'),
    Article(id: '3', title: 'Feed Article 2'),
  ];

  const tTickerItems = [
    TickerItem(id: '1', text: 'Breaking news'),
    TickerItem(id: '2', text: 'Ticker item 2'),
  ];

  const tCategories = [
    Category(id: '1', name: 'Politics'),
    Category(id: '2', name: 'Economy'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const NoParams());
    registerFallbackValue(const FeedParams(page: 1));
  });

  setUp(() {
    mockGetHeroArticle = MockGetHeroArticle();
    mockGetFeedArticles = MockGetFeedArticles();
    mockGetTickerItems = MockGetTickerItems();
    mockGetCategories = MockGetCategories();

    homeBloc = HomeBloc(
      mockGetHeroArticle,
      mockGetFeedArticles,
      mockGetTickerItems,
      mockGetCategories,
    );
  });

  tearDown(() {
    homeBloc.close();
  });

  // -------------------------------------------------------------------------
  // Helper: stub all 4 use cases to return success
  // -------------------------------------------------------------------------

  void arrangeAllUseCasesSuccess({
    Article heroArticle = tHeroArticle,
    List<Article> articles = tArticles,
    List<TickerItem> tickerItems = tTickerItems,
    List<Category> categories = tCategories,
  }) {
    when(() => mockGetHeroArticle(any()))
        .thenAnswer((_) async => Right(heroArticle));
    when(() => mockGetFeedArticles(any()))
        .thenAnswer((_) async => Right(articles));
    when(() => mockGetTickerItems(any()))
        .thenAnswer((_) async => Right(tickerItems));
    when(() => mockGetCategories(any()))
        .thenAnswer((_) async => Right(categories));
  }

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('HomeBloc', () {
    test('initial state is HomeInitial', () {
      expect(homeBloc.state, const HomeInitial());
    });

    // -----------------------------------------------------------------------
    // LoadHome
    // -----------------------------------------------------------------------

    group('LoadHome', () {
      blocTest<HomeBloc, HomeState>(
        'emits [HomeLoading, HomeLoaded] on success',
        build: () {
          arrangeAllUseCasesSuccess();
          return homeBloc;
        },
        act: (bloc) => bloc.add(const LoadHome()),
        expect: () => [
          const HomeLoading(),
          const HomeLoaded(
            heroArticle: tHeroArticle,
            articles: tArticles,
            tickerItems: tTickerItems,
            categories: tCategories,
            hasMore: false,
            currentPage: 1,
          ),
        ],
        verify: (_) {
          verify(() => mockGetHeroArticle(any())).called(1);
          verify(() => mockGetFeedArticles(any())).called(1);
          verify(() => mockGetTickerItems(any())).called(1);
          verify(() => mockGetCategories(any())).called(1);
        },
      );

      blocTest<HomeBloc, HomeState>(
        'emits [HomeLoading, HomeError] when feed fails',
        build: () {
          when(() => mockGetHeroArticle(any()))
              .thenAnswer((_) async => const Right(tHeroArticle));
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          when(() => mockGetTickerItems(any()))
              .thenAnswer((_) async => const Right(tTickerItems));
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          return homeBloc;
        },
        act: (bloc) => bloc.add(const LoadHome()),
        expect: () => [
          const HomeLoading(),
          const HomeError(message: 'Server error'),
        ],
      );

      blocTest<HomeBloc, HomeState>(
        'emits [HomeLoading, HomeLoaded] with null hero when hero fails',
        build: () {
          when(() => mockGetHeroArticle(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          when(() => mockGetTickerItems(any()))
              .thenAnswer((_) async => const Right(tTickerItems));
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          return homeBloc;
        },
        act: (bloc) => bloc.add(const LoadHome()),
        expect: () => [
          const HomeLoading(),
          const HomeLoaded(
            heroArticle: null,
            articles: tArticles,
            tickerItems: tTickerItems,
            categories: tCategories,
            hasMore: false,
            currentPage: 1,
          ),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreArticles
    // -----------------------------------------------------------------------

    group('LoadMoreArticles', () {
      const tNewArticles = [
        Article(id: '4', title: 'New Article 1'),
        Article(id: '5', title: 'New Article 2'),
      ];

      blocTest<HomeBloc, HomeState>(
        'appends articles to existing list',
        build: () {
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => const Right(tNewArticles));
          return homeBloc;
        },
        seed: () => const HomeLoaded(
          heroArticle: tHeroArticle,
          articles: tArticles,
          tickerItems: tTickerItems,
          categories: tCategories,
          hasMore: true,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreArticles()),
        expect: () => [
          const HomeLoaded(
            heroArticle: tHeroArticle,
            articles: [...tArticles, ...tNewArticles],
            tickerItems: tTickerItems,
            categories: tCategories,
            hasMore: false,
            currentPage: 2,
          ),
        ],
        verify: (_) {
          verify(
            () => mockGetFeedArticles(const FeedParams(page: 2)),
          ).called(1);
        },
      );

      blocTest<HomeBloc, HomeState>(
        'sets hasMore false when less than page size returned',
        build: () {
          // Return fewer than _pageSize (20) articles
          const fewArticles = [
            Article(id: '10', title: 'Only One'),
          ];
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => const Right(fewArticles));
          return homeBloc;
        },
        seed: () => const HomeLoaded(
          heroArticle: tHeroArticle,
          articles: tArticles,
          tickerItems: tTickerItems,
          categories: tCategories,
          hasMore: true,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreArticles()),
        expect: () => [
          isA<HomeLoaded>().having((s) => s.hasMore, 'hasMore', false),
        ],
      );

      blocTest<HomeBloc, HomeState>(
        'sets hasMore true when exactly page size returned',
        build: () {
          // Return exactly 20 articles
          final fullPage = List.generate(
            20,
            (i) => Article(id: '${100 + i}', title: 'Article $i'),
          );
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => Right(fullPage));
          return homeBloc;
        },
        seed: () => const HomeLoaded(
          heroArticle: tHeroArticle,
          articles: tArticles,
          tickerItems: tTickerItems,
          categories: tCategories,
          hasMore: true,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreArticles()),
        expect: () => [
          isA<HomeLoaded>().having((s) => s.hasMore, 'hasMore', true),
        ],
      );

      blocTest<HomeBloc, HomeState>(
        'does nothing when hasMore is false',
        build: () => homeBloc,
        seed: () => const HomeLoaded(
          heroArticle: tHeroArticle,
          articles: tArticles,
          tickerItems: tTickerItems,
          categories: tCategories,
          hasMore: false,
          currentPage: 1,
        ),
        act: (bloc) => bloc.add(const LoadMoreArticles()),
        expect: () => <HomeState>[],
        verify: (_) {
          verifyNever(() => mockGetFeedArticles(any()));
        },
      );

      blocTest<HomeBloc, HomeState>(
        'does nothing when state is not HomeLoaded',
        build: () => homeBloc,
        act: (bloc) => bloc.add(const LoadMoreArticles()),
        expect: () => <HomeState>[],
        verify: (_) {
          verifyNever(() => mockGetFeedArticles(any()));
        },
      );
    });

    // -----------------------------------------------------------------------
    // RefreshFeed
    // -----------------------------------------------------------------------

    group('RefreshFeed', () {
      const tRefreshedHero = Article(
        id: '99',
        title: 'Refreshed Hero',
        isHero: true,
      );

      const tRefreshedArticles = [
        Article(id: '100', title: 'Refreshed Article 1'),
        Article(id: '101', title: 'Refreshed Article 2'),
      ];

      const tRefreshedTicker = [
        TickerItem(id: '10', text: 'New ticker'),
      ];

      const tRefreshedCategories = [
        Category(id: '10', name: 'New Category'),
      ];

      blocTest<HomeBloc, HomeState>(
        'reloads all data and replaces old state',
        build: () {
          arrangeAllUseCasesSuccess(
            heroArticle: tRefreshedHero,
            articles: tRefreshedArticles,
            tickerItems: tRefreshedTicker,
            categories: tRefreshedCategories,
          );
          return homeBloc;
        },
        seed: () => const HomeLoaded(
          heroArticle: tHeroArticle,
          articles: tArticles,
          tickerItems: tTickerItems,
          categories: tCategories,
          hasMore: false,
          currentPage: 3,
        ),
        act: (bloc) => bloc.add(const RefreshFeed()),
        expect: () => [
          const HomeLoaded(
            heroArticle: tRefreshedHero,
            articles: tRefreshedArticles,
            tickerItems: tRefreshedTicker,
            categories: tRefreshedCategories,
            hasMore: false,
            currentPage: 1,
          ),
        ],
        verify: (_) {
          verify(() => mockGetHeroArticle(any())).called(1);
          verify(() => mockGetFeedArticles(any())).called(1);
          verify(() => mockGetTickerItems(any())).called(1);
          verify(() => mockGetCategories(any())).called(1);
        },
      );

      blocTest<HomeBloc, HomeState>(
        'keeps existing state when refresh feed fails and state is HomeLoaded',
        build: () {
          when(() => mockGetHeroArticle(any()))
              .thenAnswer((_) async => const Right(tHeroArticle));
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          when(() => mockGetTickerItems(any()))
              .thenAnswer((_) async => const Right(tTickerItems));
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          return homeBloc;
        },
        seed: () => const HomeLoaded(
          heroArticle: tHeroArticle,
          articles: tArticles,
          tickerItems: tTickerItems,
          categories: tCategories,
          hasMore: true,
          currentPage: 2,
        ),
        act: (bloc) => bloc.add(const RefreshFeed()),
        expect: () => <HomeState>[],
      );

      blocTest<HomeBloc, HomeState>(
        'emits HomeError when refresh fails and state is not HomeLoaded',
        build: () {
          when(() => mockGetHeroArticle(any()))
              .thenAnswer((_) async => const Right(tHeroArticle));
          when(() => mockGetFeedArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          when(() => mockGetTickerItems(any()))
              .thenAnswer((_) async => const Right(tTickerItems));
          when(() => mockGetCategories(any()))
              .thenAnswer((_) async => const Right(tCategories));
          return homeBloc;
        },
        act: (bloc) => bloc.add(const RefreshFeed()),
        expect: () => [
          const HomeError(message: 'Server error'),
        ],
      );
    });
  });
}
