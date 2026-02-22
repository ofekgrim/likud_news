import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/usecases/get_all_articles.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/usecases/get_breaking_articles.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/usecases/watch_breaking_news.dart';
import 'package:metzudat_halikud/features/breaking_news/presentation/bloc/breaking_news_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetBreakingArticles extends Mock implements GetBreakingArticles {}

class MockWatchBreakingNews extends Mock implements WatchBreakingNews {}

class MockGetAllArticles extends Mock implements GetAllArticles {}

void main() {
  late BreakingNewsBloc bloc;
  late MockGetBreakingArticles mockGetBreakingArticles;
  late MockWatchBreakingNews mockWatchBreakingNews;
  late MockGetAllArticles mockGetAllArticles;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tArticle1 = Article(
    id: 'breaking-1',
    title: 'Breaking: Major Announcement',
    isBreaking: true,
  );

  const tArticle2 = Article(
    id: 'breaking-2',
    title: 'Breaking: Another Event',
    isBreaking: true,
  );

  const tArticle3 = Article(
    id: 'breaking-3',
    title: 'Breaking: Third Story',
    isBreaking: true,
  );

  const tArticles = [tArticle1, tArticle2];

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const NoParams());
    registerFallbackValue(const AllArticlesParams());
  });

  setUp(() {
    mockGetBreakingArticles = MockGetBreakingArticles();
    mockWatchBreakingNews = MockWatchBreakingNews();
    mockGetAllArticles = MockGetAllArticles();

    // Default: SSE stream returns empty stream to prevent hanging tests
    when(() => mockWatchBreakingNews()).thenAnswer(
      (_) => const Stream<Article>.empty(),
    );

    bloc = BreakingNewsBloc(
      mockGetBreakingArticles,
      mockWatchBreakingNews,
      mockGetAllArticles,
    );
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('BreakingNewsBloc', () {
    test('initial state is BreakingNewsInitial', () {
      expect(bloc.state, const BreakingNewsInitial());
    });

    // -----------------------------------------------------------------------
    // LoadBreakingNews
    // -----------------------------------------------------------------------

    group('LoadBreakingNews', () {
      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'emits [Loading, Loaded] on success',
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadBreakingNews()),
        expect: () => [
          const BreakingNewsLoading(),
          const BreakingNewsLoaded(articles: tArticles, isLive: true),
        ],
        verify: (_) {
          verify(() => mockGetBreakingArticles(any())).called(1);
        },
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'emits [Loading, Error] on failure',
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadBreakingNews()),
        expect: () => [
          const BreakingNewsLoading(),
          const BreakingNewsError('Server error'),
        ],
        verify: (_) {
          verify(() => mockGetBreakingArticles(any())).called(1);
        },
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'subscribes to SSE stream after successful load',
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadBreakingNews()),
        expect: () => [
          const BreakingNewsLoading(),
          const BreakingNewsLoaded(articles: tArticles, isLive: true),
        ],
        verify: (_) {
          verify(() => mockWatchBreakingNews()).called(1);
        },
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'does not subscribe to SSE stream on failure',
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadBreakingNews()),
        expect: () => [
          const BreakingNewsLoading(),
          const BreakingNewsError('Server error'),
        ],
        verify: (_) {
          verifyNever(() => mockWatchBreakingNews());
        },
      );
    });

    // -----------------------------------------------------------------------
    // NewBreakingArticle
    // -----------------------------------------------------------------------

    group('NewBreakingArticle', () {
      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'prepends new article to existing list',
        seed: () => const BreakingNewsLoaded(
          articles: tArticles,
          isLive: true,
        ),
        build: () => bloc,
        act: (bloc) => bloc.add(const NewBreakingArticle(tArticle3)),
        expect: () => [
          const BreakingNewsLoaded(
            articles: [tArticle3, tArticle1, tArticle2],
            isLive: true,
          ),
        ],
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'deduplicates by article ID when prepending',
        seed: () => const BreakingNewsLoaded(
          articles: tArticles,
          isLive: true,
        ),
        build: () => bloc,
        act: (bloc) => bloc.add(NewBreakingArticle(
          tArticle1.id == 'breaking-1'
              ? const Article(
                  id: 'breaking-1',
                  title: 'Updated Breaking News',
                  isBreaking: true,
                )
              : tArticle1,
        )),
        expect: () => [
          const BreakingNewsLoaded(
            articles: [
              Article(
                id: 'breaking-1',
                title: 'Updated Breaking News',
                isBreaking: true,
              ),
              tArticle2,
            ],
            isLive: true,
          ),
        ],
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'does nothing when state is not BreakingNewsLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const NewBreakingArticle(tArticle3)),
        expect: () => <BreakingNewsState>[],
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'preserves isLive flag when adding new article',
        seed: () => const BreakingNewsLoaded(
          articles: tArticles,
          isLive: false,
        ),
        build: () => bloc,
        act: (bloc) => bloc.add(const NewBreakingArticle(tArticle3)),
        expect: () => [
          isA<BreakingNewsLoaded>()
              .having((s) => s.isLive, 'isLive', false)
              .having((s) => s.articles.length, 'articles.length', 3),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // RefreshBreaking
    // -----------------------------------------------------------------------

    group('RefreshBreaking', () {
      const tRefreshedArticles = [
        Article(id: 'breaking-10', title: 'Refreshed Article 1',
            isBreaking: true),
        Article(id: 'breaking-11', title: 'Refreshed Article 2',
            isBreaking: true),
      ];

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'emits Loaded with refreshed articles on success',
        seed: () => const BreakingNewsLoaded(
          articles: tArticles,
          isLive: true,
        ),
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Right(tRefreshedArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshBreaking()),
        expect: () => [
          const BreakingNewsLoaded(
            articles: tRefreshedArticles,
            isLive: true,
          ),
        ],
        verify: (_) {
          verify(() => mockGetBreakingArticles(any())).called(1);
        },
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'keeps current state when refresh fails and state is BreakingNewsLoaded',
        seed: () => const BreakingNewsLoaded(
          articles: tArticles,
          isLive: true,
        ),
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshBreaking()),
        expect: () => <BreakingNewsState>[],
      );

      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'emits Error when refresh fails and state is not BreakingNewsLoaded',
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshBreaking()),
        expect: () => [
          const BreakingNewsError('Server error'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // SSE stream integration
    // -----------------------------------------------------------------------

    group('SSE stream integration', () {
      blocTest<BreakingNewsBloc, BreakingNewsState>(
        'receives articles from SSE stream after LoadBreakingNews',
        build: () {
          when(() => mockGetBreakingArticles(any()))
              .thenAnswer((_) async => const Right(tArticles));
          when(() => mockWatchBreakingNews()).thenAnswer(
            (_) => Stream.fromIterable([tArticle3]),
          );
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadBreakingNews()),
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const BreakingNewsLoading(),
          const BreakingNewsLoaded(articles: tArticles, isLive: true),
          // tArticle3 arrives from SSE stream
          const BreakingNewsLoaded(
            articles: [tArticle3, tArticle1, tArticle2],
            isLive: true,
          ),
        ],
      );
    });
  });
}
