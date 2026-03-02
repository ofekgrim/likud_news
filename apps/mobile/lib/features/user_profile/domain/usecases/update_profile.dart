import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../repositories/user_profile_repository.dart';

/// Updates the authenticated user's profile fields.
@injectable
class UpdateProfile implements UseCase<AppUser, UpdateProfileParams> {
  final UserProfileRepository _repository;

  UpdateProfile(this._repository);

  @override
  Future<Either<Failure, AppUser>> call(UpdateProfileParams params) {
    return _repository.updateProfile(
      displayName: params.displayName,
      bio: params.bio,
      phone: params.phone,
      email: params.email,
      preferredCategories: params.preferredCategories,
      notificationPrefs: params.notificationPrefs,
    );
  }
}

class UpdateProfileParams extends Equatable {
  final String? displayName;
  final String? bio;
  final String? phone;
  final String? email;
  final List<String>? preferredCategories;
  final Map<String, dynamic>? notificationPrefs;

  const UpdateProfileParams({
    this.displayName,
    this.bio,
    this.phone,
    this.email,
    this.preferredCategories,
    this.notificationPrefs,
  });

  @override
  List<Object?> get props => [
        displayName,
        bio,
        phone,
        email,
        preferredCategories,
        notificationPrefs,
      ];
}
