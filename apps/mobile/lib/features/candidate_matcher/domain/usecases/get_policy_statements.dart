import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/policy_statement.dart';
import '../repositories/candidate_matcher_repository.dart';

/// Fetches policy statements for a given election.
@injectable
class GetPolicyStatements
    implements UseCase<List<PolicyStatement>, GetPolicyStatementsParams> {
  final CandidateMatcherRepository repository;

  GetPolicyStatements(this.repository);

  @override
  Future<Either<Failure, List<PolicyStatement>>> call(
    GetPolicyStatementsParams params,
  ) {
    return repository.getStatements(params.electionId);
  }
}

/// Parameters for [GetPolicyStatements].
class GetPolicyStatementsParams extends Equatable {
  final String electionId;

  const GetPolicyStatementsParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
