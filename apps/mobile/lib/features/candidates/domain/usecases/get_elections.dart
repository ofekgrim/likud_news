import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/election.dart';
import '../repositories/candidates_repository.dart';

/// Fetches all active elections.
@injectable
class GetElections implements UseCase<List<Election>, NoParams> {
  final CandidatesRepository repository;

  GetElections(this.repository);

  @override
  Future<Either<Failure, List<Election>>> call(NoParams params) {
    return repository.getElections();
  }
}
