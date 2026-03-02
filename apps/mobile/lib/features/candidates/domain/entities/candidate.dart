import 'package:equatable/equatable.dart';

import '../../../article_detail/domain/entities/content_block.dart';

/// Immutable candidate entity used throughout the domain and presentation layers.
class Candidate extends Equatable {
  final String id;
  final String electionId;
  final String fullName;
  final String slug;
  final String? district;
  final String? position;
  final String? photoUrl;
  final String? coverImageUrl;
  final String? bio;
  final List<ContentBlock> bioBlocks;
  final Map<String, double> quizPositions;
  final Map<String, String> socialLinks;
  final String? phone;
  final String? email;
  final String? website;
  final int endorsementCount;
  final int sortOrder;
  final bool isActive;
  final DateTime? createdAt;

  const Candidate({
    required this.id,
    required this.electionId,
    required this.fullName,
    required this.slug,
    this.district,
    this.position,
    this.photoUrl,
    this.coverImageUrl,
    this.bio,
    this.bioBlocks = const [],
    this.quizPositions = const {},
    this.socialLinks = const {},
    this.phone,
    this.email,
    this.website,
    this.endorsementCount = 0,
    this.sortOrder = 0,
    this.isActive = true,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        electionId,
        fullName,
        slug,
        district,
        position,
        photoUrl,
        coverImageUrl,
        bio,
        bioBlocks,
        quizPositions,
        socialLinks,
        phone,
        email,
        website,
        endorsementCount,
        sortOrder,
        isActive,
        createdAt,
      ];
}
