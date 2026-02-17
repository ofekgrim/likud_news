import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/core/usecases/usecase.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/repositories/breaking_news_repository.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/usecases/get_breaking_articles.dart';

class MockBreakingNewsRepository extends Mock
    implements BreakingNewsRepository {}

void main() {
  late GetBreakingArticles useCase;
  late MockBreakingNewsRepository mockRepository;

  setUp(() {
    mockRepository = MockBreakingNewsRepository();
    useCase = GetBreakingArticles(mockRepository);
  });

  const tArticles = [
    Article(id: '1', title: 'Art 1'),
    Article(id: '2', title: 'Art 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetBreakingArticles', () {
    test('should delegate to repository.getBreakingArticles', () async {
      // arrange
      when(() => mockRepository.getBreakingArticles())
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getBreakingArticles()).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Article>) on success', () async {
      // arrange
      when(() => mockRepository.getBreakingArticles())
          .thenAnswer((_) async => const Right(tArticles));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(tArticles));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getBreakingArticles())
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should call repository exactly once per invocation', () async {
      // arrange
      when(() => mockRepository.getBreakingArticles())
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const NoParams());
      await useCase(const NoParams());

      // assert
      verify(() => mockRepository.getBreakingArticles()).called(2);
    });

    test('should return empty list when repository returns empty list',
        () async {
      // arrange
      when(() => mockRepository.getBreakingArticles())
          .thenAnswer((_) async => const Right(<Article>[]));

      // act
      final result = await useCase(const NoParams());

      // assert
      expect(result, const Right(<Article>[]));
    });
  });
}
