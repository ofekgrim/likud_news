import '../../../article_detail/domain/entities/author.dart';

/// Data model for authors, handles JSON serialization.
class AuthorModel {
  final String id;
  final String nameHe;
  final String? nameEn;
  final String? roleHe;
  final String? roleEn;
  final String? bioHe;
  final String? avatarUrl;
  final String? avatarThumbnailUrl;
  final String? email;
  final Map<String, String> socialLinks;
  final bool isActive;

  const AuthorModel({
    required this.id,
    required this.nameHe,
    this.nameEn,
    this.roleHe,
    this.roleEn,
    this.bioHe,
    this.avatarUrl,
    this.avatarThumbnailUrl,
    this.email,
    this.socialLinks = const {},
    this.isActive = true,
  });

  factory AuthorModel.fromJson(Map<String, dynamic> json) {
    return AuthorModel(
      id: json['id'] as String,
      nameHe: json['nameHe'] as String? ?? '',
      nameEn: json['nameEn'] as String?,
      roleHe: json['roleHe'] as String?,
      roleEn: json['roleEn'] as String?,
      bioHe: json['bioHe'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      avatarThumbnailUrl: json['avatarThumbnailUrl'] as String?,
      email: json['email'] as String?,
      socialLinks: _parseSocialLinks(json['socialLinks']),
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Author toEntity() {
    return Author(
      id: id,
      nameHe: nameHe,
      nameEn: nameEn,
      roleHe: roleHe,
      roleEn: roleEn,
      bioHe: bioHe,
      avatarUrl: avatarUrl,
      avatarThumbnailUrl: avatarThumbnailUrl,
      email: email,
      socialLinks: socialLinks,
      isActive: isActive,
    );
  }

  static Map<String, String> _parseSocialLinks(dynamic json) {
    if (json == null || json is! Map) return const {};
    return (json as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, value.toString()),
    );
  }
}
