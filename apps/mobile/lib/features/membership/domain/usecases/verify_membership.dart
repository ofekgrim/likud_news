import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/membership_info.dart';
import '../repositories/membership_repository.dart';

/// Submits a membership verification request with the user's
/// membership ID and full name.
@injectable
class VerifyMembership
    implements UseCase<MembershipInfo, VerifyMembershipParams> {
  final MembershipRepository repository;

  VerifyMembership(this.repository);

  @override
  Future<Either<Failure, MembershipInfo>> call(
    VerifyMembershipParams params,
  ) {
    return repository.verifyMembership(
      membershipId: params.membershipId,
      fullName: params.fullName,
    );
  }
}

/// Parameters for the [VerifyMembership] use case.
class VerifyMembershipParams extends Equatable {
  final String membershipId;
  final String fullName;

  const VerifyMembershipParams({
    required this.membershipId,
    required this.fullName,
  });

  @override
  List<Object?> get props => [membershipId, fullName];
}
