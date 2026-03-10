import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../auth/domain/entities/app_user.dart';

/// Abstract contract for user profile data operations.
///
/// Implemented by [UserProfileRepositoryImpl] in the data layer.
abstract class UserProfileRepository {
  /// Fetches the currently authenticated user's profile.
  Future<Either<Failure, AppUser>> getProfile();

  /// Updates the user's profile fields.
  ///
  /// Only non-null fields will be sent to the API.
  Future<Either<Failure, AppUser>> updateProfile({
    String? displayName,
    String? bio,
    String? phone,
    String? email,
    List<String>? preferredCategories,
    Map<String, dynamic>? notificationPrefs,
  });

  /// Updates the user's avatar image.
  ///
  /// [avatarUrl] is typically obtained after uploading to S3 via presigned URL.
  Future<Either<Failure, AppUser>> updateAvatar({
    required String avatarUrl,
  });

  /// Uploads a local image file and sets it as the user's avatar.
  Future<Either<Failure, AppUser>> uploadAndSetAvatar({
    required String filePath,
  });

  /// Changes the user's password.
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String newPassword,
  });

  /// Requests membership verification for the current user.
  ///
  /// [membershipId] is the Likud party membership card number.
  /// [fullName] is optionally provided for verification matching.
  Future<Either<Failure, AppUser>> requestMembershipVerification({
    required String membershipId,
    String? fullName,
  });
}
