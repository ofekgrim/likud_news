import '../../../home/domain/entities/article.dart';
import '../../domain/entities/article_detail.dart';

/// Data model for full article detail responses.
///
/// Handles JSON serialization/deserialization and converts
/// to the domain [ArticleDetail] entity.
class ArticleDetailModel {
  final int id;
  final String title;
  final String? titleEn;
  final String? subtitle;
  final String? content;
  final String? contentEn;
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
  final List<Article> relatedArticles;
  final bool isFavorite;

  const ArticleDetailModel({
    required this.id,
    required this.title,
    this.titleEn,
    this.subtitle,
    this.content,
    this.contentEn,
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
    this.relatedArticles = const [],
    this.isFavorite = false,
  });

  /// Creates an [ArticleDetailModel] from a JSON map.
  factory ArticleDetailModel.fromJson(Map<String, dynamic> json) {
    return ArticleDetailModel(
      id: json['id'] as int,
      title: json['title'] as String,
      titleEn: json['titleEn'] as String?,
      subtitle: json['subtitle'] as String?,
      content: json['content'] as String?,
      contentEn: json['contentEn'] as String?,
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
      categoryId: json['categoryId'] as int?,
      categoryName: json['categoryName'] as String?,
      categoryColor: json['categoryColor'] as String?,
      relatedArticles: (json['relatedArticles'] as List<dynamic>?)
              ?.map((e) => _articleFromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      isFavorite: json['isFavorite'] as bool? ?? false,
    );
  }

  /// Converts this model to a domain [ArticleDetail] entity.
  ArticleDetail toEntity() {
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
      publishedAt: publishedAt,
      categoryId: categoryId,
      categoryName: categoryName,
      categoryColor: categoryColor,
      relatedArticles: relatedArticles,
      isFavorite: isFavorite,
    );
  }

  /// Converts this model to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'titleEn': titleEn,
      'subtitle': subtitle,
      'content': content,
      'contentEn': contentEn,
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
      'isFavorite': isFavorite,
    };
  }

  /// Parses a related article from JSON into an [Article] entity.
  static Article _articleFromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] as int,
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
      categoryId: json['categoryId'] as int?,
      categoryName: json['categoryName'] as String?,
      categoryColor: json['categoryColor'] as String?,
    );
  }
}
