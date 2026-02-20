import 'package:equatable/equatable.dart';

/// Sealed class representing a structured content block within an article body.
///
/// Each subclass represents a different block type (paragraph, heading, image,
/// embed, quote, etc.) that can be rendered in the article detail view.
sealed class ContentBlock extends Equatable {
  final String id;
  final String type;

  const ContentBlock({required this.id, required this.type});
}

/// A paragraph of text content.
class ParagraphBlock extends ContentBlock {
  final String text;

  const ParagraphBlock({required super.id, required this.text})
      : super(type: 'paragraph');

  @override
  List<Object?> get props => [id, type, text];
}

/// A heading block with configurable level (2, 3, or 4).
class HeadingBlock extends ContentBlock {
  final String text;
  final int level;

  const HeadingBlock({
    required super.id,
    required this.text,
    required this.level,
  }) : super(type: 'heading');

  @override
  List<Object?> get props => [id, type, text, level];
}

/// An image block with optional credit and captions.
class ImageBlock extends ContentBlock {
  final String url;
  final String? fullUrl;
  final String? credit;
  final String? captionHe;
  final String? captionEn;
  final String? altText;

  const ImageBlock({
    required super.id,
    required this.url,
    this.fullUrl,
    this.credit,
    this.captionHe,
    this.captionEn,
    this.altText,
  }) : super(type: 'image');

  @override
  List<Object?> get props =>
      [id, type, url, fullUrl, credit, captionHe, captionEn, altText];
}

/// A YouTube video embed block.
class YouTubeEmbedBlock extends ContentBlock {
  final String videoId;
  final String? caption;
  final String? credit;

  const YouTubeEmbedBlock({
    required super.id,
    required this.videoId,
    this.caption,
    this.credit,
  }) : super(type: 'youtube');

  @override
  List<Object?> get props => [id, type, videoId, caption, credit];
}

/// A Twitter/X tweet embed block.
class TweetEmbedBlock extends ContentBlock {
  final String tweetId;
  final String? authorHandle;
  final String? previewText;
  final String? caption;

  const TweetEmbedBlock({
    required super.id,
    required this.tweetId,
    this.authorHandle,
    this.previewText,
    this.caption,
  }) : super(type: 'tweet');

  @override
  List<Object?> get props =>
      [id, type, tweetId, authorHandle, previewText, caption];
}

/// A pull-quote block with optional attribution.
class QuoteBlock extends ContentBlock {
  final String text;
  final String? attribution;

  const QuoteBlock({
    required super.id,
    required this.text,
    this.attribution,
  }) : super(type: 'quote');

  @override
  List<Object?> get props => [id, type, text, attribution];
}

/// A visual divider/separator block.
class DividerBlock extends ContentBlock {
  const DividerBlock({required super.id}) : super(type: 'divider');

  @override
  List<Object?> get props => [id, type];
}

/// A bulleted list block containing multiple text items.
class BulletListBlock extends ContentBlock {
  final List<String> items;

  const BulletListBlock({
    required super.id,
    this.items = const [],
  }) : super(type: 'bullet_list');

  @override
  List<Object?> get props => [id, type, items];
}

/// A block linking to another article, displayed as a card or inline link.
class ArticleLinkBlock extends ContentBlock {
  final String linkedArticleId;
  final String displayStyle;
  final String? linkedArticleTitle;
  final String? linkedArticleImageUrl;
  final String? linkedArticleSlug;

  const ArticleLinkBlock({
    required super.id,
    required this.linkedArticleId,
    this.displayStyle = 'card',
    this.linkedArticleTitle,
    this.linkedArticleImageUrl,
    this.linkedArticleSlug,
  }) : super(type: 'article_link');

  @override
  List<Object?> get props => [
        id,
        type,
        linkedArticleId,
        displayStyle,
        linkedArticleTitle,
        linkedArticleImageUrl,
        linkedArticleSlug,
      ];
}

/// A video block supporting YouTube embeds and uploaded video files.
class VideoBlock extends ContentBlock {
  final String source; // 'youtube' or 'upload'
  final String? videoId;
  final String? url;
  final String? thumbnailUrl;
  final String? caption;
  final String? credit;
  final String? mimeType;

  const VideoBlock({
    required super.id,
    required this.source,
    this.videoId,
    this.url,
    this.thumbnailUrl,
    this.caption,
    this.credit,
    this.mimeType,
  }) : super(type: 'video');

  @override
  List<Object?> get props =>
      [id, type, source, videoId, url, thumbnailUrl, caption, credit, mimeType];
}
