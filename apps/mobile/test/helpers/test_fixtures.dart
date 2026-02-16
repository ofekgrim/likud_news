import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';

/// Creates a test [Article] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Article createTestArticle({
  int id = 1,
  String title = 'Test Article',
  String? titleEn = 'Test Article EN',
  String? subtitle = 'Test subtitle',
  String? content = '<p>Test article content</p>',
  String? heroImageUrl = 'https://example.com/image.jpg',
  String? heroImageCaption = 'Test caption',
  String? author = 'Test Author',
  List<String> hashtags = const [],
  bool isHero = false,
  bool isBreaking = false,
  int viewCount = 0,
  String? slug = 'test-article',
  DateTime? publishedAt,
  int? categoryId = 1,
  String? categoryName = 'Test Category',
  String? categoryColor = '#0099DB',
}) {
  return Article(
    id: id,
    title: title,
    titleEn: titleEn,
    subtitle: subtitle,
    content: content,
    heroImageUrl: heroImageUrl,
    heroImageCaption: heroImageCaption,
    author: author,
    hashtags: hashtags,
    isHero: isHero,
    isBreaking: isBreaking,
    viewCount: viewCount,
    slug: slug,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    categoryId: categoryId,
    categoryName: categoryName,
    categoryColor: categoryColor,
  );
}

/// Creates a list of [count] test articles with sequential IDs and titles.
List<Article> createTestArticleList(int count) {
  return List.generate(
    count,
    (index) => createTestArticle(
      id: index + 1,
      title: 'Test Article ${index + 1}',
      slug: 'test-article-${index + 1}',
    ),
  );
}

/// Creates a test [Category] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Category createTestCategory({
  int id = 1,
  String name = 'Test Category',
  String? nameEn = 'Test Category EN',
  String? slug = 'test-category',
  String? iconUrl = 'https://example.com/icon.svg',
  int sortOrder = 0,
  bool isActive = true,
  String? color = '#0099DB',
}) {
  return Category(
    id: id,
    name: name,
    nameEn: nameEn,
    slug: slug,
    iconUrl: iconUrl,
    sortOrder: sortOrder,
    isActive: isActive,
    color: color,
  );
}

/// Creates a test [TickerItem] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
TickerItem createTestTickerItem({
  int id = 1,
  String text = 'Test ticker headline',
  String? linkUrl = 'https://example.com/article',
  int? articleId = 1,
  int position = 0,
  bool isActive = true,
}) {
  return TickerItem(
    id: id,
    text: text,
    linkUrl: linkUrl,
    articleId: articleId,
    position: position,
    isActive: isActive,
  );
}
