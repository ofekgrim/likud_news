import '../../domain/entities/election_result.dart';

/// Data model for election results, handles JSON serialization.
///
/// Flattens the nested `candidate` relation so that `candidateName`
/// and `candidatePhotoUrl` are top-level on the domain entity.
class ElectionResultModel {
  final String id;
  final String electionId;
  final String candidateId;
  final String candidateName;
  final String? candidatePhotoUrl;
  final String? stationId;
  final int voteCount;
  final double? percentage;
  final bool isOfficial;
  final DateTime? publishedAt;

  const ElectionResultModel({
    required this.id,
    required this.electionId,
    required this.candidateId,
    required this.candidateName,
    this.candidatePhotoUrl,
    this.stationId,
    this.voteCount = 0,
    this.percentage,
    this.isOfficial = false,
    this.publishedAt,
  });

  factory ElectionResultModel.fromJson(Map<String, dynamic> json) {
    // Flatten the candidate relation if present.
    final candidate = json['candidate'] as Map<String, dynamic>?;
    final candidateName = candidate != null
        ? (candidate['fullName'] as String? ?? '')
        : (json['candidateName'] as String? ?? '');
    final candidatePhotoUrl = candidate != null
        ? candidate['photoUrl'] as String?
        : json['candidatePhotoUrl'] as String?;

    return ElectionResultModel(
      id: json['id'] as String,
      electionId: json['electionId'] as String,
      candidateId: json['candidateId'] as String,
      candidateName: candidateName,
      candidatePhotoUrl: candidatePhotoUrl,
      stationId: json['stationId'] as String?,
      voteCount: json['voteCount'] != null
          ? int.tryParse(json['voteCount'].toString()) ?? 0
          : 0,
      percentage: json['percentage'] != null
          ? double.tryParse(json['percentage'].toString())
          : null,
      isOfficial: json['isOfficial'] as bool? ?? false,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'electionId': electionId,
      'candidateId': candidateId,
      'candidateName': candidateName,
      'candidatePhotoUrl': candidatePhotoUrl,
      'stationId': stationId,
      'voteCount': voteCount,
      'percentage': percentage,
      'isOfficial': isOfficial,
      'publishedAt': publishedAt?.toIso8601String(),
    };
  }

  ElectionResult toEntity() {
    return ElectionResult(
      id: id,
      electionId: electionId,
      candidateId: candidateId,
      candidateName: candidateName,
      candidatePhotoUrl: candidatePhotoUrl,
      stationId: stationId,
      voteCount: voteCount,
      percentage: percentage,
      isOfficial: isOfficial,
      publishedAt: publishedAt,
    );
  }
}
