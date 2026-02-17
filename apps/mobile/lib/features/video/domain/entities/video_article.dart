import 'package:equatable/equatable.dart';

/// Immutable video article entity used throughout the domain and presentation layers.
class VideoArticle extends Equatable {
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

  const VideoArticle({
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

  @override
  List<Object?> get props => [
        id,
        title,
        subtitle,
        heroImageUrl,
        videoUrl,
        duration,
        categoryName,
        categoryColor,
        slug,
        publishedAt,
      ];
}
