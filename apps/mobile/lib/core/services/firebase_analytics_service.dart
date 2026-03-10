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
}
