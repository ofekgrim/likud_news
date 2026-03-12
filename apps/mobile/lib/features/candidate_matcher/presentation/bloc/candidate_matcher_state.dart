part of 'candidate_matcher_bloc.dart';

/// Base class for all CandidateMatcher BLoC states.
sealed class CandidateMatcherState extends Equatable {
  const CandidateMatcherState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been loaded.
final class CandidateMatcherInitial extends CandidateMatcherState {
  const CandidateMatcherInitial();
}

/// Policy statements are being loaded.
final class CandidateMatcherLoading extends CandidateMatcherState {
  const CandidateMatcherLoading();
}

/// Policy statements loaded and quiz is in progress.
final class CandidateMatcherQuestionsLoaded extends CandidateMatcherState {
  /// All policy statements for this election.
  final List<PolicyStatement> statements;

  /// User answers keyed by statement ID.
  final Map<String, QuizAnswer> answers;

  /// Category importance weights set by the user.
  final Map<String, double> categoryWeights;

  /// Current question index (0-based).
  final int currentIndex;

  const CandidateMatcherQuestionsLoaded({
    required this.statements,
    required this.answers,
    required this.categoryWeights,
    required this.currentIndex,
  });

  /// Whether all questions have been answered.
  bool get allAnswered => answers.length == statements.length;

  /// Total number of questions.
  int get totalQuestions => statements.length;

  /// Number of answered questions.
  int get answeredCount => answers.length;

  /// Creates a copy with modified fields.
  CandidateMatcherQuestionsLoaded copyWith({
    List<PolicyStatement>? statements,
    Map<String, QuizAnswer>? answers,
    Map<String, double>? categoryWeights,
    int? currentIndex,
  }) {
    return CandidateMatcherQuestionsLoaded(
      statements: statements ?? this.statements,
      answers: answers ?? this.answers,
      categoryWeights: categoryWeights ?? this.categoryWeights,
      currentIndex: currentIndex ?? this.currentIndex,
    );
  }

  @override
  List<Object?> get props => [statements, answers, categoryWeights, currentIndex];
}

/// Responses are being submitted and match is being computed.
final class CandidateMatcherSubmitting extends CandidateMatcherState {
  const CandidateMatcherSubmitting();
}

/// Match results loaded successfully.
final class CandidateMatcherResultsLoaded extends CandidateMatcherState {
  final MatchResultResponse matchResponse;

  const CandidateMatcherResultsLoaded({required this.matchResponse});

  /// Convenience getter for the ranked match list.
  List<MatchResult> get matches => matchResponse.matches;

  @override
  List<Object?> get props => [matchResponse];
}

/// An error occurred.
final class CandidateMatcherError extends CandidateMatcherState {
  final Failure failure;

  const CandidateMatcherError({required this.failure});

  @override
  List<Object?> get props => [failure];
}
