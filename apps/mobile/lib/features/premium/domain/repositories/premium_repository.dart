import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/subscription_info.dart';

/// Abstract contract for the premium/subscription feature data operations.
///
/// Implemented by [PremiumRepositoryImpl] in the data layer.
abstract class PremiumRepository {
  /// Fetches the current user's subscription info (or null if none).
  Future<Either<Failure, SubscriptionInfo?>> getSubscription();

  /// Cancels the current user's active subscription.
  Future<Either<Failure, SubscriptionInfo>> cancelSubscription();
}
