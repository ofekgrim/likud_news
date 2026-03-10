import '../../domain/entities/community_average.dart';

/// Data model for community average quiz match results from the API.
class CommunityAverageModel {
  final String candidateId;
  final String candidateName;
  final int averageMatchPercentage;
  final int totalResponses;

  const CommunityAverageModel({
    required this.candidateId,
    required this.candidateName,
    required this.averageMatchPercentage,
    required this.totalResponses,
  });

  factory CommunityAverageModel.fromJson(Map<String, dynamic> json) {
    return CommunityAverageModel(
      candidateId: json['candidateId'] as String,
      candidateName: (json['candidateName'] as String?) ?? '',
      averageMatchPercentage:
          int.tryParse(json['averageMatchPercentage'].toString()) ?? 0,
      totalResponses:
          int.tryParse(json['totalResponses'].toString()) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'candidateId': candidateId,
      'candidateName': candidateName,
      'averageMatchPercentage': averageMatchPercentage,
      'totalResponses': totalResponses,
    };
  }

  CommunityAverage toEntity() {
    return CommunityAverage(
      candidateId: candidateId,
      candidateName: candidateName,
      averageMatchPercentage: averageMatchPercentage,
      totalResponses: totalResponses,
    );
  }
}
