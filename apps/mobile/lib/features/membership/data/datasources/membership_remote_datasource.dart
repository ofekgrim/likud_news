import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/membership_info_model.dart';
import '../models/voting_eligibility_model.dart';

/// Contract for the membership feature remote data source.
abstract class MembershipRemoteDataSource {
  /// Fetches the current user's membership info from the API.
  ///
  /// Uses GET /app-users/me and extracts membership-related fields.
  /// Throws a [DioException] on failure.
  Future<MembershipInfoModel> getMembershipInfo();

  /// Submits a membership verification request.
  ///
  /// Uses POST /app-users/me/verify-membership.
  /// Throws a [DioException] on failure.
  Future<MembershipInfoModel> verifyMembership({
    required String membershipId,
    required String fullName,
  });

  /// Checks the user's voting eligibility for the active election.
  ///
  /// Uses GET /elections to find the active election and determine
  /// eligibility.
  /// Throws a [DioException] on failure.
  Future<VotingEligibilityModel> checkVotingEligibility();
}

/// Implementation of [MembershipRemoteDataSource] using [ApiClient].
@LazySingleton(as: MembershipRemoteDataSource)
class MembershipRemoteDataSourceImpl implements MembershipRemoteDataSource {
  final ApiClient _apiClient;

  MembershipRemoteDataSourceImpl(this._apiClient);

  @override
  Future<MembershipInfoModel> getMembershipInfo() async {
    final response = await _apiClient.get(ApiConstants.appUsersMe);
    final data = response.data as Map<String, dynamic>;
    final userJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return MembershipInfoModel.fromJson(userJson);
  }

  @override
  Future<MembershipInfoModel> verifyMembership({
    required String membershipId,
    required String fullName,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.appUsersMeVerifyMembership,
      data: {
        'membershipId': membershipId,
        'fullName': fullName,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final userJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return MembershipInfoModel.fromJson(userJson);
  }

  @override
  Future<VotingEligibilityModel> checkVotingEligibility() async {
    final response = await _apiClient.get(
      ApiConstants.elections,
      queryParameters: {'status': 'active'},
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data is List<dynamic>
                ? data
                : [];

    // If there are active elections, use the first one to determine eligibility.
    if (items.isNotEmpty) {
      final electionJson = items.first as Map<String, dynamic>;
      return VotingEligibilityModel.fromJson(electionJson);
    }

    // No active elections — user is not eligible by default.
    return const VotingEligibilityModel(
      isEligible: false,
      reason: 'No active elections',
    );
  }
}
