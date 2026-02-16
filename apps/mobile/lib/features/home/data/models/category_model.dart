import '../../domain/entities/category.dart';

/// Data model for categories, handles JSON serialization.
///
/// Maps API responses to the domain [Category] entity via [toEntity].
class CategoryModel {
  final int id;
  final String name;
  final String? nameEn;
  final String? slug;
  final String? iconUrl;
  final int sortOrder;
  final bool isActive;
  final String? color;

  const CategoryModel({
    required this.id,
    required this.name,
    this.nameEn,
    this.slug,
    this.iconUrl,
    this.sortOrder = 0,
    this.isActive = true,
    this.color,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as int,
      name: json['name'] as String,
      nameEn: json['name_en'] as String?,
      slug: json['slug'] as String?,
      iconUrl: json['icon_url'] as String?,
      sortOrder: json['sort_order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
      color: json['color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'name_en': nameEn,
      'slug': slug,
      'icon_url': iconUrl,
      'sort_order': sortOrder,
      'is_active': isActive,
      'color': color,
    };
  }

  Category toEntity() {
    return Category(
      id: id,
      name: name,
      nameEn: nameEn,
      slug: slug,
      iconUrl: iconUrl,
      sortOrder: sortOrder,
      isActive: isActive,
      color: color,
    );
  }
}
