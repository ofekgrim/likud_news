import 'package:equatable/equatable.dart';
import '../../domain/entities/feed_item.dart';
import '../../domain/entities/feed_response.dart';

/// States for FeedBloc
sealed class FeedState extends Equatable {
  const FeedState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any feed is loaded
class FeedInitial extends FeedState {
  const FeedInitial();
}

/// State when initial feed is being loaded
class FeedLoading extends FeedState {
  const FeedLoading();
}

/// State when feed is successfully loaded
class FeedLoaded extends FeedState {
  final List<FeedItem> items;
  final FeedMeta meta;
  final bool hasReachedMax;
  final bool isRefreshing;
  final bool isLoadingMore;
  final List<FeedItemType>? activeFilters;
  final String? activeCategoryId;

  const FeedLoaded({
    required this.items,
    required this.meta,
    this.hasReachedMax = false,
    this.isRefreshing = false,
    this.isLoadingMore = false,
    this.activeFilters,
    this.activeCategoryId,
  });

  FeedLoaded copyWith({
    List<FeedItem>? items,
    FeedMeta? meta,
    bool? hasReachedMax,
    bool? isRefreshing,
    bool? isLoadingMore,
    List<FeedItemType>? activeFilters,
    String? activeCategoryId,
  }) {
    return FeedLoaded(
      items: items ?? this.items,
      meta: meta ?? this.meta,
      hasReachedMax: hasReachedMax ?? this.hasReachedMax,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      activeFilters: activeFilters ?? this.activeFilters,
      activeCategoryId: activeCategoryId ?? this.activeCategoryId,
    );
  }

  @override
  List<Object?> get props => [
        items,
        meta,
        hasReachedMax,
        isRefreshing,
        isLoadingMore,
        activeFilters,
        activeCategoryId,
      ];
}

/// State when an error occurs
class FeedError extends FeedState {
  final String message;

  const FeedError(this.message);

  @override
  List<Object?> get props => [message];
}
