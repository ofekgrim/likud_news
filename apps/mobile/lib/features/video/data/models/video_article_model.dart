import '../../domain/entities/video_article.dart';

/// Data model for video articles, handles JSON serialization.
///
/// Maps API responses to the domain [VideoArticle] entity via [toEntity].
class VideoArticleModel {
  final String id;
  final String title;
  final String? subtitle;
  final String? heroImageUrl;
  final String? videoUrl;
  final int duration;
  final String? categoryName;
  final String? categoryColor;
  final String? slug;
  final DateTime? publishedAt;

  const VideoArticleModel({
    required this.id,
    required this.title,
    this.subtitle,
    this.heroImageUrl,
    this.videoUrl,
    this.duration = 0,
    this.categoryName,
    this.categoryColor,
    this.slug,
    this.publishedAt,
  });

  factory VideoArticleModel.fromJson(Map<String, dynamic> json) {
    return VideoArticleModel(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      heroImageUrl: json['heroImageUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      duration: json['duration'] as int? ?? 0,
      categoryName: json['categoryName'] as String?,
      categoryColor: json['categoryColor'] as String?,
      slug: json['slug'] as String?,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'heroImageUrl': heroImageUrl,
      'videoUrl': videoUrl,
      'duration': duration,
      'categoryName': categoryName,
      'categoryColor': categoryColor,
      'slug': slug,
      'publishedAt': publishedAt?.toIso8601String(),
    };
  }

  VideoArticle toEntity() {
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
      publishedAt: publishedAt,
    );
  }
}
