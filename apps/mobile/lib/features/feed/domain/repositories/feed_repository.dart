import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/feed_item.dart';
import '../entities/feed_response.dart';

/// Repository interface for feed operations
abstract class FeedRepository {
  /// Get paginated feed with mixed content
  ///
  /// [page] - Page number (1-based)
  /// [limit] - Items per page (default: 20, max: 50)
  /// [types] - Optional filter for content types
  /// [categoryId] - Optional filter for article category
  /// [deviceId] - Optional device ID for personalization
  /// [userId] - Optional user ID for personalization
  Future<Either<Failure, FeedResponse>> getFeed({
    int page = 1,
    int limit = 20,
    List<FeedItemType>? types,
    String? categoryId,
    String? deviceId,
    String? userId,
  });

  /// Subscribe to real-time feed updates via SSE
  ///
  /// Returns a stream of new feed items as they're published
  /// Automatically reconnects on connection loss
  Stream<FeedItem> subscribeToUpdates();

  /// Close SSE connection and clean up resources
  Future<void> dispose();
}
