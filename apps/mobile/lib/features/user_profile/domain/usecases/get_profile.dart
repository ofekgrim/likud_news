import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../repositories/user_profile_repository.dart';

/// Fetches the authenticated user's profile.
@injectable
class GetProfile implements UseCase<AppUser, NoParams> {
  final UserProfileRepository _repository;

  GetProfile(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(NoParams params) {
    return _repository.getProfile();
  }
}
