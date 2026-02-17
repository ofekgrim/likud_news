import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/video/domain/entities/video_article.dart';
import 'package:metzudat_halikud/features/video/domain/usecases/get_videos.dart';
import 'package:metzudat_halikud/features/video/presentation/bloc/video_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetVideos extends Mock implements GetVideos {}

void main() {
  late VideoBloc bloc;
  late MockGetVideos mockGetVideos;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tVideos = [
    VideoArticle(id: '1', title: 'Video 1'),
    VideoArticle(id: '2', title: 'Video 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const VideoParams(page: 1));
  });

  setUp(() {
    mockGetVideos = MockGetVideos();
    bloc = VideoBloc(mockGetVideos);
  });

  tearDown(() {
    bloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('VideoBloc', () {
    test('initial state is VideoInitial', () {
      expect(bloc.state, const VideoInitial());
    });

    // -----------------------------------------------------------------------
    // LoadVideos
    // -----------------------------------------------------------------------

    group('LoadVideos', () {
      blocTest<VideoBloc, VideoState>(
        'emits [VideoLoading, VideoLoaded] on success',
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Right(tVideos));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadVideos()),
        expect: () => [
          const VideoLoading(),
          const VideoLoaded(
            videos: tVideos,
            hasMore: false,
            currentPage: 1,
          ),
        ],
        verify: (_) {
          verify(() => mockGetVideos(const VideoParams(page: 1))).called(1);
        },
      );

      blocTest<VideoBloc, VideoState>(
        'emits [VideoLoading, VideoError] on failure',
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadVideos()),
        expect: () => [
          const VideoLoading(),
          const VideoError(message: 'Server error'),
        ],
      );

      blocTest<VideoBloc, VideoState>(
        'sets hasMore to true when exactly 20 results returned',
        build: () {
          final fullPage = List.generate(
            20,
            (i) => VideoArticle(id: '${i + 1}', title: 'Video ${i + 1}'),
          );
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => Right(fullPage));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadVideos()),
        expect: () => [
          const VideoLoading(),
          isA<VideoLoaded>()
              .having((s) => s.hasMore, 'hasMore', true)
              .having((s) => s.videos.length, 'videos.length', 20)
              .having((s) => s.currentPage, 'currentPage', 1),
        ],
      );

      blocTest<VideoBloc, VideoState>(
        'sets hasMore to false when fewer than 20 results returned',
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Right(tVideos));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadVideos()),
        expect: () => [
          const VideoLoading(),
          isA<VideoLoaded>()
              .having((s) => s.hasMore, 'hasMore', false)
              .having((s) => s.videos.length, 'videos.length', 2),
        ],
      );

      blocTest<VideoBloc, VideoState>(
        'emits [VideoLoading, VideoError] with default message when failure has no message',
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Left(ServerFailure()));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadVideos()),
        expect: () => [
          const VideoLoading(),
          const VideoError(message: 'Failed to load videos'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreVideos
    // -----------------------------------------------------------------------

    group('LoadMoreVideos', () {
      blocTest<VideoBloc, VideoState>(
        'appends videos and increments page',
        seed: () => const VideoLoaded(
          videos: [VideoArticle(id: '1', title: 'V1')],
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetVideos(any())).thenAnswer(
            (_) async => const Right([VideoArticle(id: '2', title: 'V2')]),
          );
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMoreVideos()),
        expect: () => [
          isA<VideoLoaded>()
              .having((s) => s.videos.length, 'count', 2)
              .having((s) => s.videos.last.id, 'last video id', '2')
              .having((s) => s.currentPage, 'page', 2)
              .having((s) => s.hasMore, 'hasMore', false),
        ],
        verify: (_) {
          verify(() => mockGetVideos(const VideoParams(page: 2))).called(1);
        },
      );

      blocTest<VideoBloc, VideoState>(
        'does nothing when hasMore is false',
        seed: () => const VideoLoaded(
          videos: tVideos,
          currentPage: 1,
          hasMore: false,
        ),
        build: () => bloc,
        act: (bloc) => bloc.add(const LoadMoreVideos()),
        expect: () => <VideoState>[],
        verify: (_) {
          verifyNever(() => mockGetVideos(any()));
        },
      );

      blocTest<VideoBloc, VideoState>(
        'does nothing when state is not VideoLoaded',
        build: () => bloc,
        act: (bloc) => bloc.add(const LoadMoreVideos()),
        expect: () => <VideoState>[],
        verify: (_) {
          verifyNever(() => mockGetVideos(any()));
        },
      );

      blocTest<VideoBloc, VideoState>(
        'sets hasMore to false on pagination failure and keeps existing data',
        seed: () => const VideoLoaded(
          videos: tVideos,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMoreVideos()),
        expect: () => [
          isA<VideoLoaded>()
              .having((s) => s.videos, 'videos', tVideos)
              .having((s) => s.hasMore, 'hasMore', false)
              .having((s) => s.currentPage, 'currentPage', 1),
        ],
      );

      blocTest<VideoBloc, VideoState>(
        'sets hasMore to true when next page returns 20 items',
        seed: () => const VideoLoaded(
          videos: tVideos,
          currentPage: 1,
          hasMore: true,
        ),
        build: () {
          final fullPage = List.generate(
            20,
            (i) => VideoArticle(
              id: '${100 + i}',
              title: 'New Video ${i + 1}',
            ),
          );
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => Right(fullPage));
          return bloc;
        },
        act: (bloc) => bloc.add(const LoadMoreVideos()),
        expect: () => [
          isA<VideoLoaded>()
              .having((s) => s.videos.length, 'total count', 22)
              .having((s) => s.currentPage, 'page', 2)
              .having((s) => s.hasMore, 'hasMore', true),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // RefreshVideos
    // -----------------------------------------------------------------------

    group('RefreshVideos', () {
      blocTest<VideoBloc, VideoState>(
        're-fetches from page 1 and replaces all videos',
        seed: () => const VideoLoaded(
          videos: [
            VideoArticle(id: 'old-1', title: 'Old Video'),
          ],
          currentPage: 3,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Right(tVideos));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshVideos()),
        expect: () => [
          const VideoLoaded(
            videos: tVideos,
            hasMore: false,
            currentPage: 1,
          ),
        ],
        verify: (_) {
          verify(() => mockGetVideos(const VideoParams(page: 1))).called(1);
        },
      );

      blocTest<VideoBloc, VideoState>(
        'keeps existing state when refresh fails and state is VideoLoaded',
        seed: () => const VideoLoaded(
          videos: tVideos,
          currentPage: 2,
          hasMore: true,
        ),
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshVideos()),
        expect: () => <VideoState>[],
      );

      blocTest<VideoBloc, VideoState>(
        'emits VideoError when refresh fails and state is not VideoLoaded',
        build: () {
          when(() => mockGetVideos(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return bloc;
        },
        act: (bloc) => bloc.add(const RefreshVideos()),
        expect: () => [
          const VideoError(message: 'Server error'),
        ],
      );
    });
  });
}
