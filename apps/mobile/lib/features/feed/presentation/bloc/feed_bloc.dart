import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../domain/entities/feed_item.dart';
import '../../domain/usecases/get_feed.dart';
import '../../domain/usecases/subscribe_to_feed_updates.dart';
import 'feed_event.dart';
import 'feed_state.dart';

/// BLoC for managing feed state with pagination and SSE updates
@injectable
class FeedBloc extends Bloc<FeedEvent, FeedState> {
  final GetFeed _getFeed;
  final SubscribeToFeedUpdates _subscribeToFeedUpdates;
  final AuthBloc _authBloc;

  StreamSubscription<FeedItem>? _feedUpdatesSubscription;
  StreamSubscription? _authSubscription;

  FeedBloc({
    required GetFeed getFeed,
    required SubscribeToFeedUpdates subscribeToFeedUpdates,
    required AuthBloc authBloc,
  })  : _getFeed = getFeed,
        _subscribeToFeedUpdates = subscribeToFeedUpdates,
        _authBloc = authBloc,
        super(const FeedInitial()) {
    on<LoadFeed>(_onLoadFeed);
    on<RefreshFeed>(_onRefreshFeed);
    on<LoadMoreFeed>(_onLoadMoreFeed);
    on<FilterByType>(_onFilterByType);
    on<FilterByCategory>(_onFilterByCategory);
    on<SubscribeToUpdates>(_onSubscribeToUpdates);
    on<UnsubscribeFromUpdates>(_onUnsubscribeFromUpdates);
    on<FeedUpdateReceived>(_onFeedUpdateReceived);
    on<AuthStateChangedFeed>(_onAuthStateChanged);
    on<ChangeFeedMode>(_onChangeFeedMode);

    // Listen for auth state changes — reload feed with userId when user logs in
    _authSubscription = _authBloc.stream.listen((authState) {
      if (authState is AuthAuthenticated || authState is AuthUnauthenticated) {
        add(const AuthStateChangedFeed());
      }
    });
  }

  /// Returns the current authenticated user's ID, or null for guests.
  String? get _currentUserId {
    final authState = _authBloc.state;
    if (authState is AuthAuthenticated) {
      return authState.user.id;
    }
    return null;
  }

  /// Handle initial feed load
  Future<void> _onLoadFeed(
    LoadFeed event,
    Emitter<FeedState> emit,
  ) async {
    emit(const FeedLoading());

    final result = await _getFeed(GetFeedParams(
      page: 1,
      limit: 20,
      types: event.types,
      categoryId: event.categoryId,
      userId: _currentUserId,
    ));

    result.fold(
      (failure) => emit(FeedError(failure.message ?? 'Failed to load feed')),
      (response) => emit(FeedLoaded(
        items: response.items,
        meta: response.meta,
        hasReachedMax: !response.meta.hasMore,
        activeFilters: event.types,
        activeCategoryId: event.categoryId,
      )),
    );
  }

  /// Handle pull-to-refresh
  Future<void> _onRefreshFeed(
    RefreshFeed event,
    Emitter<FeedState> emit,
  ) async {
    final currentState = state;

    // Handle refresh from any state (not just FeedLoaded)
    if (currentState is FeedLoaded) {
      // Show refreshing indicator
      emit(currentState.copyWith(isRefreshing: true));

      final result = await _getFeed(GetFeedParams(
        page: 1,
        limit: 20,
        types: currentState.activeFilters,
        categoryId: currentState.activeCategoryId,
        userId: _currentUserId,
      ));

      result.fold(
        (failure) {
          // Revert to previous state on error
          emit(currentState.copyWith(isRefreshing: false));
        },
        (response) {
          emit(FeedLoaded(
            items: response.items,
            meta: response.meta,
            hasReachedMax: !response.meta.hasMore,
            isRefreshing: false,
            activeFilters: currentState.activeFilters,
            activeCategoryId: currentState.activeCategoryId,
          ));
        },
      );
    } else {
      // If not in FeedLoaded state, trigger initial load
      // This ensures refresh always completes even if called too early
      add(const LoadFeed());
    }
  }

  /// Handle pagination (load more)
  Future<void> _onLoadMoreFeed(
    LoadMoreFeed event,
    Emitter<FeedState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FeedLoaded) return;
    if (currentState.hasReachedMax) return;
    if (currentState.isLoadingMore) return;

    // Show loading more indicator
    emit(currentState.copyWith(isLoadingMore: true));

    final nextPage = currentState.meta.page + 1;

    final result = await _getFeed(GetFeedParams(
      page: nextPage,
      limit: 20,
      types: currentState.activeFilters,
      categoryId: currentState.activeCategoryId,
      userId: _currentUserId,
    ));

    result.fold(
      (failure) {
        // Revert loading indicator on error
        emit(currentState.copyWith(isLoadingMore: false));
      },
      (response) {
        final updatedItems = [...currentState.items, ...response.items];
        emit(FeedLoaded(
          items: updatedItems,
          meta: response.meta,
          hasReachedMax: !response.meta.hasMore,
          isLoadingMore: false,
          activeFilters: currentState.activeFilters,
          activeCategoryId: currentState.activeCategoryId,
        ));
      },
    );
  }

  /// Handle filter by content type
  Future<void> _onFilterByType(
    FilterByType event,
    Emitter<FeedState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FeedLoaded) return;

    emit(const FeedLoading());

    final result = await _getFeed(GetFeedParams(
      page: 1,
      limit: 20,
      types: event.types,
      categoryId: currentState.activeCategoryId,
    ));

    result.fold(
      (failure) => emit(FeedError(failure.message ?? 'Failed to filter feed')),
      (response) => emit(FeedLoaded(
        items: response.items,
        meta: response.meta,
        hasReachedMax: !response.meta.hasMore,
        activeFilters: event.types,
        activeCategoryId: currentState.activeCategoryId,
      )),
    );
  }

  /// Handle filter by category
  Future<void> _onFilterByCategory(
    FilterByCategory event,
    Emitter<FeedState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FeedLoaded) return;

    emit(const FeedLoading());

    final result = await _getFeed(GetFeedParams(
      page: 1,
      limit: 20,
      types: currentState.activeFilters,
      categoryId: event.categoryId,
    ));

    result.fold(
      (failure) => emit(FeedError(failure.message ?? 'Failed to filter feed')),
      (response) => emit(FeedLoaded(
        items: response.items,
        meta: response.meta,
        hasReachedMax: !response.meta.hasMore,
        activeFilters: currentState.activeFilters,
        activeCategoryId: event.categoryId,
      )),
    );
  }

  /// Handle SSE subscription
  Future<void> _onSubscribeToUpdates(
    SubscribeToUpdates event,
    Emitter<FeedState> emit,
  ) async {
    // Cancel existing subscription if any
    await _feedUpdatesSubscription?.cancel();

    // Subscribe to feed updates
    final stream = _subscribeToFeedUpdates();
    _feedUpdatesSubscription = stream.listen(
      (feedItem) => add(FeedUpdateReceived(feedItem)),
    );
  }

  /// Handle SSE unsubscription
  Future<void> _onUnsubscribeFromUpdates(
    UnsubscribeFromUpdates event,
    Emitter<FeedState> emit,
  ) async {
    await _feedUpdatesSubscription?.cancel();
    _feedUpdatesSubscription = null;
  }

  /// Handle real-time feed update from SSE
  void _onFeedUpdateReceived(
    FeedUpdateReceived event,
    Emitter<FeedState> emit,
  ) {
    final currentState = state;
    if (currentState is! FeedLoaded) return;

    // Check if item already exists (avoid duplicates)
    final existingIndex = currentState.items.indexWhere(
      (item) => item.id == event.feedItem.id,
    );

    if (existingIndex != -1) {
      // Update existing item
      final updatedItems = List<FeedItem>.from(currentState.items);
      updatedItems[existingIndex] = event.feedItem;
      emit(currentState.copyWith(items: updatedItems));
    } else {
      // Add new item at the beginning
      final updatedItems = [event.feedItem, ...currentState.items];
      emit(currentState.copyWith(items: updatedItems));
    }
  }

  /// Handle auth state change — reload feed with/without userId
  Future<void> _onAuthStateChanged(
    AuthStateChangedFeed event,
    Emitter<FeedState> emit,
  ) async {
    // Re-load feed from page 1 with the now-available userId
    final currentState = state;
    final types = currentState is FeedLoaded ? currentState.activeFilters : null;
    final categoryId = currentState is FeedLoaded ? currentState.activeCategoryId : null;

    final result = await _getFeed(GetFeedParams(
      page: 1,
      limit: 20,
      types: types,
      categoryId: categoryId,
      userId: _currentUserId,
    ));

    result.fold(
      (failure) {
        // Don't overwrite existing feed on auth-triggered reload failure
      },
      (response) => emit(FeedLoaded(
        items: response.items,
        meta: response.meta,
        hasReachedMax: !response.meta.hasMore,
        activeFilters: types,
        activeCategoryId: categoryId,
      )),
    );
  }

  /// Handle feed mode change (latest ↔ personalized)
  Future<void> _onChangeFeedMode(
    ChangeFeedMode event,
    Emitter<FeedState> emit,
  ) async {
    final currentState = state;
    final types = currentState is FeedLoaded ? currentState.activeFilters : null;
    final categoryId = currentState is FeedLoaded ? currentState.activeCategoryId : null;

    emit(const FeedLoading());

    final result = await _getFeed(GetFeedParams(
      page: 1,
      limit: 20,
      types: types,
      categoryId: categoryId,
      userId: _currentUserId,
      mode: event.mode,
    ));

    result.fold(
      (failure) => emit(FeedError(failure.message ?? 'Failed to load feed')),
      (response) => emit(FeedLoaded(
        items: response.items,
        meta: response.meta,
        hasReachedMax: !response.meta.hasMore,
        activeFilters: types,
        activeCategoryId: categoryId,
        feedMode: event.mode,
      )),
    );
  }

  @override
  Future<void> close() {
    _authSubscription?.cancel();
    _feedUpdatesSubscription?.cancel();
    return super.close();
  }
}
