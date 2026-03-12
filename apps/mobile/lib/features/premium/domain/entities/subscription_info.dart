import 'package:equatable/equatable.dart';

import 'vip_benefit.dart';

/// Subscription tier options.
enum SubscriptionTier {
  vipMonthly,
  vipAnnual;

  /// Returns the API string representation.
  String get apiValue {
    switch (this) {
      case SubscriptionTier.vipMonthly:
        return 'vip_monthly';
      case SubscriptionTier.vipAnnual:
        return 'vip_annual';
    }
  }

  /// Parses from API string.
  static SubscriptionTier fromString(String? value) {
    switch (value) {
      case 'vip_annual':
        return SubscriptionTier.vipAnnual;
      case 'vip_monthly':
      default:
        return SubscriptionTier.vipMonthly;
    }
  }
}

/// Subscription status.
enum SubscriptionStatus {
  active,
  expired,
  cancelled,
  trial,
  gracePeriod;

  /// Parses from API string.
  static SubscriptionStatus fromString(String? value) {
    switch (value) {
      case 'active':
        return SubscriptionStatus.active;
      case 'expired':
        return SubscriptionStatus.expired;
      case 'cancelled':
        return SubscriptionStatus.cancelled;
      case 'trial':
        return SubscriptionStatus.trial;
      case 'grace_period':
        return SubscriptionStatus.gracePeriod;
      default:
        return SubscriptionStatus.expired;
    }
  }

  /// Whether this status grants VIP access.
  bool get isVip =>
      this == SubscriptionStatus.active ||
      this == SubscriptionStatus.gracePeriod ||
      this == SubscriptionStatus.trial;
}

/// Immutable subscription info entity.
class SubscriptionInfo extends Equatable {
  final String? id;
  final SubscriptionTier tier;
  final SubscriptionStatus status;
  final DateTime? expiresAt;
  final DateTime? cancelledAt;
  final List<VipBenefit> benefits;

  const SubscriptionInfo({
    this.id,
    this.tier = SubscriptionTier.vipMonthly,
    this.status = SubscriptionStatus.expired,
    this.expiresAt,
    this.cancelledAt,
    this.benefits = const [],
  });

  /// Whether the user currently has VIP access.
  bool get isVip => status.isVip;

  @override
  List<Object?> get props => [id, tier, status, expiresAt, cancelledAt, benefits];
}
