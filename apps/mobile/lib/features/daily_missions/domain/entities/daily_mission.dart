import 'package:equatable/equatable.dart';

/// Immutable entity representing a single daily mission.
class DailyMission extends Equatable {
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

  const DailyMission({
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

  DailyMission copyWith({
    String? id,
    String? type,
    String? descriptionHe,
    String? descriptionEn,
    int? points,
    bool? isCompleted,
    DateTime? completedAt,
    double? progress,
    int? targetCount,
    int? currentCount,
  }) {
    return DailyMission(
      id: id ?? this.id,
      type: type ?? this.type,
      descriptionHe: descriptionHe ?? this.descriptionHe,
      descriptionEn: descriptionEn ?? this.descriptionEn,
      points: points ?? this.points,
      isCompleted: isCompleted ?? this.isCompleted,
      completedAt: completedAt ?? this.completedAt,
      progress: progress ?? this.progress,
      targetCount: targetCount ?? this.targetCount,
      currentCount: currentCount ?? this.currentCount,
    );
  }

  @override
  List<Object?> get props => [
        id,
        type,
        descriptionHe,
        descriptionEn,
        points,
        isCompleted,
        completedAt,
        progress,
        targetCount,
        currentCount,
      ];
}
