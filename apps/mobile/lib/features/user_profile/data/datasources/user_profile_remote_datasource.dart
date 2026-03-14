import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/secure_storage_service.dart';
import '../../../auth/data/models/app_user_model.dart';

/// Contract for the user profile remote data source.
abstract class UserProfileRemoteDataSource {
  /// Fetches the authenticated user's profile.
  ///
  /// Throws a [DioException] on failure.
  Future<AppUserModel> getProfile();

  /// Updates the user's profile fields.
  ///
  /// Only non-null fields are sent in the request body.
  /// Throws a [DioException] on failure.
  Future<AppUserModel> updateProfile({
    String? displayName,
    String? bio,
    String? phone,
    String? email,
    List<String>? preferredCategories,
    Map<String, dynamic>? notificationPrefs,
  });

  /// Updates the user's avatar URL.
  ///
  /// Throws a [DioException] on failure.
  Future<AppUserModel> updateAvatar({required String avatarUrl});

  /// Uploads a local image file and returns the URL.
  ///
  /// Throws a [DioException] on failure.
  Future<String> uploadAvatarFile(String filePath);

  /// Changes the user's password.
  ///
  /// Throws a [DioException] on failure.
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  });

  /// Requests membership verification.
  ///
  /// Throws a [DioException] on failure.
  Future<AppUserModel> requestMembershipVerification({
    required String membershipId,
    String? fullName,
  });

  /// Gets or generates the user's referral code.
  Future<Map<String, dynamic>> getReferralCode();

  /// Claims a referral code on behalf of the current user.
  Future<void> claimReferralCode(String code);
}

/// Implementation of [UserProfileRemoteDataSource] using [ApiClient].
@LazySingleton(as: UserProfileRemoteDataSource)
class UserProfileRemoteDataSourceImpl implements UserProfileRemoteDataSource {
  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;

  UserProfileRemoteDataSourceImpl(this._apiClient, this._secureStorage);

  /// Retrieves the stored access token or throws if unavailable.
  Future<Options> _authOptions() async {
    final accessToken = await _secureStorage.getAccessToken();
    return Options(
      headers: {
        if (accessToken != null) 'Authorization': 'Bearer $accessToken',
      },
    );
  }

  @override
  Future<AppUserModel> getProfile() async {
    final options = await _authOptions();
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      ApiConstants.appUsersMe,
      options: options,
    );
    final data = response.data ?? <String, dynamic>{};
    return AppUserModel.fromJson(data);
  }

  @override
  Future<AppUserModel> updateProfile({
    String? displayName,
    String? bio,
    String? phone,
    String? email,
    List<String>? preferredCategories,
    Map<String, dynamic>? notificationPrefs,
  }) async {
    final options = await _authOptions();
    final body = <String, dynamic>{};
    if (displayName != null) body['displayName'] = displayName;
    if (bio != null) body['bio'] = bio;
    if (phone != null) body['phone'] = phone;
    if (email != null) body['email'] = email;
    if (preferredCategories != null) {
      body['preferredCategories'] = preferredCategories;
    }
    if (notificationPrefs != null) {
      body['notificationPrefs'] = notificationPrefs;
    }

    final response = await _apiClient.dio.put<Map<String, dynamic>>(
      ApiConstants.appUsersMe,
      data: body,
      options: options,
    );
    final data = response.data ?? <String, dynamic>{};
    return AppUserModel.fromJson(data);
  }

  @override
  Future<AppUserModel> updateAvatar({required String avatarUrl}) async {
    final options = await _authOptions();
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      ApiConstants.appUsersMeAvatar,
      data: {'avatarUrl': avatarUrl},
      options: options,
    );
    final data = response.data ?? <String, dynamic>{};
    return AppUserModel.fromJson(data);
  }

  @override
  Future<AppUserModel> requestMembershipVerification({
    required String membershipId,
    String? fullName,
  }) async {
    final options = await _authOptions();
    final body = <String, dynamic>{
      'membershipId': membershipId,
    };
    if (fullName != null) body['fullName'] = fullName;

    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      ApiConstants.appUsersMeVerifyMembership,
      data: body,
      options: options,
    );
    final data = response.data ?? <String, dynamic>{};
    return AppUserModel.fromJson(data);
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final options = await _authOptions();
    await _apiClient.dio.post<Map<String, dynamic>>(
      ApiConstants.appUsersMeChangePassword,
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
      options: options,
    );
  }

  @override
  Future<String> uploadAvatarFile(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });

    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      ApiConstants.mediaUpload,
      data: formData,
    );
    final data = response.data ?? <String, dynamic>{};
    return data['url'] as String;
  }

  @override
  Future<Map<String, dynamic>> getReferralCode() async {
    final options = await _authOptions();
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      ApiConstants.appUsersMeReferralCode,
      options: options,
    );
    return response.data ?? <String, dynamic>{};
  }

  @override
  Future<void> claimReferralCode(String code) async {
    final options = await _authOptions();
    await _apiClient.dio.post<void>(
      ApiConstants.appUsersMeClaimReferral,
      data: {'code': code},
      options: options,
    );
  }
}
