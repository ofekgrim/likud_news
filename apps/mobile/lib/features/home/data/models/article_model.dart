import '../../domain/entities/article.dart';

/// Data model for articles, handles JSON serialization.
///
/// Maps API responses to the domain [Article] entity via [toEntity].
class ArticleModel {
  final int id;
  final String title;
  final String? titleEn;
  final String? subtitle;
  final String? content;
  final String? heroImageUrl;
  final String? heroImageCaption;
  final String? author;
  final List<String> hashtags;
  final bool isHero;
  final bool isBreaking;
  final int viewCount;
  final String? slug;
  final DateTime? publishedAt;
  final int? categoryId;
  final String? categoryName;
  final String? categoryColor;

  const ArticleModel({
    required this.id,
    required this.title,
    this.titleEn,
    this.subtitle,
    this.content,
    this.heroImageUrl,
    this.heroImageCaption,
    this.author,
    this.hashtags = const [],
    this.isHero = false,
    this.isBreaking = false,
    this.viewCount = 0,
    this.slug,
    this.publishedAt,
    this.categoryId,
    this.categoryName,
    this.categoryColor,
  });

  factory ArticleModel.fromJson(Map<String, dynamic> json) {
    return ArticleModel(
      id: json['id'] as int,
      title: json['title'] as String,
      titleEn: json['title_en'] as String?,
      subtitle: json['subtitle'] as String?,
      content: json['content'] as String?,
      heroImageUrl: json['hero_image_url'] as String?,
      heroImageCaption: json['hero_image_caption'] as String?,
      author: json['author'] as String?,
      hashtags: (json['hashtags'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      isHero: json['is_hero'] as bool? ?? false,
      isBreaking: json['is_breaking'] as bool? ?? false,
      viewCount: json['view_count'] as int? ?? 0,
      slug: json['slug'] as String?,
      publishedAt: json['published_at'] != null
          ? DateTime.tryParse(json['published_at'] as String)
          : null,
      categoryId: json['category_id'] as int?,
      categoryName: json['category_name'] as String?,
      categoryColor: json['category_color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'title_en': titleEn,
      'subtitle': subtitle,
      'content': content,
      'hero_image_url': heroImageUrl,
      'hero_image_caption': heroImageCaption,
      'author': author,
      'hashtags': hashtags,
      'is_hero': isHero,
      'is_breaking': isBreaking,
      'view_count': viewCount,
      'slug': slug,
      'published_at': publishedAt?.toIso8601String(),
      'category_id': categoryId,
      'category_name': categoryName,
      'category_color': categoryColor,
    };
  }

  Article toEntity() {
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
      publishedAt: publishedAt,
      categoryId: categoryId,
      categoryName: categoryName,
      categoryColor: categoryColor,
    );
  }
}
