import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/branch_leaderboard.dart';
import '../repositories/branch_leaderboard_repository.dart';

/// Fetches the branch leaderboard for a given period.
@injectable
class GetBranchLeaderboard
    implements UseCase<BranchLeaderboard, BranchLeaderboardParams> {
  final BranchLeaderboardRepository repository;

  GetBranchLeaderboard(this.repository);

  @override
  Future<Either<Failure, BranchLeaderboard>> call(
    BranchLeaderboardParams params,
  ) {
    return repository.getBranchLeaderboard(
      period: params.period,
      limit: params.limit,
    );
  }
}

/// Parameters for the [GetBranchLeaderboard] use case.
class BranchLeaderboardParams extends Equatable {
  final String? period;
  final int? limit;

  const BranchLeaderboardParams({
    this.period,
    this.limit,
  });

  @override
  List<Object?> get props => [period, limit];
}
