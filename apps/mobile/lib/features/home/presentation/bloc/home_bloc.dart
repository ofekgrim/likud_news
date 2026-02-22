import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/article.dart';
import '../../domain/entities/category.dart';
import '../../domain/entities/story.dart';
import '../../domain/entities/ticker_item.dart';
import '../../domain/usecases/get_categories.dart';
import '../../domain/usecases/get_feed_articles.dart';
import '../../domain/usecases/get_hero_article.dart';
import '../../domain/usecases/get_stories.dart';
import '../../domain/usecases/get_ticker_items.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Home BLoC events.
sealed class HomeEvent extends Equatable {
  const HomeEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers initial loading of all home screen data.
class LoadHome extends HomeEvent {
  const LoadHome();
}

/// Loads the next page of feed articles (infinite scroll).
class LoadMoreArticles extends HomeEvent {
  const LoadMoreArticles();
}

/// Pull-to-refresh: reloads all data from page 1.
class RefreshFeed extends HomeEvent {
  const RefreshFeed();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Home BLoC states.
sealed class HomeState extends Equatable {
  const HomeState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
class HomeInitial extends HomeState {
  const HomeInitial();
}

/// Data is being fetched for the first time.
class HomeLoading extends HomeState {
  const HomeLoading();
}

/// All home screen data loaded successfully.
class HomeLoaded extends HomeState {
  final Article? heroArticle;
  final List<Article> articles;
  final List<TickerItem> tickerItems;
  final List<Category> categories;
  final List<Story> stories;
  final bool hasMore;
  final int currentPage;

  const HomeLoaded({
    this.heroArticle,
    this.articles = const [],
    this.tickerItems = const [],
    this.categories = const [],
    this.stories = const [],
    this.hasMore = true,
    this.currentPage = 1,
  });

  /// Creates a copy with optional overrides.
  HomeLoaded copyWith({
    Article? heroArticle,
    List<Article>? articles,
    List<TickerItem>? tickerItems,
    List<Category>? categories,
    List<Story>? stories,
    bool? hasMore,
    int? currentPage,
  }) {
    return HomeLoaded(
      heroArticle: heroArticle ?? this.heroArticle,
      articles: articles ?? this.articles,
      tickerItems: tickerItems ?? this.tickerItems,
      categories: categories ?? this.categories,
      stories: stories ?? this.stories,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [
    heroArticle,
    articles,
    tickerItems,
    categories,
    stories,
    hasMore,
    currentPage,
  ];
}

/// An error occurred while loading home data.
class HomeError extends HomeState {
  final String message;

  const HomeError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Home screen.
///
/// Orchestrates four parallel use cases on initial load and supports
/// infinite-scroll pagination and pull-to-refresh.
@injectable
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final GetHeroArticle _getHeroArticle;
  final GetFeedArticles _getFeedArticles;
  final GetTickerItems _getTickerItems;
  final GetCategories _getCategories;
  final GetStories _getStories;

  /// Number of articles per page. When a page returns fewer items,
  /// [HomeLoaded.hasMore] is set to false.
  static const int _pageSize = 10;

  HomeBloc(
    this._getHeroArticle,
    this._getFeedArticles,
    this._getTickerItems,
    this._getCategories,
    this._getStories,
  ) : super(const HomeInitial()) {
    on<LoadHome>(_onLoadHome);
    on<LoadMoreArticles>(_onLoadMoreArticles);
    on<RefreshFeed>(_onRefreshFeed);
  }

  /// Loads all home data in parallel.
  Future<void> _onLoadHome(LoadHome event, Emitter<HomeState> emit) async {
    emit(const HomeLoading());

    // Fire all requests in parallel.
    final results = await Future.wait([
      _getHeroArticle(const NoParams()),
      _getFeedArticles(const FeedParams(page: 1, limit: _pageSize)),
      _getTickerItems(const NoParams()),
      _getCategories(const NoParams()),
      _getStories(const NoParams()),
    ]);

    final heroResult = results[0];
    final feedResult = results[1];
    final tickerResult = results[2];
    final categoriesResult = results[3];
    final storiesResult = results[4];

    // If the feed fails, surface the error. Other sections degrade gracefully.
    final feedEither = feedResult;
    if (feedEither.isLeft()) {
      final failure = feedEither.fold((f) => f, (_) => null);
      emit(HomeError(message: failure?.message ?? 'Failed to load articles'));
      return;
    }

    final articles = feedEither.fold(
      (_) => <Article>[],
      (list) => list as List<Article>,
    );
    final heroArticle = heroResult.fold((_) => null, (a) => a as Article);
    final tickerItems = tickerResult.fold(
      (_) => <TickerItem>[],
      (list) => list as List<TickerItem>,
    );
    final categories = categoriesResult.fold(
      (_) => <Category>[],
      (list) => list as List<Category>,
    );
    final stories = storiesResult.fold(
      (_) => <Story>[],
      (list) => list as List<Story>,
    );

    emit(
      HomeLoaded(
        heroArticle: heroArticle,
        articles: articles,
        tickerItems: tickerItems,
        categories: categories,
        stories: stories,
        hasMore: articles.length >= _pageSize,
        currentPage: 1,
      ),
    );
  }

  /// Loads the next page of articles and appends to the existing list.
  Future<void> _onLoadMoreArticles(
    LoadMoreArticles event,
    Emitter<HomeState> emit,
  ) async {
    final currentState = state;
    if (currentState is! HomeLoaded || !currentState.hasMore) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _getFeedArticles(FeedParams(page: nextPage, limit: _pageSize));

    result.fold(
      (failure) {
        // Silently keep existing data on pagination failure.
        emit(currentState.copyWith(hasMore: false));
      },
      (newArticles) {
        emit(
          currentState.copyWith(
            articles: [...currentState.articles, ...newArticles],
            currentPage: nextPage,
            hasMore: newArticles.length >= _pageSize,
          ),
        );
      },
    );
  }

  /// Refreshes all home data from scratch (pull-to-refresh).
  Future<void> _onRefreshFeed(
    RefreshFeed event,
    Emitter<HomeState> emit,
  ) async {
    // Reload everything from page 1.
    final results = await Future.wait([
      _getHeroArticle(const NoParams()),
      _getFeedArticles(const FeedParams(page: 1, limit: _pageSize)),
      _getTickerItems(const NoParams()),
      _getCategories(const NoParams()),
      _getStories(const NoParams()),
    ]);

    final heroResult = results[0];
    final feedResult = results[1];
    final tickerResult = results[2];
    final categoriesResult = results[3];
    final storiesResult = results[4];

    final feedEither = feedResult;
    if (feedEither.isLeft()) {
      // On refresh failure, keep existing state if available.
      if (state is HomeLoaded) return;
      final failure = feedEither.fold((f) => f, (_) => null);
      emit(HomeError(message: failure?.message ?? 'Failed to refresh'));
      return;
    }

    final articles = feedEither.fold(
      (_) => <Article>[],
      (list) => list as List<Article>,
    );
    final heroArticle = heroResult.fold((_) => null, (a) => a as Article);
    final tickerItems = tickerResult.fold(
      (_) => <TickerItem>[],
      (list) => list as List<TickerItem>,
    );
    final categories = categoriesResult.fold(
      (_) => <Category>[],
      (list) => list as List<Category>,
    );
    final stories = storiesResult.fold(
      (_) => <Story>[],
      (list) => list as List<Story>,
    );

    emit(
      HomeLoaded(
        heroArticle: heroArticle,
        articles: articles,
        tickerItems: tickerItems,
        categories: categories,
        stories: stories,
        hasMore: articles.length >= _pageSize,
        currentPage: 1,
      ),
    );
  }
}
