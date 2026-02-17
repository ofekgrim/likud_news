import '../../domain/entities/member.dart';

/// Data model for members, handles JSON serialization.
///
/// Maps API responses to the domain [Member] entity via [toEntity].
class MemberModel {
  final String id;
  final String name;
  final String? nameEn;
  final String? title;
  final String? bio;
  final String? photoUrl;
  final String? socialTwitter;
  final String? socialFacebook;
  final String? socialInstagram;
  final bool isActive;
  final int sortOrder;

  const MemberModel({
    required this.id,
    required this.name,
    this.nameEn,
    this.title,
    this.bio,
    this.photoUrl,
    this.socialTwitter,
    this.socialFacebook,
    this.socialInstagram,
    this.isActive = true,
    this.sortOrder = 0,
  });

  factory MemberModel.fromJson(Map<String, dynamic> json) {
    return MemberModel(
      id: json['id'] as String,
      name: json['name'] as String,
      nameEn: json['name_en'] as String?,
      title: json['title'] as String?,
      bio: json['bio'] as String?,
      photoUrl: json['photo_url'] as String?,
      socialTwitter: json['social_twitter'] as String?,
      socialFacebook: json['social_facebook'] as String?,
      socialInstagram: json['social_instagram'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      sortOrder: json['sort_order'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'name_en': nameEn,
      'title': title,
      'bio': bio,
      'photo_url': photoUrl,
      'social_twitter': socialTwitter,
      'social_facebook': socialFacebook,
      'social_instagram': socialInstagram,
      'is_active': isActive,
      'sort_order': sortOrder,
    };
  }

  Member toEntity() {
    return Member(
      id: id,
      name: name,
      nameEn: nameEn,
      title: title,
      bio: bio,
      photoUrl: photoUrl,
      socialTwitter: socialTwitter,
      socialFacebook: socialFacebook,
      socialInstagram: socialInstagram,
      isActive: isActive,
      sortOrder: sortOrder,
    );
  }
}
