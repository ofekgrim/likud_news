import 'package:equatable/equatable.dart';

/// Immutable domain entity representing a candidate match result
/// from the VAA (Voting Advice Application) quiz.
class MatchResult extends Equatable {
  final String candidateId;
  final String candidateName;
  final String? candidatePhotoUrl;
  final double matchPct;
  final Map<String, double> categoryBreakdown;

  const MatchResult({
    required this.candidateId,
    required this.candidateName,
    this.candidatePhotoUrl,
    required this.matchPct,
    this.categoryBreakdown = const {},
  });

  @override
  List<Object?> get props => [
        candidateId,
        candidateName,
        candidatePhotoUrl,
        matchPct,
        categoryBreakdown,
      ];
}

/// Wraps the full response from the match computation endpoint.
class MatchResultResponse extends Equatable {
  final String electionId;
  final List<MatchResult> matches;
  final int totalAnswered;
  final int totalStatements;
  final String computedAt;

  const MatchResultResponse({
    required this.electionId,
    required this.matches,
    required this.totalAnswered,
    required this.totalStatements,
    required this.computedAt,
  });

  @override
  List<Object?> get props => [
        electionId,
        matches,
        totalAnswered,
        totalStatements,
        computedAt,
      ];
}
