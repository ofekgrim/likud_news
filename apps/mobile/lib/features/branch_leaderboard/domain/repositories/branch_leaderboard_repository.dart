import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/branch_leaderboard.dart';

/// Abstract contract for the branch leaderboard data operations.
///
/// Implemented by [BranchLeaderboardRepositoryImpl] in the data layer.
abstract class BranchLeaderboardRepository {
  /// Fetches the branch leaderboard for the given period.
  ///
  /// [period] is one of: `current`, `previous`, `all_time`.
  /// [limit] controls how many branches to return.
  Future<Either<Failure, BranchLeaderboard>> getBranchLeaderboard({
    String? period,
    int? limit,
  });

  /// Fetches the national leaderboard (aggregate across all districts).
  Future<Either<Failure, BranchLeaderboard>> getNationalLeaderboard();
}
