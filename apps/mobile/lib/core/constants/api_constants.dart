import 'dart:io';

import 'package:flutter/foundation.dart';

/// API endpoint constants.
///
/// Environment selection (highest priority wins):
/// 1. `--dart-define=API_BASE_URL=https://...` — full override
/// 2. `--dart-define=ENV=production` — uses production URL
/// 3. Auto-detect: simulator → localhost, physical device → ngrok
class ApiConstants {
  ApiConstants._();

  static const String _localUrl = 'http://localhost/api/v1';
  static const String _ngrokUrl =
      'https://misfashioned-fastidiously-deacon.ngrok-free.dev/api/v1';
  static const String _productionUrl =
      'https://api.metzudathalikud.co.il/api/v1';

  /// Build-time overrides via --dart-define
  static const String _envOverride =
      String.fromEnvironment('ENV', defaultValue: '');
  static const String _urlOverride =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  /// Resolved base URL for all API calls.
  static final String baseUrl = _resolveBaseUrl();

  static String _resolveBaseUrl() {
    // 1. Explicit URL override
    if (_urlOverride.isNotEmpty) return _urlOverride;

    // 2. Environment name override
    if (_envOverride == 'production') return _productionUrl;

    // 3. Release builds use ngrok (until production is ready)
    if (kReleaseMode) return _ngrokUrl;

    // 4. Debug: detect iOS simulator via executable path
    if (Platform.isIOS || Platform.isAndroid) {
      final isSimulator =
          Platform.resolvedExecutable.contains('CoreSimulator') ||
              Platform.resolvedExecutable.contains('emulator');
      return isSimulator ? _localUrl : _ngrokUrl;
    }

    // Desktop / other → localhost
    return _localUrl;
  }

  // Articles
  static const String articles = '/articles';
  static const String articlesHero = '/articles/hero';
  static const String articlesBreaking = '/articles/breaking';
  static const String articlesMostRead = '/articles/most-read';
  static const String articlesTrending = '/articles/trending';
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
  static final String deleteAccount = '$baseUrl/app-auth/delete-account';

  // App Users (mobile user profile)
  static const String appUsersMe = '/app-users/me';
  static const String appUsersMeAvatar = '/app-users/me/avatar';
  static const String appUsersMeChangePassword =
      '/app-users/me/change-password';
  static const String appUsersMeVerifyMembership =
      '/app-users/me/verify-membership';
  static const String appUsersMeFolders = '/app-users/me/folders';
  static const String appUsersMeFollows = '/app-users/me/follows';
  static const String appUsersMeReferralCode = '/app-users/me/referral-code';
  static const String appUsersMeClaimReferral = '/app-users/me/claim-referral';

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
  static const String gamificationMe = '/gamification/me';
  static const String gamificationPoints = '/gamification/me/points';
  static const String gamificationPointsHistory = '/gamification/me/points/history';
  static const String gamificationBadges = '/gamification/me/badges';
  static const String gamificationStreak = '/gamification/me/streak';
  static const String gamificationRank = '/gamification/me/rank';
  static const String gamificationTrack = '/gamification/track';
  static const String gamificationLeaderboard = '/gamification/leaderboard';
  static const String gamificationTier = '/gamification/me/tier';
  static const String gamificationDailyQuizToday = '/gamification/daily-quiz/today';
  static const String gamificationDailyQuizSubmit = '/gamification/daily-quiz/submit';

  // Candidate Matcher (VAA)
  static const String matcherStatements = '/primaries/matcher/statements';
  static const String matcherResponses = '/primaries/matcher/responses';
  static const String matcherMatch = '/primaries/matcher/match';

  // SSE - Primaries
  static const String ssePrimaries = '/sse/primaries';

  // SSE - Articles
  static final String sseArticles = '$baseUrl/sse/articles';

  // Article Analytics
  static const String articleAnalyticsTrack = '/article-analytics/track';
  static const String articleAnalyticsLiveReaders = '/article-analytics/live-readers';

  // GOTV (Get Out The Vote)
  static const String gotvCheckin = '/gotv/checkin';
  static const String gotvPlan = '/gotv/plan';

  // Sharing
  static const String sharingCreateLink = '/sharing/create-link';
  static const String sharingResolve = '/sharing/resolve';

  // Notifications
  static const String notificationInbox = '/notifications/inbox';
  static const String notificationUnreadCount =
      '/notifications/inbox/unread-count';
  static const String notificationTrackOpen = '/notifications/track-open';

  // AI Chat
  static const String aiChat = '/ai/chat';
  static const String aiChatSessions = '/ai/chat/sessions';

  // AMA Sessions
  static const String amaSessions = '/ama/sessions';
  static const String amaSessionsUpcoming = '/ama/sessions/upcoming';
  static const String amaQuestions = '/ama/questions';

  // Daily Missions (under gamification)
  static const String gamificationMissionsToday = '/gamification/missions/today';
  static const String gamificationMissionsComplete = '/gamification/missions';

  // Subscriptions (Premium)
  static const String subscriptionsMe = '/subscriptions/me';
  static const String subscriptionsBenefits = '/subscriptions/benefits';
  static const String subscriptionsCancel = '/subscriptions/cancel';
}
