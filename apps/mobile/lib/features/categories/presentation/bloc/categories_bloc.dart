import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../../../home/domain/entities/category.dart';
import '../../domain/usecases/get_categories.dart';
import '../../domain/usecases/get_category_articles.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Categories BLoC events.
sealed class CategoriesEvent extends Equatable {
  const CategoriesEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers the initial loading of all categories.
class LoadCategories extends CategoriesEvent {
  const LoadCategories();
}

/// Loads articles for a specific category by [slug].
class LoadCategoryArticles extends CategoriesEvent {
  final String slug;
  final int page;

  const LoadCategoryArticles({
    required this.slug,
    this.page = 1,
  });

  @override
  List<Object?> get props => [slug, page];
}

/// Pull-to-refresh: reloads articles for the current category from page 1.
class RefreshCategoryArticles extends CategoriesEvent {
  final String slug;

  const RefreshCategoryArticles({required this.slug});

  @override
  List<Object?> get props => [slug];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Categories BLoC states.
sealed class CategoriesState extends Equatable {
  const CategoriesState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
class CategoriesInitial extends CategoriesState {
  const CategoriesInitial();
}

/// Data is being fetched for the first time.
class CategoriesLoading extends CategoriesState {
  const CategoriesLoading();
}

/// All categories loaded successfully.
class CategoriesLoaded extends CategoriesState {
  final List<Category> categories;

  const CategoriesLoaded({required this.categories});

  @override
  List<Object?> get props => [categories];
}

/// Articles for a specific category loaded successfully.
class CategoryArticlesLoaded extends CategoriesState {
  final Category category;
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;

  const CategoryArticlesLoaded({
    required this.category,
    required this.articles,
    this.hasMore = true,
    this.currentPage = 1,
  });

  CategoryArticlesLoaded copyWith({
    Category? category,
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
  }) {
    return CategoryArticlesLoaded(
      category: category ?? this.category,
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [category, articles, hasMore, currentPage];
}

/// An error occurred while loading categories or category articles.
class CategoriesError extends CategoriesState {
  final String message;

  const CategoriesError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Categories feature.
///
/// Supports loading the categories grid, viewing articles by category,
/// infinite-scroll pagination, and pull-to-refresh.
@injectable
class CategoriesBloc extends Bloc<CategoriesEvent, CategoriesState> {
  final GetCategories _getCategories;
  final GetCategoryArticles _getCategoryArticles;

  /// Number of articles per page. When a page returns fewer items,
  /// [CategoryArticlesLoaded.hasMore] is set to false.
  static const int _pageSize = 20;

  CategoriesBloc(
    this._getCategories,
    this._getCategoryArticles,
  ) : super(const CategoriesInitial()) {
    on<LoadCategories>(_onLoadCategories);
    on<LoadCategoryArticles>(_onLoadCategoryArticles);
    on<RefreshCategoryArticles>(_onRefreshCategoryArticles);
  }

  /// Loads all active categories.
  Future<void> _onLoadCategories(
    LoadCategories event,
    Emitter<CategoriesState> emit,
  ) async {
    emit(const CategoriesLoading());

    final result = await _getCategories(const NoParams());

    result.fold(
      (failure) => emit(CategoriesError(
        message: failure.message ?? 'error_loading_categories'.tr(),
      )),
      (categories) => emit(CategoriesLoaded(categories: categories)),
    );
  }

  /// Loads articles for a specific category.
  ///
  /// On page 1, emits a loading state first. On subsequent pages,
  /// appends articles to the existing list (infinite scroll).
  Future<void> _onLoadCategoryArticles(
    LoadCategoryArticles event,
    Emitter<CategoriesState> emit,
  ) async {
    final currentState = state;

    // For pagination (page > 1), append to existing articles.
    if (event.page > 1 && currentState is CategoryArticlesLoaded) {
      if (!currentState.hasMore) return;

      final result = await _getCategoryArticles(
        CategoryArticlesParams(slug: event.slug, page: event.page),
      );

      result.fold(
        (failure) {
          // Silently keep existing data on pagination failure.
          emit(currentState.copyWith(hasMore: false));
        },
        (newArticles) {
          emit(currentState.copyWith(
            articles: [...currentState.articles, ...newArticles],
            currentPage: event.page,
            hasMore: newArticles.length >= _pageSize,
          ));
        },
      );
      return;
    }

    // First page — show loading.
    emit(const CategoriesLoading());

    // First, load categories to find the selected one.
    final categoriesResult = await _getCategories(const NoParams());
    Category? selectedCategory;
    categoriesResult.fold(
      (_) {},
      (categories) {
        selectedCategory = categories.where((c) => c.slug == event.slug).firstOrNull;
      },
    );

    // If category not found, create a placeholder from slug.
    selectedCategory ??= Category(
      id: 0,
      name: event.slug,
      slug: event.slug,
    );

    final result = await _getCategoryArticles(
      CategoryArticlesParams(slug: event.slug, page: 1),
    );

    result.fold(
      (failure) => emit(CategoriesError(
        message: failure.message ?? 'error_loading_category_articles'.tr(),
      )),
      (articles) => emit(CategoryArticlesLoaded(
        category: selectedCategory!,
        articles: articles,
        hasMore: articles.length >= _pageSize,
        currentPage: 1,
      )),
    );
  }

  /// Refreshes the articles for a specific category (pull-to-refresh).
  Future<void> _onRefreshCategoryArticles(
    RefreshCategoryArticles event,
    Emitter<CategoriesState> emit,
  ) async {
    final currentState = state;

    final result = await _getCategoryArticles(
      CategoryArticlesParams(slug: event.slug, page: 1),
    );

    result.fold(
      (failure) {
        // On refresh failure, keep current state if available.
        if (currentState is! CategoryArticlesLoaded) {
          emit(CategoriesError(
            message: failure.message ?? 'error_refreshing_category_articles'.tr(),
          ));
        }
      },
      (articles) {
        final category = currentState is CategoryArticlesLoaded
            ? currentState.category
            : Category(id: 0, name: event.slug, slug: event.slug);

        emit(CategoryArticlesLoaded(
          category: category,
          articles: articles,
          hasMore: articles.length >= _pageSize,
          currentPage: 1,
        ));
      },
    );
  }
}
