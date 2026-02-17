import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/magazine/domain/repositories/magazine_repository.dart';
import 'package:metzudat_halikud/features/magazine/domain/usecases/get_featured_article.dart';

class MockMagazineRepository extends Mock implements MagazineRepository {}

void main() {
  late GetFeaturedArticle useCase;
  late MockMagazineRepository mockRepository;

  setUp(() {
    mockRepository = MockMagazineRepository();
    useCase = GetFeaturedArticle(mockRepository);
  });

  const tArticle = Article(id: '1', title: 'Featured Article');
  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetFeaturedArticle', () {
    test('should delegate to repository.getFeaturedArticle()', () async {
      // arrange
      when(() => mockRepository.getFeaturedArticle())
          .thenAnswer((_) async => const Right(tArticle));

      // act
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getFeaturedArticle()).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(Article) on success', () async {
      // arrange
      when(() => mockRepository.getFeaturedArticle())
          .thenAnswer((_) async => const Right(tArticle));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(tArticle));
    });

    test('should return Right(null) when no featured article exists',
        () async {
      // arrange
      when(() => mockRepository.getFeaturedArticle())
          .thenAnswer((_) async => const Right(null));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(null));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getFeaturedArticle())
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Left(tServerFailure));
    });
  });
}
