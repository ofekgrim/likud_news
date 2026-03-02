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
  static const String searchArticles = '/articles/search';

  // Feed (unified mixed-content)
  static const String feed = '/feed';

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
  static const String mediaUpload = '/media/upload';

  // Push
  static const String pushRegister = '/push/register';

  // SSE
  static const String sseTicker = '/sse/ticker';
  static const String sseBreaking = '/sse/breaking';
  static const String sseFeed = '/sse/feed';

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

  // App Auth (mobile user authentication)
  static const String appAuthOtpRequest = '/app-auth/otp/request';
  static const String appAuthOtpVerify = '/app-auth/otp/verify';
  static const String appAuthRegister = '/app-auth/register';
  static const String appAuthLogin = '/app-auth/login';
  static const String appAuthRefresh = '/app-auth/refresh';
  static const String appAuthLogout = '/app-auth/logout';
  static const String appAuthMigrateDevice = '/app-auth/migrate-device';
  static const String appAuthPhoneChangeRequest =
      '/app-auth/phone-change/request';
  static const String appAuthPhoneChangeVerify =
      '/app-auth/phone-change/verify';
  static const String appAuthEmailChangeRequest =
      '/app-auth/email-change/request';
  static const String appAuthEmailChangeVerify =
      '/app-auth/email-change/verify';
  static const deleteAccount = '$baseUrl/app-auth/delete-account';

  // App Users (mobile user profile)
  static const String appUsersMe = '/app-users/me';
  static const String appUsersMeAvatar = '/app-users/me/avatar';
  static const String appUsersMeChangePassword =
      '/app-users/me/change-password';
  static const String appUsersMeVerifyMembership =
      '/app-users/me/verify-membership';
  static const String appUsersMeFolders = '/app-users/me/folders';
  static const String appUsersMeFollows = '/app-users/me/follows';

  // Elections
  static const String elections = '/elections';

  // Candidates
  static const String candidates = '/candidates';

  // Endorsements
  static const String endorsements = '/endorsements';

  // Quiz
  static const String quiz = '/quiz';

  // Polling Stations
  static const String pollingStations = '/polling-stations';

  // Election Results
  static const String electionResults = '/election-results';

  // Community Polls
  static const String communityPolls = '/community-polls';

  // Campaign Events
  static const String campaignEvents = '/campaign-events';

  // Gamification
  static const String gamificationPoints = '/gamification/points';
  static const String gamificationBadges = '/gamification/badges';
  static const String gamificationLeaderboard = '/gamification/leaderboard';

  // SSE - Primaries
  static const String ssePrimaries = '/sse/primaries';

  // SSE - Articles
  static const String sseArticles = '$baseUrl/sse/articles';

  // Article Analytics
  static const String articleAnalyticsTrack = '/article-analytics/track';
}
