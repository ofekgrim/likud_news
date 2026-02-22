import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../home/domain/entities/article.dart';
import '../../domain/usecases/get_tag_articles.dart';

// Events
sealed class TagArticlesEvent extends Equatable {
  const TagArticlesEvent();
  @override
  List<Object?> get props => [];
}

class LoadTagArticles extends TagArticlesEvent {
  final String slug;
  final int page;
  const LoadTagArticles({required this.slug, this.page = 1});
  @override
  List<Object?> get props => [slug, page];
}

class RefreshTagArticles extends TagArticlesEvent {
  final String slug;
  const RefreshTagArticles({required this.slug});
  @override
  List<Object?> get props => [slug];
}

// States
sealed class TagArticlesState extends Equatable {
  const TagArticlesState();
  @override
  List<Object?> get props => [];
}

class TagArticlesInitial extends TagArticlesState {
  const TagArticlesInitial();
}

class TagArticlesLoading extends TagArticlesState {
  const TagArticlesLoading();
}

class TagArticlesLoaded extends TagArticlesState {
  final String tagName;
  final List<Article> articles;
  final bool hasMore;
  final int currentPage;

  const TagArticlesLoaded({
    required this.tagName,
    required this.articles,
    this.hasMore = true,
    this.currentPage = 1,
  });

  TagArticlesLoaded copyWith({
    String? tagName,
    List<Article>? articles,
    bool? hasMore,
    int? currentPage,
  }) {
    return TagArticlesLoaded(
      tagName: tagName ?? this.tagName,
      articles: articles ?? this.articles,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }

  @override
  List<Object?> get props => [tagName, articles, hasMore, currentPage];
}

class TagArticlesError extends TagArticlesState {
  final String message;
  const TagArticlesError({required this.message});
  @override
  List<Object?> get props => [message];
}

// BLoC
@injectable
class TagArticlesBloc extends Bloc<TagArticlesEvent, TagArticlesState> {
  final GetTagArticles _getTagArticles;
  static const int _pageSize = 20;

  /// Tag display name, set from the route query param.
  String _tagName = '';

  void setTagName(String name) => _tagName = name;

  TagArticlesBloc(this._getTagArticles) : super(const TagArticlesInitial()) {
    on<LoadTagArticles>(_onLoad);
    on<RefreshTagArticles>(_onRefresh);
  }

  Future<void> _onLoad(
    LoadTagArticles event,
    Emitter<TagArticlesState> emit,
  ) async {
    final currentState = state;

    // Pagination
    if (event.page > 1 && currentState is TagArticlesLoaded) {
      if (!currentState.hasMore) return;

      final result = await _getTagArticles(
        TagArticlesParams(slug: event.slug, page: event.page),
      );

      result.fold(
        (failure) => emit(currentState.copyWith(hasMore: false)),
        (newArticles) => emit(
          currentState.copyWith(
            articles: [...currentState.articles, ...newArticles],
            currentPage: event.page,
            hasMore: newArticles.length >= _pageSize,
          ),
        ),
      );
      return;
    }

    // First page
    emit(const TagArticlesLoading());

    final result = await _getTagArticles(
      TagArticlesParams(slug: event.slug, page: 1),
    );

    result.fold(
      (failure) => emit(
        TagArticlesError(
          message: failure.message ?? 'error_loading_tag_articles'.tr(),
        ),
      ),
      (articles) => emit(
        TagArticlesLoaded(
          tagName: _tagName.isNotEmpty ? _tagName : event.slug,
          articles: articles,
          hasMore: articles.length >= _pageSize,
          currentPage: 1,
        ),
      ),
    );
  }

  Future<void> _onRefresh(
    RefreshTagArticles event,
    Emitter<TagArticlesState> emit,
  ) async {
    final currentState = state;

    final result = await _getTagArticles(
      TagArticlesParams(slug: event.slug, page: 1),
    );

    result.fold(
      (failure) {
        if (currentState is! TagArticlesLoaded) {
          emit(TagArticlesError(
            message: failure.message ?? 'error_loading_tag_articles'.tr(),
          ));
        }
      },
      (articles) => emit(
        TagArticlesLoaded(
          tagName: currentState is TagArticlesLoaded
              ? currentState.tagName
              : (_tagName.isNotEmpty ? _tagName : event.slug),
          articles: articles,
          hasMore: articles.length >= _pageSize,
          currentPage: 1,
        ),
      ),
    );
  }
}
