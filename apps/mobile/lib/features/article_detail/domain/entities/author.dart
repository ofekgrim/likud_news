import 'package:equatable/equatable.dart';

/// Structured author entity with localized name, role, bio, and avatar.
class Author extends Equatable {
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

  const Author({
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

  @override
  List<Object?> get props => [
        id,
        nameHe,
        nameEn,
        roleHe,
        roleEn,
        bioHe,
        avatarUrl,
        avatarThumbnailUrl,
        email,
        socialLinks,
        isActive,
      ];
}
