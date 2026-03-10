import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/candidates_repository.dart';

/// Removes the current user's endorsement for a given election.
@injectable
class RemoveEndorsement
    implements UseCase<void, RemoveEndorsementParams> {
  final CandidatesRepository repository;

  RemoveEndorsement(this.repository);

  @override
  Future<Either<Failure, void>> call(RemoveEndorsementParams params) {
    return repository.removeEndorsement(params.electionId);
  }
}

/// Parameters for the [RemoveEndorsement] use case.
class RemoveEndorsementParams extends Equatable {
  final String electionId;

  const RemoveEndorsementParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
