import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/membership_info.dart';
import '../entities/voting_eligibility.dart';

/// Abstract contract for the membership feature data operations.
///
/// Implemented by [MembershipRepositoryImpl] in the data layer.
abstract class MembershipRepository {
  /// Fetches the current user's membership information.
  Future<Either<Failure, MembershipInfo>> getMembershipInfo();

  /// Submits a membership verification request.
  Future<Either<Failure, MembershipInfo>> verifyMembership({
    required String membershipId,
    required String fullName,
  });

  /// Checks the user's voting eligibility for upcoming elections.
  Future<Either<Failure, VotingEligibility>> checkVotingEligibility();
}
