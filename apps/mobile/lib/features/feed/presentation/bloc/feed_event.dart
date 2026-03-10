import 'package:equatable/equatable.dart';
import '../../domain/entities/feed_item.dart';

/// Events for FeedBloc
sealed class FeedEvent extends Equatable {
  const FeedEvent();

  @override
  List<Object?> get props => [];
}

/// Event to load the initial feed
class LoadFeed extends FeedEvent {
  final List<FeedItemType>? types;
  final String? categoryId;

  const LoadFeed({this.types, this.categoryId});

  @override
  List<Object?> get props => [types, categoryId];
}

/// Event to refresh the feed (pull-to-refresh)
class RefreshFeed extends FeedEvent {
  const RefreshFeed();
}

/// Event to load more feed items (pagination)
class LoadMoreFeed extends FeedEvent {
  const LoadMoreFeed();
}

/// Event to filter feed by content types
class FilterByType extends FeedEvent {
  final List<FeedItemType>? types;

  const FilterByType(this.types);

  @override
  List<Object?> get props => [types];
}

/// Event to filter feed by category
class FilterByCategory extends FeedEvent {
  final String? categoryId;

  const FilterByCategory(this.categoryId);

  @override
  List<Object?> get props => [categoryId];
}

/// Event to subscribe to real-time feed updates via SSE
class SubscribeToUpdates extends FeedEvent {
  const SubscribeToUpdates();
}

/// Event to unsubscribe from real-time feed updates
class UnsubscribeFromUpdates extends FeedEvent {
  const UnsubscribeFromUpdates();
}

/// Internal event when a new feed update is received via SSE
class FeedUpdateReceived extends FeedEvent {
  final FeedItem feedItem;

  const FeedUpdateReceived(this.feedItem);

  @override
  List<Object?> get props => [feedItem];
}

/// Internal event when auth state changes (user logs in/out)
class AuthStateChangedFeed extends FeedEvent {
  const AuthStateChangedFeed();
}
