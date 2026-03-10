import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/quiz_election.dart';
import '../../domain/usecases/get_quiz_elections.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

sealed class QuizListEvent extends Equatable {
  const QuizListEvent();

  @override
  List<Object?> get props => [];
}

final class LoadQuizElections extends QuizListEvent {
  const LoadQuizElections();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

sealed class QuizListState extends Equatable {
  const QuizListState();

  @override
  List<Object?> get props => [];
}

final class QuizListInitial extends QuizListState {
  const QuizListInitial();
}

final class QuizListLoading extends QuizListState {
  const QuizListLoading();
}

final class QuizListLoaded extends QuizListState {
  final List<QuizElection> elections;

  const QuizListLoaded({required this.elections});

  @override
  List<Object?> get props => [elections];
}

final class QuizListError extends QuizListState {
  final String message;

  const QuizListError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

@injectable
class QuizListBloc extends Bloc<QuizListEvent, QuizListState> {
  final GetQuizElections _getQuizElections;

  QuizListBloc(this._getQuizElections) : super(const QuizListInitial()) {
    on<LoadQuizElections>(_onLoad);
  }

  Future<void> _onLoad(
    LoadQuizElections event,
    Emitter<QuizListState> emit,
  ) async {
    emit(const QuizListLoading());

    final result = await _getQuizElections(const NoParams());

    result.fold(
      (failure) => emit(QuizListError(
        message: failure.message ?? 'Failed to load quizzes',
      )),
      (elections) => emit(QuizListLoaded(elections: elections)),
    );
  }
}
