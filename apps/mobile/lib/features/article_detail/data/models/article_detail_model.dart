import '../../../home/domain/entities/article.dart';
import '../../domain/entities/article_detail.dart';
import '../../domain/entities/author.dart';
import '../../domain/entities/content_block.dart';
import '../../domain/entities/tag.dart';
import 'content_block_model.dart';

/// Data model for full article detail responses.
///
/// Handles JSON serialization/deserialization and converts
/// to the domain [ArticleDetail] entity.
class ArticleDetailModel {
  final String id;
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
  final String? categoryId;
  final String? categoryName;
  final String? categoryColor;
  final List<Article> relatedArticles;
  final bool isFavorite;

  // --- Enhanced article fields ---
  final List<ContentBlock> bodyBlocks;
  final String? alertBannerText;
  final bool alertBannerEnabled;
  final String? alertBannerColor;
  final String? heroImageCredit;
  final String? heroImageCaptionHe;
  final String? heroImageFullUrl;
  final Author? authorEntity;
  final List<Tag> tags;
  final bool allowComments;
  final int? readingTimeMinutes;
  final int shareCount;
  final int commentCount;
  final List<Article> sameCategoryArticles;
  final List<Article> recommendedArticles;

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
    this.bodyBlocks = const [],
    this.alertBannerText,
    this.alertBannerEnabled = false,
    this.alertBannerColor,
    this.heroImageCredit,
    this.heroImageCaptionHe,
    this.heroImageFullUrl,
    this.authorEntity,
    this.tags = const [],
    this.allowComments = true,
    this.readingTimeMinutes,
    this.shareCount = 0,
    this.commentCount = 0,
    this.sameCategoryArticles = const [],
    this.recommendedArticles = const [],
  });

  /// Creates an [ArticleDetailModel] from a JSON map.
  factory ArticleDetailModel.fromJson(Map<String, dynamic> json) {
    return ArticleDetailModel(
      id: json['id'] as String,
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
      categoryId: json['categoryId'] as String?,
      categoryName: json['categoryName'] as String?,
      categoryColor: json['categoryColor'] as String?,
      relatedArticles: (json['relatedArticles'] as List<dynamic>?)
              ?.map((e) => _articleFromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      isFavorite: json['isFavorite'] as bool? ?? false,
      bodyBlocks:
          ContentBlockModel.fromJsonList(json['bodyBlocks'] as List<dynamic>?),
      alertBannerText: json['alertBannerText'] as String?,
      alertBannerEnabled: json['alertBannerEnabled'] as bool? ?? false,
      alertBannerColor: json['alertBannerColor'] as String?,
      heroImageCredit: json['heroImageCredit'] as String?,
      heroImageCaptionHe: json['heroImageCaptionHe'] as String?,
      heroImageFullUrl: json['heroImageFullUrl'] as String?,
      authorEntity: json['authorEntity'] != null
          ? Author(
              id: (json['authorEntity'] as Map<String, dynamic>)['id']
                      as String? ??
                  '',
              nameHe: (json['authorEntity']
                      as Map<String, dynamic>)['nameHe'] as String? ??
                  '',
              nameEn: (json['authorEntity']
                  as Map<String, dynamic>)['nameEn'] as String?,
              roleHe: (json['authorEntity']
                  as Map<String, dynamic>)['roleHe'] as String?,
              roleEn: (json['authorEntity']
                  as Map<String, dynamic>)['roleEn'] as String?,
              bioHe: (json['authorEntity']
                  as Map<String, dynamic>)['bioHe'] as String?,
              avatarUrl: (json['authorEntity']
                  as Map<String, dynamic>)['avatarUrl'] as String?,
              avatarThumbnailUrl: (json['authorEntity']
                      as Map<String, dynamic>)['avatarThumbnailUrl']
                  as String?,
            )
          : null,
      tags: (json['tags'] as List<dynamic>?)?.map((e) {
            final t = e as Map<String, dynamic>;
            return Tag(
              id: t['id'] as String,
              nameHe: t['nameHe'] as String? ?? '',
              nameEn: t['nameEn'] as String?,
              slug: t['slug'] as String? ?? '',
              tagType: t['tagType'] as String? ?? 'topic',
            );
          }).toList() ??
          const [],
      allowComments: json['allowComments'] as bool? ?? true,
      readingTimeMinutes: json['readingTimeMinutes'] as int?,
      shareCount: json['shareCount'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? 0,
      sameCategoryArticles: (json['sameCategoryArticles'] as List<dynamic>?)
              ?.map((e) => _articleFromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      recommendedArticles: (json['recommendedArticles'] as List<dynamic>?)
              ?.map((e) => _articleFromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
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
      bodyBlocks: bodyBlocks,
      alertBannerText: alertBannerText,
      alertBannerEnabled: alertBannerEnabled,
      alertBannerColor: alertBannerColor,
      heroImageCredit: heroImageCredit,
      heroImageCaptionHe: heroImageCaptionHe,
      heroImageFullUrl: heroImageFullUrl,
      authorEntity: authorEntity,
      tags: tags,
      allowComments: allowComments,
      readingTimeMinutes: readingTimeMinutes,
      shareCount: shareCount,
      commentCount: commentCount,
      sameCategoryArticles: sameCategoryArticles,
      recommendedArticles: recommendedArticles,
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
      'alertBannerText': alertBannerText,
      'alertBannerEnabled': alertBannerEnabled,
      'alertBannerColor': alertBannerColor,
      'heroImageCredit': heroImageCredit,
      'heroImageCaptionHe': heroImageCaptionHe,
      'heroImageFullUrl': heroImageFullUrl,
      'allowComments': allowComments,
      'readingTimeMinutes': readingTimeMinutes,
      'shareCount': shareCount,
      'commentCount': commentCount,
      if (authorEntity != null)
        'authorEntity': {
          'id': authorEntity!.id,
          'nameHe': authorEntity!.nameHe,
          'nameEn': authorEntity!.nameEn,
          'roleHe': authorEntity!.roleHe,
          'roleEn': authorEntity!.roleEn,
          'bioHe': authorEntity!.bioHe,
          'avatarUrl': authorEntity!.avatarUrl,
          'avatarThumbnailUrl': authorEntity!.avatarThumbnailUrl,
        },
      'tags': tags
          .map((t) => {
                'id': t.id,
                'nameHe': t.nameHe,
                'nameEn': t.nameEn,
                'slug': t.slug,
                'tagType': t.tagType,
              })
          .toList(),
    };
  }

  /// Parses a related article from JSON into an [Article] entity.
  static Article _articleFromJson(Map<String, dynamic> json) {
    return Article(
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
}
