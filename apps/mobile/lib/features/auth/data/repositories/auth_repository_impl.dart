import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/services/secure_storage_service.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/entities/auth_tokens.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final SecureStorageService _secureStorage;

  AuthRepositoryImpl(this._remoteDataSource, this._secureStorage);

  @override
  Future<Either<Failure, void>> requestOtp({required String phone}) async {
    try {
      await _remoteDataSource.requestOtp(phone: phone);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> verifyOtp({
    required String phone,
    required String code,
    required String deviceId,
    String? platform,
  }) async {
    try {
      final result = await _remoteDataSource.verifyOtp(
        phone: phone,
        code: code,
        deviceId: deviceId,
        platform: platform,
      );
      final user = result.user.toEntity();
      final tokens = result.tokens.toEntity();
      await _secureStorage.saveTokens(tokens);
      return Right((user: user, tokens: tokens));
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> registerEmail({
    required String email,
    required String password,
    required String deviceId,
    String? displayName,
    String? phone,
    String? platform,
  }) async {
    try {
      final result = await _remoteDataSource.registerEmail(
        email: email,
        password: password,
        deviceId: deviceId,
        displayName: displayName,
        phone: phone,
        platform: platform,
      );
      final user = result.user.toEntity();
      final tokens = result.tokens.toEntity();
      await _secureStorage.saveTokens(tokens);
      return Right((user: user, tokens: tokens));
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> loginEmail({
    required String email,
    required String password,
    required String deviceId,
    String? platform,
  }) async {
    try {
      final result = await _remoteDataSource.loginEmail(
        email: email,
        password: password,
        deviceId: deviceId,
        platform: platform,
      );
      final user = result.user.toEntity();
      final tokens = result.tokens.toEntity();
      await _secureStorage.saveTokens(tokens);
      return Right((user: user, tokens: tokens));
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AuthTokens>> refreshTokens({
    required String refreshToken,
    required String deviceId,
  }) async {
    try {
      final model = await _remoteDataSource.refreshTokens(
        refreshToken: refreshToken,
        deviceId: deviceId,
      );
      final tokens = model.toEntity();
      await _secureStorage.saveTokens(tokens);
      return Right(tokens);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout({required String deviceId}) async {
    try {
      final accessToken = await _secureStorage.getAccessToken();
      if (accessToken != null) {
        await _remoteDataSource.logout(
          accessToken: accessToken,
          deviceId: deviceId,
        );
      }
      await _secureStorage.clearTokens();
      return const Right(null);
    } on DioException catch (e) {
      // Clear tokens even if server logout fails
      await _secureStorage.clearTokens();
      return Left(_mapDioException(e));
    } catch (e) {
      await _secureStorage.clearTokens();
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> getProfile() async {
    try {
      final accessToken = await _secureStorage.getAccessToken();
      if (accessToken == null) {
        return const Left(UnauthorizedFailure());
      }
      final model = await _remoteDataSource.getProfile(
        accessToken: accessToken,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> migrateDeviceData({
    required String oldDeviceId,
  }) async {
    try {
      final accessToken = await _secureStorage.getAccessToken();
      if (accessToken == null) {
        return const Left(UnauthorizedFailure());
      }
      await _remoteDataSource.migrateDeviceData(
        accessToken: accessToken,
        oldDeviceId: oldDeviceId,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  // ── Phone/Email Change ─────────────────────────────────────────────

  @override
  Future<Either<Failure, void>> requestPhoneChange({
    required String phone,
  }) async {
    try {
      await _remoteDataSource.requestPhoneChange(phone: phone);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> verifyPhoneChange({
    required String phone,
    required String code,
  }) async {
    try {
      final model = await _remoteDataSource.verifyPhoneChange(
        phone: phone,
        code: code,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> requestEmailChange({
    required String email,
    required String currentPassword,
  }) async {
    try {
      await _remoteDataSource.requestEmailChange(
        email: email,
        currentPassword: currentPassword,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AppUser>> verifyEmailChange({
    required String email,
    required String code,
  }) async {
    try {
      final model = await _remoteDataSource.verifyEmailChange(
        email: email,
        code: code,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteAccount({required String password}) async {
    try {
      await _remoteDataSource.deleteAccount(password: password);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

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
        if (statusCode == 404) {
          final message = e.response?.data is Map<String, dynamic>
              ? (e.response!.data as Map<String, dynamic>)['message'] as String?
              : null;
          return NotFoundFailure(message: message ?? 'Not found');
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
