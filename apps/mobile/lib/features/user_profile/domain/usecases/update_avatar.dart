import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../repositories/user_profile_repository.dart';

/// Updates the authenticated user's avatar image URL.
@injectable
class UpdateAvatar implements UseCase<AppUser, UpdateAvatarParams> {
  final UserProfileRepository _repository;

  UpdateAvatar(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(UpdateAvatarParams params) {
    return _repository.updateAvatar(avatarUrl: params.avatarUrl);
  }
}

class UpdateAvatarParams extends Equatable {
  final String avatarUrl;

  const UpdateAvatarParams({required this.avatarUrl});

  @override
  List<Object?> get props => [avatarUrl];
}
