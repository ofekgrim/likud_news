import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/tier_info.dart';
import '../repositories/gamification_repository.dart';

/// Fetches the authenticated user's tier progression info.
@injectable
class GetTierInfo implements UseCase<TierInfo, NoParams> {
  final GamificationRepository repository;

  GetTierInfo(this.repository);

  @override
  Future<Either<Failure, TierInfo>> call(NoParams params) {
    return repository.getTierInfo();
  }
}
