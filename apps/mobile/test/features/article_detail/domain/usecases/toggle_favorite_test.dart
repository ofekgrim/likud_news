import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/article_detail/domain/repositories/article_detail_repository.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/toggle_favorite.dart';

class MockArticleDetailRepository extends Mock
    implements ArticleDetailRepository {}

void main() {
  late ToggleFavorite useCase;
  late MockArticleDetailRepository mockRepository;

  setUp(() {
    mockRepository = MockArticleDetailRepository();
    useCase = ToggleFavorite(mockRepository);
  });

  const tDeviceId = 'device-123';
  const tArticleId = 'article-456';
  const tServerFailure = ServerFailure(message: 'Server error');

  group('ToggleFavorite', () {
    test(
        'should delegate to repository.toggleFavorite with correct params',
        () async {
      // arrange
      when(() => mockRepository.toggleFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Right(true));

      // act
      await useCase(const ToggleFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      verify(() => mockRepository.toggleFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(true) on success', () async {
      // arrange
      when(() => mockRepository.toggleFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Right(true));

      // act
      final result = await useCase(const ToggleFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      expect(result, const Right(true));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.toggleFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const ToggleFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      expect(result, const Left(tServerFailure));
    });
  });

  group('ToggleFavoriteParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = ToggleFavoriteParams(
        deviceId: 'device-123',
        articleId: 'article-456',
      );
      const params2 = ToggleFavoriteParams(
        deviceId: 'device-123',
        articleId: 'article-456',
      );

      // assert
      expect(params1, equals(params2));
    });

    test('props should contain deviceId and articleId', () {
      // arrange
      const params = ToggleFavoriteParams(
        deviceId: 'device-123',
        articleId: 'article-456',
      );

      // assert
      expect(params.props, ['device-123', 'article-456']);
    });
  });
}
