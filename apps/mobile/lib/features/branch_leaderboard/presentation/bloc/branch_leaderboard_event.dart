import 'package:equatable/equatable.dart';

/// Base class for all BranchLeaderboard BLoC events.
sealed class BranchLeaderboardEvent extends Equatable {
  const BranchLeaderboardEvent();

  @override
  List<Object?> get props => [];
}

/// Loads the branch leaderboard for the given period.
final class LoadBranchLeaderboard extends BranchLeaderboardEvent {
  final String? period;

  const LoadBranchLeaderboard({this.period});

  @override
  List<Object?> get props => [period];
}

/// Loads the national leaderboard.
final class LoadNationalLeaderboard extends BranchLeaderboardEvent {
  const LoadNationalLeaderboard();
}

/// Changes the time period filter and reloads the leaderboard.
final class ChangePeriod extends BranchLeaderboardEvent {
  final String period;

  const ChangePeriod(this.period);

  @override
  List<Object?> get props => [period];
}
