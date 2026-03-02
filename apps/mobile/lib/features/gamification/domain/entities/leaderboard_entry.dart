import 'package:equatable/equatable.dart';

/// Immutable entity representing a single row in the gamification leaderboard.
class LeaderboardEntry extends Equatable {
  final String userId;
  final String displayName;
  final String? avatarUrl;
  final int totalPoints;
  final int rank;

  const LeaderboardEntry({
    required this.userId,
    required this.displayName,
    this.avatarUrl,
    required this.totalPoints,
    required this.rank,
  });

  @override
  List<Object?> get props => [userId, displayName, avatarUrl, totalPoints, rank];
}
