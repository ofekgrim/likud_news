import 'package:equatable/equatable.dart';

/// A comment entity representing user feedback on an article.
///
/// Supports nested replies via the [replies] list and [parentId] reference.
class Comment extends Equatable {
  final String id;
  final String articleId;
  final String? parentId;
  final String authorName;
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
        body,
        isPinned,
        likesCount,
        createdAt,
        replies,
      ];
}
