import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/quiz_election.dart';
import '../repositories/quiz_repository.dart';

/// Fetches all elections that have quizzes.
@injectable
class GetQuizElections implements UseCase<List<QuizElection>, NoParams> {
  final QuizRepository _repository;

  GetQuizElections(this._repository);

  @override
  Future<Either<Failure, List<QuizElection>>> call(NoParams params) {
    return _repository.getQuizElections();
  }
}
