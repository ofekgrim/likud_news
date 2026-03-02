import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../repositories/user_profile_repository.dart';

/// Requests membership verification for the authenticated user.
@injectable
class RequestMembership
    implements UseCase<AppUser, RequestMembershipParams> {
  final UserProfileRepository _repository;

  RequestMembership(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(RequestMembershipParams params) {
    return _repository.requestMembershipVerification(
      membershipId: params.membershipId,
      fullName: params.fullName,
    );
  }
}

class RequestMembershipParams extends Equatable {
  final String membershipId;
  final String? fullName;

  const RequestMembershipParams({
    required this.membershipId,
    this.fullName,
  });

  @override
  List<Object?> get props => [membershipId, fullName];
}
