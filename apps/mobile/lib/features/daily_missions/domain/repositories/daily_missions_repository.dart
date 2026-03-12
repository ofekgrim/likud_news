import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/daily_mission.dart';
import '../entities/daily_missions_summary.dart';

/// Abstract contract for the daily missions feature data operations.
///
/// Implemented by [DailyMissionsRepositoryImpl] in the data layer.
abstract class DailyMissionsRepository {
  /// Fetches today's daily missions summary.
  Future<Either<Failure, DailyMissionsSummary>> getTodayMissions();

  /// Completes a specific mission by its ID.
  Future<Either<Failure, DailyMission>> completeMission(String missionId);
}
