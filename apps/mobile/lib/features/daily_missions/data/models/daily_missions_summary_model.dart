import '../../domain/entities/daily_missions_summary.dart';
import 'daily_mission_model.dart';

/// Data model for the daily missions summary, handles JSON serialization.
///
/// Maps API responses to the domain [DailyMissionsSummary] entity via [toEntity].
class DailyMissionsSummaryModel {
  final List<DailyMissionModel> missions;
  final DateTime date;
  final bool allCompleted;
  final int bonusPoints;
  final int totalPointsEarned;

  const DailyMissionsSummaryModel({
    required this.missions,
    required this.date,
    this.allCompleted = false,
    this.bonusPoints = 0,
    this.totalPointsEarned = 0,
  });

  factory DailyMissionsSummaryModel.fromJson(Map<String, dynamic> json) {
    final missionsRaw = json['missions'] as List<dynamic>? ?? [];
    return DailyMissionsSummaryModel(
      missions: missionsRaw
          .map((m) => DailyMissionModel.fromJson(m as Map<String, dynamic>))
          .toList(),
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : DateTime.now(),
      allCompleted: json['allCompleted'] as bool? ?? false,
      bonusPoints: json['bonusPoints'] as int? ?? 0,
      totalPointsEarned: json['totalPointsEarned'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'missions': missions.map((m) => m.toJson()).toList(),
      'date': date.toIso8601String(),
      'allCompleted': allCompleted,
      'bonusPoints': bonusPoints,
      'totalPointsEarned': totalPointsEarned,
    };
  }

  DailyMissionsSummary toEntity() {
    return DailyMissionsSummary(
      missions: missions.map((m) => m.toEntity()).toList(),
      date: date,
      allCompleted: allCompleted,
      bonusPoints: bonusPoints,
      totalPointsEarned: totalPointsEarned,
    );
  }
}
