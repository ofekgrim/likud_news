import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user_streak.dart';
import '../repositories/gamification_repository.dart';

/// Uses a freeze token to protect the user's current streak.
@injectable
class UseStreakFreeze implements UseCase<UserStreak, NoParams> {
  final GamificationRepository repository;

  UseStreakFreeze(this.repository);

  @override
  Future<Either<Failure, UserStreak>> call(NoParams params) {
    return repository.useStreakFreeze();
  }
}
