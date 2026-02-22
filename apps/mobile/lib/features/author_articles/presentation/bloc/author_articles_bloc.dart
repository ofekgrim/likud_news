import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../article_detail/domain/entities/author.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/usecases/get_author_articles.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

sealed class AuthorArticlesEvent extends Equatable {
  const AuthorArticlesEvent();
  @override
  List<Object?> get props => [];
}

class LoadAuthorArticles extends AuthorArticlesEvent {
  final String authorId;
  final int page;
  const LoadAuthorArticles({required this.authorId, this.page = 1});
  @override
  List<Object?> get props => [authorId, page];
}

class RefreshAuthorArticles extends AuthorArticlesEvent {
  final String authorId;
  const RefreshAuthorArticles({required this.authorId});
  @override
  List<Object?> get props => [authorId];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

sealed class AuthorArticlesState extends Equatable {
  const AuthorArticlesState();
  @override
  List<Object?> get props => [];
}

class AuthorArticlesInitial extends AuthorArticlesState {
  const AuthorArticlesInitial();
}

class AuthorArticlesLoading extends AuthorArticlesState {
  const AuthorArticlesLoading();
}

class AuthorArticlesLoaded extends AuthorArticlesState {
  final Author author;
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;

  const AuthorArticlesLoaded({
    required this.author,
    required this.articles,
    this.hasMore = true,
    this.currentPage = 1,
  });

  AuthorArticlesLoaded copyWith({
    Author? author,
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
  }) {
    return AuthorArticlesLoaded(
      author: author ?? this.author,
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [author, articles, hasMore, currentPage];
}

class AuthorArticlesError extends AuthorArticlesState {
  final String message;
  const AuthorArticlesError({required this.message});
  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

@injectable
class AuthorArticlesBloc
    extends Bloc<AuthorArticlesEvent, AuthorArticlesState> {
  final GetAuthorArticles _getAuthorArticles;
  static const int _pageSize = 20;

  AuthorArticlesBloc(this._getAuthorArticles)
      : super(const AuthorArticlesInitial()) {
    on<LoadAuthorArticles>(_onLoad);
    on<RefreshAuthorArticles>(_onRefresh);
  }

  Future<void> _onLoad(
    LoadAuthorArticles event,
    Emitter<AuthorArticlesState> emit,
  ) async {
    final currentState = state;

    // Pagination — append to existing list
    if (event.page > 1 && currentState is AuthorArticlesLoaded) {
      if (!currentState.hasMore) return;

      final result = await _getAuthorArticles(
        AuthorArticlesParams(authorId: event.authorId, page: event.page),
      );

      result.fold(
        (failure) => emit(currentState.copyWith(hasMore: false)),
        (data) => emit(
          currentState.copyWith(
            articles: [...currentState.articles, ...data.articles],
            currentPage: event.page,
            hasMore: data.articles.length >= _pageSize,
          ),
        ),
      );
      return;
    }

    // First page
    emit(const AuthorArticlesLoading());

    final result = await _getAuthorArticles(
      AuthorArticlesParams(authorId: event.authorId, page: 1),
    );

    result.fold(
      (failure) => emit(
        AuthorArticlesError(
          message: failure.message ?? 'error_loading_author_articles'.tr(),
        ),
      ),
      (data) => emit(
        AuthorArticlesLoaded(
          author: data.author,
          articles: data.articles,
          hasMore: data.articles.length >= _pageSize,
          currentPage: 1,
        ),
      ),
    );
  }

  Future<void> _onRefresh(
    RefreshAuthorArticles event,
    Emitter<AuthorArticlesState> emit,
  ) async {
    final currentState = state;

    final result = await _getAuthorArticles(
      AuthorArticlesParams(authorId: event.authorId, page: 1),
    );

    result.fold(
      (failure) {
        if (currentState is! AuthorArticlesLoaded) {
          emit(AuthorArticlesError(
            message:
                failure.message ?? 'error_loading_author_articles'.tr(),
          ));
        }
      },
      (data) => emit(
        AuthorArticlesLoaded(
          author: data.author,
          articles: data.articles,
          hasMore: data.articles.length >= _pageSize,
          currentPage: 1,
        ),
      ),
    );
  }
}
