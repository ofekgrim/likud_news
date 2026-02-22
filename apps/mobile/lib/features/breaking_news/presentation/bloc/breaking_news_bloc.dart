import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/usecases/get_all_articles.dart';
import '../../domain/usecases/get_breaking_articles.dart';
import '../../domain/usecases/watch_breaking_news.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all breaking news events.
sealed class BreakingNewsEvent extends Equatable {
  const BreakingNewsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers the initial load of breaking articles and starts the SSE stream.
class LoadBreakingNews extends BreakingNewsEvent {
  const LoadBreakingNews();
}

/// Emitted internally when a new article arrives from the SSE stream.
class NewBreakingArticle extends BreakingNewsEvent {
  final Article article;

  const NewBreakingArticle(this.article);

  @override
  List<Object?> get props => [article];
}

/// Pull-to-refresh: re-fetches the breaking articles list.
class RefreshBreaking extends BreakingNewsEvent {
  const RefreshBreaking();
}

/// Emitted internally when the SSE stream encounters an error.
class _SseDisconnected extends BreakingNewsEvent {
  const _SseDisconnected();
}

/// Triggers loading the "all articles" list (page 1).
class LoadAllArticles extends BreakingNewsEvent {
  const LoadAllArticles();
}

/// Loads the next page of "all articles".
class LoadMoreAllArticles extends BreakingNewsEvent {
  const LoadMoreAllArticles();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all breaking news states.
sealed class BreakingNewsState extends Equatable {
  const BreakingNewsState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
class BreakingNewsInitial extends BreakingNewsState {
  const BreakingNewsInitial();
}

/// Loading state while fetching breaking articles.
class BreakingNewsLoading extends BreakingNewsState {
  const BreakingNewsLoading();
}

/// Loaded state containing the list of breaking articles.
class BreakingNewsLoaded extends BreakingNewsState {
  final List<Article> articles;
  final bool isLive;
  final List<Article> allArticles;
  final int allArticlesPage;
  final bool allArticlesHasMore;

  const BreakingNewsLoaded({
    required this.articles,
    this.isLive = false,
    this.allArticles = const [],
    this.allArticlesPage = 0,
    this.allArticlesHasMore = true,
  });

  BreakingNewsLoaded copyWith({
    List<Article>? articles,
    bool? isLive,
    List<Article>? allArticles,
    int? allArticlesPage,
    bool? allArticlesHasMore,
  }) {
    return BreakingNewsLoaded(
      articles: articles ?? this.articles,
      isLive: isLive ?? this.isLive,
      allArticles: allArticles ?? this.allArticles,
      allArticlesPage: allArticlesPage ?? this.allArticlesPage,
      allArticlesHasMore: allArticlesHasMore ?? this.allArticlesHasMore,
    );
  }

  @override
  List<Object?> get props => [articles, isLive, allArticles, allArticlesPage, allArticlesHasMore];
}

/// Error state with a user-facing message.
class BreakingNewsError extends BreakingNewsState {
  final String message;

  const BreakingNewsError(this.message);

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the breaking news feature state.
///
/// On [LoadBreakingNews]:
///   1. Fetches the current list of breaking articles via REST.
///   2. Subscribes to the SSE stream for real-time updates.
///
/// On [NewBreakingArticle]:
///   Prepends the incoming article to the current list (deduplicating by id).
///
/// On [RefreshBreaking]:
///   Re-fetches the article list while keeping the SSE connection alive.
@injectable
class BreakingNewsBloc extends Bloc<BreakingNewsEvent, BreakingNewsState> {
  final GetBreakingArticles _getBreakingArticles;
  final WatchBreakingNews _watchBreakingNews;
  final GetAllArticles _getAllArticles;

  static const int _pageSize = 10;

  StreamSubscription<Article>? _sseSubscription;

  BreakingNewsBloc(
    this._getBreakingArticles,
    this._watchBreakingNews,
    this._getAllArticles,
  ) : super(const BreakingNewsInitial()) {
    on<LoadBreakingNews>(_onLoad);
    on<NewBreakingArticle>(_onNewArticle);
    on<RefreshBreaking>(_onRefresh);
    on<_SseDisconnected>(_onSseDisconnected);
    on<LoadAllArticles>(_onLoadAllArticles);
    on<LoadMoreAllArticles>(_onLoadMoreAllArticles);
  }

  Future<void> _onLoad(
    LoadBreakingNews event,
    Emitter<BreakingNewsState> emit,
  ) async {
    emit(const BreakingNewsLoading());

    final result = await _getBreakingArticles(const NoParams());

    result.fold(
      (failure) => emit(BreakingNewsError(
        failure.message ?? 'error_loading_breaking'.tr(),
      )),
      (articles) {
        emit(BreakingNewsLoaded(articles: articles, isLive: true));
        _subscribeSse();
      },
    );
  }

  Future<void> _onNewArticle(
    NewBreakingArticle event,
    Emitter<BreakingNewsState> emit,
  ) async {
    final currentState = state;
    if (currentState is BreakingNewsLoaded) {
      // Deduplicate: remove any existing article with the same id.
      final updated = [
        event.article,
        ...currentState.articles.where((a) => a.id != event.article.id),
      ];
      emit(currentState.copyWith(articles: updated));
    }
  }

  Future<void> _onRefresh(
    RefreshBreaking event,
    Emitter<BreakingNewsState> emit,
  ) async {
    final result = await _getBreakingArticles(const NoParams());

    result.fold(
      (failure) {
        // On refresh failure, keep current articles if available.
        if (state is! BreakingNewsLoaded) {
          emit(BreakingNewsError(
            failure.message ?? 'error_loading_breaking'.tr(),
          ));
        }
      },
      (articles) {
        emit(BreakingNewsLoaded(articles: articles, isLive: true));
      },
    );
  }

  Future<void> _onSseDisconnected(
    _SseDisconnected event,
    Emitter<BreakingNewsState> emit,
  ) async {
    final currentState = state;
    if (currentState is BreakingNewsLoaded) {
      emit(currentState.copyWith(isLive: false));
    }
  }

  Future<void> _onLoadAllArticles(
    LoadAllArticles event,
    Emitter<BreakingNewsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! BreakingNewsLoaded) return;

    // Don't reload if already loaded
    if (currentState.allArticlesPage > 0) return;

    final result = await _getAllArticles(const AllArticlesParams(page: 1, limit: _pageSize));

    result.fold(
      (failure) {
        // Keep current state, just mark no more
        emit(currentState.copyWith(allArticlesHasMore: false));
      },
      (articles) {
        emit(currentState.copyWith(
          allArticles: articles,
          allArticlesPage: 1,
          allArticlesHasMore: articles.length >= _pageSize,
        ));
      },
    );
  }

  Future<void> _onLoadMoreAllArticles(
    LoadMoreAllArticles event,
    Emitter<BreakingNewsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! BreakingNewsLoaded || !currentState.allArticlesHasMore) return;

    final nextPage = currentState.allArticlesPage + 1;
    final result = await _getAllArticles(AllArticlesParams(page: nextPage, limit: _pageSize));

    result.fold(
      (failure) {
        emit(currentState.copyWith(allArticlesHasMore: false));
      },
      (newArticles) {
        emit(currentState.copyWith(
          allArticles: [...currentState.allArticles, ...newArticles],
          allArticlesPage: nextPage,
          allArticlesHasMore: newArticles.length >= _pageSize,
        ));
      },
    );
  }

  void _subscribeSse() {
    _sseSubscription?.cancel();
    _sseSubscription = _watchBreakingNews().listen(
      (article) => add(NewBreakingArticle(article)),
      onError: (_) {
        // SSE errors are handled by SseClient's auto-reconnect.
        // Mark the stream as no longer live in the UI.
        add(const _SseDisconnected());
      },
    );
  }

  @override
  Future<void> close() {
    _sseSubscription?.cancel();
    return super.close();
  }
}
