import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/entities/daily_quiz.dart';
import '../../domain/repositories/daily_quiz_repository.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all DailyQuiz BLoC events.
sealed class DailyQuizEvent extends Equatable {
  const DailyQuizEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of today's daily quiz.
final class LoadDailyQuiz extends DailyQuizEvent {
  const LoadDailyQuiz();
}

/// Selects an answer for a specific question.
final class SelectAnswer extends DailyQuizEvent {
  final int questionIndex;
  final int optionIndex;

  const SelectAnswer({
    required this.questionIndex,
    required this.optionIndex,
  });

  @override
  List<Object?> get props => [questionIndex, optionIndex];
}

/// Submits all selected answers for the daily quiz.
final class SubmitDailyQuiz extends DailyQuizEvent {
  const SubmitDailyQuiz();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all DailyQuiz BLoC states.
sealed class DailyQuizState extends Equatable {
  const DailyQuizState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class DailyQuizInitial extends DailyQuizState {
  const DailyQuizInitial();
}

/// Data is being fetched.
final class DailyQuizLoading extends DailyQuizState {
  const DailyQuizLoading();
}

/// Quiz loaded successfully.
final class DailyQuizLoaded extends DailyQuizState {
  final DailyQuiz quiz;
  final Map<int, int> selectedAnswers;
  final bool isSubmitting;
  final DailyQuizResult? result;

  const DailyQuizLoaded({
    required this.quiz,
    this.selectedAnswers = const {},
    this.isSubmitting = false,
    this.result,
  });

  /// Whether all questions have been answered.
  bool get allAnswered => selectedAnswers.length == quiz.questions.length;

  DailyQuizLoaded copyWith({
    DailyQuiz? quiz,
    Map<int, int>? selectedAnswers,
    bool? isSubmitting,
    DailyQuizResult? result,
  }) {
    return DailyQuizLoaded(
      quiz: quiz ?? this.quiz,
      selectedAnswers: selectedAnswers ?? this.selectedAnswers,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      result: result ?? this.result,
    );
  }

  @override
  List<Object?> get props => [quiz, selectedAnswers, isSubmitting, result];
}

/// No quiz available today.
final class DailyQuizNoQuiz extends DailyQuizState {
  const DailyQuizNoQuiz();
}

/// An error occurred while loading the quiz.
final class DailyQuizError extends DailyQuizState {
  final String message;

  const DailyQuizError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Daily Quiz feature.
///
/// Supports loading today's quiz, selecting answers, and submitting.
@injectable
class DailyQuizBloc extends Bloc<DailyQuizEvent, DailyQuizState> {
  final DailyQuizRepository _repository;

  DailyQuizBloc(this._repository) : super(const DailyQuizInitial()) {
    on<LoadDailyQuiz>(_onLoadDailyQuiz);
    on<SelectAnswer>(_onSelectAnswer);
    on<SubmitDailyQuiz>(_onSubmitDailyQuiz);
  }

  /// Loads today's daily quiz from the repository.
  Future<void> _onLoadDailyQuiz(
    LoadDailyQuiz event,
    Emitter<DailyQuizState> emit,
  ) async {
    emit(const DailyQuizLoading());

    final result = await _repository.getTodayQuiz();

    result.fold(
      (failure) => emit(DailyQuizError(
        message: failure.message ?? 'daily_quiz_error_loading'.tr(),
      )),
      (quiz) {
        if (quiz == null) {
          emit(const DailyQuizNoQuiz());
        } else {
          emit(DailyQuizLoaded(quiz: quiz));
        }
      },
    );
  }

  /// Updates the selected answer for a question.
  void _onSelectAnswer(
    SelectAnswer event,
    Emitter<DailyQuizState> emit,
  ) {
    final currentState = state;
    if (currentState is! DailyQuizLoaded) return;
    if (currentState.isSubmitting) return;
    if (currentState.result != null) return;

    final updatedAnswers = Map<int, int>.from(currentState.selectedAnswers);
    updatedAnswers[event.questionIndex] = event.optionIndex;

    emit(currentState.copyWith(selectedAnswers: updatedAnswers));
  }

  /// Submits all answers and shows the result.
  Future<void> _onSubmitDailyQuiz(
    SubmitDailyQuiz event,
    Emitter<DailyQuizState> emit,
  ) async {
    final currentState = state;
    if (currentState is! DailyQuizLoaded) return;
    if (!currentState.allAnswered) return;
    if (currentState.isSubmitting) return;

    emit(currentState.copyWith(isSubmitting: true));

    // Build ordered answers list
    final answers = List<int>.generate(
      currentState.quiz.questions.length,
      (i) => currentState.selectedAnswers[i] ?? 0,
    );

    final result = await _repository.submitQuiz(
      currentState.quiz.id,
      answers,
    );

    result.fold(
      (failure) {
        emit(currentState.copyWith(isSubmitting: false));
      },
      (quizResult) {
        emit(currentState.copyWith(
          isSubmitting: false,
          result: quizResult,
        ));
      },
    );
  }
}
