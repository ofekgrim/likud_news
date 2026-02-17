import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/categories/domain/repositories/categories_repository.dart';
import 'package:metzudat_halikud/features/categories/domain/usecases/get_category_articles.dart';

class MockCategoriesRepository extends Mock implements CategoriesRepository {}

void main() {
  late GetCategoryArticles useCase;
  late MockCategoriesRepository mockRepository;

  setUp(() {
    mockRepository = MockCategoriesRepository();
    useCase = GetCategoryArticles(mockRepository);
  });

  const tArticles = [
    Article(id: '1', title: 'Art 1'),
    Article(id: '2', title: 'Art 2'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetCategoryArticles', () {
    test(
        'should delegate to repository.getCategoryArticles with correct slug and page',
        () async {
      // arrange
      when(() => mockRepository.getCategoryArticles(
            slug: 'politics',
            page: 1,
          )).thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(
          const CategoryArticlesParams(slug: 'politics', page: 1));

      // assert
      verify(() => mockRepository.getCategoryArticles(
            slug: 'politics',
            page: 1,
          )).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Article>) on success', () async {
      // arrange
      when(() => mockRepository.getCategoryArticles(
            slug: 'politics',
            page: 1,
          )).thenAnswer((_) async => const Right(tArticles));

      // act
      final result = await useCase(
          const CategoryArticlesParams(slug: 'politics', page: 1));

      // assert
      expect(result, const Right(tArticles));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getCategoryArticles(
            slug: 'politics',
            page: 1,
          )).thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(
          const CategoryArticlesParams(slug: 'politics', page: 1));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should pass different slug and page parameters correctly',
        () async {
      // arrange
      when(() => mockRepository.getCategoryArticles(
            slug: 'economy',
            page: 3,
          )).thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(
          const CategoryArticlesParams(slug: 'economy', page: 3));

      // assert
      verify(() => mockRepository.getCategoryArticles(
            slug: 'economy',
            page: 3,
          )).called(1);
    });
  });

  group('CategoryArticlesParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = CategoryArticlesParams(slug: 'politics', page: 1);
      const params2 = CategoryArticlesParams(slug: 'politics', page: 1);

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when slug differs', () {
      // arrange
      const params1 = CategoryArticlesParams(slug: 'politics', page: 1);
      const params2 = CategoryArticlesParams(slug: 'economy', page: 1);

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('should not be equal when page differs', () {
      // arrange
      const params1 = CategoryArticlesParams(slug: 'politics', page: 1);
      const params2 = CategoryArticlesParams(slug: 'politics', page: 2);

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain slug and page', () {
      // arrange
      const params =
          CategoryArticlesParams(slug: 'politics', page: 3);

      // assert
      expect(params.props, ['politics', 3]);
    });
  });
}
