import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/candidate.dart';
import '../repositories/candidates_repository.dart';

/// Fetches all active candidates for a given election.
@injectable
class GetCandidatesByElection
    implements UseCase<List<Candidate>, CandidatesByElectionParams> {
  final CandidatesRepository repository;

  GetCandidatesByElection(this.repository);

  @override
  Future<Either<Failure, List<Candidate>>> call(
    CandidatesByElectionParams params,
  ) {
    return repository.getCandidatesByElection(params.electionId);
  }
}

/// Parameters for the [GetCandidatesByElection] use case.
class CandidatesByElectionParams extends Equatable {
  final String electionId;

  const CandidatesByElectionParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
