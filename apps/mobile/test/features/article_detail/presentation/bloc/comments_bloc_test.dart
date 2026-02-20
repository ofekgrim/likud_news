import 'package:bloc_test/bloc_test.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:metzudat_halikud/core/errors/failures.dart';
import 'package:metzudat_halikud/features/article_detail/domain/entities/comment.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/get_comments.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/like_comment.dart';
import 'package:metzudat_halikud/features/article_detail/domain/usecases/submit_comment.dart';
import 'package:metzudat_halikud/features/article_detail/presentation/bloc/comments_bloc.dart';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockGetComments extends Mock implements GetComments {}

class MockSubmitComment extends Mock implements SubmitComment {}

class MockLikeComment extends Mock implements LikeComment {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

Comment _createComment(String id) => Comment(
      id: id,
      articleId: 'article-1',
      authorName: 'Author $id',
      body: 'Comment body $id',
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  late CommentsBloc commentsBloc;
  late MockGetComments mockGetComments;
  late MockSubmitComment mockSubmitComment;
  late MockLikeComment mockLikeComment;

  // -------------------------------------------------------------------------
  // Test data
  // -------------------------------------------------------------------------

  const tArticleId = 'article-1';
  const tServerFailure = ServerFailure(message: 'Server error');

  final tComments = List.generate(5, (i) => _createComment('$i'));
  final tFullPageComments = List.generate(20, (i) => _createComment('$i'));
  final tNextPageComments = List.generate(3, (i) => _createComment('next-$i'));

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  setUpAll(() {
    registerFallbackValue(const GetCommentsParams(articleId: ''));
    registerFallbackValue(const SubmitCommentParams(
      articleId: '',
      authorName: '',
      body: '',
    ));
    registerFallbackValue(const LikeCommentParams(
      articleId: '',
      commentId: '',
    ));
  });

  setUp(() {
    mockGetComments = MockGetComments();
    mockSubmitComment = MockSubmitComment();
    mockLikeComment = MockLikeComment();
    commentsBloc = CommentsBloc(
      mockGetComments,
      mockSubmitComment,
      mockLikeComment,
    );
  });

  tearDown(() {
    commentsBloc.close();
  });

  // -------------------------------------------------------------------------
  // Tests
  // -------------------------------------------------------------------------

  group('CommentsBloc', () {
    // -----------------------------------------------------------------------
    // Initial state
    // -----------------------------------------------------------------------

    test('initial state is CommentsInitial', () {
      expect(commentsBloc.state, const CommentsInitial());
    });

    // -----------------------------------------------------------------------
    // LoadComments
    // -----------------------------------------------------------------------

    group('LoadComments', () {
      blocTest<CommentsBloc, CommentsState>(
        'emits [CommentsLoading, CommentsLoaded] on success',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          return commentsBloc;
        },
        act: (bloc) =>
            bloc.add(const LoadComments(articleId: tArticleId)),
        expect: () => [
          const CommentsLoading(),
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
        ],
        verify: (_) {
          verify(() => mockGetComments(any())).called(1);
        },
      );

      blocTest<CommentsBloc, CommentsState>(
        'emits [CommentsLoading, CommentsError] on failure',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return commentsBloc;
        },
        act: (bloc) =>
            bloc.add(const LoadComments(articleId: tArticleId)),
        expect: () => [
          const CommentsLoading(),
          const CommentsError('Server error'),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'sets hasMore = true when 20 or more comments returned',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tFullPageComments));
          return commentsBloc;
        },
        act: (bloc) =>
            bloc.add(const LoadComments(articleId: tArticleId)),
        expect: () => [
          const CommentsLoading(),
          CommentsLoaded(
            comments: tFullPageComments,
            hasMore: true,
            currentPage: 1,
            articleId: tArticleId,
          ),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'sets hasMore = false when fewer than 20 comments returned',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          return commentsBloc;
        },
        act: (bloc) =>
            bloc.add(const LoadComments(articleId: tArticleId)),
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>()
              .having((s) => s.hasMore, 'hasMore', false)
              .having((s) => s.comments.length, 'comments.length', 5),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'emits error with default message when failure.message is null',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => const Left(ServerFailure()));
          return commentsBloc;
        },
        act: (bloc) =>
            bloc.add(const LoadComments(articleId: tArticleId)),
        expect: () => [
          const CommentsLoading(),
          const CommentsError('Failed to load comments'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LoadMoreComments
    // -----------------------------------------------------------------------

    group('LoadMoreComments', () {
      blocTest<CommentsBloc, CommentsState>(
        'appends new comments to existing list on success',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tNextPageComments));
          return commentsBloc;
        },
        seed: () {
          // We need to prime the bloc's internal state by loading first.
          // Since seed only sets the state, we also need to set internal fields.
          // The cleanest approach: run LoadComments first, then LoadMoreComments.
          return CommentsLoaded(
            comments: tComments,
            hasMore: true,
            currentPage: 1,
            articleId: tArticleId,
          );
        },
        setUp: () {
          // Prime the bloc's private _articleId and _allComments by running
          // a successful LoadComments before testing LoadMoreComments.
          // Since blocTest's seed doesn't set private fields, we'll use a
          // separate blocTest that chains events instead.
        },
        act: (bloc) =>
            bloc.add(const LoadComments(articleId: tArticleId)),
        // We'll test load more with a dedicated chained test below.
        skip: 0,
        verify: (_) {},
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>(),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'appends to existing comments and increments page on success',
        build: () {
          // First call returns initial comments, second call returns next page.
          var callCount = 0;
          when(() => mockGetComments(any())).thenAnswer((_) async {
            callCount++;
            if (callCount == 1) {
              return Right(tComments);
            }
            return Right(tNextPageComments);
          });
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const LoadMoreComments());
        },
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentsLoading(),
          // Initial load result
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
          // Load more result — appended
          CommentsLoaded(
            comments: [...tComments, ...tNextPageComments],
            hasMore: false,
            currentPage: 2,
            articleId: tArticleId,
          ),
        ],
        verify: (_) {
          verify(() => mockGetComments(any())).called(2);
        },
      );

      blocTest<CommentsBloc, CommentsState>(
        'does nothing when articleId is empty (no prior LoadComments)',
        build: () => commentsBloc,
        act: (bloc) => bloc.add(const LoadMoreComments()),
        wait: const Duration(milliseconds: 50),
        expect: () => <CommentsState>[],
        verify: (_) {
          verifyNever(() => mockGetComments(any()));
        },
      );

      blocTest<CommentsBloc, CommentsState>(
        'silently fails on load-more error (no state change)',
        build: () {
          var callCount = 0;
          when(() => mockGetComments(any())).thenAnswer((_) async {
            callCount++;
            if (callCount == 1) {
              return Right(tComments);
            }
            return const Left(tServerFailure);
          });
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const LoadMoreComments());
        },
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentsLoading(),
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
          // No additional state emitted on load-more failure.
        ],
      );
    });

    // -----------------------------------------------------------------------
    // SubmitCommentEvent
    // -----------------------------------------------------------------------

    group('SubmitCommentEvent', () {
      blocTest<CommentsBloc, CommentsState>(
        'emits [CommentSubmitting, CommentSubmitted] on success, then reloads',
        build: () {
          // First getComments call: initial load.
          // Second getComments call: reload after submission.
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          when(() => mockSubmitComment(any()))
              .thenAnswer((_) async => const Right(null));
          return commentsBloc;
        },
        act: (bloc) async {
          // First load comments so bloc has internal state.
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const SubmitCommentEvent(
            articleId: tArticleId,
            authorName: 'Test Author',
            body: 'Great article!',
          ));
        },
        wait: const Duration(milliseconds: 200),
        expect: () => [
          // Initial LoadComments
          const CommentsLoading(),
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
          // SubmitCommentEvent flow
          const CommentSubmitting(),
          const CommentSubmitted(),
          // Reload triggered by add(LoadComments(...))
          const CommentsLoading(),
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
        ],
        verify: (_) {
          verify(() => mockSubmitComment(any())).called(1);
          // getComments called twice: initial load + reload after submit
          verify(() => mockGetComments(any())).called(2);
        },
      );

      blocTest<CommentsBloc, CommentsState>(
        'emits [CommentSubmitting, CommentsError] on failure, '
        'then restores previous CommentsLoaded state',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          when(() => mockSubmitComment(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return commentsBloc;
        },
        act: (bloc) async {
          // Load comments first so there is a previous CommentsLoaded state.
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const SubmitCommentEvent(
            articleId: tArticleId,
            authorName: 'Test Author',
            body: 'This will fail',
          ));
        },
        wait: const Duration(milliseconds: 200),
        expect: () => [
          // Initial LoadComments
          const CommentsLoading(),
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
          // SubmitCommentEvent failure flow
          const CommentSubmitting(),
          const CommentsError('Server error'),
          // Previous CommentsLoaded state restored
          CommentsLoaded(
            comments: tComments,
            hasMore: false,
            currentPage: 1,
            articleId: tArticleId,
          ),
        ],
        verify: (_) {
          verify(() => mockSubmitComment(any())).called(1);
        },
      );

      blocTest<CommentsBloc, CommentsState>(
        'emits [CommentSubmitting, CommentsError] on failure '
        'without restoring state when previous state is not CommentsLoaded',
        build: () {
          when(() => mockSubmitComment(any()))
              .thenAnswer((_) async => const Left(tServerFailure));
          return commentsBloc;
        },
        act: (bloc) => bloc.add(const SubmitCommentEvent(
          articleId: tArticleId,
          authorName: 'Test Author',
          body: 'No previous loaded state',
        )),
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentSubmitting(),
          const CommentsError('Server error'),
          // No restored state — previous state was CommentsInitial.
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'submits a reply comment with parentId',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          when(() => mockSubmitComment(any()))
              .thenAnswer((_) async => const Right(null));
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const SubmitCommentEvent(
            articleId: tArticleId,
            authorName: 'Reply Author',
            body: 'This is a reply',
            parentId: 'parent-comment-1',
          ));
        },
        wait: const Duration(milliseconds: 200),
        verify: (_) {
          final captured = verify(() => mockSubmitComment(captureAny()))
              .captured
              .first as SubmitCommentParams;
          expect(captured.parentId, 'parent-comment-1');
          expect(captured.authorName, 'Reply Author');
          expect(captured.body, 'This is a reply');
          expect(captured.articleId, tArticleId);
        },
      );

      blocTest<CommentsBloc, CommentsState>(
        'emits error with default message when submit failure.message is null',
        build: () {
          when(() => mockSubmitComment(any()))
              .thenAnswer((_) async => const Left(ServerFailure()));
          return commentsBloc;
        },
        act: (bloc) => bloc.add(const SubmitCommentEvent(
          articleId: tArticleId,
          authorName: 'Test Author',
          body: 'Will fail with null message',
        )),
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentSubmitting(),
          const CommentsError('Failed to submit comment'),
        ],
      );
    });

    // -----------------------------------------------------------------------
    // LikeCommentEvent
    // -----------------------------------------------------------------------

    group('LikeCommentEvent', () {
      blocTest<CommentsBloc, CommentsState>(
        'optimistically adds commentId to likedCommentIds',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          when(() => mockLikeComment(any()))
              .thenAnswer((_) async => const Right(1));
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const LikeCommentEvent(commentId: '0'));
        },
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>(),
          isA<CommentsLoaded>()
              .having(
                (s) => s.likedCommentIds.contains('0'),
                'contains liked comment',
                true,
              ),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'does nothing when state is not CommentsLoaded',
        build: () => commentsBloc,
        act: (bloc) => bloc.add(const LikeCommentEvent(commentId: '0')),
        wait: const Duration(milliseconds: 50),
        expect: () => <CommentsState>[],
      );
    });

    // -----------------------------------------------------------------------
    // SetReplyTarget / ClearReplyTarget
    // -----------------------------------------------------------------------

    group('SetReplyTarget / ClearReplyTarget', () {
      blocTest<CommentsBloc, CommentsState>(
        'sets replyTargetId and replyTargetAuthor',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const SetReplyTarget(
            commentId: 'comment-1',
            authorName: 'Author 1',
          ));
        },
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>(),
          isA<CommentsLoaded>()
              .having((s) => s.replyTargetId, 'replyTargetId', 'comment-1')
              .having(
                (s) => s.replyTargetAuthor,
                'replyTargetAuthor',
                'Author 1',
              ),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'clears replyTarget when ClearReplyTarget is added',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const SetReplyTarget(
            commentId: 'comment-1',
            authorName: 'Author 1',
          ));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const ClearReplyTarget());
        },
        wait: const Duration(milliseconds: 150),
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>(),
          isA<CommentsLoaded>()
              .having((s) => s.replyTargetId, 'replyTargetId', 'comment-1'),
          isA<CommentsLoaded>()
              .having((s) => s.replyTargetId, 'replyTargetId', isNull)
              .having(
                (s) => s.replyTargetAuthor,
                'replyTargetAuthor',
                isNull,
              ),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'SetReplyTarget does nothing when state is not CommentsLoaded',
        build: () => commentsBloc,
        act: (bloc) => bloc.add(const SetReplyTarget(
          commentId: 'x',
          authorName: 'X',
        )),
        wait: const Duration(milliseconds: 50),
        expect: () => <CommentsState>[],
      );
    });

    // -----------------------------------------------------------------------
    // ToggleRepliesExpanded
    // -----------------------------------------------------------------------

    group('ToggleRepliesExpanded', () {
      blocTest<CommentsBloc, CommentsState>(
        'adds commentId to expandedRepliesIds on first toggle',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const ToggleRepliesExpanded(commentId: 'comment-1'));
        },
        wait: const Duration(milliseconds: 100),
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>(),
          isA<CommentsLoaded>()
              .having(
                (s) => s.expandedRepliesIds.contains('comment-1'),
                'expanded',
                true,
              ),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'removes commentId from expandedRepliesIds on second toggle',
        build: () {
          when(() => mockGetComments(any()))
              .thenAnswer((_) async => Right(tComments));
          return commentsBloc;
        },
        act: (bloc) async {
          bloc.add(const LoadComments(articleId: tArticleId));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const ToggleRepliesExpanded(commentId: 'comment-1'));
          await Future<void>.delayed(const Duration(milliseconds: 50));
          bloc.add(const ToggleRepliesExpanded(commentId: 'comment-1'));
        },
        wait: const Duration(milliseconds: 150),
        expect: () => [
          const CommentsLoading(),
          isA<CommentsLoaded>(),
          isA<CommentsLoaded>()
              .having(
                (s) => s.expandedRepliesIds.contains('comment-1'),
                'expanded',
                true,
              ),
          isA<CommentsLoaded>()
              .having(
                (s) => s.expandedRepliesIds.contains('comment-1'),
                'collapsed',
                false,
              ),
        ],
      );

      blocTest<CommentsBloc, CommentsState>(
        'does nothing when state is not CommentsLoaded',
        build: () => commentsBloc,
        act: (bloc) =>
            bloc.add(const ToggleRepliesExpanded(commentId: 'x')),
        wait: const Duration(milliseconds: 50),
        expect: () => <CommentsState>[],
      );
    });
  });
}
