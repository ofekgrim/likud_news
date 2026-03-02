import '../../../article_detail/data/models/content_block_model.dart';
import '../../../article_detail/domain/entities/content_block.dart';
import '../../domain/entities/candidate.dart';

/// Data model for candidates, handles JSON serialization.
///
/// Maps API responses to the domain [Candidate] entity via [toEntity].
class CandidateModel {
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

  const CandidateModel({
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

  factory CandidateModel.fromJson(Map<String, dynamic> json) {
    return CandidateModel(
      id: json['id'] as String,
      electionId: json['electionId'] as String,
      fullName: json['fullName'] as String,
      slug: json['slug'] as String,
      district: json['district'] as String?,
      position: json['position'] as String?,
      photoUrl: json['photoUrl'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      bio: json['bio'] as String?,
      bioBlocks: ContentBlockModel.fromJsonList(
        json['bioBlocks'] as List<dynamic>?,
      ),
      quizPositions: _parseQuizPositions(json['quizPositions']),
      socialLinks: _parseSocialLinks(json['socialLinks']),
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      website: json['website'] as String?,
      endorsementCount: json['endorsementCount'] as int? ?? 0,
      sortOrder: json['sortOrder'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'electionId': electionId,
      'fullName': fullName,
      'slug': slug,
      'district': district,
      'position': position,
      'photoUrl': photoUrl,
      'coverImageUrl': coverImageUrl,
      'bio': bio,
      'quizPositions': quizPositions,
      'socialLinks': socialLinks,
      'phone': phone,
      'email': email,
      'website': website,
      'endorsementCount': endorsementCount,
      'sortOrder': sortOrder,
      'isActive': isActive,
    };
  }

  Candidate toEntity() {
    return Candidate(
      id: id,
      electionId: electionId,
      fullName: fullName,
      slug: slug,
      district: district,
      position: position,
      photoUrl: photoUrl,
      coverImageUrl: coverImageUrl,
      bio: bio,
      bioBlocks: bioBlocks,
      quizPositions: quizPositions,
      socialLinks: socialLinks,
      phone: phone,
      email: email,
      website: website,
      endorsementCount: endorsementCount,
      sortOrder: sortOrder,
      isActive: isActive,
      createdAt: createdAt,
    );
  }

  /// Parses quiz positions from JSON, handling null and dynamic numeric types.
  static Map<String, double> _parseQuizPositions(dynamic json) {
    if (json == null || json is! Map) return const {};
    return (json as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, double.tryParse(value.toString()) ?? 0.0),
    );
  }

  /// Parses social links from JSON, handling null values.
  static Map<String, String> _parseSocialLinks(dynamic json) {
    if (json == null || json is! Map) return const {};
    return (json as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, value as String),
    );
  }
}
