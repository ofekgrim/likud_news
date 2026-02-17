import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/services/device_id_service.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/usecases/get_favorites.dart';
import '../../domain/usecases/get_reading_history.dart';
import '../../domain/usecases/remove_favorite.dart' as use_case;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Favorites BLoC events.
sealed class FavoritesEvent extends Equatable {
  const FavoritesEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers initial loading of the favorites list.
final class LoadFavorites extends FavoritesEvent {
  const LoadFavorites();
}

/// Loads the next page of favorites (infinite scroll).
final class LoadMoreFavorites extends FavoritesEvent {
  const LoadMoreFavorites();
}

/// Removes an article from the favorites list.
final class RemoveFavorite extends FavoritesEvent {
  final String articleId;

  const RemoveFavorite(this.articleId);

  @override
  List<Object?> get props => [articleId];
}

/// Switches the active tab to reading history and loads the first page.
final class SwitchToHistory extends FavoritesEvent {
  const SwitchToHistory();
}

/// Triggers initial loading of the reading history list.
final class LoadHistory extends FavoritesEvent {
  const LoadHistory();
}

/// Loads the next page of reading history (infinite scroll).
final class LoadMoreHistory extends FavoritesEvent {
  const LoadMoreHistory();
}

// ---------------------------------------------------------------------------
// Active tab enum
// ---------------------------------------------------------------------------

/// Represents which tab is currently active.
enum FavoritesTab { favorites, history }

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Favorites BLoC states.
sealed class FavoritesState extends Equatable {
  const FavoritesState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class FavoritesInitial extends FavoritesState {
  const FavoritesInitial();
}

/// Data is being fetched for the first time.
final class FavoritesLoading extends FavoritesState {
  const FavoritesLoading();
}

/// Data loaded successfully for the active tab.
final class FavoritesLoaded extends FavoritesState {
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;
  final FavoritesTab activeTab;

  const FavoritesLoaded({
    this.articles = const [],
    this.hasMore = true,
    this.currentPage = 1,
    this.activeTab = FavoritesTab.favorites,
  });

  /// Creates a copy with optional overrides.
  FavoritesLoaded copyWith({
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
    FavoritesTab? activeTab,
  }) {
    return FavoritesLoaded(
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      activeTab: activeTab ?? this.activeTab,
    );
  }

  @override
  List<Object?> get props => [articles, hasMore, currentPage, activeTab];
}

/// An error occurred while loading favorites/history data.
final class FavoritesError extends FavoritesState {
  final String message;

  const FavoritesError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Favorites & Reading History screen.
///
/// Supports two tabs (favorites and history), infinite-scroll pagination,
/// swipe-to-dismiss for removing favorites, and tab switching.
@injectable
class FavoritesBloc extends Bloc<FavoritesEvent, FavoritesState> {
  final GetFavorites _getFavorites;
  final use_case.RemoveFavorite _removeFavorite;
  final GetReadingHistory _getReadingHistory;
  final DeviceIdService _deviceIdService;

  /// Device identifier obtained from [DeviceIdService].
  String get _deviceId => _deviceIdService.deviceId;

  /// Number of articles per page. When a page returns fewer items,
  /// [FavoritesLoaded.hasMore] is set to false.
  static const int _pageSize = 20;

  FavoritesBloc(
    this._getFavorites,
    this._removeFavorite,
    this._getReadingHistory,
    this._deviceIdService,
  ) : super(const FavoritesInitial()) {
    on<LoadFavorites>(_onLoadFavorites);
    on<LoadMoreFavorites>(_onLoadMoreFavorites);
    on<RemoveFavorite>(_onRemoveFavorite);
    on<SwitchToHistory>(_onSwitchToHistory);
    on<LoadHistory>(_onLoadHistory);
    on<LoadMoreHistory>(_onLoadMoreHistory);
  }

  /// Loads the first page of favorites.
  Future<void> _onLoadFavorites(
    LoadFavorites event,
    Emitter<FavoritesState> emit,
  ) async {
    emit(const FavoritesLoading());

    final result = await _getFavorites(
      FavoritesParams(deviceId: _deviceId, page: 1),
    );

    result.fold(
      (failure) => emit(FavoritesError(
        message: failure.message ?? 'error_loading_favorites'.tr(),
      )),
      (articles) => emit(FavoritesLoaded(
        articles: articles,
        hasMore: articles.length >= _pageSize,
        currentPage: 1,
        activeTab: FavoritesTab.favorites,
      )),
    );
  }

  /// Loads the next page of favorites and appends to the existing list.
  Future<void> _onLoadMoreFavorites(
    LoadMoreFavorites event,
    Emitter<FavoritesState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FavoritesLoaded ||
        !currentState.hasMore ||
        currentState.activeTab != FavoritesTab.favorites) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _getFavorites(
      FavoritesParams(deviceId: _deviceId, page: nextPage),
    );

    result.fold(
      (failure) {
        // Silently keep existing data on pagination failure.
        emit(currentState.copyWith(hasMore: false));
      },
      (newArticles) {
        emit(currentState.copyWith(
          articles: [...currentState.articles, ...newArticles],
          currentPage: nextPage,
          hasMore: newArticles.length >= _pageSize,
        ));
      },
    );
  }

  /// Removes an article from favorites and updates the list optimistically.
  Future<void> _onRemoveFavorite(
    RemoveFavorite event,
    Emitter<FavoritesState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FavoritesLoaded) return;

    // Optimistically remove from the UI.
    final updatedArticles = currentState.articles
        .where((a) => a.id != event.articleId)
        .toList();
    emit(currentState.copyWith(articles: updatedArticles));

    // Fire the API call.
    final result = await _removeFavorite(
      use_case.RemoveFavoriteParams(
        deviceId: _deviceId,
        articleId: event.articleId,
      ),
    );

    result.fold(
      (failure) {
        // On failure, restore the original list.
        emit(currentState);
      },
      (_) {
        // Success — list already updated optimistically.
      },
    );
  }

  /// Switches to the reading history tab and loads the first page.
  Future<void> _onSwitchToHistory(
    SwitchToHistory event,
    Emitter<FavoritesState> emit,
  ) async {
    emit(const FavoritesLoading());

    final result = await _getReadingHistory(
      HistoryParams(deviceId: _deviceId, page: 1),
    );

    result.fold(
      (failure) => emit(FavoritesError(
        message: failure.message ?? 'error_loading_history'.tr(),
      )),
      (articles) => emit(FavoritesLoaded(
        articles: articles,
        hasMore: articles.length >= _pageSize,
        currentPage: 1,
        activeTab: FavoritesTab.history,
      )),
    );
  }

  /// Loads the first page of reading history.
  Future<void> _onLoadHistory(
    LoadHistory event,
    Emitter<FavoritesState> emit,
  ) async {
    emit(const FavoritesLoading());

    final result = await _getReadingHistory(
      HistoryParams(deviceId: _deviceId, page: 1),
    );

    result.fold(
      (failure) => emit(FavoritesError(
        message: failure.message ?? 'error_loading_history'.tr(),
      )),
      (articles) => emit(FavoritesLoaded(
        articles: articles,
        hasMore: articles.length >= _pageSize,
        currentPage: 1,
        activeTab: FavoritesTab.history,
      )),
    );
  }

  /// Loads the next page of reading history and appends to the existing list.
  Future<void> _onLoadMoreHistory(
    LoadMoreHistory event,
    Emitter<FavoritesState> emit,
  ) async {
    final currentState = state;
    if (currentState is! FavoritesLoaded ||
        !currentState.hasMore ||
        currentState.activeTab != FavoritesTab.history) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _getReadingHistory(
      HistoryParams(deviceId: _deviceId, page: nextPage),
    );

    result.fold(
      (failure) {
        // Silently keep existing data on pagination failure.
        emit(currentState.copyWith(hasMore: false));
      },
      (newArticles) {
        emit(currentState.copyWith(
          articles: [...currentState.articles, ...newArticles],
          currentPage: nextPage,
          hasMore: newArticles.length >= _pageSize,
        ));
      },
    );
  }
}
