import 'package:equatable/equatable.dart';

/// Immutable entity representing a branch's weekly score in the leaderboard.
class BranchWeeklyScore extends Equatable {
  final String branchId;
  final String branchName;
  final DateTime weekStart;
  final int totalScore;
  final double perCapitaScore;
  final int activeMemberCount;
  final int rank;
  final int prevRank;
  final Map<String, dynamic> scoreBreakdown;

  const BranchWeeklyScore({
    required this.branchId,
    required this.branchName,
    required this.weekStart,
    required this.totalScore,
    required this.perCapitaScore,
    required this.activeMemberCount,
    required this.rank,
    required this.prevRank,
    this.scoreBreakdown = const {},
  });

  /// Positive = moved up, negative = moved down, zero = no change.
  int get deltaRank => prevRank - rank;

  @override
  List<Object?> get props => [
        branchId,
        branchName,
        weekStart,
        totalScore,
        perCapitaScore,
        activeMemberCount,
        rank,
        prevRank,
        scoreBreakdown,
      ];
}
