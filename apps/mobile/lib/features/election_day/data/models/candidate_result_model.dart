import '../../domain/entities/candidate_result.dart';

/// Data model for candidate results, handles JSON serialization.
///
/// Maps WebSocket / API JSON payloads to the domain [CandidateResult] entity.
class CandidateResultModel {
  final String candidateId;
  final String name;
  final String? imageUrl;
  final int voteCount;
  final double percentage;
  final int rank;
  final int deltaRank;

  const CandidateResultModel({
    required this.candidateId,
    required this.name,
    this.imageUrl,
    required this.voteCount,
    required this.percentage,
    required this.rank,
    this.deltaRank = 0,
  });

  factory CandidateResultModel.fromJson(Map<String, dynamic> json) {
    final candidate = json['candidate'] as Map<String, dynamic>?;
    final name = candidate != null
        ? (candidate['fullName'] as String? ?? '')
        : (json['name'] as String? ?? json['candidateName'] as String? ?? '');
    final imageUrl = candidate != null
        ? candidate['photoUrl'] as String?
        : json['imageUrl'] as String? ?? json['candidatePhotoUrl'] as String?;

    return CandidateResultModel(
      candidateId: json['candidateId'] as String? ?? json['id'] as String? ?? '',
      name: name,
      imageUrl: imageUrl,
      voteCount: json['voteCount'] != null
          ? int.tryParse(json['voteCount'].toString()) ?? 0
          : 0,
      percentage: json['percentage'] != null
          ? double.tryParse(json['percentage'].toString()) ?? 0.0
          : 0.0,
      rank: json['rank'] != null
          ? int.tryParse(json['rank'].toString()) ?? 0
          : 0,
      deltaRank: json['deltaRank'] != null
          ? int.tryParse(json['deltaRank'].toString()) ?? 0
          : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'candidateId': candidateId,
      'name': name,
      'imageUrl': imageUrl,
      'voteCount': voteCount,
      'percentage': percentage,
      'rank': rank,
      'deltaRank': deltaRank,
    };
  }

  CandidateResult toEntity() {
    return CandidateResult(
      candidateId: candidateId,
      name: name,
      imageUrl: imageUrl,
      voteCount: voteCount,
      percentage: percentage,
      rank: rank,
      deltaRank: deltaRank,
    );
  }
}
