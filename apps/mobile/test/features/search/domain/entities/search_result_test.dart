import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/search/domain/entities/search_result.dart';

import '../../../../helpers/test_fixtures.dart';

void main() {
  group('SearchResult', () {
    group('equality', () {
      test('two search results with the same properties should be equal', () {
        final result1 = createTestSearchResult();
        final result2 = createTestSearchResult();

        expect(result1, equals(result2));
      });

      test('two search results with different articles should not be equal',
          () {
        final result1 = createTestSearchResult(
          articles: createTestArticleList(2),
        );
        final result2 = createTestSearchResult(
          articles: createTestArticleList(3),
        );

        expect(result1, isNot(equals(result2)));
      });

      test(
          'two search results with different totalArticles should not be equal',
          () {
        final result1 = createTestSearchResult(totalArticles: 3);
        final result2 = createTestSearchResult(totalArticles: 10);

        expect(result1, isNot(equals(result2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        final articles = createTestArticleList(2);
        final result = SearchResult(
          articles: articles,
          totalArticles: 5,
        );

        expect(result.props, [
          articles,
          5,
        ]);
      });
    });

    group('construction', () {
      test('can construct with articles and totalArticles', () {
        final articles = [
          createTestArticle(id: '1', title: 'Article 1'),
          createTestArticle(id: '2', title: 'Article 2'),
        ];
        final result = SearchResult(
          articles: articles,
          totalArticles: 2,
        );

        expect(result.articles, hasLength(2));
        expect(result.articles.first.title, equals('Article 1'));
        expect(result.totalArticles, equals(2));
      });
    });
  });
}
