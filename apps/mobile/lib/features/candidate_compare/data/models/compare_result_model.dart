import '../../domain/entities/compare_result.dart';

/// Data model for candidate comparison results, handles JSON serialization.
///
/// Maps API responses to the domain [CompareResult] entity via [toEntity].
class CompareResultModel {
  final List<ComparedCandidateModel> candidates;
  final Map<String, List<double>> positionComparison;

  const CompareResultModel({
    required this.candidates,
    this.positionComparison = const {},
  });

  factory CompareResultModel.fromJson(Map<String, dynamic> json) {
    final candidatesJson = json['candidates'] as List<dynamic>? ?? [];
    final candidates = candidatesJson
        .map((c) => ComparedCandidateModel.fromJson(c as Map<String, dynamic>))
        .toList();

    final positionComparisonJson =
        json['positionComparison'] as Map<String, dynamic>? ?? {};
    final positionComparison = positionComparisonJson.map(
      (key, value) => MapEntry(
        key,
        (value as List<dynamic>)
            .map((v) => double.tryParse(v.toString()) ?? 0.0)
            .toList(),
      ),
    );

    return CompareResultModel(
      candidates: candidates,
      positionComparison: positionComparison,
    );
  }

  CompareResult toEntity() {
    return CompareResult(
      candidates: candidates.map((c) => c.toEntity()).toList(),
      positionComparison: positionComparison,
    );
  }
}

/// Data model for a single compared candidate.
class ComparedCandidateModel {
  final String id;
  final String fullName;
  final String? photoUrl;
  final String? position;
  final String? district;
  final int endorsementCount;
  final String? bio;
  final Map<String, double> quizPositions;

  const ComparedCandidateModel({
    required this.id,
    required this.fullName,
    this.photoUrl,
    this.position,
    this.district,
    this.endorsementCount = 0,
    this.bio,
    this.quizPositions = const {},
  });

  factory ComparedCandidateModel.fromJson(Map<String, dynamic> json) {
    return ComparedCandidateModel(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      photoUrl: json['photoUrl'] as String?,
      position: json['position'] as String?,
      district: json['district'] as String?,
      endorsementCount: json['endorsementCount'] as int? ?? 0,
      bio: json['bio'] as String?,
      quizPositions: _parseQuizPositions(json['quizPositions']),
    );
  }

  ComparedCandidate toEntity() {
    return ComparedCandidate(
      id: id,
      fullName: fullName,
      photoUrl: photoUrl,
      position: position,
      district: district,
      endorsementCount: endorsementCount,
      bio: bio,
      quizPositions: quizPositions,
    );
  }

  static Map<String, double> _parseQuizPositions(dynamic json) {
    if (json == null || json is! Map) return const {};
    return (json as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, double.tryParse(value.toString()) ?? 0.0),
    );
  }
}
