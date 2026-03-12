import '../../domain/entities/subscription_info.dart';
import '../../domain/entities/vip_benefit.dart';

/// Data model for subscription info, handles JSON serialization.
///
/// Maps API responses from `/subscriptions/me` to the domain
/// [SubscriptionInfo] entity via [toEntity].
class SubscriptionInfoModel {
  final String? id;
  final SubscriptionTier tier;
  final SubscriptionStatus status;
  final DateTime? expiresAt;
  final DateTime? cancelledAt;
  final List<VipBenefitModel> benefits;

  const SubscriptionInfoModel({
    this.id,
    this.tier = SubscriptionTier.vipMonthly,
    this.status = SubscriptionStatus.expired,
    this.expiresAt,
    this.cancelledAt,
    this.benefits = const [],
  });

  /// Creates a [SubscriptionInfoModel] from a JSON map.
  ///
  /// Handles both `{data: {...}}` wrapper and raw `{...}` responses.
  factory SubscriptionInfoModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const SubscriptionInfoModel();
    }

    final data = json.containsKey('data') && json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;

    return SubscriptionInfoModel(
      id: data['id'] as String?,
      tier: SubscriptionTier.fromString(data['tier'] as String?),
      status: SubscriptionStatus.fromString(data['status'] as String?),
      expiresAt: data['expiresAt'] != null
          ? DateTime.tryParse(data['expiresAt'] as String)
          : null,
      cancelledAt: data['cancelledAt'] != null
          ? DateTime.tryParse(data['cancelledAt'] as String)
          : null,
    );
  }

  /// Creates a [SubscriptionInfoModel] with benefits from a separate response.
  SubscriptionInfoModel withBenefits(List<VipBenefitModel> newBenefits) {
    return SubscriptionInfoModel(
      id: id,
      tier: tier,
      status: status,
      expiresAt: expiresAt,
      cancelledAt: cancelledAt,
      benefits: newBenefits,
    );
  }

  SubscriptionInfo toEntity() {
    return SubscriptionInfo(
      id: id,
      tier: tier,
      status: status,
      expiresAt: expiresAt,
      cancelledAt: cancelledAt,
      benefits: benefits.map((b) => b.toEntity()).toList(),
    );
  }
}

/// Data model for a VIP benefit item.
class VipBenefitModel {
  final String id;
  final String titleKey;
  final String descriptionKey;
  final String icon;

  const VipBenefitModel({
    required this.id,
    required this.titleKey,
    required this.descriptionKey,
    required this.icon,
  });

  factory VipBenefitModel.fromJson(Map<String, dynamic> json) {
    return VipBenefitModel(
      id: json['id'] as String? ?? '',
      titleKey: json['titleKey'] as String? ?? '',
      descriptionKey: json['descriptionKey'] as String? ?? '',
      icon: json['icon'] as String? ?? '',
    );
  }

  VipBenefit toEntity() {
    return VipBenefit(
      id: id,
      titleKey: titleKey,
      descriptionKey: descriptionKey,
      icon: icon,
    );
  }
}
