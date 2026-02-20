import 'package:equatable/equatable.dart';

import '../../../home/domain/entities/article.dart';
import 'author.dart';
import 'content_block.dart';
import 'tag.dart';

/// Full article detail entity with content body and related articles.
///
/// Extends the base [Article] data with HTML content, English translations,
/// related articles list, and favorite status for the detail view.
class ArticleDetail extends Equatable {
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

  /// Structured body content blocks parsed from TipTap editor output.
  final List<ContentBlock> bodyBlocks;

  /// Optional alert banner text displayed above the article.
  final String? alertBannerText;

  /// Whether the alert banner is currently enabled.
  final bool alertBannerEnabled;

  /// Custom color for the alert banner (hex string).
  final String? alertBannerColor;

  /// Credit/attribution for the hero image.
  final String? heroImageCredit;

  /// Hebrew caption for the hero image.
  final String? heroImageCaptionHe;

  /// Full-resolution URL of the hero image.
  final String? heroImageFullUrl;

  /// Structured author entity with localized name, role, and avatar.
  final Author? authorEntity;

  /// Tags classifying this article by topic, person, or location.
  final List<Tag> tags;

  /// Whether comments are allowed on this article.
  final bool allowComments;

  /// Estimated reading time in minutes.
  final int? readingTimeMinutes;

  /// Number of times this article has been shared.
  final int shareCount;

  /// Number of comments on this article.
  final int commentCount;

  /// Articles from the same category for "more from" section.
  final List<Article> sameCategoryArticles;

  /// Recommended articles from other categories (most-read).
  final List<Article> recommendedArticles;

  const ArticleDetail({
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

  /// Creates a copy with optional field overrides.
  ArticleDetail copyWith({
    String? id,
    String? title,
    String? titleEn,
    String? subtitle,
    String? content,
    String? contentEn,
    String? heroImageUrl,
    String? heroImageCaption,
    String? author,
    List<String>? hashtags,
    bool? isHero,
    bool? isBreaking,
    int? viewCount,
    String? slug,
    DateTime? publishedAt,
    String? categoryId,
    String? categoryName,
    String? categoryColor,
    List<Article>? relatedArticles,
    bool? isFavorite,
    List<ContentBlock>? bodyBlocks,
    String? alertBannerText,
    bool? alertBannerEnabled,
    String? alertBannerColor,
    String? heroImageCredit,
    String? heroImageCaptionHe,
    String? heroImageFullUrl,
    Author? authorEntity,
    List<Tag>? tags,
    bool? allowComments,
    int? readingTimeMinutes,
    int? shareCount,
    int? commentCount,
    List<Article>? sameCategoryArticles,
    List<Article>? recommendedArticles,
  }) {
    return ArticleDetail(
      id: id ?? this.id,
      title: title ?? this.title,
      titleEn: titleEn ?? this.titleEn,
      subtitle: subtitle ?? this.subtitle,
      content: content ?? this.content,
      contentEn: contentEn ?? this.contentEn,
      heroImageUrl: heroImageUrl ?? this.heroImageUrl,
      heroImageCaption: heroImageCaption ?? this.heroImageCaption,
      author: author ?? this.author,
      hashtags: hashtags ?? this.hashtags,
      isHero: isHero ?? this.isHero,
      isBreaking: isBreaking ?? this.isBreaking,
      viewCount: viewCount ?? this.viewCount,
      slug: slug ?? this.slug,
      publishedAt: publishedAt ?? this.publishedAt,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName ?? this.categoryName,
      categoryColor: categoryColor ?? this.categoryColor,
      relatedArticles: relatedArticles ?? this.relatedArticles,
      isFavorite: isFavorite ?? this.isFavorite,
      bodyBlocks: bodyBlocks ?? this.bodyBlocks,
      alertBannerText: alertBannerText ?? this.alertBannerText,
      alertBannerEnabled: alertBannerEnabled ?? this.alertBannerEnabled,
      alertBannerColor: alertBannerColor ?? this.alertBannerColor,
      heroImageCredit: heroImageCredit ?? this.heroImageCredit,
      heroImageCaptionHe: heroImageCaptionHe ?? this.heroImageCaptionHe,
      heroImageFullUrl: heroImageFullUrl ?? this.heroImageFullUrl,
      authorEntity: authorEntity ?? this.authorEntity,
      tags: tags ?? this.tags,
      allowComments: allowComments ?? this.allowComments,
      readingTimeMinutes: readingTimeMinutes ?? this.readingTimeMinutes,
      shareCount: shareCount ?? this.shareCount,
      commentCount: commentCount ?? this.commentCount,
      sameCategoryArticles: sameCategoryArticles ?? this.sameCategoryArticles,
      recommendedArticles: recommendedArticles ?? this.recommendedArticles,
    );
  }

  /// Converts the detail entity back to a base [Article] for list usage.
  Article toArticle() {
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

  @override
  List<Object?> get props => [
        id,
        title,
        titleEn,
        subtitle,
        content,
        contentEn,
        heroImageUrl,
        heroImageCaption,
        author,
        hashtags,
        isHero,
        isBreaking,
        viewCount,
        slug,
        publishedAt,
        categoryId,
        categoryName,
        categoryColor,
        relatedArticles,
        isFavorite,
        bodyBlocks,
        alertBannerText,
        alertBannerEnabled,
        alertBannerColor,
        heroImageCredit,
        heroImageCaptionHe,
        heroImageFullUrl,
        authorEntity,
        tags,
        allowComments,
        readingTimeMinutes,
        shareCount,
        commentCount,
        sameCategoryArticles,
        recommendedArticles,
      ];
}
