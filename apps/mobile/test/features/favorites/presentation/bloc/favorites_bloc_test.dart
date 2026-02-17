import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/services/device_id_service.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/favorites/domain/usecases/get_favorites.dart';
import 'package:metzudat_halikud/features/favorites/domain/usecases/get_reading_history.dart';
import 'package:metzudat_halikud/features/favorites/domain/usecases/remove_favorite.dart'
    as use_case;
import 'package:metzudat_halikud/features/favorites/presentation/bloc/favorites_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetFavorites extends Mock implements GetFavorites {}

class MockRemoveFavorite extends Mock implements use_case.RemoveFavorite {}

class MockGetReadingHistory extends Mock implements GetReadingHistory {}

class MockDeviceIdService extends Mock implements DeviceIdService {}

void main() {
  late FavoritesBloc bloc;
  late MockGetFavorites mockGetFavorites;
  late MockRemoveFavorite mockRemoveFavorite;
  late MockGetReadingHistory mockGetReadingHistory;
  late MockDeviceIdService mockDeviceIdService;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tArticles = [
    Article(id: '1', title: 'Fav 1'),
    Article(id: '2', title: 'Fav 2'),
    Article(id: '3', title: 'Fav 3'),
  ];

  const tHistoryArticles = [
    Article(id: '10', title: 'History 1'),
    Article(id: '11', title: 'History 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const FavoritesParams(deviceId: '', page: 1));
    registerFallbackValue(
        const use_case.RemoveFavoriteParams(deviceId: '', articleId: ''));
    registerFallbackValue(const HistoryParams(deviceId: '', page: 1));
  });

  setUp(() {
    mockGetFavorites = MockGetFavorites();
    mockRemoveFavorite = MockRemoveFavorite();
    mockGetReadingHistory = MockGetReadingHistory();
    mockDeviceIdService = MockDeviceIdService();

    when(() => mockDeviceIdService.deviceId).thenReturn('test-device-id');

    bloc = FavoritesBloc(
      mockGetFavorites,
      mockRemoveFavorite,
      mockGetReadingHistory,
      mockDeviceIdService,
    );
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('FavoritesBloc', () {
    test('initial state is FavoritesInitial', () {
      expect(bloc.state, const FavoritesInitial());
    });

    // -----------------------------------------------------------------------
    // LoadFavorites
    // -----------------------------------------------------------------------

    group('LoadFavorites', () {
      blocTest<FavoritesBloc, FavoritesState>(
        'emits [FavoritesLoading, FavoritesLoaded] with activeTab favorites on success',
        build: () {
          when(() => mockGetFavorites(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadFavorites()),
        expect: () => [
          const FavoritesLoading(),
          const FavoritesLoaded(
            articles: tArticles,
            hasMore: false,
            currentPage: 1,
            activeTab: FavoritesTab.favorites,
          ),
        ],
        verify: (_) {
          verify(() => mockGetFavorites(any())).called(1);
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'emits [FavoritesLoading, FavoritesError] on failure',
        build: () {
          when(() => mockGetFavorites(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadFavorites()),
        expect: () => [
          const FavoritesLoading(),
          const FavoritesError(message: 'Server error'),
        ],
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'passes correct deviceId to use case',
        build: () {
          when(() => mockGetFavorites(any()))
              .thenAnswer((_) async => const Right(tArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadFavorites()),
        verify: (_) {
          verify(() => mockGetFavorites(
                const FavoritesParams(deviceId: 'test-device-id', page: 1),
              )).called(1);
        },
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreFavorites
    // -----------------------------------------------------------------------

    group('LoadMoreFavorites', () {
      const tNewArticles = [
        Article(id: '20', title: 'New Fav 1'),
        Article(id: '21', title: 'New Fav 2'),
      ];

      blocTest<FavoritesBloc, FavoritesState>(
        'appends articles to existing list on success',
        build: () {
          when(() => mockGetFavorites(any()))
              .thenAnswer((_) async => const Right(tNewArticles));
          return bloc;
        },
        seed: () => const FavoritesLoaded(
          articles: tArticles,
          hasMore: true,
          currentPage: 1,
          activeTab: FavoritesTab.favorites,
        ),
        act: (bloc) => bloc.add(const LoadMoreFavorites()),
        expect: () => [
          const FavoritesLoaded(
            articles: [...tArticles, ...tNewArticles],
            hasMore: false,
            currentPage: 2,
            activeTab: FavoritesTab.favorites,
          ),
        ],
        verify: (_) {
          verify(() => mockGetFavorites(
                const FavoritesParams(deviceId: 'test-device-id', page: 2),
              )).called(1);
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'does nothing when hasMore is false',
        build: () => bloc,
        seed: () => const FavoritesLoaded(
          articles: tArticles,
          hasMore: false,
          currentPage: 1,
          activeTab: FavoritesTab.favorites,
        ),
        act: (bloc) => bloc.add(const LoadMoreFavorites()),
        expect: () => <FavoritesState>[],
        verify: (_) {
          verifyNever(() => mockGetFavorites(any()));
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'does nothing when activeTab is history',
        build: () => bloc,
        seed: () => const FavoritesLoaded(
          articles: tHistoryArticles,
          hasMore: true,
          currentPage: 1,
          activeTab: FavoritesTab.history,
        ),
        act: (bloc) => bloc.add(const LoadMoreFavorites()),
        expect: () => <FavoritesState>[],
        verify: (_) {
          verifyNever(() => mockGetFavorites(any()));
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'does nothing when state is not FavoritesLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const LoadMoreFavorites()),
        expect: () => <FavoritesState>[],
        verify: (_) {
          verifyNever(() => mockGetFavorites(any()));
        },
      );
    });

    // -----------------------------------------------------------------------
    // RemoveFavorite
    // -----------------------------------------------------------------------

    group('RemoveFavorite', () {
      blocTest<FavoritesBloc, FavoritesState>(
        'optimistically removes article from list on success',
        build: () {
          when(() => mockRemoveFavorite(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        seed: () => const FavoritesLoaded(
          articles: tArticles,
          hasMore: false,
          currentPage: 1,
          activeTab: FavoritesTab.favorites,
        ),
        act: (bloc) => bloc.add(const RemoveFavorite('2')),
        expect: () => [
          const FavoritesLoaded(
            articles: [
              Article(id: '1', title: 'Fav 1'),
              Article(id: '3', title: 'Fav 3'),
            ],
            hasMore: false,
            currentPage: 1,
            activeTab: FavoritesTab.favorites,
          ),
        ],
        verify: (_) {
          verify(() => mockRemoveFavorite(
                const use_case.RemoveFavoriteParams(
                  deviceId: 'test-device-id',
                  articleId: '2',
                ),
              )).called(1);
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'restores original list on failure',
        build: () {
          when(() => mockRemoveFavorite(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        seed: () => const FavoritesLoaded(
          articles: tArticles,
          hasMore: false,
          currentPage: 1,
          activeTab: FavoritesTab.favorites,
        ),
        act: (bloc) => bloc.add(const RemoveFavorite('2')),
        expect: () => [
          // First: optimistic removal
          const FavoritesLoaded(
            articles: [
              Article(id: '1', title: 'Fav 1'),
              Article(id: '3', title: 'Fav 3'),
            ],
            hasMore: false,
            currentPage: 1,
            activeTab: FavoritesTab.favorites,
          ),
          // Second: restoration on failure
          const FavoritesLoaded(
            articles: tArticles,
            hasMore: false,
            currentPage: 1,
            activeTab: FavoritesTab.favorites,
          ),
        ],
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'does nothing when state is not FavoritesLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const RemoveFavorite('1')),
        expect: () => <FavoritesState>[],
        verify: (_) {
          verifyNever(() => mockRemoveFavorite(any()));
        },
      );
    });

    // -----------------------------------------------------------------------
    // SwitchToHistory
    // -----------------------------------------------------------------------

    group('SwitchToHistory', () {
      blocTest<FavoritesBloc, FavoritesState>(
        'emits [FavoritesLoading, FavoritesLoaded(activeTab: history)] on success',
        build: () {
          when(() => mockGetReadingHistory(any()))
              .thenAnswer((_) async => const Right(tHistoryArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const SwitchToHistory()),
        expect: () => [
          const FavoritesLoading(),
          const FavoritesLoaded(
            articles: tHistoryArticles,
            hasMore: false,
            currentPage: 1,
            activeTab: FavoritesTab.history,
          ),
        ],
        verify: (_) {
          verify(() => mockGetReadingHistory(
                const HistoryParams(deviceId: 'test-device-id', page: 1),
              )).called(1);
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'emits [FavoritesLoading, FavoritesError] when history fails',
        build: () {
          when(() => mockGetReadingHistory(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const SwitchToHistory()),
        expect: () => [
          const FavoritesLoading(),
          const FavoritesError(message: 'Server error'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadHistory
    // -----------------------------------------------------------------------

    group('LoadHistory', () {
      blocTest<FavoritesBloc, FavoritesState>(
        'emits [FavoritesLoading, FavoritesLoaded(activeTab: history)] on success',
        build: () {
          when(() => mockGetReadingHistory(any()))
              .thenAnswer((_) async => const Right(tHistoryArticles));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadHistory()),
        expect: () => [
          const FavoritesLoading(),
          const FavoritesLoaded(
            articles: tHistoryArticles,
            hasMore: false,
            currentPage: 1,
            activeTab: FavoritesTab.history,
          ),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreHistory
    // -----------------------------------------------------------------------

    group('LoadMoreHistory', () {
      const tNewHistoryArticles = [
        Article(id: '30', title: 'New History 1'),
        Article(id: '31', title: 'New History 2'),
      ];

      blocTest<FavoritesBloc, FavoritesState>(
        'appends articles to existing history list on success',
        build: () {
          when(() => mockGetReadingHistory(any()))
              .thenAnswer((_) async => const Right(tNewHistoryArticles));
          return bloc;
        },
        seed: () => const FavoritesLoaded(
          articles: tHistoryArticles,
          hasMore: true,
          currentPage: 1,
          activeTab: FavoritesTab.history,
        ),
        act: (bloc) => bloc.add(const LoadMoreHistory()),
        expect: () => [
          const FavoritesLoaded(
            articles: [...tHistoryArticles, ...tNewHistoryArticles],
            hasMore: false,
            currentPage: 2,
            activeTab: FavoritesTab.history,
          ),
        ],
        verify: (_) {
          verify(() => mockGetReadingHistory(
                const HistoryParams(deviceId: 'test-device-id', page: 2),
              )).called(1);
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'does nothing when hasMore is false',
        build: () => bloc,
        seed: () => const FavoritesLoaded(
          articles: tHistoryArticles,
          hasMore: false,
          currentPage: 1,
          activeTab: FavoritesTab.history,
        ),
        act: (bloc) => bloc.add(const LoadMoreHistory()),
        expect: () => <FavoritesState>[],
        verify: (_) {
          verifyNever(() => mockGetReadingHistory(any()));
        },
      );

      blocTest<FavoritesBloc, FavoritesState>(
        'does nothing when activeTab is favorites',
        build: () => bloc,
        seed: () => const FavoritesLoaded(
          articles: tArticles,
          hasMore: true,
          currentPage: 1,
          activeTab: FavoritesTab.favorites,
        ),
        act: (bloc) => bloc.add(const LoadMoreHistory()),
        expect: () => <FavoritesState>[],
        verify: (_) {
          verifyNever(() => mockGetReadingHistory(any()));
        },
      );
    });
  });
}
