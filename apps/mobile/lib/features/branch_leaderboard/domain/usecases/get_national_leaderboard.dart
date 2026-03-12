import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/branch_leaderboard.dart';
import '../repositories/branch_leaderboard_repository.dart';

/// Fetches the national leaderboard (aggregate across all districts).
@injectable
class GetNationalLeaderboard
    implements UseCase<BranchLeaderboard, NoParams> {
  final BranchLeaderboardRepository repository;

  GetNationalLeaderboard(this.repository);

  @override
  Future<Either<Failure, BranchLeaderboard>> call(NoParams params) {
    return repository.getNationalLeaderboard();
  }
}
