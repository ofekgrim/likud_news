import '../../domain/entities/endorsement.dart';

/// Data model for endorsements, handles JSON serialization.
///
/// Maps API responses to the domain [Endorsement] entity via [toEntity].
class EndorsementModel {
  final String id;
  final String userId;
  final String candidateId;
  final String electionId;
  final DateTime? createdAt;

  const EndorsementModel({
    required this.id,
    required this.userId,
    required this.candidateId,
    required this.electionId,
    this.createdAt,
  });

  factory EndorsementModel.fromJson(Map<String, dynamic> json) {
    return EndorsementModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      candidateId: json['candidateId'] as String,
      electionId: json['electionId'] as String,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'candidateId': candidateId,
      'electionId': electionId,
    };
  }

  Endorsement toEntity() {
    return Endorsement(
      id: id,
      userId: userId,
      candidateId: candidateId,
      electionId: electionId,
      createdAt: createdAt,
    );
  }
}
