import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/repositories/home_repository.dart';
import 'package:metzudat_halikud/features/home/domain/usecases/get_feed_articles.dart';

class MockHomeRepository extends Mock implements HomeRepository {}

void main() {
  late GetFeedArticles useCase;
  late MockHomeRepository mockRepository;

  setUp(() {
    mockRepository = MockHomeRepository();
    useCase = GetFeedArticles(mockRepository);
  });

  const tArticles = [
    Article(id: 1, title: 'Article 1'),
    Article(id: 2, title: 'Article 2'),
    Article(id: 3, title: 'Article 3'),
  ];

  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetFeedArticles', () {
    test('should delegate to repository.getFeedArticles(page: 1)', () async {
      // arrange
      when(() => mockRepository.getFeedArticles(page: 1))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const FeedParams(page: 1));

      // assert
      verify(() => mockRepository.getFeedArticles(page: 1)).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(List<Article>) on success', () async {
      // arrange
      when(() => mockRepository.getFeedArticles(page: 1))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      final result = await useCase(const FeedParams(page: 1));

      // assert
      expect(result, const Right(tArticles));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getFeedArticles(page: 1))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result = await useCase(const FeedParams(page: 1));

      // assert
      expect(result, const Left(tServerFailure));
    });

    test('should pass the correct page parameter', () async {
      // arrange
      when(() => mockRepository.getFeedArticles(page: 5))
          .thenAnswer((_) async => const Right(tArticles));

      // act
      await useCase(const FeedParams(page: 5));

      // assert
      verify(() => mockRepository.getFeedArticles(page: 5)).called(1);
    });
  });

  group('FeedParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = FeedParams(page: 1);
      const params2 = FeedParams(page: 1);

      // assert
      expect(params1, equals(params2));
    });

    test('should not be equal when page differs', () {
      // arrange
      const params1 = FeedParams(page: 1);
      const params2 = FeedParams(page: 2);

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain page', () {
      // arrange
      const params = FeedParams(page: 3);

      // assert
      expect(params.props, [3]);
    });
  });
}
