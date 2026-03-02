import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/app_user_model.dart';
import '../models/auth_tokens_model.dart';

abstract class AuthRemoteDataSource {
  Future<void> requestOtp({required String phone});

  Future<({AppUserModel user, AuthTokensModel tokens})> verifyOtp({
    required String phone,
    required String code,
    required String deviceId,
    String? platform,
  });

  Future<({AppUserModel user, AuthTokensModel tokens})> registerEmail({
    required String email,
    required String password,
    required String deviceId,
    String? displayName,
    String? phone,
    String? platform,
  });

  Future<({AppUserModel user, AuthTokensModel tokens})> loginEmail({
    required String email,
    required String password,
    required String deviceId,
    String? platform,
  });

  Future<AuthTokensModel> refreshTokens({
    required String refreshToken,
    required String deviceId,
  });

  Future<void> logout({
    required String accessToken,
    required String deviceId,
  });

  Future<AppUserModel> getProfile({required String accessToken});

  Future<void> migrateDeviceData({
    required String accessToken,
    required String oldDeviceId,
  });

  // Phone/Email change
  Future<void> requestPhoneChange({required String phone});
  Future<AppUserModel> verifyPhoneChange({
    required String phone,
    required String code,
  });
  Future<void> requestEmailChange({
    required String email,
    required String currentPassword,
  });
  Future<AppUserModel> verifyEmailChange({
    required String email,
    required String code,
  });

  Future<void> deleteAccount({required String password});
}

@LazySingleton(as: AuthRemoteDataSource)
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;

  AuthRemoteDataSourceImpl(this._apiClient);

  @override
  Future<void> requestOtp({required String phone}) async {
    await _apiClient.post(
      ApiConstants.appAuthOtpRequest,
      data: {'phone': phone},
    );
  }

  @override
  Future<({AppUserModel user, AuthTokensModel tokens})> verifyOtp({
    required String phone,
    required String code,
    required String deviceId,
    String? platform,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appAuthOtpVerify,
      data: {
        'phone': phone,
        'code': code,
        'deviceId': deviceId,
        if (platform != null) 'platform': platform,
      },
    );
    return _parseAuthResponse(response.data);
  }

  @override
  Future<({AppUserModel user, AuthTokensModel tokens})> registerEmail({
    required String email,
    required String password,
    required String deviceId,
    String? displayName,
    String? phone,
    String? platform,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appAuthRegister,
      data: {
        'email': email,
        'password': password,
        'deviceId': deviceId,
        if (displayName != null) 'displayName': displayName,
        if (phone != null) 'phone': phone,
        if (platform != null) 'platform': platform,
      },
    );
    return _parseAuthResponse(response.data);
  }

  @override
  Future<({AppUserModel user, AuthTokensModel tokens})> loginEmail({
    required String email,
    required String password,
    required String deviceId,
    String? platform,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appAuthLogin,
      data: {
        'email': email,
        'password': password,
        'deviceId': deviceId,
        if (platform != null) 'platform': platform,
      },
    );
    return _parseAuthResponse(response.data);
  }

  @override
  Future<AuthTokensModel> refreshTokens({
    required String refreshToken,
    required String deviceId,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appAuthRefresh,
      data: {
        'refreshToken': refreshToken,
        'deviceId': deviceId,
      },
    );
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{};
    // The refresh endpoint returns { user, tokens } — extract tokens
    final tokensData = data['tokens'] as Map<String, dynamic>? ?? data;
    return AuthTokensModel.fromJson(tokensData);
  }

  @override
  Future<void> logout({
    required String accessToken,
    required String deviceId,
  }) async {
    await _apiClient.post(
      ApiConstants.appAuthLogout,
      data: {'deviceId': deviceId},
    );
  }

  @override
  Future<AppUserModel> getProfile({required String accessToken}) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      ApiConstants.appUsersMe,
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );
    final data = response.data ?? <String, dynamic>{};
    return AppUserModel.fromJson(data);
  }

  @override
  Future<void> migrateDeviceData({
    required String accessToken,
    required String oldDeviceId,
  }) async {
    await _apiClient.dio.post<void>(
      ApiConstants.appAuthMigrateDevice,
      data: {'oldDeviceId': oldDeviceId},
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );
  }

  // ── Phone/Email Change ─────────────────────────────────────────────

  @override
  Future<void> requestPhoneChange({required String phone}) async {
    await _apiClient.post(
      ApiConstants.appAuthPhoneChangeRequest,
      data: {'phone': phone},
    );
  }

  @override
  Future<AppUserModel> verifyPhoneChange({
    required String phone,
    required String code,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appAuthPhoneChangeVerify,
      data: {'phone': phone, 'code': code},
    );
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{};
    return AppUserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  @override
  Future<void> requestEmailChange({
    required String email,
    required String currentPassword,
  }) async {
    await _apiClient.post(
      ApiConstants.appAuthEmailChangeRequest,
      data: {'email': email, 'currentPassword': currentPassword},
    );
  }

  @override
  Future<AppUserModel> verifyEmailChange({
    required String email,
    required String code,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appAuthEmailChangeVerify,
      data: {'email': email, 'code': code},
    );
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{};
    return AppUserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  @override
  Future<void> deleteAccount({required String password}) async {
    await _apiClient.post<void>(
      ApiConstants.deleteAccount,
      data: {'password': password},
    );
  }

  ({AppUserModel user, AuthTokensModel tokens}) _parseAuthResponse(
    dynamic rawData,
  ) {
    final data = rawData is Map<String, dynamic>
        ? rawData
        : <String, dynamic>{};
    final user = AppUserModel.fromJson(data['user'] as Map<String, dynamic>);
    final tokens =
        AuthTokensModel.fromJson(data['tokens'] as Map<String, dynamic>);
    return (user: user, tokens: tokens);
  }
}
