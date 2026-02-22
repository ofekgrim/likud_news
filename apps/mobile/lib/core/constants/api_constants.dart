/// API endpoint constants.
class ApiConstants {
  ApiConstants._();

  // Base URL — change per environment
  static const String baseUrl = 'http://localhost:9090/api/v1';

  // Articles
  static const String articles = '/articles';
  static const String articlesHero = '/articles/hero';
  static const String articlesBreaking = '/articles/breaking';
  static const String articlesMostRead = '/articles/most-read';

  // Categories
  static const String categories = '/categories';

  // Members
  static const String members = '/members';

  // Ticker
  static const String ticker = '/ticker';

  // Search
  static const String search = '/search';

  // Favorites
  static const String favorites = '/favorites';

  // Reading History
  static const String history = '/history';

  // Contact
  static const String contact = '/contact';

  // Media
  static const String mediaPresign = '/media/presign';
  static const String mediaConfirm = '/media/confirm';

  // Push
  static const String pushRegister = '/push/register';

  // SSE
  static const String sseTicker = '/sse/ticker';
  static const String sseBreaking = '/sse/breaking';

  // Authors
  static const String authors = '/authors';

  // Tags
  static const String tags = '/tags';

  // Comments (moderation - admin)
  static const String comments = '/comments';

  // Config
  static const String config = '/config';

  // Stories
  static const String stories = '/stories';
}
