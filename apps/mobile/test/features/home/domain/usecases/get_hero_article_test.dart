import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/repositories/home_repository.dart';
import 'package:metzudat_halikud/features/home/domain/usecases/get_hero_article.dart';

class MockHomeRepository extends Mock implements HomeRepository {}

void main() {
  late GetHeroArticle useCase;
  late MockHomeRepository mockRepository;

  setUp(() {
    mockRepository = MockHomeRepository();
    useCase = GetHeroArticle(mockRepository);
  });

  const tArticle = Article(
    id: 1,
    title: 'Test Hero Article',
    isHero: true,
  );

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetHeroArticle', () {
    test('should delegate to repository.getHeroArticle()', () async {
      // arrange
      when(() => mockRepository.getHeroArticle())
          .thenAnswer((_) async => const Right(tArticle));

      // act
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getHeroArticle()).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(Article) on success', () async {
      // arrange
      when(() => mockRepository.getHeroArticle())
          .thenAnswer((_) async => const Right(tArticle));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(tArticle));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getHeroArticle())
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Left(tServerFailure));
    });
  });
}
