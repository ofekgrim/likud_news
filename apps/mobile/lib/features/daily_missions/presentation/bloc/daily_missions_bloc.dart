import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/complete_mission.dart' as uc;
import '../../domain/usecases/get_today_missions.dart';
import 'daily_missions_event.dart';
import 'daily_missions_state.dart';

/// Manages the state of the Daily Missions feature.
///
/// Loads today's missions and handles mission completion.
@injectable
class DailyMissionsBloc extends Bloc<DailyMissionsEvent, DailyMissionsState> {
  final GetTodayMissions _getTodayMissions;
  final uc.CompleteMission _completeMission;

  DailyMissionsBloc(
    this._getTodayMissions,
    this._completeMission,
  ) : super(const DailyMissionsInitial()) {
    on<LoadTodayMissions>(_onLoadTodayMissions);
    on<CompleteMission>(_onCompleteMission);
  }

  /// Loads today's daily missions summary.
  Future<void> _onLoadTodayMissions(
    LoadTodayMissions event,
    Emitter<DailyMissionsState> emit,
  ) async {
    emit(const DailyMissionsLoading());

    final result = await _getTodayMissions(const NoParams());

    result.fold(
      (failure) => emit(DailyMissionsError(
        message: failure.message ?? 'gamification_error_loading'.tr(),
      )),
      (summary) => emit(DailyMissionsLoaded(summary: summary)),
    );
  }

  /// Completes a specific mission and refreshes the summary.
  Future<void> _onCompleteMission(
    CompleteMission event,
    Emitter<DailyMissionsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! DailyMissionsLoaded) return;

    final result = await _completeMission(event.missionId);

    result.fold(
      (failure) {
        // Keep existing data on failure — UI can show a snackbar.
      },
      (updatedMission) {
        // Update the mission in the summary
        final updatedMissions = currentState.summary.missions.map((m) {
          if (m.id == updatedMission.id) return updatedMission;
          return m;
        }).toList();

        final allCompleted = updatedMissions.every((m) => m.isCompleted);
        final totalPointsEarned = updatedMissions
            .where((m) => m.isCompleted)
            .fold(0, (sum, m) => sum + m.points);

        emit(currentState.copyWith(
          summary: currentState.summary.copyWith(
            missions: updatedMissions,
            allCompleted: allCompleted,
            bonusPoints: allCompleted ? 50 : 0,
            totalPointsEarned:
                totalPointsEarned + (allCompleted ? 50 : 0),
          ),
        ));
      },
    );
  }
}
