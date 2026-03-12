import 'package:equatable/equatable.dart';

/// Immutable entity representing turnout data for a branch (district).
///
/// Used in the branch competition leaderboard on Election Day.
class BranchTurnout extends Equatable {
  final String branchName;
  final double turnoutPct;
  final int rank;
  final bool isMyBranch;

  const BranchTurnout({
    required this.branchName,
    required this.turnoutPct,
    required this.rank,
    this.isMyBranch = false,
  });

  @override
  List<Object?> get props => [branchName, turnoutPct, rank, isMyBranch];
}
