import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/quiz_answer.dart';
import '../entities/quiz_result.dart';
import '../repositories/quiz_repository.dart';

/// Submits the user's quiz answers and returns ranked candidate matches.
@injectable
class SubmitQuiz implements UseCase<List<CandidateMatch>, SubmitQuizParams> {
  final QuizRepository repository;

  SubmitQuiz(this.repository);

  @override
  Future<Either<Failure, List<CandidateMatch>>> call(
    SubmitQuizParams params,
  ) {
    return repository.submitQuiz(params.electionId, params.answers);
  }
}

/// Parameters for the [SubmitQuiz] use case.
class SubmitQuizParams extends Equatable {
  final String electionId;
  final List<QuizAnswer> answers;

  const SubmitQuizParams({
    required this.electionId,
    required this.answers,
  });

  @override
  List<Object?> get props => [electionId, answers];
}
