import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:injectable/injectable.dart';

/// Thin wrapper around [FirebaseAnalytics] for app-wide event tracking.
///
/// All calls are fire-and-forget — errors are silently ignored so
/// analytics never crashes the app.
@lazySingleton
class FirebaseAnalyticsService {
  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  /// The navigator observer for automatic screen tracking via GoRouter.
  FirebaseAnalyticsObserver get observer =>
      FirebaseAnalyticsObserver(analytics: _analytics);

  /// Log a custom event.
  Future<void> logEvent({
    required String name,
    Map<String, Object>? parameters,
  }) async {
    try {
      await _analytics.logEvent(name: name, parameters: parameters);
    } catch (_) {}
  }

  /// Track when a user reads an article.
  Future<void> logArticleRead({
    required String articleId,
    required String title,
    String? category,
  }) =>
      logEvent(
        name: 'article_read',
        parameters: {
          'article_id': articleId,
          'title': title,
          if (category != null) 'category': category,
        },
      );

  /// Track when a user votes on a community poll.
  Future<void> logPollVote({required String pollId}) =>
      logEvent(name: 'poll_vote', parameters: {'poll_id': pollId});

  /// Track when a user shares an article.
  Future<void> logShareArticle({required String articleId}) =>
      logEvent(name: 'share_article', parameters: {'article_id': articleId});

  /// Track when a user completes a quiz.
  Future<void> logQuizComplete({required String quizId}) =>
      logEvent(name: 'quiz_complete', parameters: {'quiz_id': quizId});

  /// Track user sign-up.
  Future<void> logSignUp({required String method}) async {
    try {
      await _analytics.logSignUp(signUpMethod: method);
    } catch (_) {}
  }

  /// Track when a referral code is claimed.
  Future<void> logReferralClaimed() =>
      logEvent(name: 'referral_claimed');

  /// Track when a user shares referral code.
  Future<void> logReferralShared() =>
      logEvent(name: 'referral_shared');

  /// Track feature usage for funnel analysis.
  Future<void> logFeatureUsed({required String feature}) =>
      logEvent(name: 'feature_used', parameters: {'feature': feature});

  /// Track when a user RSVPs to an event.
  Future<void> logEventRsvp({required String eventId}) =>
      logEvent(name: 'event_rsvp', parameters: {'event_id': eventId});

  /// Track when a user posts a comment.
  Future<void> logCommentPosted({required String articleId}) =>
      logEvent(name: 'comment_posted', parameters: {'article_id': articleId});

  /// Track daily mission completion.
  Future<void> logMissionComplete({required String missionId}) =>
      logEvent(name: 'mission_complete', parameters: {'mission_id': missionId});

  /// Set user properties for segmentation in Firebase Console.
  Future<void> setUserProperties({
    String? tier,
    String? branch,
    bool? isPremium,
    int? streakDays,
  }) async {
    try {
      if (tier != null) {
        await _analytics.setUserProperty(name: 'tier', value: tier);
      }
      if (branch != null) {
        await _analytics.setUserProperty(name: 'branch', value: branch);
      }
      if (isPremium != null) {
        await _analytics.setUserProperty(
          name: 'is_premium',
          value: isPremium.toString(),
        );
      }
      if (streakDays != null) {
        await _analytics.setUserProperty(
          name: 'streak_days',
          value: streakDays.toString(),
        );
      }
    } catch (_) {}
  }
}
