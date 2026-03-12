import '../../domain/entities/daily_mission.dart';

/// Data model for daily mission entries, handles JSON serialization.
///
/// Maps API responses to the domain [DailyMission] entity via [toEntity].
class DailyMissionModel {
  final String id;
  final String type;
  final String descriptionHe;
  final String descriptionEn;
  final int points;
  final bool isCompleted;
  final DateTime? completedAt;
  final double progress;
  final int targetCount;
  final int currentCount;

  const DailyMissionModel({
    required this.id,
    required this.type,
    required this.descriptionHe,
    required this.descriptionEn,
    required this.points,
    this.isCompleted = false,
    this.completedAt,
    this.progress = 0.0,
    this.targetCount = 1,
    this.currentCount = 0,
  });

  factory DailyMissionModel.fromJson(Map<String, dynamic> json) {
    return DailyMissionModel(
      id: json['id'] as String,
      type: json['type'] as String,
      descriptionHe: json['descriptionHe'] as String? ?? '',
      descriptionEn: json['descriptionEn'] as String? ?? '',
      points: json['points'] as int? ?? 0,
      isCompleted: json['isCompleted'] as bool? ?? false,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
      targetCount: json['targetCount'] as int? ?? 1,
      currentCount: json['currentCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'descriptionHe': descriptionHe,
      'descriptionEn': descriptionEn,
      'points': points,
      'isCompleted': isCompleted,
      'completedAt': completedAt?.toIso8601String(),
      'progress': progress,
      'targetCount': targetCount,
      'currentCount': currentCount,
    };
  }

  DailyMission toEntity() {
    return DailyMission(
      id: id,
      type: type,
      descriptionHe: descriptionHe,
      descriptionEn: descriptionEn,
      points: points,
      isCompleted: isCompleted,
      completedAt: completedAt,
      progress: progress,
      targetCount: targetCount,
      currentCount: currentCount,
    );
  }
}
