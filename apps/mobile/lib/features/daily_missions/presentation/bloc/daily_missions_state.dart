import 'package:equatable/equatable.dart';

import '../../domain/entities/daily_missions_summary.dart';

/// Base class for all Daily Missions BLoC states.
sealed class DailyMissionsState extends Equatable {
  const DailyMissionsState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class DailyMissionsInitial extends DailyMissionsState {
  const DailyMissionsInitial();
}

/// Data is being fetched for the first time.
final class DailyMissionsLoading extends DailyMissionsState {
  const DailyMissionsLoading();
}

/// Data loaded successfully.
final class DailyMissionsLoaded extends DailyMissionsState {
  final DailyMissionsSummary summary;

  const DailyMissionsLoaded({required this.summary});

  DailyMissionsLoaded copyWith({DailyMissionsSummary? summary}) {
    return DailyMissionsLoaded(summary: summary ?? this.summary);
  }

  @override
  List<Object?> get props => [summary];
}

/// An error occurred while loading daily missions.
final class DailyMissionsError extends DailyMissionsState {
  final String message;

  const DailyMissionsError({required this.message});

  @override
  List<Object?> get props => [message];
}
