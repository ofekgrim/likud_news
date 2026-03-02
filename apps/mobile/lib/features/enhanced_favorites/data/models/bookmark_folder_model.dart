import '../../domain/entities/bookmark_folder.dart';

/// Data model for bookmark folders, handles JSON serialization.
///
/// Maps API responses to the domain [BookmarkFolder] entity via [toEntity].
class BookmarkFolderModel {
  final String id;
  final String name;
  final String? color;
  final int sortOrder;
  final bool isPublic;
  final String? shareToken;
  final int itemCount;
  final DateTime? createdAt;

  const BookmarkFolderModel({
    required this.id,
    required this.name,
    this.color,
    this.sortOrder = 0,
    this.isPublic = false,
    this.shareToken,
    this.itemCount = 0,
    this.createdAt,
  });

  factory BookmarkFolderModel.fromJson(Map<String, dynamic> json) {
    return BookmarkFolderModel(
      id: json['id'] as String,
      name: json['name'] as String,
      color: json['color'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
      isPublic: json['isPublic'] as bool? ?? false,
      shareToken: json['shareToken'] as String?,
      itemCount: json['itemCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'color': color,
      'sortOrder': sortOrder,
      'isPublic': isPublic,
      'shareToken': shareToken,
      'itemCount': itemCount,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  BookmarkFolder toEntity() {
    return BookmarkFolder(
      id: id,
      name: name,
      color: color,
      sortOrder: sortOrder,
      isPublic: isPublic,
      shareToken: shareToken,
      itemCount: itemCount,
      createdAt: createdAt,
    );
  }
}
