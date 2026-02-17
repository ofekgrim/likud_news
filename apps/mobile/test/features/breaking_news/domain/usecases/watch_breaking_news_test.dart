import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/repositories/breaking_news_repository.dart';
import 'package:metzudat_halikud/features/breaking_news/domain/usecases/watch_breaking_news.dart';

class MockBreakingNewsRepository extends Mock
    implements BreakingNewsRepository {}

void main() {
  late WatchBreakingNews useCase;
  late MockBreakingNewsRepository mockRepository;

  setUp(() {
    mockRepository = MockBreakingNewsRepository();
    useCase = WatchBreakingNews(mockRepository);
  });

  group('WatchBreakingNews', () {
    test('should delegate to repository.watchBreakingNews', () {
      // arrange
      when(() => mockRepository.watchBreakingNews())
          .thenAnswer((_) => const Stream<Article>.empty());

      // act
      useCase();

      // assert
      verify(() => mockRepository.watchBreakingNews()).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    test('should emit articles from the stream', () {
      // arrange
      const tArticle = Article(id: '1', title: 'Breaking');
      when(() => mockRepository.watchBreakingNews())
          .thenAnswer((_) => Stream.fromIterable([tArticle]));

      // act
      final stream = useCase();

      // assert
      expectLater(stream, emitsInOrder([tArticle]));
    });

    test('should handle empty stream', () {
      // arrange
      when(() => mockRepository.watchBreakingNews())
          .thenAnswer((_) => const Stream<Article>.empty());

      // act
      final stream = useCase();

      // assert
      expectLater(stream, emitsDone);
    });

    test('should forward stream errors', () {
      // arrange
      final tError = Exception('SSE connection lost');
      when(() => mockRepository.watchBreakingNews())
          .thenAnswer((_) => Stream<Article>.error(tError));

      // act
      final stream = useCase();

      // assert
      expectLater(stream, emitsError(isA<Exception>()));
    });

    test('should emit multiple articles in order', () {
      // arrange
      const tArticle1 = Article(id: '1', title: 'Breaking 1');
      const tArticle2 = Article(id: '2', title: 'Breaking 2');
      const tArticle3 = Article(id: '3', title: 'Breaking 3');
      when(() => mockRepository.watchBreakingNews()).thenAnswer(
          (_) => Stream.fromIterable([tArticle1, tArticle2, tArticle3]));

      // act
      final stream = useCase();

      // assert
      expectLater(
          stream, emitsInOrder([tArticle1, tArticle2, tArticle3]));
    });
  });
}
