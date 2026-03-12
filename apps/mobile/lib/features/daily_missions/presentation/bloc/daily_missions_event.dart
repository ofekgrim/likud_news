import 'package:equatable/equatable.dart';

/// Base class for all Daily Missions BLoC events.
sealed class DailyMissionsEvent extends Equatable {
  const DailyMissionsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of today's daily missions.
final class LoadTodayMissions extends DailyMissionsEvent {
  const LoadTodayMissions();
}

/// Triggers completion of a specific mission.
final class CompleteMission extends DailyMissionsEvent {
  final String missionId;

  const CompleteMission(this.missionId);

  @override
  List<Object?> get props => [missionId];
}
