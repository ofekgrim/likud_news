import 'package:metzudat_halikud/features/article_detail/domain/entities/article_detail.dart';
import 'package:metzudat_halikud/features/home/domain/entities/article.dart';
import 'package:metzudat_halikud/features/home/domain/entities/category.dart';
import 'package:metzudat_halikud/features/home/domain/entities/ticker_item.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member_detail.dart';
import 'package:metzudat_halikud/features/search/domain/entities/search_result.dart';
import 'package:metzudat_halikud/features/video/domain/entities/video_article.dart';

/// Creates a test [Article] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Article createTestArticle({
  String id = '1',
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
  String? categoryId = '1',
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
      id: '${index + 1}',
      title: 'Test Article ${index + 1}',
      slug: 'test-article-${index + 1}',
    ),
  );
}

/// Creates a test [Category] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Category createTestCategory({
  String id = '1',
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
  String id = '1',
  String text = 'Test ticker headline',
  String? linkUrl = 'https://example.com/article',
  String? articleId = '1',
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

/// Creates a test [ArticleDetail] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
ArticleDetail createTestArticleDetail({
  String id = '1',
  String title = 'Test Article Detail',
  String? titleEn = 'Test Article Detail EN',
  String? subtitle = 'Test subtitle',
  String? content = '<p>Test content</p>',
  String? contentEn = '<p>Test content EN</p>',
  String? heroImageUrl = 'https://example.com/image.jpg',
  String? heroImageCaption = 'Test caption',
  String? author = 'Test Author',
  List<String> hashtags = const [],
  bool isHero = false,
  bool isBreaking = false,
  int viewCount = 0,
  String? slug = 'test-article-detail',
  DateTime? publishedAt,
  String? categoryId = '1',
  String? categoryName = 'Test Category',
  String? categoryColor = '#0099DB',
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
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
    categoryId: categoryId,
    categoryName: categoryName,
    categoryColor: categoryColor,
    relatedArticles: relatedArticles,
    isFavorite: isFavorite,
  );
}

/// Creates a test [SearchResult] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
SearchResult createTestSearchResult({
  List<Article>? articles,
  int totalArticles = 3,
}) {
  return SearchResult(
    articles: articles ?? createTestArticleList(3),
    totalArticles: totalArticles,
  );
}

/// Creates a test [Member] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
Member createTestMember({
  String id = '1',
  String name = 'Test Member',
  String? nameEn = 'Test Member EN',
  String? title = 'Member of Knesset',
  String? bio = 'Test bio for member',
  String? photoUrl = 'https://example.com/photo.jpg',
  String? socialTwitter,
  String? socialFacebook,
  String? socialInstagram,
  bool isActive = true,
  int sortOrder = 0,
}) {
  return Member(
    id: id,
    name: name,
    nameEn: nameEn,
    title: title,
    bio: bio,
    photoUrl: photoUrl,
    socialTwitter: socialTwitter,
    socialFacebook: socialFacebook,
    socialInstagram: socialInstagram,
    isActive: isActive,
    sortOrder: sortOrder,
  );
}

/// Creates a test [MemberDetail] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
MemberDetail createTestMemberDetail({
  Member? member,
  List<Article> articles = const [],
}) {
  return MemberDetail(
    member: member ?? createTestMember(),
    articles: articles,
  );
}

/// Creates a test [VideoArticle] with sensible defaults.
///
/// Override any parameter to customize the fixture for a specific test case.
VideoArticle createTestVideoArticle({
  String id = '1',
  String title = 'Test Video',
  String? subtitle = 'Test video subtitle',
  String? heroImageUrl = 'https://example.com/thumb.jpg',
  String? videoUrl = 'https://example.com/video.mp4',
  int duration = 120,
  String? categoryName = 'Video Category',
  String? categoryColor = '#0099DB',
  String? slug = 'test-video',
  DateTime? publishedAt,
}) {
  return VideoArticle(
    id: id,
    title: title,
    subtitle: subtitle,
    heroImageUrl: heroImageUrl,
    videoUrl: videoUrl,
    duration: duration,
    categoryName: categoryName,
    categoryColor: categoryColor,
    slug: slug,
    publishedAt: publishedAt ?? DateTime(2024, 1, 15, 10, 30),
  );
}
