/// Estimates reading time for article content.
///
/// Uses a word-per-minute rate tuned for Hebrew text, which tends to
/// have shorter words but denser information per word than English.
library;

/// Calculates estimated reading time from HTML content.
class ReadingTimeCalculator {
  ReadingTimeCalculator._();

  /// Average reading speed for Hebrew text in words per minute.
  ///
  /// Hebrew readers typically process ~200 wpm for news-style content.
  static const int _wordsPerMinute = 200;

  /// Regex used to strip all HTML tags.
  static final _tagRegex = RegExp(r'<[^>]*>');

  /// Regex used to split text into word tokens.
  static final _whitespaceRegex = RegExp(r'\s+');

  /// Calculates reading time in minutes from [htmlContent].
  ///
  /// Returns at least 1 minute even for very short content.
  /// Returns 1 when [htmlContent] is `null` or empty.
  static int calculateMinutes(String? htmlContent) {
    if (htmlContent == null || htmlContent.trim().isEmpty) {
      return 1;
    }

    final stripped = htmlContent.replaceAll(_tagRegex, ' ');
    final words = stripped
        .split(_whitespaceRegex)
        .where((w) => w.trim().isNotEmpty)
        .length;
    final minutes = (words / _wordsPerMinute).ceil();

    return minutes < 1 ? 1 : minutes;
  }
}
