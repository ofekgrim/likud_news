import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/favorites/domain/repositories/favorites_repository.dart';
import 'package:metzudat_halikud/features/favorites/domain/usecases/get_reading_history.dart';

class MockFavoritesRepository extends Mock implements FavoritesRepository {}

void main() {
  late GetReadingHistory useCase;
  late MockFavoritesRepository mockRepository;

  setUp(() {
    mockRepository = MockFavoritesRepository();
    useCase = GetReadingHistory(mockRepository);
  });

  const tArticles = [
    Article(id: '1', title: 'Art 1'),
    Article(id: '2', title: 'Art 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');
  const tDeviceId = 'device-123';

  group('GetReadingHistory', () {
    test(
        'should delegate to repository.getReadingHistory(deviceId: ..., page: 1)',
        () async {
      // arrange
      when(() =>
              mockRepository.getReadingHistory(deviceId: tDeviceId, page: 1))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const HistoryParams(deviceId: tDeviceId, page: 1));

      // assert
      verify(() =>
              mockRepository.getReadingHistory(deviceId: tDeviceId, page: 1))
          .called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Article>) on success', () async {
      // arrange
      when(() =>
              mockRepository.getReadingHistory(deviceId: tDeviceId, page: 1))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      final result =
          await useCase(const HistoryParams(deviceId: tDeviceId, page: 1));

      // assert
      expect(result, const Right(tArticles));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() =>
              mockRepository.getReadingHistory(deviceId: tDeviceId, page: 1))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result =
          await useCase(const HistoryParams(deviceId: tDeviceId, page: 1));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should pass the correct parameters', () async {
      // arrange
      when(() =>
              mockRepository.getReadingHistory(deviceId: tDeviceId, page: 5))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const HistoryParams(deviceId: tDeviceId, page: 5));

      // assert
      verify(() =>
              mockRepository.getReadingHistory(deviceId: tDeviceId, page: 5))
          .called(1);
    });
  });

  group('HistoryParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = HistoryParams(deviceId: tDeviceId, page: 1);
      const params2 = HistoryParams(deviceId: tDeviceId, page: 1);

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when deviceId or page differs', () {
      // arrange
      const params1 = HistoryParams(deviceId: tDeviceId, page: 1);
      const params2 = HistoryParams(deviceId: 'other-device', page: 1);
      const params3 = HistoryParams(deviceId: tDeviceId, page: 2);

      // assert
      expect(params1, isNot(equals(params2)));
      expect(params1, isNot(equals(params3)));
    });

    test('props should contain deviceId and page', () {
      // arrange
      const params = HistoryParams(deviceId: tDeviceId, page: 3);

      // assert
      expect(params.props, [tDeviceId, 3]);
    });
  });
}
