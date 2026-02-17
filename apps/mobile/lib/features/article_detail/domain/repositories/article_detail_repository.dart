import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/article_detail.dart';

/// Abstract contract for article detail data operations.
///
/// Implemented by the data layer to fetch full article content,
/// toggle favorites, and record read events.
abstract class ArticleDetailRepository {
  /// Fetches the full article detail by its URL slug.
  Future<Either<Failure, ArticleDetail>> getArticleBySlug(String slug);

  /// Toggles the favorite/bookmark status for an article.
  ///
  /// Uses [deviceId] to identify the user on this device and
  /// [articleId] to identify the article.
  /// Returns the new favorite status (`true` = favorited).
  Future<Either<Failure, bool>> toggleFavorite({
    required String deviceId,
    required String articleId,
  });

  /// Records that the user read the given article.
  Future<Either<Failure, void>> recordRead({
    required String deviceId,
    required String articleId,
  });
}
