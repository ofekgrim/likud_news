import '../../domain/entities/content_block.dart';

/// Data model that parses JSON arrays into [ContentBlock] sealed class instances.
///
/// Each JSON object must contain a `type` field to determine the block subclass.
/// Unknown block types are silently skipped.
class ContentBlockModel {
  /// Parses a list of JSON objects into [ContentBlock] entities.
  static List<ContentBlock> fromJsonList(List<dynamic>? json) {
    if (json == null || json.isEmpty) return const [];
    return json
        .whereType<Map<String, dynamic>>()
        .map(_fromJson)
        .where((block) => block != null)
        .cast<ContentBlock>()
        .toList();
  }

  static ContentBlock? _fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String?;
    final id = json['id'] as String? ?? '';

    switch (type) {
      case 'paragraph':
        return ParagraphBlock(id: id, text: json['text'] as String? ?? '');
      case 'heading':
        return HeadingBlock(
          id: id,
          text: json['text'] as String? ?? '',
          level: json['level'] as int? ?? 2,
        );
      case 'image':
        return ImageBlock(
          id: id,
          url: json['url'] as String? ?? '',
          fullUrl: json['fullUrl'] as String?,
          credit: json['credit'] as String?,
          captionHe: json['captionHe'] as String?,
          captionEn: json['captionEn'] as String?,
          altText: json['altText'] as String?,
        );
      case 'youtube':
        return YouTubeEmbedBlock(
          id: id,
          videoId: json['videoId'] as String? ?? '',
          caption: json['caption'] as String?,
          credit: json['credit'] as String?,
        );
      case 'tweet':
        return TweetEmbedBlock(
          id: id,
          tweetId: json['tweetId'] as String? ?? '',
          authorHandle: json['authorHandle'] as String?,
          previewText: json['previewText'] as String?,
          caption: json['caption'] as String?,
        );
      case 'quote':
        return QuoteBlock(
          id: id,
          text: json['text'] as String? ?? '',
          attribution: json['attribution'] as String?,
        );
      case 'divider':
        return DividerBlock(id: id);
      case 'bullet_list':
        return BulletListBlock(
          id: id,
          items: (json['items'] as List<dynamic>?)
                  ?.map((e) => e as String)
                  .toList() ??
              const [],
        );
      case 'article_link':
        final linked = json['linkedArticle'] as Map<String, dynamic>?;
        return ArticleLinkBlock(
          id: id,
          linkedArticleId: json['linkedArticleId'] as String? ?? '',
          displayStyle: json['displayStyle'] as String? ?? 'card',
          linkedArticleTitle: linked?['title'] as String?,
          linkedArticleImageUrl: linked?['heroImageUrl'] as String?,
          linkedArticleSlug: linked?['slug'] as String?,
        );
      case 'video':
        return VideoBlock(
          id: id,
          source: json['source'] as String? ?? 'youtube',
          videoId: json['videoId'] as String?,
          url: json['url'] as String?,
          thumbnailUrl: json['thumbnailUrl'] as String?,
          caption: json['caption'] as String?,
          credit: json['credit'] as String?,
          mimeType: json['mimeType'] as String?,
        );
      default:
        return null; // Skip unknown block types
    }
  }
}
