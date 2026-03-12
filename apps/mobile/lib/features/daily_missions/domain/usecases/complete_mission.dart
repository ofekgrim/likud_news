import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/daily_mission.dart';
import '../repositories/daily_missions_repository.dart';

/// Completes a specific daily mission by its ID.
@injectable
class CompleteMission implements UseCase<DailyMission, String> {
  final DailyMissionsRepository repository;

  CompleteMission(this.repository);

  @override
  Future<Either<Failure, DailyMission>> call(String missionId) {
    return repository.completeMission(missionId);
  }
}
