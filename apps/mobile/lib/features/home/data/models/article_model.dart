import '../../domain/entities/article.dart';

/// Data model for articles, handles JSON serialization.
///
/// Maps API responses to the domain [Article] entity via [toEntity].
class ArticleModel {
  final String id;
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
  final String? categoryId;
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
      id: json['id'] as String,
      title: json['title'] as String,
      titleEn: json['titleEn'] as String?,
      subtitle: json['subtitle'] as String?,
      content: json['content'] as String?,
      heroImageUrl: json['heroImageUrl'] as String?,
      heroImageCaption: json['heroImageCaption'] as String?,
      author: json['author'] as String?,
      hashtags: (json['hashtags'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      isHero: json['isHero'] as bool? ?? false,
      isBreaking: json['isBreaking'] as bool? ?? false,
      viewCount: json['viewCount'] as int? ?? 0,
      slug: json['slug'] as String?,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'] as String)
          : null,
      categoryId: json['categoryId'] as String?,
      categoryName: json['categoryName'] as String?,
      categoryColor: json['categoryColor'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleEn': titleEn,
      'subtitle': subtitle,
      'content': content,
      'heroImageUrl': heroImageUrl,
      'heroImageCaption': heroImageCaption,
      'author': author,
      'hashtags': hashtags,
      'isHero': isHero,
      'isBreaking': isBreaking,
      'viewCount': viewCount,
      'slug': slug,
      'publishedAt': publishedAt?.toIso8601String(),
      'categoryId': categoryId,
      'categoryName': categoryName,
      'categoryColor': categoryColor,
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
