import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/magazine/domain/repositories/magazine_repository.dart';
import 'package:metzudat_halikud/features/magazine/domain/usecases/get_magazine_articles.dart';

class MockMagazineRepository extends Mock implements MagazineRepository {}

void main() {
  late GetMagazineArticles useCase;
  late MockMagazineRepository mockRepository;

  setUp(() {
    mockRepository = MockMagazineRepository();
    useCase = GetMagazineArticles(mockRepository);
  });

  const tArticles = [
    Article(id: '1', title: 'Art 1'),
    Article(id: '2', title: 'Art 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetMagazineArticles', () {
    test('should delegate to repository.getMagazineArticles(page: 1)',
        () async {
      // arrange
      when(() => mockRepository.getMagazineArticles(page: 1))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const MagazineParams(page: 1));

      // assert
      verify(() => mockRepository.getMagazineArticles(page: 1)).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Article>) on success', () async {
      // arrange
      when(() => mockRepository.getMagazineArticles(page: 1))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      final result = await useCase(const MagazineParams(page: 1));

      // assert
      expect(result, const Right(tArticles));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getMagazineArticles(page: 1))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const MagazineParams(page: 1));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should pass the correct page parameter', () async {
      // arrange
      when(() => mockRepository.getMagazineArticles(page: 5))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const MagazineParams(page: 5));

      // assert
      verify(() => mockRepository.getMagazineArticles(page: 5)).called(1);
    });
  });

  group('MagazineParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = MagazineParams(page: 1);
      const params2 = MagazineParams(page: 1);

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when page differs', () {
      // arrange
      const params1 = MagazineParams(page: 1);
      const params2 = MagazineParams(page: 2);

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain page', () {
      // arrange
      const params = MagazineParams(page: 3);

      // assert
      expect(params.props, [3]);
    });
  });
}
