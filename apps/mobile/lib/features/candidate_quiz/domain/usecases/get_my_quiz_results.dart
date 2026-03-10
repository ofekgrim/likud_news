import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/quiz_result.dart';
import '../repositories/quiz_repository.dart';

/// Fetches the user's existing quiz results for a given election.
///
/// Returns `null` inside [Right] if the user has not yet taken the quiz.
@injectable
class GetMyQuizResults
    implements UseCase<QuizResult?, GetMyQuizResultsParams> {
  final QuizRepository repository;

  GetMyQuizResults(this.repository);

  @override
  Future<Either<Failure, QuizResult?>> call(
    GetMyQuizResultsParams params,
  ) {
    return repository.getMyResults(params.electionId);
  }
}

/// Parameters for the [GetMyQuizResults] use case.
class GetMyQuizResultsParams extends Equatable {
  final String electionId;

  const GetMyQuizResultsParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
