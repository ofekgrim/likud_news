import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/endorsement.dart';
import '../repositories/candidates_repository.dart';

/// Fetches the current user's endorsement for a given election, if any.
@injectable
class GetMyEndorsement
    implements UseCase<Endorsement?, GetMyEndorsementParams> {
  final CandidatesRepository repository;

  GetMyEndorsement(this.repository);

  @override
  Future<Either<Failure, Endorsement?>> call(GetMyEndorsementParams params) {
    return repository.getMyEndorsement(params.electionId);
  }
}

/// Parameters for the [GetMyEndorsement] use case.
class GetMyEndorsementParams extends Equatable {
  final String electionId;

  const GetMyEndorsementParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
