import 'package:equatable/equatable.dart';

import '../../../article_detail/domain/entities/content_block.dart';

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
  final String? slug;
  final String? office;
  final String? phone;
  final String? email;
  final String? website;
  final String? coverImageUrl;
  final String? personalPageHtml;
  final List<ContentBlock> bioBlocks;

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
    this.slug,
    this.office,
    this.phone,
    this.email,
    this.website,
    this.coverImageUrl,
    this.personalPageHtml,
    this.bioBlocks = const [],
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
        slug,
        office,
        phone,
        email,
        website,
        coverImageUrl,
        personalPageHtml,
        bioBlocks,
      ];
}
