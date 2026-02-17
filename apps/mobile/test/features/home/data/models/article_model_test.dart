import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/home/data/models/article_model.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';

void main() {
  group('ArticleModel', () {
    final tPublishedAt = DateTime(2024, 1, 15, 10, 30);

    final tJson = <String, dynamic>{
      'id': '1',
      'title': 'Test Article',
      'title_en': 'Test Article EN',
      'subtitle': 'Subtitle',
      'content': '<p>Content</p>',
      'hero_image_url': 'https://example.com/img.jpg',
      'hero_image_caption': 'Caption',
      'author': 'Author',
      'hashtags': ['tag1', 'tag2'],
      'is_hero': true,
      'is_breaking': false,
      'view_count': 42,
      'slug': 'test-article',
      'published_at': '2024-01-15T10:30:00.000',
      'category_id': '5',
      'category_name': 'Politics',
      'category_color': '#FF0000',
    };

    final tModel = ArticleModel(
      id: '1',
      title: 'Test Article',
      titleEn: 'Test Article EN',
      subtitle: 'Subtitle',
      content: '<p>Content</p>',
      heroImageUrl: 'https://example.com/img.jpg',
      heroImageCaption: 'Caption',
      author: 'Author',
      hashtags: const ['tag1', 'tag2'],
      isHero: true,
      isBreaking: false,
      viewCount: 42,
      slug: 'test-article',
      publishedAt: tPublishedAt,
      categoryId: '5',
      categoryName: 'Politics',
      categoryColor: '#FF0000',
    );

    group('fromJson', () {
      test('should parse full JSON correctly', () {
        final model = ArticleModel.fromJson(tJson);

        expect(model.id, equals('1'));
        expect(model.title, equals('Test Article'));
        expect(model.titleEn, equals('Test Article EN'));
        expect(model.subtitle, equals('Subtitle'));
        expect(model.content, equals('<p>Content</p>'));
        expect(model.heroImageUrl, equals('https://example.com/img.jpg'));
        expect(model.heroImageCaption, equals('Caption'));
        expect(model.author, equals('Author'));
        expect(model.hashtags, equals(['tag1', 'tag2']));
        expect(model.isHero, isTrue);
        expect(model.isBreaking, isFalse);
        expect(model.viewCount, equals(42));
        expect(model.slug, equals('test-article'));
        expect(model.publishedAt, equals(tPublishedAt));
        expect(model.categoryId, equals('5'));
        expect(model.categoryName, equals('Politics'));
        expect(model.categoryColor, equals('#FF0000'));
      });

      test('should handle null/missing optional fields', () {
        final minimalJson = <String, dynamic>{
          'id': '1',
          'title': 'Minimal',
        };

        final model = ArticleModel.fromJson(minimalJson);

        expect(model.id, equals('1'));
        expect(model.title, equals('Minimal'));
        expect(model.titleEn, isNull);
        expect(model.subtitle, isNull);
        expect(model.content, isNull);
        expect(model.heroImageUrl, isNull);
        expect(model.heroImageCaption, isNull);
        expect(model.author, isNull);
        expect(model.hashtags, isEmpty);
        expect(model.isHero, isFalse);
        expect(model.isBreaking, isFalse);
        expect(model.viewCount, equals(0));
        expect(model.slug, isNull);
        expect(model.publishedAt, isNull);
        expect(model.categoryId, isNull);
        expect(model.categoryName, isNull);
        expect(model.categoryColor, isNull);
      });

      test('should parse hashtags list', () {
        final model = ArticleModel.fromJson(tJson);

        expect(model.hashtags, isA<List<String>>());
        expect(model.hashtags, hasLength(2));
        expect(model.hashtags, containsAll(['tag1', 'tag2']));
      });

      test('should parse publishedAt DateTime', () {
        final model = ArticleModel.fromJson(tJson);

        expect(model.publishedAt, isA<DateTime>());
        expect(model.publishedAt, equals(tPublishedAt));
      });
    });

    group('toJson', () {
      test('should serialize all fields correctly', () {
        final json = tModel.toJson();

        expect(json['id'], equals('1'));
        expect(json['title'], equals('Test Article'));
        expect(json['title_en'], equals('Test Article EN'));
        expect(json['subtitle'], equals('Subtitle'));
        expect(json['content'], equals('<p>Content</p>'));
        expect(json['hero_image_url'], equals('https://example.com/img.jpg'));
        expect(json['hero_image_caption'], equals('Caption'));
        expect(json['author'], equals('Author'));
        expect(json['hashtags'], equals(['tag1', 'tag2']));
        expect(json['is_hero'], isTrue);
        expect(json['is_breaking'], isFalse);
        expect(json['view_count'], equals(42));
        expect(json['slug'], equals('test-article'));
        expect(json['category_id'], equals('5'));
        expect(json['category_name'], equals('Politics'));
        expect(json['category_color'], equals('#FF0000'));
      });

      test('should serialize publishedAt as ISO8601', () {
        final json = tModel.toJson();

        expect(json['published_at'], isA<String>());
        expect(json['published_at'], equals(tPublishedAt.toIso8601String()));
      });
    });

    group('toEntity', () {
      test('should return Article with matching fields', () {
        final entity = tModel.toEntity();

        expect(entity, isA<Article>());
        expect(entity.id, equals(tModel.id));
        expect(entity.title, equals(tModel.title));
        expect(entity.titleEn, equals(tModel.titleEn));
        expect(entity.subtitle, equals(tModel.subtitle));
        expect(entity.content, equals(tModel.content));
        expect(entity.heroImageUrl, equals(tModel.heroImageUrl));
        expect(entity.heroImageCaption, equals(tModel.heroImageCaption));
        expect(entity.author, equals(tModel.author));
        expect(entity.hashtags, equals(tModel.hashtags));
        expect(entity.isHero, equals(tModel.isHero));
        expect(entity.isBreaking, equals(tModel.isBreaking));
        expect(entity.viewCount, equals(tModel.viewCount));
        expect(entity.slug, equals(tModel.slug));
        expect(entity.publishedAt, equals(tModel.publishedAt));
        expect(entity.categoryId, equals(tModel.categoryId));
        expect(entity.categoryName, equals(tModel.categoryName));
        expect(entity.categoryColor, equals(tModel.categoryColor));
      });
    });

    group('round-trip', () {
      test('fromJson(toJson(model)) should produce equivalent model', () {
        final json = tModel.toJson();
        final roundTripped = ArticleModel.fromJson(json);

        expect(roundTripped.id, equals(tModel.id));
        expect(roundTripped.title, equals(tModel.title));
        expect(roundTripped.titleEn, equals(tModel.titleEn));
        expect(roundTripped.subtitle, equals(tModel.subtitle));
        expect(roundTripped.content, equals(tModel.content));
        expect(roundTripped.heroImageUrl, equals(tModel.heroImageUrl));
        expect(roundTripped.heroImageCaption, equals(tModel.heroImageCaption));
        expect(roundTripped.author, equals(tModel.author));
        expect(roundTripped.hashtags, equals(tModel.hashtags));
        expect(roundTripped.isHero, equals(tModel.isHero));
        expect(roundTripped.isBreaking, equals(tModel.isBreaking));
        expect(roundTripped.viewCount, equals(tModel.viewCount));
        expect(roundTripped.slug, equals(tModel.slug));
        expect(roundTripped.publishedAt, equals(tModel.publishedAt));
        expect(roundTripped.categoryId, equals(tModel.categoryId));
        expect(roundTripped.categoryName, equals(tModel.categoryName));
        expect(roundTripped.categoryColor, equals(tModel.categoryColor));
      });
    });
  });
}
