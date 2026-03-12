import '../../domain/entities/match_result.dart';

/// Data model for individual candidate match results.
class MatchResultModel {
  final String candidateId;
  final String candidateName;
  final String? photoUrl;
  final double matchPct;
  final Map<String, double> categoryBreakdown;

  const MatchResultModel({
    required this.candidateId,
    required this.candidateName,
    this.photoUrl,
    required this.matchPct,
    this.categoryBreakdown = const {},
  });

  factory MatchResultModel.fromJson(Map<String, dynamic> json) {
    return MatchResultModel(
      candidateId: json['candidateId'] as String,
      candidateName: json['candidateName'] as String,
      photoUrl: json['photoUrl'] as String?,
      matchPct:
          double.tryParse(json['matchPct']?.toString() ?? '0') ?? 0.0,
      categoryBreakdown: _parseCategoryBreakdown(json['categoryBreakdown']),
    );
  }

  MatchResult toEntity() {
    return MatchResult(
      candidateId: candidateId,
      candidateName: candidateName,
      candidatePhotoUrl: photoUrl,
      matchPct: matchPct,
      categoryBreakdown: categoryBreakdown,
    );
  }

  static Map<String, double> _parseCategoryBreakdown(dynamic json) {
    if (json == null || json is! Map) return const {};
    return (json as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, double.tryParse(value.toString()) ?? 0.0),
    );
  }
}

/// Data model wrapping the full match result response from the API.
class MatchResultResponseModel {
  final String electionId;
  final List<MatchResultModel> matches;
  final int totalAnswered;
  final int totalStatements;
  final String computedAt;

  const MatchResultResponseModel({
    required this.electionId,
    required this.matches,
    required this.totalAnswered,
    required this.totalStatements,
    required this.computedAt,
  });

  factory MatchResultResponseModel.fromJson(Map<String, dynamic> json) {
    final matchesJson = json['matches'] as List<dynamic>? ?? [];
    return MatchResultResponseModel(
      electionId: json['electionId'] as String,
      matches: matchesJson
          .map((m) => MatchResultModel.fromJson(m as Map<String, dynamic>))
          .toList(),
      totalAnswered: json['totalAnswered'] as int? ?? 0,
      totalStatements: json['totalStatements'] as int? ?? 0,
      computedAt: json['computedAt'] as String? ?? '',
    );
  }

  MatchResultResponse toEntity() {
    return MatchResultResponse(
      electionId: electionId,
      matches: matches.map((m) => m.toEntity()).toList(),
      totalAnswered: totalAnswered,
      totalStatements: totalStatements,
      computedAt: computedAt,
    );
  }
}
