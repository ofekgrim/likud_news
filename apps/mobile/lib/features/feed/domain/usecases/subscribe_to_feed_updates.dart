import 'package:injectable/injectable.dart';
import '../entities/feed_item.dart';
import '../repositories/feed_repository.dart';

/// Use case for subscribing to real-time feed updates via SSE
@injectable
class SubscribeToFeedUpdates {
  final FeedRepository repository;

  SubscribeToFeedUpdates(this.repository);

  /// Returns a stream of new feed items as they're published
  /// Automatically reconnects on connection loss
  Stream<FeedItem> call() {
    return repository.subscribeToUpdates();
  }
}
