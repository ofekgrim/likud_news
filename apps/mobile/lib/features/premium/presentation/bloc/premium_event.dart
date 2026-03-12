import 'package:equatable/equatable.dart';

/// Base class for all Premium BLoC events.
sealed class PremiumEvent extends Equatable {
  const PremiumEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of the user's subscription info and benefits.
final class LoadSubscription extends PremiumEvent {
  const LoadSubscription();
}

/// Cancels the user's current active subscription.
final class CancelSubscription extends PremiumEvent {
  const CancelSubscription();
}
