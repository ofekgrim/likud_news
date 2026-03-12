import 'package:equatable/equatable.dart';

import 'daily_mission.dart';

/// Immutable entity representing a summary of today's daily missions.
class DailyMissionsSummary extends Equatable {
  final List<DailyMission> missions;
  final DateTime date;
  final bool allCompleted;
  final int bonusPoints;
  final int totalPointsEarned;

  const DailyMissionsSummary({
    required this.missions,
    required this.date,
    this.allCompleted = false,
    this.bonusPoints = 0,
    this.totalPointsEarned = 0,
  });

  DailyMissionsSummary copyWith({
    List<DailyMission>? missions,
    DateTime? date,
    bool? allCompleted,
    int? bonusPoints,
    int? totalPointsEarned,
  }) {
    return DailyMissionsSummary(
      missions: missions ?? this.missions,
      date: date ?? this.date,
      allCompleted: allCompleted ?? this.allCompleted,
      bonusPoints: bonusPoints ?? this.bonusPoints,
      totalPointsEarned: totalPointsEarned ?? this.totalPointsEarned,
    );
  }

  @override
  List<Object?> get props => [
        missions,
        date,
        allCompleted,
        bonusPoints,
        totalPointsEarned,
      ];
}
