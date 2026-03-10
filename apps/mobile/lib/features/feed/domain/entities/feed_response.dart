import 'package:equatable/equatable.dart';
import 'feed_item.dart';

/// Response from feed endpoint containing items and metadata
class FeedResponse extends Equatable {
  final List<FeedItem> items;
  final FeedMeta meta;

  const FeedResponse({
    required this.items,
    required this.meta,
  });

  @override
  List<Object?> get props => [items, meta];
}

/// Metadata about the feed response
class FeedMeta extends Equatable {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final int articlesCount;
  final int pollsCount;
  final int eventsCount;
  final int electionsCount;
  final int quizzesCount;

  const FeedMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.articlesCount,
    required this.pollsCount,
    required this.eventsCount,
    required this.electionsCount,
    required this.quizzesCount,
  });

  bool get hasMore => page < totalPages;

  @override
  List<Object?> get props => [
        page,
        limit,
        total,
        totalPages,
        articlesCount,
        pollsCount,
        eventsCount,
        electionsCount,
        quizzesCount,
      ];
}
