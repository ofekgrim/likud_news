import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/search/domain/entities/search_result.dart';
import 'package:metzudat_halikud/features/search/domain/usecases/search_articles.dart';
import 'package:metzudat_halikud/features/search/presentation/bloc/search_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockSearchArticles extends Mock implements SearchArticles {}

void main() {
  late SearchBloc bloc;
  late MockSearchArticles mockSearchArticles;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tQuery = 'ליכוד';

  const tArticles = [
    Article(id: '1', title: 'Article 1'),
    Article(id: '2', title: 'Article 2'),
  ];

  const tMoreArticles = [
    Article(id: '3', title: 'Article 3'),
    Article(id: '4', title: 'Article 4'),
  ];

  const tSearchResult = SearchResult(
    articles: tArticles,
    totalArticles: 2,
  );

  const tEmptySearchResult = SearchResult(
    articles: [],
    totalArticles: 0,
  );

  const tSearchResultMore = SearchResult(
    articles: tMoreArticles,
    totalArticles: 4,
  );

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const SearchParams(query: ''));
  });

  setUp(() {
    mockSearchArticles = MockSearchArticles();
    bloc = SearchBloc(mockSearchArticles);
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('SearchBloc', () {
    test('initial state is SearchInitial with empty recentSearches', () {
      expect(bloc.state, const SearchInitial());
      expect(
        (bloc.state as SearchInitial).recentSearches,
        isEmpty,
      );
    });

    // -----------------------------------------------------------------------
    // SearchQueryChanged
    // -----------------------------------------------------------------------

    group('SearchQueryChanged', () {
      blocTest<SearchBloc, SearchState>(
        'emits [SearchLoading, SearchLoaded] on success with non-empty query',
        build: () {
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => const Right(tSearchResult));
          return bloc;
        },
        act: (bloc) => bloc.add(const SearchQueryChanged(tQuery)),
        wait: const Duration(milliseconds: 400),
        expect: () => [
          const SearchLoading(),
          isA<SearchLoaded>()
              .having((s) => s.query, 'query', tQuery)
              .having((s) => s.articles, 'articles', tArticles)
              .having((s) => s.currentPage, 'currentPage', 1)
              .having((s) => s.hasMore, 'hasMore', false),
        ],
        verify: (_) {
          verify(() => mockSearchArticles(any())).called(1);
        },
      );

      blocTest<SearchBloc, SearchState>(
        'emits [SearchInitial] when query is empty',
        build: () => bloc,
        act: (bloc) => bloc.add(const SearchQueryChanged('')),
        wait: const Duration(milliseconds: 400),
        expect: () => [
          isA<SearchInitial>(),
        ],
      );

      blocTest<SearchBloc, SearchState>(
        'emits [SearchInitial] when query is only whitespace',
        build: () => bloc,
        act: (bloc) => bloc.add(const SearchQueryChanged('   ')),
        wait: const Duration(milliseconds: 400),
        expect: () => [
          isA<SearchInitial>(),
        ],
      );

      blocTest<SearchBloc, SearchState>(
        'emits [SearchLoading, SearchEmpty] when no results found',
        build: () {
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => const Right(tEmptySearchResult));
          return bloc;
        },
        act: (bloc) => bloc.add(const SearchQueryChanged(tQuery)),
        wait: const Duration(milliseconds: 400),
        expect: () => [
          const SearchLoading(),
          SearchEmpty(query: tQuery),
        ],
      );

      blocTest<SearchBloc, SearchState>(
        'emits [SearchLoading, SearchError] on failure',
        build: () {
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const SearchQueryChanged(tQuery)),
        wait: const Duration(milliseconds: 400),
        expect: () => [
          const SearchLoading(),
          const SearchError(message: 'Server error'),
        ],
      );

      blocTest<SearchBloc, SearchState>(
        'sets hasMore true when exactly 20 results returned',
        build: () {
          final fullPage = List.generate(
            20,
            (i) => Article(id: '${100 + i}', title: 'Article $i'),
          );
          final fullResult = SearchResult(
            articles: fullPage,
            totalArticles: 50,
          );
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => Right(fullResult));
          return bloc;
        },
        act: (bloc) => bloc.add(const SearchQueryChanged(tQuery)),
        wait: const Duration(milliseconds: 400),
        expect: () => [
          const SearchLoading(),
          isA<SearchLoaded>()
              .having((s) => s.hasMore, 'hasMore', true)
              .having((s) => s.articles.length, 'articles.length', 20),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreSearchResults
    // -----------------------------------------------------------------------

    group('LoadMoreSearchResults', () {
      blocTest<SearchBloc, SearchState>(
        'appends articles on next page',
        seed: () => const SearchLoaded(
          query: tQuery,
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => const Right(tSearchResultMore));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMoreSearchResults()),
        expect: () => [
          isA<SearchLoaded>()
              .having((s) => s.articles.length, 'articles.length', 4)
              .having((s) => s.currentPage, 'currentPage', 2)
              .having((s) => s.hasMore, 'hasMore', false),
        ],
        verify: (_) {
          verify(
            () => mockSearchArticles(
              const SearchParams(query: tQuery, page: 2),
            ),
          ).called(1);
        },
      );

      blocTest<SearchBloc, SearchState>(
        'does nothing when state is not SearchLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const LoadMoreSearchResults()),
        expect: () => <SearchState>[],
        verify: (_) {
          verifyNever(() => mockSearchArticles(any()));
        },
      );

      blocTest<SearchBloc, SearchState>(
        'does nothing when hasMore is false',
        seed: () => const SearchLoaded(
          query: tQuery,
          articles: tArticles,
          currentPage: 1,
          hasMore: false,
        ),
        build: () => bloc,
        act: (bloc) => bloc.add(const LoadMoreSearchResults()),
        expect: () => <SearchState>[],
        verify: (_) {
          verifyNever(() => mockSearchArticles(any()));
        },
      );

      blocTest<SearchBloc, SearchState>(
        'sets hasMore false on pagination failure',
        seed: () => const SearchLoaded(
          query: tQuery,
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMoreSearchResults()),
        expect: () => [
          isA<SearchLoaded>()
              .having((s) => s.hasMore, 'hasMore', false)
              .having((s) => s.articles, 'articles', tArticles),
        ],
      );

      blocTest<SearchBloc, SearchState>(
        'sets hasMore true when exactly 20 results on pagination',
        seed: () => const SearchLoaded(
          query: tQuery,
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          final fullPage = List.generate(
            20,
            (i) => Article(id: '${200 + i}', title: 'Page2 Article $i'),
          );
          final fullResult = SearchResult(
            articles: fullPage,
            totalArticles: 100,
          );
          when(() => mockSearchArticles(any()))
              .thenAnswer((_) async => Right(fullResult));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMoreSearchResults()),
        expect: () => [
          isA<SearchLoaded>()
              .having((s) => s.hasMore, 'hasMore', true)
              .having((s) => s.articles.length, 'articles.length', 22),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // ClearSearch
    // -----------------------------------------------------------------------

    group('ClearSearch', () {
      blocTest<SearchBloc, SearchState>(
        'emits SearchInitial when clearing from loaded state',
        seed: () => const SearchLoaded(
          query: tQuery,
          articles: tArticles,
          currentPage: 1,
          hasMore: true,
        ),
        build: () => bloc,
        act: (bloc) => bloc.add(const ClearSearch()),
        expect: () => [
          isA<SearchInitial>(),
        ],
      );

      blocTest<SearchBloc, SearchState>(
        'emits SearchInitial when clearing from error state',
        seed: () => const SearchError(message: 'Server error'),
        build: () => bloc,
        act: (bloc) => bloc.add(const ClearSearch()),
        expect: () => [
          isA<SearchInitial>(),
        ],
      );
    });
  });
}
