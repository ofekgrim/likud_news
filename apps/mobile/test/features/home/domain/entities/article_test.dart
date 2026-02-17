import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';

import '../../../../helpers/test_fixtures.dart';

void main() {
  group('Article', () {
    group('equality', () {
      test('two articles with the same properties should be equal', () {
        final article1 = createTestArticle();
        final article2 = createTestArticle();

        expect(article1, equals(article2));
      });

      test('two articles with different id should not be equal', () {
        final article1 = createTestArticle(id: '1');
        final article2 = createTestArticle(id: '2');

        expect(article1, isNot(equals(article2)));
      });

      test('two articles with different title should not be equal', () {
        final article1 = createTestArticle(title: 'Article A');
        final article2 = createTestArticle(title: 'Article B');

        expect(article1, isNot(equals(article2)));
      });

      test('two articles with different isHero should not be equal', () {
        final article1 = createTestArticle(isHero: false);
        final article2 = createTestArticle(isHero: true);

        expect(article1, isNot(equals(article2)));
      });

      test('two articles with different hashtags should not be equal', () {
        final article1 = createTestArticle(hashtags: ['a']);
        final article2 = createTestArticle(hashtags: ['b']);

        expect(article1, isNot(equals(article2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        final publishedAt = DateTime(2024, 1, 15, 10, 30);
        final article = Article(
          id: '1',
          title: 'Title',
          titleEn: 'Title EN',
          subtitle: 'Subtitle',
          content: 'Content',
          heroImageUrl: 'https://example.com/img.jpg',
          heroImageCaption: 'Caption',
          author: 'Author',
          hashtags: ['tag1'],
          isHero: true,
          isBreaking: true,
          viewCount: 42,
          slug: 'title-slug',
          publishedAt: publishedAt,
          categoryId: '5',
          categoryName: 'Politics',
          categoryColor: '#FF0000',
        );

        expect(article.props, [
          '1',
          'Title',
          'Title EN',
          'Subtitle',
          'Content',
          'https://example.com/img.jpg',
          'Caption',
          'Author',
          ['tag1'],
          true,
          true,
          42,
          'title-slug',
          publishedAt,
          '5',
          'Politics',
          '#FF0000',
        ]);
      });
    });

    group('default values', () {
      test('hashtags should default to an empty list', () {
        const article = Article(id: '1', title: 'Test');

        expect(article.hashtags, isEmpty);
        expect(article.hashtags, isA<List<String>>());
      });

      test('isHero should default to false', () {
        const article = Article(id: '1', title: 'Test');

        expect(article.isHero, isFalse);
      });

      test('isBreaking should default to false', () {
        const article = Article(id: '1', title: 'Test');

        expect(article.isBreaking, isFalse);
      });

      test('viewCount should default to 0', () {
        const article = Article(id: '1', title: 'Test');

        expect(article.viewCount, equals(0));
      });

      test('nullable fields should default to null', () {
        const article = Article(id: '1', title: 'Test');

        expect(article.titleEn, isNull);
        expect(article.subtitle, isNull);
        expect(article.content, isNull);
        expect(article.heroImageUrl, isNull);
        expect(article.heroImageCaption, isNull);
        expect(article.author, isNull);
        expect(article.slug, isNull);
        expect(article.publishedAt, isNull);
        expect(article.categoryId, isNull);
        expect(article.categoryName, isNull);
        expect(article.categoryColor, isNull);
      });
    });
  });
}
