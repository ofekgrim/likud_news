import 'package:equatable/equatable.dart';

/// Immutable article entity used throughout the domain and presentation layers.
class Article extends Equatable {
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

  const Article({
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

  @override
  List<Object?> get props => [
        id,
        title,
        titleEn,
        subtitle,
        content,
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
      ];
}
