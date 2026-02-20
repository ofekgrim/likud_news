import '../../domain/entities/comment.dart';

/// Data model for parsing comment JSON into [Comment] domain entities.
///
/// Supports nested replies by recursively parsing child comment arrays.
class CommentModel {
  final String id;
  final String articleId;
  final String? parentId;
  final String authorName;
  final String body;
  final bool isPinned;
  final int likesCount;
  final DateTime createdAt;
  final List<CommentModel> replies;

  const CommentModel({
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

  /// Creates a [CommentModel] from a JSON map.
  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as String? ?? '',
      articleId: json['articleId'] as String? ?? '',
      parentId: json['parentId'] as String?,
      authorName: json['authorName'] as String? ?? '',
      body: json['body'] as String? ?? '',
      isPinned: json['isPinned'] as bool? ?? false,
      likesCount: json['likesCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      replies: (json['replies'] as List<dynamic>?)
              ?.map((e) =>
                  CommentModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  /// Converts this model to a domain [Comment] entity.
  Comment toEntity() {
    return Comment(
      id: id,
      articleId: articleId,
      parentId: parentId,
      authorName: authorName,
      body: body,
      isPinned: isPinned,
      likesCount: likesCount,
      createdAt: createdAt,
      replies: replies.map((r) => r.toEntity()).toList(),
    );
  }

  /// Parses a list of JSON objects into [Comment] entities.
  static List<Comment> fromJsonList(List<dynamic>? json) {
    if (json == null || json.isEmpty) return const [];
    return json
        .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
        .map((model) => model.toEntity())
        .toList();
  }
}
