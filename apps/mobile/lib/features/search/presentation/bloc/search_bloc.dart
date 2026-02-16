import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:stream_transform/stream_transform.dart';

import '../../../home/domain/entities/article.dart';
import '../../domain/usecases/search_articles.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Search BLoC events.
sealed class SearchEvent extends Equatable {
  const SearchEvent();

  @override
  List<Object?> get props => [];
}

/// Fires when the user types in the search field.
/// Debounced by 300ms using the [restartable] transformer.
class SearchQueryChanged extends SearchEvent {
  final String query;

  const SearchQueryChanged(this.query);

  @override
  List<Object?> get props => [query];
}

/// Loads the next page of search results (infinite scroll).
class LoadMoreSearchResults extends SearchEvent {
  const LoadMoreSearchResults();
}

/// Clears the current search query and results.
class ClearSearch extends SearchEvent {
  const ClearSearch();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Search BLoC states.
sealed class SearchState extends Equatable {
  const SearchState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any search has been performed.
/// Contains a list of recent search queries for quick access.
class SearchInitial extends SearchState {
  final List<String> recentSearches;

  const SearchInitial({this.recentSearches = const []});

  @override
  List<Object?> get props => [recentSearches];
}

/// Search is in progress.
class SearchLoading extends SearchState {
  const SearchLoading();
}

/// Search completed with results.
class SearchLoaded extends SearchState {
  final String query;
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;

  const SearchLoaded({
    required this.query,
    required this.articles,
    this.hasMore = true,
    this.currentPage = 1,
  });

  SearchLoaded copyWith({
    String? query,
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
  }) {
    return SearchLoaded(
      query: query ?? this.query,
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [query, articles, hasMore, currentPage];
}

/// Search completed but returned no results.
class SearchEmpty extends SearchState {
  final String query;

  const SearchEmpty({required this.query});

  @override
  List<Object?> get props => [query];
}

/// An error occurred during the search.
class SearchError extends SearchState {
  final String message;

  const SearchError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Search feature.
///
/// Handles debounced search queries (300ms), infinite-scroll pagination,
/// recent search history, and clearing the search state.
@injectable
class SearchBloc extends Bloc<SearchEvent, SearchState> {
  final SearchArticles _searchArticles;

  /// Number of articles per page.
  static const int _pageSize = 20;

  /// Maximum number of recent searches to keep.
  static const int _maxRecentSearches = 10;

  /// In-memory list of recent search queries.
  final List<String> _recentSearches = [];

  SearchBloc(this._searchArticles) : super(const SearchInitial()) {
    on<SearchQueryChanged>(
      _onSearchQueryChanged,
      transformer: _debounceRestartable(const Duration(milliseconds: 300)),
    );
    on<LoadMoreSearchResults>(_onLoadMoreSearchResults);
    on<ClearSearch>(_onClearSearch);
  }

  /// Creates a debounced, restartable event transformer.
  ///
  /// Waits [duration] after the last event before processing,
  /// and cancels any in-progress handler when a new event arrives.
  EventTransformer<T> _debounceRestartable<T>(Duration duration) {
    return (events, mapper) {
      return events.debounce(duration).switchMap(mapper);
    };
  }

  /// Handles a new search query.
  Future<void> _onSearchQueryChanged(
    SearchQueryChanged event,
    Emitter<SearchState> emit,
  ) async {
    final query = event.query.trim();

    // If query is empty, return to initial state.
    if (query.isEmpty) {
      emit(SearchInitial(recentSearches: List.unmodifiable(_recentSearches)));
      return;
    }

    emit(const SearchLoading());

    final result = await _searchArticles(SearchParams(query: query, page: 1));

    result.fold(
      (failure) => emit(SearchError(
        message: failure.message ?? 'error_searching'.tr(),
      )),
      (searchResult) {
        // Add to recent searches.
        _addToRecentSearches(query);

        if (searchResult.articles.isEmpty) {
          emit(SearchEmpty(query: query));
        } else {
          emit(SearchLoaded(
            query: query,
            articles: searchResult.articles,
            hasMore: searchResult.articles.length >= _pageSize,
            currentPage: 1,
          ));
        }
      },
    );
  }

  /// Loads the next page of search results.
  Future<void> _onLoadMoreSearchResults(
    LoadMoreSearchResults event,
    Emitter<SearchState> emit,
  ) async {
    final currentState = state;
    if (currentState is! SearchLoaded || !currentState.hasMore) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _searchArticles(
      SearchParams(query: currentState.query, page: nextPage),
    );

    result.fold(
      (failure) {
        // Silently keep existing data on pagination failure.
        emit(currentState.copyWith(hasMore: false));
      },
      (searchResult) {
        final newArticles = searchResult.articles;
        emit(currentState.copyWith(
          articles: [...currentState.articles, ...newArticles],
          currentPage: nextPage,
          hasMore: newArticles.length >= _pageSize,
        ));
      },
    );
  }

  /// Clears the search and returns to the initial state.
  Future<void> _onClearSearch(
    ClearSearch event,
    Emitter<SearchState> emit,
  ) async {
    emit(SearchInitial(recentSearches: List.unmodifiable(_recentSearches)));
  }

  /// Adds a query to the recent searches list, deduplicating and capping size.
  void _addToRecentSearches(String query) {
    _recentSearches.remove(query);
    _recentSearches.insert(0, query);
    if (_recentSearches.length > _maxRecentSearches) {
      _recentSearches.removeLast();
    }
  }
}
