import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Tracks article reads and requests an app rating after the 3rd article.
///
/// The rating prompt is shown at most once (the OS enforces a yearly cap).
/// Call [trackArticleRead] from ArticleDetailPage after a successful load.
class ReviewService {
  ReviewService._();

  static const _countKey = 'articles_read_count';
  static const _threshold = 3;

  static Future<void> trackArticleRead() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final count = (prefs.getInt(_countKey) ?? 0) + 1;
      await prefs.setInt(_countKey, count);

      if (count == _threshold) {
        final review = InAppReview.instance;
        if (await review.isAvailable()) {
          await review.requestReview();
        }
      }
    } catch (_) {
      // Rating prompt failure is never fatal
    }
  }
}
