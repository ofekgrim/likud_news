import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../repositories/user_profile_repository.dart';

/// Uploads a local image file and sets it as the user's avatar.
@injectable
class UploadAndSetAvatar
    implements UseCase<AppUser, UploadAndSetAvatarParams> {
  final UserProfileRepository _repository;

  UploadAndSetAvatar(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(UploadAndSetAvatarParams params) {
    return _repository.uploadAndSetAvatar(filePath: params.filePath);
  }
}

class UploadAndSetAvatarParams extends Equatable {
  final String filePath;

  const UploadAndSetAvatarParams({required this.filePath});

  @override
  List<Object?> get props => [filePath];
}
