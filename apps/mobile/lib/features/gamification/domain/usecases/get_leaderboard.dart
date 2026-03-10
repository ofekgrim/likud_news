import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/leaderboard_entry.dart';
import '../repositories/gamification_repository.dart';

/// Fetches the public gamification leaderboard.
@injectable
class GetLeaderboard implements UseCase<List<LeaderboardEntry>, LeaderboardParams> {
  final GamificationRepository repository;

  GetLeaderboard(this.repository);

  @override
  Future<Either<Failure, List<LeaderboardEntry>>> call(LeaderboardParams params) {
    return repository.getLeaderboard(
      period: params.period,
      page: params.page,
      limit: params.limit,
      district: params.district,
    );
  }
}

/// Parameters for the [GetLeaderboard] use case.
class LeaderboardParams extends Equatable {
  final String period;
  final int page;
  final int limit;
  final String? district;

  const LeaderboardParams({
    required this.period,
    this.page = 1,
    this.limit = 20,
    this.district,
  });

  @override
  List<Object?> get props => [period, page, limit, district];
}
