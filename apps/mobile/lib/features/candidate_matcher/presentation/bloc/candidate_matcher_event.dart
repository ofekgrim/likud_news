part of 'candidate_matcher_bloc.dart';

/// Base class for all CandidateMatcher BLoC events.
sealed class CandidateMatcherEvent extends Equatable {
  const CandidateMatcherEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading policy statements for the given election.
final class LoadStatements extends CandidateMatcherEvent {
  final String electionId;

  const LoadStatements({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Records the user's answer for a specific statement.
final class AnswerStatement extends CandidateMatcherEvent {
  final String statementId;
  final QuizAnswer answer;

  const AnswerStatement({
    required this.statementId,
    required this.answer,
  });

  @override
  List<Object?> get props => [statementId, answer];
}

/// Sets the importance weight for a policy category.
final class SetImportanceWeight extends CandidateMatcherEvent {
  final String category;
  final double weight;

  const SetImportanceWeight({
    required this.category,
    required this.weight,
  });

  @override
  List<Object?> get props => [category, weight];
}

/// Triggers submission of all quiz responses and computation of matches.
final class SubmitMatcherResponses extends CandidateMatcherEvent {
  final String electionId;

  const SubmitMatcherResponses({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Navigates to a specific question index.
final class NavigateToQuestion extends CandidateMatcherEvent {
  final int index;

  const NavigateToQuestion({required this.index});

  @override
  List<Object?> get props => [index];
}

/// Resets the quiz to its initial state for retaking.
final class RetakeQuiz extends CandidateMatcherEvent {
  const RetakeQuiz();
}

/// Fetches already-computed match results from the backend (e.g. when the
/// results page creates a fresh BLoC after navigation, but responses have
/// already been submitted by the questions page).
final class LoadMatchResults extends CandidateMatcherEvent {
  final String electionId;

  const LoadMatchResults({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
