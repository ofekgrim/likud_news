import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/article_detail/domain/entities/article_detail.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';

void main() {
  group('ArticleDetail', () {
    final tPublishedAt = DateTime(2024, 1, 15, 10, 30);

    ArticleDetail createDetail({
      String id = '1',
      String title = 'Test Article',
      String? titleEn = 'Test Article EN',
      String? subtitle = 'Test subtitle',
      String? content = '<p>Test content</p>',
      String? contentEn = '<p>Test content EN</p>',
      String? heroImageUrl = 'https://example.com/image.jpg',
      String? heroImageCaption = 'Test caption',
      String? author = 'Test Author',
      List<String> hashtags = const ['tag1', 'tag2'],
      bool isHero = true,
      bool isBreaking = false,
      int viewCount = 42,
      String? slug = 'test-article',
      DateTime? publishedAt,
      String? categoryId = '5',
      String? categoryName = 'Politics',
      String? categoryColor = '#FF0000',
      List<Article> relatedArticles = const [],
      bool isFavorite = false,
    }) {
      return ArticleDetail(
        id: id,
        title: title,
        titleEn: titleEn,
        subtitle: subtitle,
        content: content,
        contentEn: contentEn,
        heroImageUrl: heroImageUrl,
        heroImageCaption: heroImageCaption,
        author: author,
        hashtags: hashtags,
        isHero: isHero,
        isBreaking: isBreaking,
        viewCount: viewCount,
        slug: slug,
        publishedAt: publishedAt ?? tPublishedAt,
        categoryId: categoryId,
        categoryName: categoryName,
        categoryColor: categoryColor,
        relatedArticles: relatedArticles,
        isFavorite: isFavorite,
      );
    }

    group('equality', () {
      test('two article details with the same properties should be equal', () {
        final detail1 = createDetail();
        final detail2 = createDetail();

        expect(detail1, equals(detail2));
      });

      test('two article details with different id should not be equal', () {
        final detail1 = createDetail(id: '1');
        final detail2 = createDetail(id: '2');

        expect(detail1, isNot(equals(detail2)));
      });

      test(
          'two article details with different isFavorite should not be equal',
          () {
        final detail1 = createDetail(isFavorite: false);
        final detail2 = createDetail(isFavorite: true);

        expect(detail1, isNot(equals(detail2)));
      });
    });

    group('props', () {
      test('props list should contain all 20 fields', () {
        final detail = createDetail();

        expect(detail.props, [
          '1',
          'Test Article',
          'Test Article EN',
          'Test subtitle',
          '<p>Test content</p>',
          '<p>Test content EN</p>',
          'https://example.com/image.jpg',
          'Test caption',
          'Test Author',
          ['tag1', 'tag2'],
          true,
          false,
          42,
          'test-article',
          tPublishedAt,
          '5',
          'Politics',
          '#FF0000',
          const <Article>[],
          false,
        ]);
      });
    });

    group('default values', () {
      test('hashtags should default to an empty list', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.hashtags, isEmpty);
        expect(detail.hashtags, isA<List<String>>());
      });

      test('isHero should default to false', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.isHero, isFalse);
      });

      test('isBreaking should default to false', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.isBreaking, isFalse);
      });

      test('viewCount should default to 0', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.viewCount, equals(0));
      });

      test('relatedArticles should default to an empty list', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.relatedArticles, isEmpty);
        expect(detail.relatedArticles, isA<List<Article>>());
      });

      test('isFavorite should default to false', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.isFavorite, isFalse);
      });

      test('nullable fields should default to null', () {
        const detail = ArticleDetail(id: '1', title: 'Test');

        expect(detail.titleEn, isNull);
        expect(detail.subtitle, isNull);
        expect(detail.content, isNull);
        expect(detail.contentEn, isNull);
        expect(detail.heroImageUrl, isNull);
        expect(detail.heroImageCaption, isNull);
        expect(detail.author, isNull);
        expect(detail.slug, isNull);
        expect(detail.publishedAt, isNull);
        expect(detail.categoryId, isNull);
        expect(detail.categoryName, isNull);
        expect(detail.categoryColor, isNull);
      });
    });

    group('copyWith', () {
      test('should return a new instance with isFavorite changed', () {
        final detail = createDetail(isFavorite: false);
        final copied = detail.copyWith(isFavorite: true);

        expect(copied.isFavorite, isTrue);
        expect(copied.id, equals(detail.id));
        expect(copied.title, equals(detail.title));
        expect(copied.titleEn, equals(detail.titleEn));
        expect(copied.subtitle, equals(detail.subtitle));
        expect(copied.content, equals(detail.content));
        expect(copied.contentEn, equals(detail.contentEn));
        expect(copied.heroImageUrl, equals(detail.heroImageUrl));
        expect(copied.heroImageCaption, equals(detail.heroImageCaption));
        expect(copied.author, equals(detail.author));
        expect(copied.hashtags, equals(detail.hashtags));
        expect(copied.isHero, equals(detail.isHero));
        expect(copied.isBreaking, equals(detail.isBreaking));
        expect(copied.viewCount, equals(detail.viewCount));
        expect(copied.slug, equals(detail.slug));
        expect(copied.publishedAt, equals(detail.publishedAt));
        expect(copied.categoryId, equals(detail.categoryId));
        expect(copied.categoryName, equals(detail.categoryName));
        expect(copied.categoryColor, equals(detail.categoryColor));
        expect(copied.relatedArticles, equals(detail.relatedArticles));
      });
    });

    group('toArticle', () {
      test('should convert to Article with matching fields', () {
        final detail = createDetail();
        final article = detail.toArticle();

        expect(article, isA<Article>());
        expect(article.id, equals(detail.id));
        expect(article.title, equals(detail.title));
        expect(article.titleEn, equals(detail.titleEn));
        expect(article.subtitle, equals(detail.subtitle));
        expect(article.content, equals(detail.content));
        expect(article.heroImageUrl, equals(detail.heroImageUrl));
        expect(article.heroImageCaption, equals(detail.heroImageCaption));
        expect(article.author, equals(detail.author));
        expect(article.hashtags, equals(detail.hashtags));
        expect(article.isHero, equals(detail.isHero));
        expect(article.isBreaking, equals(detail.isBreaking));
        expect(article.viewCount, equals(detail.viewCount));
        expect(article.slug, equals(detail.slug));
        expect(article.publishedAt, equals(detail.publishedAt));
        expect(article.categoryId, equals(detail.categoryId));
        expect(article.categoryName, equals(detail.categoryName));
        expect(article.categoryColor, equals(detail.categoryColor));
      });
    });
  });
}
