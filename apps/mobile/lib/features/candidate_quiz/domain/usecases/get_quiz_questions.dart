import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/quiz_question.dart';
import '../repositories/quiz_repository.dart';

/// Fetches all active quiz questions for a given election.
@injectable
class GetQuizQuestions
    implements UseCase<List<QuizQuestion>, GetQuizQuestionsParams> {
  final QuizRepository repository;

  GetQuizQuestions(this.repository);

  @override
  Future<Either<Failure, List<QuizQuestion>>> call(
    GetQuizQuestionsParams params,
  ) {
    return repository.getQuestions(params.electionId);
  }
}

/// Parameters for the [GetQuizQuestions] use case.
class GetQuizQuestionsParams extends Equatable {
  final String electionId;

  const GetQuizQuestionsParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
