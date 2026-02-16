import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';

/// Abstract contract for the breaking news data layer.
///
/// Defines operations for fetching breaking articles via REST
/// and subscribing to real-time updates via SSE.
abstract class BreakingNewsRepository {
  /// Fetch the current list of breaking news articles.
  Future<Either<Failure, List<Article>>> getBreakingArticles();

  /// Subscribe to the SSE stream for real-time breaking news updates.
  ///
  /// Each emitted [Article] represents a newly published breaking item.
  Stream<Article> watchBreakingNews();
}
