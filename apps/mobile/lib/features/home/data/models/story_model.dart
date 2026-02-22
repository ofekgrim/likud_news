import '../../domain/entities/story.dart';

/// Data model for stories, handles JSON serialization.
class StoryModel {
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
  final String mediaType;

  const StoryModel({
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

  factory StoryModel.fromJson(Map<String, dynamic> json) {
    final article = json['article'] as Map<String, dynamic>?;
    return StoryModel(
      id: json['id'] as String,
      title: json['title'] as String,
      imageUrl: json['imageUrl'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      linkUrl: json['linkUrl'] as String?,
      articleId: json['articleId'] as String?,
      articleSlug: article?['slug'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
      videoUrl: json['videoUrl'] as String?,
      durationSeconds: json['durationSeconds'] as int? ?? 5,
      mediaType: json['mediaType'] as String? ?? 'image',
    );
  }

  Story toEntity() {
    return Story(
      id: id,
      title: title,
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl,
      linkUrl: linkUrl,
      articleId: articleId,
      articleSlug: articleSlug,
      sortOrder: sortOrder,
      videoUrl: videoUrl,
      durationSeconds: durationSeconds,
      mediaType: mediaType,
    );
  }
}
