import 'package:equatable/equatable.dart';

/// Immutable entity representing a user's streak state.
class UserStreak extends Equatable {
  final int currentStreak;
  final int longestStreak;
  final int freezeTokens;
  final int freezeTokensUsed;
  final int tier;
  final String tierName;
  final bool atRisk;
  final bool activityDoneToday;
  final DateTime? lastActivityDate;
  final List<StreakMilestone> milestones;

  const UserStreak({
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.freezeTokens = 0,
    this.freezeTokensUsed = 0,
    this.tier = 0,
    this.tierName = '',
    this.atRisk = false,
    this.activityDoneToday = false,
    this.lastActivityDate,
    this.milestones = const [],
  });

  @override
  List<Object?> get props => [
        currentStreak,
        longestStreak,
        freezeTokens,
        freezeTokensUsed,
        tier,
        tierName,
        atRisk,
        activityDoneToday,
        lastActivityDate,
        milestones,
      ];
}

/// Immutable entity representing a streak milestone.
class StreakMilestone extends Equatable {
  final int days;
  final int bonusPoints;
  final bool earned;
  final DateTime? earnedAt;

  const StreakMilestone({
    required this.days,
    this.bonusPoints = 0,
    this.earned = false,
    this.earnedAt,
  });

  @override
  List<Object?> get props => [days, bonusPoints, earned, earnedAt];
}
