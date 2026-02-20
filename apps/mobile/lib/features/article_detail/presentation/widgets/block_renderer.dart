import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/ads/ad_banner_widget.dart';
import '../../../../core/ads/ad_config.dart';
import '../../domain/entities/content_block.dart';
import 'article_content.dart';
import 'drop_cap_paragraph.dart';
import 'inline_image_widget.dart';
import 'internal_link_card.dart';
import 'quote_widget.dart';
import 'tweet_embed_widget.dart';
import 'video_player_widget.dart';
import 'youtube_embed_widget.dart';

/// Renders a list of structured [ContentBlock] items into Flutter widgets.
///
/// Converts each block type to the appropriate widget: paragraphs with HTML
/// support and an optional drop-cap for the first paragraph, headings, images,
/// YouTube and tweet embeds, quotes with attribution, bullet lists, dividers,
/// and inline article link cards.
///
/// Optionally inserts inline ad banners after paragraph indices defined by
/// [AdConfig]. Falls back to HTML rendering via [ArticleContent] when the
/// block list is empty and [htmlFallback] is provided.
class BlockRenderer extends StatelessWidget {
  /// Structured content blocks from the TipTap editor.
  final List<ContentBlock> blocks;

  /// Font scale multiplier for body text (default 1.0, range 0.8-1.6).
  final double fontScale;

  /// Fallback HTML content when no structured blocks are available.
  final String? htmlFallback;

  /// Whether to insert inline ad banners between paragraphs.
  final bool showAds;

  const BlockRenderer({
    super.key,
    required this.blocks,
    this.fontScale = 1.0,
    this.htmlFallback,
    this.showAds = true,
  });

  @override
  Widget build(BuildContext context) {
    // Fallback: render HTML content if no structured blocks are available.
    if (blocks.isEmpty) {
      if (htmlFallback != null && htmlFallback!.isNotEmpty) {
        return ArticleContent(
          htmlContent: htmlFallback!,
          showAds: showAds,
        );
      }
      return const SizedBox.shrink();
    }

    final children = <Widget>[];
    var paragraphIndex = 0;

    for (var i = 0; i < blocks.length; i++) {
      final block = blocks[i];

      // Build the widget for this block.
      children.add(_buildBlock(context, block, paragraphIndex));

      // Track paragraph indices for ad placement.
      if (block is ParagraphBlock) {
        paragraphIndex++;

        // Insert inline ads after configured paragraph positions.
        if (showAds) {
          if (paragraphIndex == AdConfig.firstAdAfterParagraph &&
              blocks.length > AdConfig.firstAdAfterParagraph) {
            children.add(const AdBannerWidget());
          } else if (paragraphIndex == AdConfig.secondAdAfterParagraph &&
              blocks.length > AdConfig.secondAdAfterParagraph) {
            children.add(const AdBannerWidget());
          }
        }
      }

      // Spacing between blocks (not after the last one).
      if (i < blocks.length - 1) {
        children.add(const SizedBox(height: 22));
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  /// Dispatches to the appropriate builder for each [ContentBlock] subtype.
  Widget _buildBlock(
    BuildContext context,
    ContentBlock block,
    int paragraphIndex,
  ) {
    return switch (block) {
      ParagraphBlock b => _buildParagraph(b, paragraphIndex),
      HeadingBlock b => _buildHeading(b),
      ImageBlock b => InlineImageWidget(block: b, fontScale: fontScale),
      YouTubeEmbedBlock b => YouTubeEmbedWidget(block: b),
      TweetEmbedBlock b => TweetEmbedWidget(block: b),
      QuoteBlock b => QuoteWidget(block: b, fontScale: fontScale),
      DividerBlock _ => const Divider(color: AppColors.border),
      BulletListBlock b => _buildBulletList(b),
      ArticleLinkBlock b => InternalLinkCard(block: b),
      VideoBlock b => VideoPlayerWidget(block: b, fontScale: fontScale),
    };
  }

  /// Renders a paragraph block. The first paragraph gets a drop-cap treatment;
  /// subsequent paragraphs render inline HTML (supporting bold, italic, links).
  Widget _buildParagraph(ParagraphBlock block, int paragraphIndex) {
    if (paragraphIndex == 0 && _stripHtml(block.text).length > 1) {
      return DropCapParagraph(text: _stripHtml(block.text));
    }

    return HtmlWidget(
      block.text,
      textStyle: TextStyle(
        fontFamily: 'Heebo',
        fontSize: 18 * fontScale,
        height: 1.9,
        color: AppColors.textPrimary,
      ),
      customStylesBuilder: (element) {
        switch (element.localName) {
          case 'a':
            return {
              'color': '#0099DB',
              'text-decoration': 'underline',
            };
          case 'strong':
          case 'b':
            return {'font-weight': '700'};
          default:
            return null;
        }
      },
      onTapUrl: (url) {
        launchUrl(
          Uri.parse(url),
          mode: LaunchMode.externalApplication,
        );
        return true;
      },
    );
  }

  /// Renders a heading block with size determined by [HeadingBlock.level].
  Widget _buildHeading(HeadingBlock block) {
    final double fontSize;
    switch (block.level) {
      case 2:
        fontSize = 22 * fontScale;
      case 3:
        fontSize = 19 * fontScale;
      case 4:
        fontSize = 17 * fontScale;
      default:
        fontSize = 22 * fontScale;
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Text(
        block.text,
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: fontSize,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          height: 1.4,
        ),
      ),
    );
  }

  /// Renders a bulleted list as a Column of RTL rows with bullet dots.
  Widget _buildBulletList(BulletListBlock block) {
    if (block.items.isEmpty) return const SizedBox.shrink();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: block.items.map((item) => _buildBulletItem(item)).toList(),
      ),
    );
  }

  /// Builds a single bullet list item row.
  Widget _buildBulletItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bullet dot
          Padding(
            padding: const EdgeInsetsDirectional.only(top: 10, end: 10),
            child: Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: AppColors.likudBlue,
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Item text
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16 * fontScale,
                color: AppColors.textPrimary,
                height: 1.7,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Strips all HTML tags from [html], returning plain text.
  String _stripHtml(String html) =>
      html.replaceAll(RegExp(r'<[^>]*>'), '').trim();
}
