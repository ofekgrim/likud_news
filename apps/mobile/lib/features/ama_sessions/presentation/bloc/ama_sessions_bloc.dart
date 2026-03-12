import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/ama_question.dart';
import '../../domain/entities/ama_session.dart';
import '../../domain/repositories/ama_repository.dart';
import '../../domain/usecases/get_ama_sessions.dart';
import '../../domain/usecases/submit_ama_question.dart';
import '../../domain/usecases/upvote_ama_question.dart';

part 'ama_sessions_event.dart';
part 'ama_sessions_state.dart';

/// Manages the state of the AMA Sessions feature.
///
/// Supports loading sessions, viewing session detail with questions,
/// submitting questions, upvoting, and receiving real-time updates.
@injectable
class AmaSessionsBloc extends Bloc<AmaSessionsEvent, AmaSessionsState> {
  final GetAmaSessions _getAmaSessions;
  final SubmitAmaQuestion _submitAmaQuestion;
  final UpvoteAmaQuestion _upvoteAmaQuestion;
  final AmaRepository _repository;

  AmaSessionsBloc(
    this._getAmaSessions,
    this._submitAmaQuestion,
    this._upvoteAmaQuestion,
    this._repository,
  ) : super(const AmaInitial()) {
    on<LoadSessions>(_onLoadSessions);
    on<LoadUpcoming>(_onLoadUpcoming);
    on<LoadSessionDetail>(_onLoadSessionDetail);
    on<SubmitQuestion>(_onSubmitQuestion);
    on<UpvoteQuestion>(_onUpvoteQuestion);
    on<QuestionReceived>(_onQuestionReceived);
  }

  /// Loads all AMA sessions and upcoming sessions in parallel.
  Future<void> _onLoadSessions(
    LoadSessions event,
    Emitter<AmaSessionsState> emit,
  ) async {
    emit(const AmaLoading());

    final result = await _getAmaSessions(const NoParams());

    await result.fold(
      (failure) async => emit(AmaError(
        message: failure.message ?? 'error_generic'.tr(),
      )),
      (sessions) async {
        // Also load upcoming sessions
        final upcomingResult = await _repository.getUpcomingSessions();

        final upcomingSessions = upcomingResult.fold(
          (_) => <AmaSession>[],
          (upcoming) => upcoming,
        );

        emit(AmaSessionsLoaded(
          sessions: sessions,
          upcomingSessions: upcomingSessions,
        ));
      },
    );
  }

  /// Loads only upcoming sessions.
  Future<void> _onLoadUpcoming(
    LoadUpcoming event,
    Emitter<AmaSessionsState> emit,
  ) async {
    final currentState = state;
    if (currentState is AmaSessionsLoaded) {
      final result = await _repository.getUpcomingSessions();
      result.fold(
        (_) {}, // Silently ignore
        (upcoming) {
          emit(currentState.copyWith(upcomingSessions: upcoming));
        },
      );
    }
  }

  /// Loads a session detail and its questions.
  Future<void> _onLoadSessionDetail(
    LoadSessionDetail event,
    Emitter<AmaSessionsState> emit,
  ) async {
    emit(const AmaLoading());

    final sessionResult = await _repository.getSession(event.sessionId);

    await sessionResult.fold(
      (failure) async => emit(AmaError(
        message: failure.message ?? 'error_generic'.tr(),
      )),
      (session) async {
        final questionsResult = await _repository.getQuestions(
          event.sessionId,
        );

        questionsResult.fold(
          (failure) => emit(AmaError(
            message: failure.message ?? 'error_generic'.tr(),
          )),
          (questions) => emit(AmaSessionDetailLoaded(
            session: session,
            questions: questions,
          )),
        );
      },
    );
  }

  /// Submits a new question to the session.
  Future<void> _onSubmitQuestion(
    SubmitQuestion event,
    Emitter<AmaSessionsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! AmaSessionDetailLoaded) return;

    emit(currentState.copyWith(isSubmitting: true));

    final result = await _submitAmaQuestion(SubmitAmaQuestionParams(
      sessionId: event.sessionId,
      text: event.text,
    ));

    result.fold(
      (failure) {
        emit(currentState.copyWith(isSubmitting: false));
      },
      (question) {
        final updatedQuestions = [...currentState.questions, question];
        emit(currentState.copyWith(
          questions: updatedQuestions,
          isSubmitting: false,
        ));
      },
    );
  }

  /// Upvotes a question with optimistic UI update.
  Future<void> _onUpvoteQuestion(
    UpvoteQuestion event,
    Emitter<AmaSessionsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! AmaSessionDetailLoaded) return;

    // Optimistic update
    final updatedQuestions = currentState.questions.map((q) {
      if (q.id == event.questionId && !q.hasUpvoted) {
        return q.withUpvote();
      }
      return q;
    }).toList();

    emit(currentState.copyWith(questions: updatedQuestions));

    // Fire API call
    final result = await _upvoteAmaQuestion(event.questionId);

    result.fold(
      (failure) {
        // Revert optimistic update on failure
        emit(currentState);
      },
      (_) {
        // Success — keep optimistic update
      },
    );
  }

  /// Handles a new question received via WebSocket.
  void _onQuestionReceived(
    QuestionReceived event,
    Emitter<AmaSessionsState> emit,
  ) {
    final currentState = state;
    if (currentState is! AmaSessionDetailLoaded) return;

    // Check if the question already exists (duplicate)
    final exists = currentState.questions.any((q) => q.id == event.question.id);
    if (exists) {
      // Update existing question (could be an answer update)
      final updatedQuestions = currentState.questions.map((q) {
        if (q.id == event.question.id) return event.question;
        return q;
      }).toList();
      emit(currentState.copyWith(questions: updatedQuestions));
    } else {
      // Add new question
      final updatedQuestions = [...currentState.questions, event.question];
      emit(currentState.copyWith(questions: updatedQuestions));
    }
  }
}
