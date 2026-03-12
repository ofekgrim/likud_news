import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/subscription_info_model.dart';

/// Contract for the premium feature remote data source.
abstract class PremiumRemoteDataSource {
  /// Fetches the current user's subscription from the API.
  ///
  /// Uses GET /subscriptions/me.
  /// Returns null if no active subscription.
  /// Throws a [DioException] on failure.
  Future<SubscriptionInfoModel?> getSubscription();

  /// Fetches the list of VIP benefits from the API.
  ///
  /// Uses GET /subscriptions/benefits.
  /// Throws a [DioException] on failure.
  Future<List<VipBenefitModel>> getVipBenefits();

  /// Cancels the current user's active subscription.
  ///
  /// Uses POST /subscriptions/cancel.
  /// Throws a [DioException] on failure.
  Future<SubscriptionInfoModel> cancelSubscription();
}

/// Implementation of [PremiumRemoteDataSource] using [ApiClient].
@LazySingleton(as: PremiumRemoteDataSource)
class PremiumRemoteDataSourceImpl implements PremiumRemoteDataSource {
  final ApiClient _apiClient;

  PremiumRemoteDataSourceImpl(this._apiClient);

  @override
  Future<SubscriptionInfoModel?> getSubscription() async {
    final response = await _apiClient.get(ApiConstants.subscriptionsMe);
    final data = response.data as Map<String, dynamic>;
    final subData = data['data'];

    if (subData == null) {
      return null;
    }

    return SubscriptionInfoModel.fromJson(
      subData is Map<String, dynamic> ? subData : data,
    );
  }

  @override
  Future<List<VipBenefitModel>> getVipBenefits() async {
    final response = await _apiClient.get(ApiConstants.subscriptionsBenefits);
    final data = response.data as Map<String, dynamic>;
    final List<dynamic> items = data['data'] as List<dynamic>? ?? [];

    return items
        .map((e) => VipBenefitModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<SubscriptionInfoModel> cancelSubscription() async {
    final response = await _apiClient.post(ApiConstants.subscriptionsCancel);
    final data = response.data as Map<String, dynamic>;
    final subJson = data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data;
    return SubscriptionInfoModel.fromJson(subJson);
  }
}
