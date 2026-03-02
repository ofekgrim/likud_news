import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/membership_info.dart';
import '../repositories/membership_repository.dart';

/// Fetches the current user's membership information.
@injectable
class GetMembershipInfo implements UseCase<MembershipInfo, NoParams> {
  final MembershipRepository repository;

  GetMembershipInfo(this.repository);

  @override
  Future<Either<Failure, MembershipInfo>> call(NoParams params) {
    return repository.getMembershipInfo();
  }
}
