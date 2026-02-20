import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/entities/comment.dart';
import '../../domain/usecases/get_comments.dart';
import '../../domain/usecases/like_comment.dart';
import '../../domain/usecases/submit_comment.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

sealed class CommentsEvent extends Equatable {
  const CommentsEvent();

  @override
  List<Object?> get props => [];
}

/// Loads the first page of comments for the given article.
class LoadComments extends CommentsEvent {
  final String articleId;
  final int page;

  const LoadComments({required this.articleId, this.page = 1});

  @override
  List<Object?> get props => [articleId, page];
}

/// Loads the next page of comments (pagination).
class LoadMoreComments extends CommentsEvent {
  const LoadMoreComments();
}

/// Submits a new comment (or reply) on the current article.
class SubmitCommentEvent extends CommentsEvent {
  final String articleId;
  final String authorName;
  final String body;
  final String? parentId;

  const SubmitCommentEvent({
    required this.articleId,
    required this.authorName,
    required this.body,
    this.parentId,
  });

  @override
  List<Object?> get props => [articleId, authorName, body, parentId];
}

/// Likes a comment (optimistic local update + API call).
class LikeCommentEvent extends CommentsEvent {
  final String commentId;

  const LikeCommentEvent({required this.commentId});

  @override
  List<Object?> get props => [commentId];
}

/// Sets the reply target when user taps "Reply" on a comment.
class SetReplyTarget extends CommentsEvent {
  final String commentId;
  final String authorName;

  const SetReplyTarget({required this.commentId, required this.authorName});

  @override
  List<Object?> get props => [commentId, authorName];
}

/// Clears the reply target (user cancelled reply).
class ClearReplyTarget extends CommentsEvent {
  const ClearReplyTarget();
}

/// Toggles expanded/collapsed state for a comment's replies.
class ToggleRepliesExpanded extends CommentsEvent {
  final String commentId;

  const ToggleRepliesExpanded({required this.commentId});

  @override
  List<Object?> get props => [commentId];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

sealed class CommentsState extends Equatable {
  const CommentsState();

  @override
  List<Object?> get props => [];
}

class CommentsInitial extends CommentsState {
  const CommentsInitial();
}

class CommentsLoading extends CommentsState {
  const CommentsLoading();
}

class CommentsLoaded extends CommentsState {
  final List<Comment> comments;
  final bool hasMore;
  final int currentPage;
  final String articleId;
  final Set<String> likedCommentIds;
  final String? replyTargetId;
  final String? replyTargetAuthor;
  final Set<String> expandedRepliesIds;

  const CommentsLoaded({
    required this.comments,
    required this.hasMore,
    required this.currentPage,
    required this.articleId,
    this.likedCommentIds = const {},
    this.replyTargetId,
    this.replyTargetAuthor,
    this.expandedRepliesIds = const {},
  });

  CommentsLoaded copyWith({
    List<Comment>? comments,
    bool? hasMore,
    int? currentPage,
    String? articleId,
    Set<String>? likedCommentIds,
    String? Function()? replyTargetId,
    String? Function()? replyTargetAuthor,
    Set<String>? expandedRepliesIds,
  }) {
    return CommentsLoaded(
      comments: comments ?? this.comments,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      articleId: articleId ?? this.articleId,
      likedCommentIds: likedCommentIds ?? this.likedCommentIds,
      replyTargetId:
          replyTargetId != null ? replyTargetId() : this.replyTargetId,
      replyTargetAuthor:
          replyTargetAuthor != null ? replyTargetAuthor() : this.replyTargetAuthor,
      expandedRepliesIds: expandedRepliesIds ?? this.expandedRepliesIds,
    );
  }

  @override
  List<Object?> get props => [
        comments,
        hasMore,
        currentPage,
        articleId,
        likedCommentIds,
        replyTargetId,
        replyTargetAuthor,
        expandedRepliesIds,
      ];
}

class CommentSubmitting extends CommentsState {
  const CommentSubmitting();
}

class CommentSubmitted extends CommentsState {
  const CommentSubmitted();
}

class CommentsError extends CommentsState {
  final String message;

  const CommentsError(this.message);

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

@injectable
class CommentsBloc extends Bloc<CommentsEvent, CommentsState> {
  final GetComments _getComments;
  final SubmitComment _submitComment;
  final LikeComment _likeComment;

  // Internal state for pagination and UI tracking.
  String _articleId = '';
  int _currentPage = 1;
  List<Comment> _allComments = [];
  Set<String> _likedCommentIds = {};
  Set<String> _expandedRepliesIds = {};

  CommentsBloc(this._getComments, this._submitComment, this._likeComment)
      : super(const CommentsInitial()) {
    on<LoadComments>(_onLoadComments);
    on<LoadMoreComments>(_onLoadMoreComments);
    on<SubmitCommentEvent>(_onSubmitComment);
    on<LikeCommentEvent>(_onLikeComment);
    on<SetReplyTarget>(_onSetReplyTarget);
    on<ClearReplyTarget>(_onClearReplyTarget);
    on<ToggleRepliesExpanded>(_onToggleRepliesExpanded);
  }

  CommentsLoaded _buildLoadedState({
    String? replyTargetId,
    String? replyTargetAuthor,
    bool clearReply = false,
  }) {
    final current = state;
    return CommentsLoaded(
      comments: _allComments,
      hasMore: false,
      currentPage: _currentPage,
      articleId: _articleId,
      likedCommentIds: _likedCommentIds,
      replyTargetId: clearReply
          ? null
          : (replyTargetId ??
              (current is CommentsLoaded ? current.replyTargetId : null)),
      replyTargetAuthor: clearReply
          ? null
          : (replyTargetAuthor ??
              (current is CommentsLoaded ? current.replyTargetAuthor : null)),
      expandedRepliesIds: _expandedRepliesIds,
    );
  }

  Future<void> _onLoadComments(
    LoadComments event,
    Emitter<CommentsState> emit,
  ) async {
    _articleId = event.articleId;
    _currentPage = 1;
    _allComments = [];
    emit(const CommentsLoading());

    final result = await _getComments(GetCommentsParams(
      articleId: event.articleId,
      page: 1,
    ));

    result.fold(
      (failure) =>
          emit(CommentsError(failure.message ?? 'Failed to load comments')),
      (comments) {
        _allComments = comments;
        _currentPage = 1;
        emit(CommentsLoaded(
          comments: _allComments,
          hasMore: comments.length >= 20,
          currentPage: _currentPage,
          articleId: _articleId,
          likedCommentIds: _likedCommentIds,
          expandedRepliesIds: _expandedRepliesIds,
        ));
      },
    );
  }

  Future<void> _onLoadMoreComments(
    LoadMoreComments event,
    Emitter<CommentsState> emit,
  ) async {
    if (_articleId.isEmpty) return;

    final nextPage = _currentPage + 1;
    final result = await _getComments(GetCommentsParams(
      articleId: _articleId,
      page: nextPage,
    ));

    result.fold(
      (failure) {}, // Silently fail on load more
      (comments) {
        _currentPage = nextPage;
        _allComments = [..._allComments, ...comments];
        emit(CommentsLoaded(
          comments: _allComments,
          hasMore: comments.length >= 20,
          currentPage: _currentPage,
          articleId: _articleId,
          likedCommentIds: _likedCommentIds,
          expandedRepliesIds: _expandedRepliesIds,
        ));
      },
    );
  }

  Future<void> _onSubmitComment(
    SubmitCommentEvent event,
    Emitter<CommentsState> emit,
  ) async {
    final previousState = state;
    emit(const CommentSubmitting());

    final result = await _submitComment(SubmitCommentParams(
      articleId: event.articleId,
      authorName: event.authorName,
      body: event.body,
      parentId: event.parentId,
    ));

    result.fold(
      (failure) {
        emit(CommentsError(failure.message ?? 'Failed to submit comment'));
        // Restore previous state after showing error.
        if (previousState is CommentsLoaded) {
          emit(previousState);
        }
      },
      (_) {
        emit(const CommentSubmitted());
        // Reload comments after successful submission.
        add(LoadComments(articleId: event.articleId));
      },
    );
  }

  Future<void> _onLikeComment(
    LikeCommentEvent event,
    Emitter<CommentsState> emit,
  ) async {
    if (state is! CommentsLoaded) return;

    // Optimistic update — add to liked set immediately.
    _likedCommentIds = {..._likedCommentIds, event.commentId};
    emit(_buildLoadedState());

    // Fire API call in background (don't block UI).
    _likeComment(LikeCommentParams(
      articleId: _articleId,
      commentId: event.commentId,
    ));
  }

  void _onSetReplyTarget(
    SetReplyTarget event,
    Emitter<CommentsState> emit,
  ) {
    if (state is! CommentsLoaded) return;
    emit(_buildLoadedState(
      replyTargetId: event.commentId,
      replyTargetAuthor: event.authorName,
    ));
  }

  void _onClearReplyTarget(
    ClearReplyTarget event,
    Emitter<CommentsState> emit,
  ) {
    if (state is! CommentsLoaded) return;
    emit(_buildLoadedState(clearReply: true));
  }

  void _onToggleRepliesExpanded(
    ToggleRepliesExpanded event,
    Emitter<CommentsState> emit,
  ) {
    if (state is! CommentsLoaded) return;

    if (_expandedRepliesIds.contains(event.commentId)) {
      _expandedRepliesIds = {..._expandedRepliesIds}..remove(event.commentId);
    } else {
      _expandedRepliesIds = {..._expandedRepliesIds, event.commentId};
    }
    emit(_buildLoadedState());
  }
}
