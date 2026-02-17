import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/article_detail/domain/repositories/article_detail_repository.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/record_read.dart';

class MockArticleDetailRepository extends Mock
    implements ArticleDetailRepository {}

void main() {
  late RecordRead useCase;
  late MockArticleDetailRepository mockRepository;

  setUp(() {
    mockRepository = MockArticleDetailRepository();
    useCase = RecordRead(mockRepository);
  });

  const tDeviceId = 'device-123';
  const tArticleId = 'article-456';
  const tServerFailure = ServerFailure(message: 'Server error');

  group('RecordRead', () {
    test(
        'should delegate to repository.recordRead with correct deviceId and articleId',
        () async {
      // arrange
      when(() => mockRepository.recordRead(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Right(null));

      // act
      await useCase(const RecordReadParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      verify(() => mockRepository.recordRead(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(null) on success', () async {
      // arrange
      when(() => mockRepository.recordRead(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Right(null));

      // act
      final result = await useCase(const RecordReadParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      expect(result, const Right(null));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.recordRead(
            deviceId: tDeviceId,
            articleId: tArticleId,
          )).thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const RecordReadParams(
        deviceId: tDeviceId,
        articleId: tArticleId,
      ));

      // assert
      expect(result, const Left(tServerFailure));
    });
  });

  group('RecordReadParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = RecordReadParams(
        deviceId: 'device-123',
        articleId: 'article-456',
      );
      const params2 = RecordReadParams(
        deviceId: 'device-123',
        articleId: 'article-456',
      );

      // assert
      expect(params1, equals(params2));
    });

    test('props should contain deviceId and articleId', () {
      // arrange
      const params = RecordReadParams(
        deviceId: 'device-123',
        articleId: 'article-456',
      );

      // assert
      expect(params.props, ['device-123', 'article-456']);
    });
  });
}
