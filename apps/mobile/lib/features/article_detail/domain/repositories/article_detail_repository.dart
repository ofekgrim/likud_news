import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/article_detail.dart';
import '../entities/comment.dart';

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

  /// Fetches comments for a target (article or story), paginated.
  Future<Either<Failure, List<Comment>>> getComments({
    required String articleId,
    int page = 1,
    int limit = 20,
    String targetType = 'article',
  });

  /// Submits a new comment on a target (article or story).
  Future<Either<Failure, void>> submitComment({
    required String articleId,
    required String authorName,
    required String body,
    String? parentId,
    String targetType = 'article',
  });

  /// Increments the share count for an article.
  Future<Either<Failure, void>> incrementShareCount(String articleId);

  /// Likes a comment. Returns the updated likesCount.
  Future<Either<Failure, int>> likeComment({
    required String articleId,
    required String commentId,
    String targetType = 'article',
  });
}
