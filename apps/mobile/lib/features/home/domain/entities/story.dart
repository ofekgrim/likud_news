import 'package:equatable/equatable.dart';

/// An Instagram-style story displayed in the home screen's circle row.
///
/// Stories can be independent (just title + image), linked to an article
/// (via [articleId]), or have an external link ([linkUrl]).
class Story extends Equatable {
  final String id;
  final String title;
  final String imageUrl;
  final String? thumbnailUrl;
  final String? linkUrl;
  final String? articleId;
  final String? articleSlug;
  final int sortOrder;
  final String? videoUrl;
  final int durationSeconds;
  final String mediaType; // 'image' or 'video'

  const Story({
    required this.id,
    required this.title,
    required this.imageUrl,
    this.thumbnailUrl,
    this.linkUrl,
    this.articleId,
    this.articleSlug,
    this.sortOrder = 0,
    this.videoUrl,
    this.durationSeconds = 5,
    this.mediaType = 'image',
  });

  /// Returns the thumbnail URL, falling back to the full image URL.
  String get displayImageUrl => thumbnailUrl ?? imageUrl;

  @override
  List<Object?> get props => [
        id,
        title,
        imageUrl,
        thumbnailUrl,
        linkUrl,
        articleId,
        articleSlug,
        sortOrder,
        videoUrl,
        durationSeconds,
        mediaType,
      ];
}
