import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/endorsement.dart';
import '../repositories/candidates_repository.dart';

/// Endorses a candidate in a given election.
@injectable
class EndorseCandidate
    implements UseCase<Endorsement, EndorseCandidateParams> {
  final CandidatesRepository repository;

  EndorseCandidate(this.repository);

  @override
  Future<Either<Failure, Endorsement>> call(EndorseCandidateParams params) {
    return repository.endorseCandidate(params.candidateId, params.electionId);
  }
}

/// Parameters for the [EndorseCandidate] use case.
class EndorseCandidateParams extends Equatable {
  final String candidateId;
  final String electionId;

  const EndorseCandidateParams({
    required this.candidateId,
    required this.electionId,
  });

  @override
  List<Object?> get props => [candidateId, electionId];
}
