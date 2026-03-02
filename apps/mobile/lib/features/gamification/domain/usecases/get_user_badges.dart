import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user_badge.dart';
import '../repositories/gamification_repository.dart';

/// Fetches the authenticated user's earned badges.
@injectable
class GetUserBadges implements UseCase<List<UserBadge>, NoParams> {
  final GamificationRepository repository;

  GetUserBadges(this.repository);

  @override
  Future<Either<Failure, List<UserBadge>>> call(NoParams params) {
    return repository.getUserBadges();
  }
}
