import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/usecases/get_featured_article.dart';
import '../../domain/usecases/get_magazine_articles.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Magazine BLoC events.
sealed class MagazineEvent extends Equatable {
  const MagazineEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers initial loading of magazine data (featured article + articles).
final class LoadMagazine extends MagazineEvent {
  const LoadMagazine();
}

/// Loads the next page of magazine articles (infinite scroll).
final class LoadMoreMagazine extends MagazineEvent {
  const LoadMoreMagazine();
}

/// Pull-to-refresh: reloads all data from page 1.
final class RefreshMagazine extends MagazineEvent {
  const RefreshMagazine();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Magazine BLoC states.
sealed class MagazineState extends Equatable {
  const MagazineState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class MagazineInitial extends MagazineState {
  const MagazineInitial();
}

/// Data is being fetched for the first time.
final class MagazineLoading extends MagazineState {
  const MagazineLoading();
}

/// All magazine data loaded successfully.
final class MagazineLoaded extends MagazineState {
  final Article? featuredArticle;
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;

  const MagazineLoaded({
    this.featuredArticle,
    this.articles = const [],
    this.hasMore = true,
    this.currentPage = 1,
  });

  /// Creates a copy with optional overrides.
  MagazineLoaded copyWith({
    Article? featuredArticle,
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
  }) {
    return MagazineLoaded(
      featuredArticle: featuredArticle ?? this.featuredArticle,
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [
        featuredArticle,
        articles,
        hasMore,
        currentPage,
      ];
}

/// An error occurred while loading magazine data.
final class MagazineError extends MagazineState {
  final String message;

  const MagazineError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Magazine screen.
///
/// Orchestrates featured article and paginated article list loading,
/// and supports infinite-scroll pagination and pull-to-refresh.
@injectable
class MagazineBloc extends Bloc<MagazineEvent, MagazineState> {
  final GetFeaturedArticle _getFeaturedArticle;
  final GetMagazineArticles _getMagazineArticles;

  /// Number of articles per page. When a page returns fewer items,
  /// [MagazineLoaded.hasMore] is set to false.
  static const int _pageSize = 20;

  MagazineBloc(
    this._getFeaturedArticle,
    this._getMagazineArticles,
  ) : super(const MagazineInitial()) {
    on<LoadMagazine>(_onLoadMagazine);
    on<LoadMoreMagazine>(_onLoadMoreMagazine);
    on<RefreshMagazine>(_onRefreshMagazine);
  }

  /// Loads featured article and first page of articles in parallel.
  Future<void> _onLoadMagazine(
    LoadMagazine event,
    Emitter<MagazineState> emit,
  ) async {
    emit(const MagazineLoading());

    // Fire both requests in parallel.
    final results = await Future.wait([
      _getFeaturedArticle(const NoParams()),
      _getMagazineArticles(const MagazineParams(page: 1)),
    ]);

    final featuredResult = results[0];
    final articlesResult = results[1];

    // If the articles list fails, surface the error.
    if (articlesResult.isLeft()) {
      final failure = articlesResult.fold((f) => f, (_) => null);
      emit(MagazineError(
        message: failure?.message ?? 'error_loading_magazine'.tr(),
      ));
      return;
    }

    final articles = articlesResult.fold(
      (_) => <Article>[],
      (list) => list as List<Article>,
    );
    final featuredArticle = featuredResult.fold(
      (_) => null,
      (a) => a as Article?,
    );

    emit(MagazineLoaded(
      featuredArticle: featuredArticle,
      articles: articles,
      hasMore: articles.length >= _pageSize,
      currentPage: 1,
    ));
  }

  /// Loads the next page of articles and appends to the existing list.
  Future<void> _onLoadMoreMagazine(
    LoadMoreMagazine event,
    Emitter<MagazineState> emit,
  ) async {
    final currentState = state;
    if (currentState is! MagazineLoaded || !currentState.hasMore) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _getMagazineArticles(
      MagazineParams(page: nextPage),
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

  /// Refreshes all magazine data from scratch (pull-to-refresh).
  Future<void> _onRefreshMagazine(
    RefreshMagazine event,
    Emitter<MagazineState> emit,
  ) async {
    // Fire both requests in parallel.
    final results = await Future.wait([
      _getFeaturedArticle(const NoParams()),
      _getMagazineArticles(const MagazineParams(page: 1)),
    ]);

    final featuredResult = results[0];
    final articlesResult = results[1];

    if (articlesResult.isLeft()) {
      // On refresh failure, keep existing state if available.
      if (state is MagazineLoaded) return;
      final failure = articlesResult.fold((f) => f, (_) => null);
      emit(MagazineError(
        message: failure?.message ?? 'error_refreshing_magazine'.tr(),
      ));
      return;
    }

    final articles = articlesResult.fold(
      (_) => <Article>[],
      (list) => list as List<Article>,
    );
    final featuredArticle = featuredResult.fold(
      (_) => null,
      (a) => a as Article?,
    );

    emit(MagazineLoaded(
      featuredArticle: featuredArticle,
      articles: articles,
      hasMore: articles.length >= _pageSize,
      currentPage: 1,
    ));
  }
}
