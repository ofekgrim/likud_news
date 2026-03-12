import 'package:equatable/equatable.dart';

import '../../domain/entities/subscription_info.dart';
import '../../domain/entities/vip_benefit.dart';

/// Base class for all Premium BLoC states.
sealed class PremiumState extends Equatable {
  const PremiumState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class PremiumInitial extends PremiumState {
  const PremiumInitial();
}

/// Data is being fetched.
final class PremiumLoading extends PremiumState {
  const PremiumLoading();
}

/// Subscription info and benefits loaded successfully.
final class PremiumLoaded extends PremiumState {
  final SubscriptionInfo? subscriptionInfo;
  final List<VipBenefit> benefits;

  const PremiumLoaded({
    this.subscriptionInfo,
    this.benefits = const [],
  });

  @override
  List<Object?> get props => [subscriptionInfo, benefits];

  /// Creates a copy with updated fields.
  PremiumLoaded copyWith({
    SubscriptionInfo? subscriptionInfo,
    List<VipBenefit>? benefits,
  }) {
    return PremiumLoaded(
      subscriptionInfo: subscriptionInfo ?? this.subscriptionInfo,
      benefits: benefits ?? this.benefits,
    );
  }
}

/// An error occurred while loading premium data.
final class PremiumError extends PremiumState {
  final String message;

  const PremiumError({required this.message});

  @override
  List<Object?> get props => [message];
}
