import 'package:equatable/equatable.dart';

import '../../../home/domain/entities/article.dart';

/// Full article detail entity with content body and related articles.
///
/// Extends the base [Article] data with HTML content, English translations,
/// related articles list, and favorite status for the detail view.
class ArticleDetail extends Equatable {
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
  });

  /// Creates a copy with optional field overrides.
  ArticleDetail copyWith({
    int? id,
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
    int? categoryId,
    String? categoryName,
    String? categoryColor,
    List<Article>? relatedArticles,
    bool? isFavorite,
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
      ];
}
