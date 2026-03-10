import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/app_user.dart';
import '../entities/auth_tokens.dart';

abstract class AuthRepository {
  Future<Either<Failure, void>> requestOtp({required String phone});

  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> verifyOtp({
    required String phone,
    required String code,
    required String deviceId,
    String? platform,
  });

  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> registerEmail({
    required String email,
    required String password,
    required String deviceId,
    String? displayName,
    String? phone,
    String? platform,
  });

  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> loginEmail({
    required String email,
    required String password,
    required String deviceId,
    String? platform,
  });

  Future<Either<Failure, AuthTokens>> refreshTokens({
    required String refreshToken,
    required String deviceId,
  });

  Future<Either<Failure, void>> logout({required String deviceId});

  Future<Either<Failure, AppUser>> getProfile();

  Future<Either<Failure, void>> migrateDeviceData({
    required String oldDeviceId,
  });

  // Phone/Email change verification
  Future<Either<Failure, void>> requestPhoneChange({required String phone});
  Future<Either<Failure, AppUser>> verifyPhoneChange({
    required String phone,
    required String code,
  });
  Future<Either<Failure, void>> requestEmailChange({
    required String email,
    required String currentPassword,
  });
  Future<Either<Failure, AppUser>> verifyEmailChange({
    required String email,
    required String code,
  });

  Future<Either<Failure, void>> deleteAccount({required String password});
}
