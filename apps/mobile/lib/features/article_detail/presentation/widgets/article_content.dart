import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/ads/ad_banner_widget.dart';
import '../../../../core/ads/ad_config.dart';
import '../utils/html_content_parser.dart';
import 'drop_cap_paragraph.dart';
import 'pull_quote.dart';

/// Renders the article body from HTML content, split into discrete sections.
///
/// Parses HTML into block-level sections using [HtmlContentParser] and renders
/// each section with appropriate styling: drop cap for the first paragraph,
/// pull quotes for short blockquotes, and enhanced heading / blockquote styles.
///
/// Optionally inserts inline banner ads between sections at positions defined
/// by [AdConfig].
class ArticleContent extends StatelessWidget {
  final String htmlContent;
  final bool showAds;

  const ArticleContent({
    super.key,
    required this.htmlContent,
    this.showAds = true,
  });

  @override
  Widget build(BuildContext context) {
    if (htmlContent.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            'אין תוכן להצגה',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textTertiary,
                ),
          ),
        ),
      );
    }

    final sections = HtmlContentParser.parse(htmlContent);

    if (sections.isEmpty) {
      // Fallback: render the raw HTML as-is when parsing yields no sections.
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: _buildHtmlWidget(htmlContent),
      );
    }

    final children = <Widget>[];

    for (var i = 0; i < sections.length; i++) {
      final section = sections[i];

      // Build the widget for this section.
      children.add(_buildSection(context, section, i));

      // Insert inline ads after the configured paragraph indices.
      if (showAds) {
        if (i == AdConfig.firstAdAfterParagraph - 1 &&
            sections.length > AdConfig.firstAdAfterParagraph) {
          children.add(const AdBannerWidget());
        } else if (i == AdConfig.secondAdAfterParagraph - 1 &&
            sections.length > AdConfig.secondAdAfterParagraph) {
          children.add(const AdBannerWidget());
        }
      }

      // Spacing between sections (not after the last one).
      if (i < sections.length - 1) {
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

  /// Builds the appropriate widget for a single [ContentSection].
  Widget _buildSection(
    BuildContext context,
    ContentSection section,
    int displayIndex,
  ) {
    switch (section.type) {
      case ContentSectionType.paragraph:
        if (displayIndex == 0) {
          // First paragraph gets a drop cap.
          return DropCapParagraph(text: _stripHtml(section.htmlContent));
        }
        return _buildHtmlWidget(section.htmlContent);

      case ContentSectionType.pullQuote:
        return PullQuote(text: _stripHtml(section.htmlContent));

      case ContentSectionType.heading:
        return _buildHtmlWidget(section.htmlContent);

      case ContentSectionType.blockquote:
        return _buildHtmlWidget(section.htmlContent);

      case ContentSectionType.image:
        return _buildHtmlWidget(section.htmlContent);

      case ContentSectionType.list:
        return _buildHtmlWidget(section.htmlContent);
    }
  }

  /// Creates an [HtmlWidget] with the app's article styling.
  Widget _buildHtmlWidget(String html) {
    return HtmlWidget(
      html,
      textStyle: const TextStyle(
        fontFamily: 'Heebo',
        fontSize: 18,
        height: 1.9,
        color: AppColors.textPrimary,
      ),
      customStylesBuilder: (element) {
        switch (element.localName) {
          case 'h2':
            return {
              'font-size': '22px',
              'font-weight': '700',
              'margin-top': '28px',
              'margin-bottom': '12px',
            };
          case 'h3':
            return {
              'font-size': '19px',
              'font-weight': '700',
              'margin-top': '24px',
              'margin-bottom': '10px',
            };
          case 'blockquote':
            return {
              'border-right': '4px solid #0099DB',
              'padding-right': '16px',
              'margin-right': '0px',
              'background-color': '#F8FAFC',
              'font-style': 'italic',
              'color': '#64748B',
            };
          case 'a':
            return {
              'color': '#0099DB',
              'text-decoration': 'underline',
            };
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

  /// Strips all HTML tags from [html], returning plain text.
  String _stripHtml(String html) =>
      html.replaceAll(RegExp(r'<[^>]*>'), '').trim();
}
