import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/subscription_info.dart';
import '../repositories/premium_repository.dart';

/// Fetches the current user's premium subscription information.
@injectable
class GetSubscription implements UseCase<SubscriptionInfo?, NoParams> {
  final PremiumRepository repository;

  GetSubscription(this.repository);

  @override
  Future<Either<Failure, SubscriptionInfo?>> call(NoParams params) {
    return repository.getSubscription();
  }
}
