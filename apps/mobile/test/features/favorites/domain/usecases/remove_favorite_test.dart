import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/favorites/domain/repositories/favorites_repository.dart';
import 'package:metzudat_halikud/features/favorites/domain/usecases/remove_favorite.dart';

class MockFavoritesRepository extends Mock implements FavoritesRepository {}

void main() {
  late RemoveFavorite useCase;
  late MockFavoritesRepository mockRepository;

  setUp(() {
    mockRepository = MockFavoritesRepository();
    useCase = RemoveFavorite(mockRepository);
  });

  const tServerFailure = ServerFailure(message: 'Server error');
  const tDeviceId = 'device-123';
  const tArticleId = 'article-456';

  group('RemoveFavorite', () {
    test(
        'should delegate to repository.removeFavorite(deviceId: ..., articleId: ...)',
        () async {
      // arrange
      when(() => mockRepository.removeFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Right(null));

      // act
      await useCase(const RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      verify(() => mockRepository.removeFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(null) on success', () async {
      // arrange
      when(() => mockRepository.removeFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Right(null));

      // act
      final result = await useCase(const RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      expect(result, const Right(null));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.removeFavorite(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should pass the correct parameters', () async {
      // arrange
      const otherDeviceId = 'other-device';
      const otherArticleId = 'other-article';
      when(() => mockRepository.removeFavorite(
            deviceId: otherDeviceId,
            articleId: otherArticleId,
          )).thenAnswer((_) async => const Right(null));

      // act
      await useCase(const RemoveFavoriteParams(
        deviceId: otherDeviceId,
        articleId: otherArticleId,
      ));

      // assert
      verify(() => mockRepository.removeFavorite(
            deviceId: otherDeviceId,
            articleId: otherArticleId,
          )).called(1);
    });
  });

  group('RemoveFavoriteParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      );
      const params2 = RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      );

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when deviceId or articleId differs', () {
      // arrange
      const params1 = RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      );
      const params2 = RemoveFavoriteParams(
        deviceId: 'other-device',
        articleId: tArticleId,
      );
      const params3 = RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: 'other-article',
      );

      // assert
      expect(params1, isNot(equals(params2)));
      expect(params1, isNot(equals(params3)));
    });

    test('props should contain deviceId and articleId', () {
      // arrange
      const params = RemoveFavoriteParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      );

      // assert
      expect(params.props, [tDeviceId, tArticleId]);
    });
  });
}
