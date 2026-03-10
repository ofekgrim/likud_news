import 'package:equatable/equatable.dart';

import 'quiz_answer.dart';

/// Represents a single candidate's match result from the quiz.
class CandidateMatch extends Equatable {
  final String candidateId;
  final String candidateName;
  final int matchPercentage;

  const CandidateMatch({
    required this.candidateId,
    required this.candidateName,
    required this.matchPercentage,
  });

  @override
  List<Object?> get props => [candidateId, candidateName, matchPercentage];
}

/// Represents the complete quiz result for a user, including all answers
/// and the computed candidate match results.
class QuizResult extends Equatable {
  final String id;
  final String electionId;
  final List<QuizAnswer> answers;
  final List<CandidateMatch> matchResults;
  final DateTime? completedAt;

  const QuizResult({
    required this.id,
    required this.electionId,
    required this.answers,
    required this.matchResults,
    this.completedAt,
  });

  @override
  List<Object?> get props => [
        id,
        electionId,
        answers,
        matchResults,
        completedAt,
      ];
}
