import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/voting_eligibility.dart';
import '../repositories/membership_repository.dart';

/// Checks the current user's voting eligibility for upcoming elections.
@injectable
class CheckVotingEligibility implements UseCase<VotingEligibility, NoParams> {
  final MembershipRepository repository;

  CheckVotingEligibility(this.repository);

  @override
  Future<Either<Failure, VotingEligibility>> call(NoParams params) {
    return repository.checkVotingEligibility();
  }
}
