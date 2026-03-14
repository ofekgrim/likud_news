import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../domain/repositories/user_profile_repository.dart';
import '../datasources/user_profile_remote_datasource.dart';

/// Concrete implementation of [UserProfileRepository].
///
/// Wraps remote data source calls with error handling,
/// mapping [DioException] to domain [Failure] types.
@LazySingleton(as: UserProfileRepository)
class UserProfileRepositoryImpl implements UserProfileRepository {
  final UserProfileRemoteDataSource _remoteDataSource;

  UserProfileRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, AppUser>> getProfile() async {
    try {
      final model = await _remoteDataSource.getProfile();
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> updateProfile({
    String? displayName,
    String? bio,
    String? phone,
    String? email,
    List<String>? preferredCategories,
    Map<String, dynamic>? notificationPrefs,
  }) async {
    try {
      final model = await _remoteDataSource.updateProfile(
        displayName: displayName,
        bio: bio,
        phone: phone,
        email: email,
        preferredCategories: preferredCategories,
        notificationPrefs: notificationPrefs,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> uploadAndSetAvatar({
    required String filePath,
  }) async {
    try {
      final url = await _remoteDataSource.uploadAvatarFile(filePath);
      final model = await _remoteDataSource.updateAvatar(avatarUrl: url);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> updateAvatar({
    required String avatarUrl,
  }) async {
    try {
      final model = await _remoteDataSource.updateAvatar(
        avatarUrl: avatarUrl,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _remoteDataSource.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> requestMembershipVerification({
    required String membershipId,
    String? fullName,
  }) async {
    try {
      final model = await _remoteDataSource.requestMembershipVerification(
        membershipId: membershipId,
        fullName: fullName,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> getReferralCode() async {
    try {
      final data = await _remoteDataSource.getReferralCode();
      return Right(data);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> claimReferralCode(String code) async {
    try {
      await _remoteDataSource.claimReferralCode(code);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  /// Maps a [DioException] to the appropriate domain [Failure].
  Failure _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return const NetworkFailure();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        if (statusCode == 401) {
          return const UnauthorizedFailure();
        }
        final message = e.response?.data is Map<String, dynamic>
            ? (e.response!.data as Map<String, dynamic>)['message'] as String?
            : null;
        return ServerFailure(
          message: message ?? 'Server error',
          statusCode: statusCode,
        );
      default:
        return ServerFailure(message: e.message ?? 'Unexpected error');
    }
  }
}
