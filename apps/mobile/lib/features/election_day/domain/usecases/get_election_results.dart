import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/election_result.dart';
import '../repositories/election_day_repository.dart';

/// Fetches election results for a specific election.
@injectable
class GetElectionResults
    implements UseCase<List<ElectionResult>, ElectionResultsParams> {
  final ElectionDayRepository repository;

  GetElectionResults(this.repository);

  @override
  Future<Either<Failure, List<ElectionResult>>> call(
    ElectionResultsParams params,
  ) {
    return repository.getElectionResults(params.electionId);
  }
}

/// Parameters for the [GetElectionResults] use case.
class ElectionResultsParams extends Equatable {
  final String electionId;

  const ElectionResultsParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
