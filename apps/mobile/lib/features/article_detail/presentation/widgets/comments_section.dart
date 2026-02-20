import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/comment.dart';
import '../bloc/comments_bloc.dart';

/// Instagram-style comments section with avatars, likes, replies, and
/// a bottom input bar.
///
/// Uses [CommentsBloc] to load, display, submit, like, and reply to comments.
class CommentsSection extends StatefulWidget {
  final String articleId;
  final int commentCount;
  final bool allowComments;

  const CommentsSection({
    super.key,
    required this.articleId,
    required this.commentCount,
    this.allowComments = true,
  });

  @override
  State<CommentsSection> createState() => _CommentsSectionState();
}

class _CommentsSectionState extends State<CommentsSection> {
  final _nameController = TextEditingController();
  final _bodyController = TextEditingController();
  final _bodyFocusNode = FocusNode();
  bool _nameEntered = false;

  // Avatar color palette — 8 pleasing colors for initials circles.
  static const _avatarColors = [
    Color(0xFF0099DB), // likudBlue
    Color(0xFF16A34A), // green
    Color(0xFFF59E0B), // amber
    Color(0xFFDC2626), // red
    Color(0xFF7C3AED), // violet
    Color(0xFFDB2777), // pink
    Color(0xFF0891B2), // cyan
    Color(0xFF1E3A8A), // likudDarkBlue
  ];

  static Color _avatarColor(String name) {
    final hash = name.codeUnits.fold(0, (prev, c) => prev + c);
    return _avatarColors[hash % _avatarColors.length];
  }

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}';
    }
    return name.isNotEmpty ? name[0] : '?';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bodyController.dispose();
    _bodyFocusNode.dispose();
    super.dispose();
  }

  void _submitComment() {
    final name = _nameController.text.trim();
    final body = _bodyController.text.trim();
    if (name.isEmpty || body.isEmpty) return;

    final blocState = context.read<CommentsBloc>().state;
    String? parentId;
    if (blocState is CommentsLoaded && blocState.replyTargetId != null) {
      parentId = blocState.replyTargetId;
    }

    context.read<CommentsBloc>().add(
          SubmitCommentEvent(
            articleId: widget.articleId,
            authorName: name,
            body: body,
            parentId: parentId,
          ),
        );

    _bodyController.clear();
    _bodyFocusNode.unfocus();
    setState(() => _nameEntered = true);

    // Clear reply target after submitting.
    context.read<CommentsBloc>().add(const ClearReplyTarget());
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: BlocListener<CommentsBloc, CommentsState>(
        listener: (context, state) {
          if (state is CommentSubmitted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('comment_pending_moderation'.tr()),
                duration: const Duration(seconds: 3),
              ),
            );
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Section header
              _buildHeader(),
              const SizedBox(height: 16),

              // Comments closed notice
              if (!widget.allowComments) _buildClosedNotice(),

              // Comments list
              _buildCommentsList(),

              // Reply banner
              if (widget.allowComments) _buildReplyBanner(),

              // Input bar
              if (widget.allowComments) _buildInputBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Text(
      '${'comments_title'.tr()} (${widget.commentCount})',
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
    );
  }

  Widget _buildClosedNotice() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        'comments_closed'.tr(),
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textTertiary,
              fontStyle: FontStyle.italic,
            ),
      ),
    );
  }

  Widget _buildCommentsList() {
    return BlocBuilder<CommentsBloc, CommentsState>(
      builder: (context, state) {
        if (state is CommentsLoading) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: CircularProgressIndicator(color: AppColors.likudBlue),
            ),
          );
        }

        if (state is CommentsError) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Text(
              state.message,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.breakingRed,
              ),
            ),
          );
        }

        if (state is CommentsLoaded) {
          if (state.comments.isEmpty) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.chat_bubble_outline,
                      size: 40,
                      color: AppColors.textTertiary.withValues(alpha: 0.5),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'no_comments_yet'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Comment tiles separated by dividers
              for (int i = 0; i < state.comments.length; i++) ...[
                _CommentTile(
                  comment: state.comments[i],
                  isLiked: state.likedCommentIds.contains(state.comments[i].id),
                  isExpanded:
                      state.expandedRepliesIds.contains(state.comments[i].id),
                  likedCommentIds: state.likedCommentIds,
                ),
                if (i < state.comments.length - 1)
                  Divider(
                    height: 1,
                    color: AppColors.border.withValues(alpha: 0.6),
                  ),
              ],

              // Load more button
              if (state.hasMore)
                Padding(
                  padding: const EdgeInsets.only(top: 12, bottom: 8),
                  child: TextButton(
                    onPressed: () => context
                        .read<CommentsBloc>()
                        .add(const LoadMoreComments()),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.likudBlue,
                    ),
                    child: Text(
                      'load_more_comments'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          );
        }

        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildReplyBanner() {
    return BlocBuilder<CommentsBloc, CommentsState>(
      buildWhen: (prev, curr) {
        if (prev is CommentsLoaded && curr is CommentsLoaded) {
          return prev.replyTargetId != curr.replyTargetId;
        }
        return true;
      },
      builder: (context, state) {
        if (state is! CommentsLoaded || state.replyTargetId == null) {
          return const SizedBox.shrink();
        }

        return Container(
          margin: const EdgeInsets.only(top: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.likudBlue.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(Icons.reply, size: 16, color: AppColors.likudBlue),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'replying_to'.tr(args: [state.replyTargetAuthor ?? '']),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    color: AppColors.likudBlue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => context
                    .read<CommentsBloc>()
                    .add(const ClearReplyTarget()),
                child: Icon(Icons.close, size: 18, color: AppColors.likudBlue),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInputBar() {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Name field — shown until first successful entry
          if (!_nameEntered || _nameController.text.trim().isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: TextField(
                controller: _nameController,
                textDirection: TextDirection.rtl,
                decoration: InputDecoration(
                  hintText: 'your_name'.tr(),
                  hintStyle: TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 13,
                  ),
                  filled: true,
                  fillColor: AppColors.surfaceLight,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  isDense: true,
                  prefixIcon: Padding(
                    padding: const EdgeInsetsDirectional.only(start: 8),
                    child: Icon(
                      Icons.person_outline,
                      size: 20,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  prefixIconConstraints:
                      const BoxConstraints(minWidth: 36, minHeight: 0),
                ),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),

          // Body input row with avatar + text field + send button
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Avatar
              CircleAvatar(
                radius: 16,
                backgroundColor: _nameController.text.trim().isNotEmpty
                    ? _avatarColor(_nameController.text.trim())
                    : AppColors.surfaceMedium,
                child: Text(
                  _nameController.text.trim().isNotEmpty
                      ? _initials(_nameController.text.trim())
                      : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Text field
              Expanded(
                child: TextField(
                  controller: _bodyController,
                  focusNode: _bodyFocusNode,
                  textDirection: TextDirection.rtl,
                  maxLines: 4,
                  minLines: 1,
                  decoration: InputDecoration(
                    hintText: 'write_comment'.tr(),
                    hintStyle: TextStyle(
                      color: AppColors.textTertiary,
                      fontSize: 14,
                    ),
                    filled: true,
                    fillColor: AppColors.surfaceLight,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    isDense: true,
                  ),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 4),

              // Send button
              BlocBuilder<CommentsBloc, CommentsState>(
                buildWhen: (prev, curr) =>
                    curr is CommentSubmitting ||
                    curr is CommentsLoaded ||
                    curr is CommentSubmitted,
                builder: (context, state) {
                  final isSubmitting = state is CommentSubmitting;
                  final canSubmit = _nameController.text.trim().isNotEmpty &&
                      _bodyController.text.trim().isNotEmpty &&
                      !isSubmitting;

                  return IconButton(
                    onPressed: canSubmit ? _submitComment : null,
                    icon: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.likudBlue,
                            ),
                          )
                        : Icon(
                            Icons.send_rounded,
                            color: canSubmit
                                ? AppColors.likudBlue
                                : AppColors.textTertiary,
                          ),
                    padding: EdgeInsets.zero,
                    constraints:
                        const BoxConstraints(minWidth: 36, minHeight: 36),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Comment Tile — Instagram-style layout
// ---------------------------------------------------------------------------

class _CommentTile extends StatelessWidget {
  final Comment comment;
  final bool isReply;
  final bool isLiked;
  final bool isExpanded;
  final Set<String> likedCommentIds;

  const _CommentTile({
    required this.comment,
    this.isReply = false,
    this.isLiked = false,
    this.isExpanded = false,
    this.likedCommentIds = const {},
  });

  @override
  Widget build(BuildContext context) {
    final avatarRadius = isReply ? 14.0 : 18.0;
    final fontSize = isReply ? 13.0 : 14.0;

    return Padding(
      padding: EdgeInsetsDirectional.only(
        start: isReply ? 48 : 0,
        top: isReply ? 8 : 12,
        bottom: isReply ? 4 : 12,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          CircleAvatar(
            radius: avatarRadius,
            backgroundColor: _CommentsSectionState._avatarColor(
              comment.authorName,
            ),
            child: Text(
              _CommentsSectionState._initials(comment.authorName),
              style: TextStyle(
                color: Colors.white,
                fontSize: avatarRadius * 0.65,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Content column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Author name + pin
                Row(
                  children: [
                    Text(
                      comment.authorName,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: fontSize,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (comment.isPinned) ...[
                      const SizedBox(width: 4),
                      Icon(
                        Icons.push_pin,
                        size: 13,
                        color: AppColors.likudBlue,
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),

                // Body text
                Text(
                  comment.body,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: fontSize,
                    color: AppColors.textPrimary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),

                // Action row: time · reply · likes
                Row(
                  children: [
                    // Time ago
                    Text(
                      _formatTimeAgo(comment.createdAt),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Reply button
                    GestureDetector(
                      onTap: () => context.read<CommentsBloc>().add(
                            SetReplyTarget(
                              commentId: comment.id,
                              authorName: comment.authorName,
                            ),
                          ),
                      child: Text(
                        'reply'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),

                    const Spacer(),

                    // Likes count
                    if (comment.likesCount > 0 || isLiked)
                      Padding(
                        padding: const EdgeInsetsDirectional.only(end: 4),
                        child: Text(
                          '${isLiked ? comment.likesCount + 1 : comment.likesCount}',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 12,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ),

                    // Like heart button
                    GestureDetector(
                      onTap: isLiked
                          ? null
                          : () => context.read<CommentsBloc>().add(
                                LikeCommentEvent(commentId: comment.id),
                              ),
                      child: Icon(
                        isLiked ? Icons.favorite : Icons.favorite_border,
                        size: 18,
                        color: isLiked
                            ? AppColors.breakingRed
                            : AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),

                // Replies section (collapsible)
                if (comment.replies.isNotEmpty && !isReply)
                  _buildRepliesSection(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRepliesSection(BuildContext context) {
    final replyCount = comment.replies.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),

        // Toggle button
        GestureDetector(
          onTap: () => context.read<CommentsBloc>().add(
                ToggleRepliesExpanded(commentId: comment.id),
              ),
          child: Text(
            isExpanded
                ? 'hide_replies'.tr()
                : (replyCount == 1
                    ? 'view_reply'.tr()
                    : 'view_replies'.tr(args: ['$replyCount'])),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ),

        // Replies list (animated)
        if (isExpanded)
          ...comment.replies.map(
            (reply) => _CommentTile(
              comment: reply,
              isReply: true,
              isLiked: likedCommentIds.contains(reply.id),
              likedCommentIds: likedCommentIds,
            ),
          ),
      ],
    );
  }

  /// Formats a [DateTime] as a relative Hebrew time string.
  static String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'עכשיו';
    if (diff.inMinutes < 60) return 'לפני ${diff.inMinutes} דק\'';
    if (diff.inHours < 24) return 'לפני ${diff.inHours} שע\'';
    if (diff.inDays < 7) return 'לפני ${diff.inDays} ימים';

    final d = dateTime.day.toString().padLeft(2, '0');
    final m = dateTime.month.toString().padLeft(2, '0');
    return '$d/$m/${dateTime.year}';
  }
}
