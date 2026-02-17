import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/video/domain/entities/video_article.dart';
import 'package:metzudat_halikud/features/video/domain/repositories/video_repository.dart';
import 'package:metzudat_halikud/features/video/domain/usecases/get_videos.dart';

class MockVideoRepository extends Mock implements VideoRepository {}

void main() {
  late GetVideos useCase;
  late MockVideoRepository mockRepository;

  setUp(() {
    mockRepository = MockVideoRepository();
    useCase = GetVideos(mockRepository);
  });

  const tVideos = [
    VideoArticle(id: '1', title: 'Video 1'),
    VideoArticle(id: '2', title: 'Video 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetVideos', () {
    test('should delegate to repository.getVideos(page: 1)', () async {
      // arrange
      when(() => mockRepository.getVideos(page: 1))
          .thenAnswer((_) async => const Right(tVideos));

      // act
      await useCase(const VideoParams(page: 1));

      // assert
      verify(() => mockRepository.getVideos(page: 1)).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<VideoArticle>) on success', () async {
      // arrange
      when(() => mockRepository.getVideos(page: 1))
          .thenAnswer((_) async => const Right(tVideos));

      // act
      final result = await useCase(const VideoParams(page: 1));

      // assert
      expect(result, const Right(tVideos));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getVideos(page: 1))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const VideoParams(page: 1));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should pass the correct page parameter', () async {
      // arrange
      when(() => mockRepository.getVideos(page: 5))
          .thenAnswer((_) async => const Right(tVideos));

      // act
      await useCase(const VideoParams(page: 5));

      // assert
      verify(() => mockRepository.getVideos(page: 5)).called(1);
    });
  });

  group('VideoParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = VideoParams(page: 1);
      const params2 = VideoParams(page: 1);

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when page differs', () {
      // arrange
      const params1 = VideoParams(page: 1);
      const params2 = VideoParams(page: 2);

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain page', () {
      // arrange
      const params = VideoParams(page: 3);

      // assert
      expect(params.props, [3]);
    });
  });
}
