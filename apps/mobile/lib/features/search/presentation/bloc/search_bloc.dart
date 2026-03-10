import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:stream_transform/stream_transform.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../../../home/domain/entities/category.dart';
import '../../../home/domain/usecases/get_categories.dart';
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

/// Fires when the user selects a category filter chip.
/// Pass `null` to clear the category filter (show all).
class CategoryFilterChanged extends SearchEvent {
  final String? categoryId;

  const CategoryFilterChanged(this.categoryId);

  @override
  List<Object?> get props => [categoryId];
}

/// Internal event to load categories on BLoC initialization.
class _LoadCategories extends SearchEvent {
  const _LoadCategories();
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
  final List<Category> categories;

  const SearchInitial({
    this.recentSearches = const [],
    this.categories = const [],
  });

  @override
  List<Object?> get props => [recentSearches, categories];
}

/// Search is in progress.
class SearchLoading extends SearchState {
  final List<Category> categories;
  final String? selectedCategoryId;

  const SearchLoading({
    this.categories = const [],
    this.selectedCategoryId,
  });

  @override
  List<Object?> get props => [categories, selectedCategoryId];
}

/// Search completed with results.
class SearchLoaded extends SearchState {
  final String query;
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;
  final List<Category> categories;
  final String? selectedCategoryId;

  const SearchLoaded({
    required this.query,
    required this.articles,
    this.hasMore = true,
    this.currentPage = 1,
    this.categories = const [],
    this.selectedCategoryId,
  });

  SearchLoaded copyWith({
    String? query,
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
    List<Category>? categories,
    String? Function()? selectedCategoryId,
  }) {
    return SearchLoaded(
      query: query ?? this.query,
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      categories: categories ?? this.categories,
      selectedCategoryId: selectedCategoryId != null
          ? selectedCategoryId()
          : this.selectedCategoryId,
    );
  }

  @override
  List<Object?> get props =>
      [query, articles, hasMore, currentPage, categories, selectedCategoryId];
}

/// Search completed but returned no results.
class SearchEmpty extends SearchState {
  final String query;
  final List<Category> categories;
  final String? selectedCategoryId;

  const SearchEmpty({
    required this.query,
    this.categories = const [],
    this.selectedCategoryId,
  });

  @override
  List<Object?> get props => [query, categories, selectedCategoryId];
}

/// An error occurred during the search.
class SearchError extends SearchState {
  final String message;
  final List<Category> categories;
  final String? selectedCategoryId;

  const SearchError({
    required this.message,
    this.categories = const [],
    this.selectedCategoryId,
  });

  @override
  List<Object?> get props => [message, categories, selectedCategoryId];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Search feature.
///
/// Handles debounced search queries (300ms), infinite-scroll pagination,
/// recent search history, category filtering, and clearing the search state.
@injectable
class SearchBloc extends Bloc<SearchEvent, SearchState> {
  final SearchArticles _searchArticles;
  final GetCategories _getCategories;

  /// Number of articles per page.
  static const int _pageSize = 20;

  /// Maximum number of recent searches to keep.
  static const int _maxRecentSearches = 10;

  /// In-memory list of recent search queries.
  final List<String> _recentSearches = [];

  /// Currently selected category filter (null = all categories).
  String? _selectedCategoryId;

  /// Cached categories list loaded once on init.
  List<Category> _categories = const [];

  SearchBloc(this._searchArticles, this._getCategories)
      : super(const SearchInitial()) {
    on<SearchQueryChanged>(
      _onSearchQueryChanged,
      transformer: _debounceRestartable(const Duration(milliseconds: 300)),
    );
    on<LoadMoreSearchResults>(_onLoadMoreSearchResults);
    on<ClearSearch>(_onClearSearch);
    on<CategoryFilterChanged>(_onCategoryFilterChanged);
    on<_LoadCategories>(_onLoadCategories);

    // Fire-and-forget category loading.
    add(const _LoadCategories());
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

  /// Loads categories once on BLoC initialization.
  Future<void> _onLoadCategories(
    _LoadCategories event,
    Emitter<SearchState> emit,
  ) async {
    final result = await _getCategories(const NoParams());
    result.fold(
      (_) {
        // Silently ignore category loading failure.
      },
      (categories) {
        _categories = categories;
        // Re-emit current state with categories populated.
        final currentState = state;
        if (currentState is SearchInitial) {
          emit(SearchInitial(
            recentSearches: currentState.recentSearches,
            categories: _categories,
          ));
        }
      },
    );
  }

  /// Handles a new search query.
  Future<void> _onSearchQueryChanged(
    SearchQueryChanged event,
    Emitter<SearchState> emit,
  ) async {
    final query = event.query.trim();

    // If query is empty, return to initial state.
    if (query.isEmpty) {
      emit(SearchInitial(
        recentSearches: List.unmodifiable(_recentSearches),
        categories: _categories,
      ));
      return;
    }

    emit(SearchLoading(
      categories: _categories,
      selectedCategoryId: _selectedCategoryId,
    ));

    final result = await _searchArticles(SearchParams(
      query: query,
      page: 1,
      categoryId: _selectedCategoryId,
    ));

    result.fold(
      (failure) => emit(SearchError(
        message: failure.message ?? 'error_searching'.tr(),
        categories: _categories,
        selectedCategoryId: _selectedCategoryId,
      )),
      (searchResult) {
        // Add to recent searches.
        _addToRecentSearches(query);

        if (searchResult.articles.isEmpty) {
          emit(SearchEmpty(
            query: query,
            categories: _categories,
            selectedCategoryId: _selectedCategoryId,
          ));
        } else {
          emit(SearchLoaded(
            query: query,
            articles: searchResult.articles,
            hasMore: searchResult.articles.length >= _pageSize,
            currentPage: 1,
            categories: _categories,
            selectedCategoryId: _selectedCategoryId,
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
      SearchParams(
        query: currentState.query,
        page: nextPage,
        categoryId: _selectedCategoryId,
      ),
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

  /// Handles category filter changes. Re-runs the current search if active.
  Future<void> _onCategoryFilterChanged(
    CategoryFilterChanged event,
    Emitter<SearchState> emit,
  ) async {
    _selectedCategoryId = event.categoryId;

    // If we are currently in a search state, re-run the search with the
    // new category filter.
    final currentState = state;
    final String currentQuery;

    if (currentState is SearchLoaded) {
      currentQuery = currentState.query;
    } else if (currentState is SearchEmpty) {
      currentQuery = currentState.query;
    } else {
      // SearchInitial, SearchLoading, or SearchError — nothing to re-search.
      return;
    }

    if (currentQuery.trim().isEmpty) return;

    emit(SearchLoading(
      categories: _categories,
      selectedCategoryId: _selectedCategoryId,
    ));

    final result = await _searchArticles(SearchParams(
      query: currentQuery,
      page: 1,
      categoryId: _selectedCategoryId,
    ));

    result.fold(
      (failure) => emit(SearchError(
        message: failure.message ?? 'error_searching'.tr(),
        categories: _categories,
        selectedCategoryId: _selectedCategoryId,
      )),
      (searchResult) {
        if (searchResult.articles.isEmpty) {
          emit(SearchEmpty(
            query: currentQuery,
            categories: _categories,
            selectedCategoryId: _selectedCategoryId,
          ));
        } else {
          emit(SearchLoaded(
            query: currentQuery,
            articles: searchResult.articles,
            hasMore: searchResult.articles.length >= _pageSize,
            currentPage: 1,
            categories: _categories,
            selectedCategoryId: _selectedCategoryId,
          ));
        }
      },
    );
  }

  /// Clears the search and returns to the initial state.
  Future<void> _onClearSearch(
    ClearSearch event,
    Emitter<SearchState> emit,
  ) async {
    _selectedCategoryId = null;
    emit(SearchInitial(
      recentSearches: List.unmodifiable(_recentSearches),
      categories: _categories,
    ));
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
