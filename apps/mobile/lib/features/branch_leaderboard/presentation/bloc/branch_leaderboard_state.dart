import 'package:equatable/equatable.dart';

import '../../domain/entities/branch_leaderboard.dart';

/// Base class for all BranchLeaderboard BLoC states.
sealed class BranchLeaderboardState extends Equatable {
  const BranchLeaderboardState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class BranchLeaderboardInitial extends BranchLeaderboardState {
  const BranchLeaderboardInitial();
}

/// Data is being fetched.
final class BranchLeaderboardLoading extends BranchLeaderboardState {
  const BranchLeaderboardLoading();
}

/// Data loaded successfully.
final class BranchLeaderboardLoaded extends BranchLeaderboardState {
  final BranchLeaderboard leaderboard;
  final String currentPeriod;

  const BranchLeaderboardLoaded({
    required this.leaderboard,
    this.currentPeriod = 'current',
  });

  /// Creates a copy with optional overrides.
  BranchLeaderboardLoaded copyWith({
    BranchLeaderboard? leaderboard,
    String? currentPeriod,
  }) {
    return BranchLeaderboardLoaded(
      leaderboard: leaderboard ?? this.leaderboard,
      currentPeriod: currentPeriod ?? this.currentPeriod,
    );
  }

  @override
  List<Object?> get props => [leaderboard, currentPeriod];
}

/// An error occurred while loading leaderboard data.
final class BranchLeaderboardError extends BranchLeaderboardState {
  final String message;

  const BranchLeaderboardError({required this.message});

  @override
  List<Object?> get props => [message];
}
