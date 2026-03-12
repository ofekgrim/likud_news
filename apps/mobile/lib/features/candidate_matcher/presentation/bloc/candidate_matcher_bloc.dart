import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/match_result.dart';
import '../../domain/entities/policy_statement.dart';
import '../../domain/entities/quiz_answer.dart';
import '../../domain/usecases/get_match_results.dart';
import '../../domain/usecases/get_policy_statements.dart';
import '../../domain/usecases/submit_responses.dart';

part 'candidate_matcher_event.dart';
part 'candidate_matcher_state.dart';

/// Manages the state of the Candidate Matcher (VAA) feature.
///
/// Handles loading statements, recording answers, setting importance
/// weights, submitting responses, and fetching match results.
@injectable
class CandidateMatcherBloc
    extends Bloc<CandidateMatcherEvent, CandidateMatcherState> {
  final GetPolicyStatements _getPolicyStatements;
  final SubmitResponses _submitResponses;
  final GetMatchResults _getMatchResults;

  CandidateMatcherBloc(
    this._getPolicyStatements,
    this._submitResponses,
    this._getMatchResults,
  ) : super(const CandidateMatcherInitial()) {
    on<LoadStatements>(_onLoadStatements);
    on<AnswerStatement>(_onAnswerStatement);
    on<SetImportanceWeight>(_onSetImportanceWeight);
    on<SubmitMatcherResponses>(_onSubmitResponses);
    on<LoadMatchResults>(_onLoadMatchResults);
    on<NavigateToQuestion>(_onNavigateToQuestion);
    on<RetakeQuiz>(_onRetakeQuiz);
  }

  /// Loads policy statements for the given election.
  Future<void> _onLoadStatements(
    LoadStatements event,
    Emitter<CandidateMatcherState> emit,
  ) async {
    emit(const CandidateMatcherLoading());

    final result = await _getPolicyStatements(
      GetPolicyStatementsParams(electionId: event.electionId),
    );

    result.fold(
      (failure) => emit(CandidateMatcherError(failure: failure)),
      (statements) => emit(CandidateMatcherQuestionsLoaded(
        statements: statements,
        answers: const {},
        categoryWeights: const {},
        currentIndex: 0,
      )),
    );
  }

  /// Records the user's answer for a statement.
  void _onAnswerStatement(
    AnswerStatement event,
    Emitter<CandidateMatcherState> emit,
  ) {
    final currentState = state;
    if (currentState is! CandidateMatcherQuestionsLoaded) return;

    final newAnswers = Map<String, QuizAnswer>.from(currentState.answers)
      ..[event.statementId] = event.answer;

    // Auto-advance to next question
    final nextIndex = currentState.currentIndex < currentState.statements.length - 1
        ? currentState.currentIndex + 1
        : currentState.currentIndex;

    emit(currentState.copyWith(
      answers: newAnswers,
      currentIndex: nextIndex,
    ));
  }

  /// Sets the importance weight for a category.
  void _onSetImportanceWeight(
    SetImportanceWeight event,
    Emitter<CandidateMatcherState> emit,
  ) {
    final currentState = state;
    if (currentState is! CandidateMatcherQuestionsLoaded) return;

    final newWeights = Map<String, double>.from(currentState.categoryWeights)
      ..[event.category] = event.weight;

    emit(currentState.copyWith(categoryWeights: newWeights));
  }

  /// Submits all responses and fetches match results.
  Future<void> _onSubmitResponses(
    SubmitMatcherResponses event,
    Emitter<CandidateMatcherState> emit,
  ) async {
    final currentState = state;
    if (currentState is! CandidateMatcherQuestionsLoaded) return;

    emit(const CandidateMatcherSubmitting());

    // Build responses list from answers + category weights
    final responses = currentState.answers.entries.map((entry) {
      // Find the category of this statement to apply its weight
      final statement = currentState.statements.firstWhere(
        (s) => s.id == entry.key,
        orElse: () => currentState.statements.first,
      );
      final categoryKey = statement.category.name;
      final weight = currentState.categoryWeights[categoryKey];

      return (
        statementId: entry.key,
        answer: entry.value,
        importanceWeight: weight,
      );
    }).toList();

    final submitResult = await _submitResponses(
      SubmitResponsesParams(
        electionId: event.electionId,
        responses: responses,
      ),
    );

    await submitResult.fold(
      (failure) async => emit(CandidateMatcherError(failure: failure)),
      (_) async {
        // After submitting, fetch match results
        final matchResult = await _getMatchResults(
          GetMatchResultsParams(electionId: event.electionId),
        );

        matchResult.fold(
          (failure) => emit(CandidateMatcherError(failure: failure)),
          (response) => emit(CandidateMatcherResultsLoaded(
            matchResponse: response,
          )),
        );
      },
    );
  }

  /// Fetches already-computed match results from the backend.
  /// Used when the results page creates a fresh BLoC after navigation.
  Future<void> _onLoadMatchResults(
    LoadMatchResults event,
    Emitter<CandidateMatcherState> emit,
  ) async {
    emit(const CandidateMatcherLoading());

    final result = await _getMatchResults(
      GetMatchResultsParams(electionId: event.electionId),
    );

    result.fold(
      (failure) => emit(CandidateMatcherError(failure: failure)),
      (response) => emit(CandidateMatcherResultsLoaded(matchResponse: response)),
    );
  }

  /// Navigates to a specific question index.
  void _onNavigateToQuestion(
    NavigateToQuestion event,
    Emitter<CandidateMatcherState> emit,
  ) {
    final currentState = state;
    if (currentState is! CandidateMatcherQuestionsLoaded) return;

    final clampedIndex = event.index.clamp(0, currentState.statements.length - 1);
    emit(currentState.copyWith(currentIndex: clampedIndex));
  }

  /// Resets the quiz to its initial state.
  void _onRetakeQuiz(
    RetakeQuiz event,
    Emitter<CandidateMatcherState> emit,
  ) {
    emit(const CandidateMatcherInitial());
  }
}
