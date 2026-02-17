import 'package:equatable/equatable.dart';

/// Immutable member entity used throughout the domain and presentation layers.
class Member extends Equatable {
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

  const Member({
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

  @override
  List<Object?> get props => [
        id,
        name,
        nameEn,
        title,
        bio,
        photoUrl,
        socialTwitter,
        socialFacebook,
        socialInstagram,
        isActive,
        sortOrder,
      ];
}
