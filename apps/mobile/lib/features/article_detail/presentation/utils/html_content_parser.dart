/// Splits TipTap HTML content into discrete sections for rendering.
///
/// Each section maps to a block-level element (paragraph, heading,
/// blockquote, image, list) so the article renderer can apply distinct
/// styles per section type.
library;

/// The kind of block-level content a [ContentSection] represents.
enum ContentSectionType {
  paragraph,
  heading,
  blockquote,
  image,
  list,
  pullQuote,
}

/// A single block-level segment extracted from an HTML document.
class ContentSection {
  final ContentSectionType type;
  final String htmlContent;
  final int index;

  const ContentSection({
    required this.type,
    required this.htmlContent,
    required this.index,
  });

  @override
  String toString() =>
      'ContentSection(type: $type, index: $index, length: ${htmlContent.length})';
}

/// Parses raw HTML produced by the TipTap editor into a list of
/// [ContentSection] objects.
///
/// The parser works by matching top-level block elements with a regular
/// expression.  Inline content that is not wrapped in a block element is
/// ignored, which is consistent with TipTap's output format where every
/// piece of content lives inside a block tag.
class HtmlContentParser {
  HtmlContentParser._();

  /// Regex that captures top-level block elements emitted by TipTap.
  ///
  /// Supported tags: `<p>`, `<h1>`-`<h6>`, `<blockquote>`, `<figure>`,
  /// `<ul>`, `<ol>`, `<div>`.
  static final _blockRegex = RegExp(
    r'<(p|h[1-6]|blockquote|figure|ul|ol|div)(\s[^>]*)?>[\s\S]*?</\1>',
    caseSensitive: false,
  );

  /// Regex used to strip all HTML tags, leaving only plain text.
  static final _stripTagsRegex = RegExp(r'<[^>]*>');

  /// Maximum plain-text length for a blockquote to be treated as a pull
  /// quote instead of a regular blockquote.
  static const _pullQuoteMaxLength = 150;

  /// Parses [html] into a list of [ContentSection]s.
  ///
  /// Returns an empty list when [html] is `null` or blank.
  static List<ContentSection> parse(String? html) {
    if (html == null || html.trim().isEmpty) {
      return const [];
    }

    final matches = _blockRegex.allMatches(html);
    final sections = <ContentSection>[];
    var index = 0;

    for (final match in matches) {
      final fullMatch = match.group(0)!;
      final tagName = match.group(1)!.toLowerCase();

      // Determine content type based on the outer tag.
      final type = _resolveType(tagName, fullMatch);

      // Filter out empty sections (only whitespace / <br> after stripping).
      if (_isEmptyContent(fullMatch)) {
        continue;
      }

      sections.add(ContentSection(
        type: type,
        htmlContent: fullMatch,
        index: index,
      ));
      index++;
    }

    return sections;
  }

  /// Maps an HTML tag name to a [ContentSectionType].
  static ContentSectionType _resolveType(String tagName, String fullHtml) {
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return ContentSectionType.heading;

      case 'blockquote':
        final plainText = _stripTags(fullHtml).trim();
        if (plainText.length <= _pullQuoteMaxLength) {
          return ContentSectionType.pullQuote;
        }
        return ContentSectionType.blockquote;

      case 'figure':
        // Figures that contain an <img> are classified as images.
        if (fullHtml.contains('<img')) {
          return ContentSectionType.image;
        }
        return ContentSectionType.paragraph;

      case 'ul':
      case 'ol':
        return ContentSectionType.list;

      case 'p':
      case 'div':
      default:
        return ContentSectionType.paragraph;
    }
  }

  /// Returns `true` when [html] contains no meaningful text after tags and
  /// whitespace are removed.
  static bool _isEmptyContent(String html) {
    final stripped = _stripTags(html)
        .replaceAll(RegExp(r'\s+'), '')
        .replaceAll(RegExp(r'&nbsp;', caseSensitive: false), '');
    return stripped.isEmpty;
  }

  /// Removes all HTML tags from [html], returning plain text.
  static String _stripTags(String html) {
    return html.replaceAll(_stripTagsRegex, ' ');
  }
}
