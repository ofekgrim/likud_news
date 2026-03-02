import 'package:equatable/equatable.dart';

/// A comment entity representing user feedback on an article.
///
/// Supports nested replies via the [replies] list and [parentId] reference.
class Comment extends Equatable {
  final String id;
  final String articleId;
  final String? parentId;
  final String authorName;
  final String? authorAvatarUrl;
  final String? authorRole;
  final String body;
  final bool isPinned;
  final int likesCount;
  final DateTime createdAt;
  final List<Comment> replies;

  const Comment({
    required this.id,
    required this.articleId,
    this.parentId,
    required this.authorName,
    this.authorAvatarUrl,
    this.authorRole,
    required this.body,
    this.isPinned = false,
    this.likesCount = 0,
    required this.createdAt,
    this.replies = const [],
  });

  @override
  List<Object?> get props => [
        id,
        articleId,
        parentId,
        authorName,
        authorAvatarUrl,
        authorRole,
        body,
        isPinned,
        likesCount,
        createdAt,
        replies,
      ];
}
