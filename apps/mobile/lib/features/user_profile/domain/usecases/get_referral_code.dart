import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../repositories/user_profile_repository.dart';

@lazySingleton
class GetReferralCode {
  final UserProfileRepository _repository;

  GetReferralCode(this._repository);

  Future<Either<Failure, Map<String, dynamic>>> call() {
    return _repository.getReferralCode();
  }
}
