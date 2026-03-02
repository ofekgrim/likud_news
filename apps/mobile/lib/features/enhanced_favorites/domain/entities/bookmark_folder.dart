import 'package:equatable/equatable.dart';

/// Immutable bookmark folder entity for organizing favorites.
///
/// Users can create named, colored folders to categorize
/// their bookmarked articles. Folders may optionally be shared
/// via a public [shareToken].
class BookmarkFolder extends Equatable {
  final String id;
  final String name;
  final String? color;
  final int sortOrder;
  final bool isPublic;
  final String? shareToken;
  final int itemCount;
  final DateTime? createdAt;

  const BookmarkFolder({
    required this.id,
    required this.name,
    this.color,
    this.sortOrder = 0,
    this.isPublic = false,
    this.shareToken,
    this.itemCount = 0,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        color,
        sortOrder,
        isPublic,
        shareToken,
        itemCount,
        createdAt,
      ];
}
