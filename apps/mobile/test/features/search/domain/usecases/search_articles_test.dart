import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/search/domain/entities/search_result.dart';
import 'package:metzudat_halikud/features/search/domain/repositories/search_repository.dart';
import 'package:metzudat_halikud/features/search/domain/usecases/search_articles.dart';

class MockSearchRepository extends Mock implements SearchRepository {}

void main() {
  late SearchArticles useCase;
  late MockSearchRepository mockRepository;

  setUp(() {
    mockRepository = MockSearchRepository();
    useCase = SearchArticles(mockRepository);
  });

  final tSearchResult = SearchResult(
    articles: const [Article(id: '1', title: 'Found Article')],
    totalArticles: 1,
  );

  const tServerFailure = ServerFailure(message: 'Server error');

  group('SearchArticles', () {
    test('should delegate to repository.search with correct query and page',
        () async {
      // arrange
      when(() => mockRepository.search(query: 'likud', page: 1))
          .thenAnswer((_) async => Right(tSearchResult));

      // act
      await useCase(const SearchParams(query: 'likud', page: 1));

      // assert
      verify(() => mockRepository.search(query: 'likud', page: 1)).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(SearchResult) on success', () async {
      // arrange
      when(() => mockRepository.search(query: 'likud', page: 1))
          .thenAnswer((_) async => Right(tSearchResult));

      // act
      final result =
          await useCase(const SearchParams(query: 'likud', page: 1));

      // assert
      expect(result, Right(tSearchResult));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.search(query: 'likud', page: 1))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result =
          await useCase(const SearchParams(query: 'likud', page: 1));

      // assert
      expect(result, const Left(tServerFailure));
    });
  });

  group('SearchParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = SearchParams(query: 'likud', page: 1);
      const params2 = SearchParams(query: 'likud', page: 1);

      // assert
      expect(params1, equals(params2));
    });

    test('page should default to 1', () {
      // arrange
      const params = SearchParams(query: 'likud');

      // assert
      expect(params.page, 1);
    });

    test('should not be equal when query differs', () {
      // arrange
      const params1 = SearchParams(query: 'likud');
      const params2 = SearchParams(query: 'knesset');

      // assert
      expect(params1, isNot(equals(params2)));
    });

    test('props should contain query and page', () {
      // arrange
      const params = SearchParams(query: 'likud', page: 3);

      // assert
      expect(params.props, ['likud', 3]);
    });
  });
}
