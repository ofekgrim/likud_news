import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/entities/community_average.dart';
import '../../domain/entities/quiz_answer.dart';
import '../../domain/entities/quiz_question.dart';
import '../../domain/entities/quiz_result.dart';
import '../../domain/repositories/quiz_repository.dart';
import '../../domain/usecases/get_my_quiz_results.dart';
import '../../domain/usecases/get_quiz_averages.dart';
import '../../domain/usecases/get_quiz_questions.dart';
import '../../domain/usecases/submit_quiz.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Quiz BLoC events.
sealed class QuizEvent extends Equatable {
  const QuizEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of quiz questions for the given election.
final class LoadQuizQuestions extends QuizEvent {
  final String electionId;

  const LoadQuizQuestions({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Records the user's answer for a specific question.
final class AnswerQuestion extends QuizEvent {
  final String questionId;
  final double selectedValue;
  final int importance;

  const AnswerQuestion({
    required this.questionId,
    required this.selectedValue,
    required this.importance,
  });

  @override
  List<Object?> get props => [questionId, selectedValue, importance];
}

/// Updates the importance level for a previously answered question.
final class UpdateImportance extends QuizEvent {
  final String questionId;
  final int importance;

  const UpdateImportance({
    required this.questionId,
    required this.importance,
  });

  @override
  List<Object?> get props => [questionId, importance];
}

/// Advances to the next question.
final class NextQuestion extends QuizEvent {
  const NextQuestion();
}

/// Goes back to the previous question.
final class PreviousQuestion extends QuizEvent {
  const PreviousQuestion();
}

/// Submits all quiz answers for the given election.
final class SubmitQuizEvent extends QuizEvent {
  final String electionId;

  const SubmitQuizEvent({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Loads the user's existing quiz results for the given election.
final class LoadMyResults extends QuizEvent {
  final String electionId;

  const LoadMyResults({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Loads community average quiz results for the given election.
final class LoadQuizAverages extends QuizEvent {
  final String electionId;

  const LoadQuizAverages({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Quiz BLoC states.
sealed class QuizState extends Equatable {
  const QuizState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class QuizInitial extends QuizState {
  const QuizInitial();
}

/// Questions are being fetched.
final class QuizLoading extends QuizState {
  const QuizLoading();
}

/// Questions loaded — the user is actively answering the quiz.
final class QuizQuestionsLoaded extends QuizState {
  final String electionId;
  final List<QuizQuestion> questions;
  final int currentIndex;
  final Map<String, QuizAnswer> answers;

  const QuizQuestionsLoaded({
    required this.electionId,
    required this.questions,
    required this.currentIndex,
    required this.answers,
  });

  /// Whether all questions have been answered.
  bool get allAnswered => answers.length == questions.length;

  /// Whether the current question has been answered.
  bool get currentAnswered =>
      questions.isNotEmpty &&
      currentIndex < questions.length &&
      answers.containsKey(questions[currentIndex].id);

  /// Whether we are on the last question.
  bool get isLastQuestion =>
      questions.isNotEmpty && currentIndex == questions.length - 1;

  /// Whether we are on the first question.
  bool get isFirstQuestion => currentIndex == 0;

  QuizQuestionsLoaded copyWith({
    String? electionId,
    List<QuizQuestion>? questions,
    int? currentIndex,
    Map<String, QuizAnswer>? answers,
  }) {
    return QuizQuestionsLoaded(
      electionId: electionId ?? this.electionId,
      questions: questions ?? this.questions,
      currentIndex: currentIndex ?? this.currentIndex,
      answers: answers ?? this.answers,
    );
  }

  @override
  List<Object?> get props => [electionId, questions, currentIndex, answers];
}

/// Quiz answers are being submitted to the server.
final class QuizSubmitting extends QuizState {
  const QuizSubmitting();
}

/// Quiz results have been loaded (either from submission or fetched).
final class QuizResultsLoaded extends QuizState {
  final List<CandidateMatch> matchResults;
  final Map<String, QuizAnswer>? answers;
  final List<CommunityAverage>? communityAverages;

  const QuizResultsLoaded({
    required this.matchResults,
    this.answers,
    this.communityAverages,
  });

  QuizResultsLoaded copyWith({
    List<CandidateMatch>? matchResults,
    Map<String, QuizAnswer>? answers,
    List<CommunityAverage>? communityAverages,
  }) {
    return QuizResultsLoaded(
      matchResults: matchResults ?? this.matchResults,
      answers: answers ?? this.answers,
      communityAverages: communityAverages ?? this.communityAverages,
    );
  }

  @override
  List<Object?> get props => [matchResults, answers, communityAverages];
}

/// An error occurred during quiz operations.
final class QuizError extends QuizState {
  final String message;

  const QuizError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the candidate quiz screens.
///
/// Handles loading questions, tracking user answers, navigating between
/// questions, submitting answers, and loading existing results.
@injectable
class QuizBloc extends Bloc<QuizEvent, QuizState> {
  final QuizRepository _repository;
  final GetQuizQuestions _getQuizQuestions;
  final SubmitQuiz _submitQuiz;
  final GetMyQuizResults _getMyQuizResults;
  final GetQuizAverages _getQuizAverages;

  QuizBloc(
    this._repository,
    this._getQuizQuestions,
    this._submitQuiz,
    this._getMyQuizResults,
    this._getQuizAverages,
  ) : super(const QuizInitial()) {
    on<LoadQuizQuestions>(_onLoadQuizQuestions);
    on<AnswerQuestion>(_onAnswerQuestion);
    on<UpdateImportance>(_onUpdateImportance);
    on<NextQuestion>(_onNextQuestion);
    on<PreviousQuestion>(_onPreviousQuestion);
    on<SubmitQuizEvent>(_onSubmitQuiz);
    on<LoadMyResults>(_onLoadMyResults);
    on<LoadQuizAverages>(_onLoadQuizAverages);
  }

  /// Loads quiz questions from the API.
  ///
  /// If [event.electionId] is `'active'`, resolves it to the real UUID first.
  Future<void> _onLoadQuizQuestions(
    LoadQuizQuestions event,
    Emitter<QuizState> emit,
  ) async {
    emit(const QuizLoading());

    // Resolve 'active' to a real election UUID
    String resolvedId = event.electionId;
    if (resolvedId == 'active') {
      final resolveResult = await _repository.resolveActiveElectionId();
      final failed = resolveResult.fold<bool>(
        (failure) {
          emit(QuizError(
            message: failure.message ?? 'No active election found',
          ));
          return true;
        },
        (id) {
          resolvedId = id;
          return false;
        },
      );
      if (failed) return;
    }

    final result = await _getQuizQuestions(
      GetQuizQuestionsParams(electionId: resolvedId),
    );

    result.fold(
      (failure) => emit(QuizError(
        message: failure.message ?? 'Failed to load quiz questions',
      )),
      (questions) => emit(QuizQuestionsLoaded(
        electionId: resolvedId,
        questions: questions,
        currentIndex: 0,
        answers: const {},
      )),
    );
  }

  /// Records or updates the user's answer for a question.
  void _onAnswerQuestion(
    AnswerQuestion event,
    Emitter<QuizState> emit,
  ) {
    final currentState = state;
    if (currentState is! QuizQuestionsLoaded) return;

    final updatedAnswers = Map<String, QuizAnswer>.from(currentState.answers);
    updatedAnswers[event.questionId] = QuizAnswer(
      questionId: event.questionId,
      selectedValue: event.selectedValue,
      importance: event.importance,
    );

    emit(currentState.copyWith(answers: updatedAnswers));
  }

  /// Updates the importance level for an existing answer.
  void _onUpdateImportance(
    UpdateImportance event,
    Emitter<QuizState> emit,
  ) {
    final currentState = state;
    if (currentState is! QuizQuestionsLoaded) return;

    final existingAnswer = currentState.answers[event.questionId];
    if (existingAnswer == null) return;

    final updatedAnswers = Map<String, QuizAnswer>.from(currentState.answers);
    updatedAnswers[event.questionId] = existingAnswer.copyWith(
      importance: event.importance,
    );

    emit(currentState.copyWith(answers: updatedAnswers));
  }

  /// Advances to the next question if the current one is answered.
  void _onNextQuestion(
    NextQuestion event,
    Emitter<QuizState> emit,
  ) {
    final currentState = state;
    if (currentState is! QuizQuestionsLoaded) return;

    // Only advance if the current question has been answered
    if (!currentState.currentAnswered) return;

    if (currentState.currentIndex < currentState.questions.length - 1) {
      emit(currentState.copyWith(
        currentIndex: currentState.currentIndex + 1,
      ));
    }
  }

  /// Goes back to the previous question.
  void _onPreviousQuestion(
    PreviousQuestion event,
    Emitter<QuizState> emit,
  ) {
    final currentState = state;
    if (currentState is! QuizQuestionsLoaded) return;

    if (currentState.currentIndex > 0) {
      emit(currentState.copyWith(
        currentIndex: currentState.currentIndex - 1,
      ));
    }
  }

  /// Submits all answers to the API and emits results.
  Future<void> _onSubmitQuiz(
    SubmitQuizEvent event,
    Emitter<QuizState> emit,
  ) async {
    final currentState = state;
    final Map<String, QuizAnswer> currentAnswers;

    if (currentState is QuizQuestionsLoaded) {
      currentAnswers = currentState.answers;
    } else {
      return;
    }

    emit(const QuizSubmitting());

    final result = await _submitQuiz(
      SubmitQuizParams(
        electionId: event.electionId,
        answers: currentAnswers.values.toList(),
      ),
    );

    result.fold(
      (failure) => emit(QuizError(
        message: failure.message ?? 'Failed to submit quiz',
      )),
      (matchResults) => emit(QuizResultsLoaded(
        matchResults: matchResults,
        answers: currentAnswers,
      )),
    );
  }

  /// Loads existing quiz results from the API.
  Future<void> _onLoadMyResults(
    LoadMyResults event,
    Emitter<QuizState> emit,
  ) async {
    emit(const QuizLoading());

    final result = await _getMyQuizResults(
      GetMyQuizResultsParams(electionId: event.electionId),
    );

    result.fold(
      (failure) => emit(QuizError(
        message: failure.message ?? 'Failed to load quiz results',
      )),
      (quizResult) {
        if (quizResult == null) {
          // User hasn't taken the quiz yet — go back to initial
          emit(const QuizInitial());
        } else {
          emit(QuizResultsLoaded(
            matchResults: quizResult.matchResults,
          ));
        }
      },
    );
  }

  /// Loads community average quiz results and merges them into the current state.
  Future<void> _onLoadQuizAverages(
    LoadQuizAverages event,
    Emitter<QuizState> emit,
  ) async {
    final result = await _getQuizAverages(
      GetQuizAveragesParams(electionId: event.electionId),
    );

    result.fold(
      (_) {
        // Silently ignore — averages are supplementary data.
      },
      (averages) {
        final currentState = state;
        if (currentState is QuizResultsLoaded) {
          emit(currentState.copyWith(communityAverages: averages));
        }
      },
    );
  }
}
