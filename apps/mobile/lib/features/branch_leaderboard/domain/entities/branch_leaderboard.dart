import 'package:equatable/equatable.dart';

import 'branch_weekly_score.dart';

/// Immutable entity representing the full branch leaderboard.
class BranchLeaderboard extends Equatable {
  final List<BranchWeeklyScore> scores;
  final DateTime weekStart;
  final String? myBranchId;
  final int? myBranchRank;

  const BranchLeaderboard({
    required this.scores,
    required this.weekStart,
    this.myBranchId,
    this.myBranchRank,
  });

  @override
  List<Object?> get props => [scores, weekStart, myBranchId, myBranchRank];
}
