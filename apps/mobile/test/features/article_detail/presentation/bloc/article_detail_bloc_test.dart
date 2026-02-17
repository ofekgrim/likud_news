import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/services/device_id_service.dart';
import 'package:metzudat_halikud/features/article_detail/domain/entities/article_detail.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/get_article_detail.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/record_read.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/toggle_favorite.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/article_detail_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetArticleDetail extends Mock implements GetArticleDetail {}

class MockRecordRead extends Mock implements RecordRead {}

class MockToggleFavorite extends Mock implements ToggleFavorite {}

class MockDeviceIdService extends Mock implements DeviceIdService {}

void main() {
  late ArticleDetailBloc bloc;
  late MockGetArticleDetail mockGetArticleDetail;
  late MockRecordRead mockRecordRead;
  late MockToggleFavorite mockToggleFavorite;
  late MockDeviceIdService mockDeviceIdService;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tSlug = 'test-article-slug';

  const tArticleDetail = ArticleDetail(
    id: 'article-1',
    title: 'Test Article Title',
    slug: tSlug,
    content: '<p>Test content</p>',
    author: 'Test Author',
    isFavorite: false,
  );

  const tArticleDetailFavorited = ArticleDetail(
    id: 'article-1',
    title: 'Test Article Title',
    slug: tSlug,
    content: '<p>Test content</p>',
    author: 'Test Author',
    isFavorite: true,
  );

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const GetArticleDetailParams(slug: ''));
    registerFallbackValue(const RecordReadParams(deviceId: '', articleId: ''));
    registerFallbackValue(
        const ToggleFavoriteParams(deviceId: '', articleId: ''));
  });

  setUp(() {
    mockGetArticleDetail = MockGetArticleDetail();
    mockRecordRead = MockRecordRead();
    mockToggleFavorite = MockToggleFavorite();
    mockDeviceIdService = MockDeviceIdService();

    when(() => mockDeviceIdService.deviceId).thenReturn('test-device-id');

    bloc = ArticleDetailBloc(
      mockGetArticleDetail,
      mockToggleFavorite,
      mockRecordRead,
      mockDeviceIdService,
    );
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('ArticleDetailBloc', () {
    test('initial state is ArticleDetailInitial', () {
      expect(bloc.state, const ArticleDetailInitial());
    });

    // -----------------------------------------------------------------------
    // LoadArticleDetail
    // -----------------------------------------------------------------------

    group('LoadArticleDetail', () {
      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'emits [Loading, Loaded] on success',
        build: () {
          when(() => mockGetArticleDetail(any()))
              .thenAnswer((_) async => const Right(tArticleDetail));
          when(() => mockRecordRead(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadArticleDetail(tSlug)),
        expect: () => [
          const ArticleDetailLoading(),
          const ArticleDetailLoaded(
            article: tArticleDetail,
            isFavorite: false,
          ),
        ],
        verify: (_) {
          verify(() => mockGetArticleDetail(any())).called(1);
        },
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'emits [Loading, Error] on failure',
        build: () {
          when(() => mockGetArticleDetail(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadArticleDetail(tSlug)),
        expect: () => [
          const ArticleDetailLoading(),
          const ArticleDetailError('Server error'),
        ],
        verify: (_) {
          verify(() => mockGetArticleDetail(any())).called(1);
          verifyNever(() => mockRecordRead(any()));
        },
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'emits [Loading, Error] with default message when failure has no message',
        build: () {
          when(() => mockGetArticleDetail(any()))
              .thenAnswer((_) async => const Left(ServerFailure()));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadArticleDetail(tSlug)),
        expect: () => [
          const ArticleDetailLoading(),
          const ArticleDetailError('Failed to load article'),
        ],
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'calls recordRead after successful load',
        build: () {
          when(() => mockGetArticleDetail(any()))
              .thenAnswer((_) async => const Right(tArticleDetail));
          when(() => mockRecordRead(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadArticleDetail(tSlug)),
        expect: () => [
          const ArticleDetailLoading(),
          const ArticleDetailLoaded(
            article: tArticleDetail,
            isFavorite: false,
          ),
        ],
        verify: (_) {
          verify(() => mockRecordRead(const RecordReadParams(
                deviceId: 'test-device-id',
                articleId: 'article-1',
              ))).called(1);
        },
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'preserves isFavorite from article detail response',
        build: () {
          when(() => mockGetArticleDetail(any()))
              .thenAnswer((_) async => const Right(tArticleDetailFavorited));
          when(() => mockRecordRead(any()))
              .thenAnswer((_) async => const Right(null));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadArticleDetail(tSlug)),
        expect: () => [
          const ArticleDetailLoading(),
          const ArticleDetailLoaded(
            article: tArticleDetailFavorited,
            isFavorite: true,
          ),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // ToggleFavoriteEvent
    // -----------------------------------------------------------------------

    group('ToggleFavoriteEvent', () {
      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'optimistically toggles isFavorite from false to true and confirms on success',
        seed: () => const ArticleDetailLoaded(
          article: tArticleDetail,
          isFavorite: false,
        ),
        build: () {
          when(() => mockToggleFavorite(any()))
              .thenAnswer((_) async => const Right(true));
          return bloc;
        },
        act: (bloc) => bloc.add(const ToggleFavoriteEvent()),
        expect: () => [
          // Optimistic update flips to true; server confirms true.
          // BLoC deduplicates equal states, so only one emission.
          isA<ArticleDetailLoaded>()
              .having((s) => s.isFavorite, 'isFavorite', true),
        ],
        verify: (_) {
          verify(() => mockToggleFavorite(const ToggleFavoriteParams(
                deviceId: 'test-device-id',
                articleId: 'article-1',
              ))).called(1);
        },
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'optimistically toggles isFavorite from true to false and confirms on success',
        seed: () => const ArticleDetailLoaded(
          article: tArticleDetail,
          isFavorite: true,
        ),
        build: () {
          when(() => mockToggleFavorite(any()))
              .thenAnswer((_) async => const Right(false));
          return bloc;
        },
        act: (bloc) => bloc.add(const ToggleFavoriteEvent()),
        expect: () => [
          // Optimistic update flips to false; server confirms false.
          // BLoC deduplicates equal states, so only one emission.
          isA<ArticleDetailLoaded>()
              .having((s) => s.isFavorite, 'isFavorite', false),
        ],
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'rolls back isFavorite on failure',
        seed: () => const ArticleDetailLoaded(
          article: tArticleDetail,
          isFavorite: false,
        ),
        build: () {
          when(() => mockToggleFavorite(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const ToggleFavoriteEvent()),
        expect: () => [
          // Optimistic update: isFavorite becomes true
          isA<ArticleDetailLoaded>()
              .having((s) => s.isFavorite, 'isFavorite', true),
          // Rollback on failure: isFavorite reverts to false
          isA<ArticleDetailLoaded>()
              .having((s) => s.isFavorite, 'isFavorite', false),
        ],
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'does nothing when state is not ArticleDetailLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const ToggleFavoriteEvent()),
        expect: () => <ArticleDetailState>[],
        verify: (_) {
          verifyNever(() => mockToggleFavorite(any()));
        },
      );

      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'does nothing when state is ArticleDetailLoading',
        seed: () => const ArticleDetailLoading(),
        build: () => bloc,
        act: (bloc) => bloc.add(const ToggleFavoriteEvent()),
        expect: () => <ArticleDetailState>[],
        verify: (_) {
          verifyNever(() => mockToggleFavorite(any()));
        },
      );
    });

    // -----------------------------------------------------------------------
    // ShareArticle
    // -----------------------------------------------------------------------

    group('ShareArticle', () {
      blocTest<ArticleDetailBloc, ArticleDetailState>(
        'does nothing when state is not ArticleDetailLoaded',
        build: () => bloc,
        act: (bloc) =>
            bloc.add(const ShareArticle(SharePlatform.system)),
        expect: () => <ArticleDetailState>[],
      );
    });
  });
}
