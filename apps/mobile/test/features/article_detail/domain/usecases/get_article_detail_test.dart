import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/article_detail/domain/entities/article_detail.dart';
import 'package:metzudat_halikud/features/article_detail/domain/repositories/article_detail_repository.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/get_article_detail.dart';

class MockArticleDetailRepository extends Mock
    implements ArticleDetailRepository {}

void main() {
  late GetArticleDetail useCase;
  late MockArticleDetailRepository mockRepository;

  setUp(() {
    mockRepository = MockArticleDetailRepository();
    useCase = GetArticleDetail(mockRepository);
  });

  const tArticleDetail = ArticleDetail(id: '1', title: 'Test');
  const tSlug = 'test-article';
  const tServerFailure = ServerFailure(message: 'Server error');

  group('GetArticleDetail', () {
    test('should delegate to repository.getArticleBySlug with correct slug',
        () async {
      // arrange
      when(() => mockRepository.getArticleBySlug(tSlug))
          .thenAnswer((_) async => const Right(tArticleDetail));

      // act
      await useCase(const GetArticleDetailParams(slug: tSlug));

      // assert
      verify(() => mockRepository.getArticleBySlug(tSlug)).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should return Right(ArticleDetail) on success', () async {
      // arrange
      when(() => mockRepository.getArticleBySlug(tSlug))
          .thenAnswer((_) async => const Right(tArticleDetail));

      // act
      final result =
          await useCase(const GetArticleDetailParams(slug: tSlug));

      // assert
      expect(result, const Right(tArticleDetail));
    });

    test('should return Left(ServerFailure) on failure', () async {
      // arrange
      when(() => mockRepository.getArticleBySlug(tSlug))
          .thenAnswer((_) async => const Left(tServerFailure));

      // act
      final result =
          await useCase(const GetArticleDetailParams(slug: tSlug));

      // assert
      expect(result, const Left(tServerFailure));
    });
  });

  group('GetArticleDetailParams', () {
    test('should support value equality', () {
      // arrange
      const params1 = GetArticleDetailParams(slug: 'test-article');
      const params2 = GetArticleDetailParams(slug: 'test-article');

      // assert
      expect(params1, equals(params2));
    });

    test('props should contain slug', () {
      // arrange
      const params = GetArticleDetailParams(slug: 'test-article');

      // assert
      expect(params.props, ['test-article']);
    });
  });
}
