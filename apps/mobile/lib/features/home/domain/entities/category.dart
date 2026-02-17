import 'package:equatable/equatable.dart';

/// Immutable category entity for story circles and article filtering.
class Category extends Equatable {
  final String id;
  final String name;
  final String? nameEn;
  final String? slug;
  final String? iconUrl;
  final int sortOrder;
  final bool isActive;
  final String? color;

  const Category({
    required this.id,
    required this.name,
    this.nameEn,
    this.slug,
    this.iconUrl,
    this.sortOrder = 0,
    this.isActive = true,
    this.color,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        nameEn,
        slug,
        iconUrl,
        sortOrder,
        isActive,
        color,
      ];
}
