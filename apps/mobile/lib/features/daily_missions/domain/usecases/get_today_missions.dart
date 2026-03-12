import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/daily_missions_summary.dart';
import '../repositories/daily_missions_repository.dart';

/// Fetches today's daily missions summary.
@injectable
class GetTodayMissions implements UseCase<DailyMissionsSummary, NoParams> {
  final DailyMissionsRepository repository;

  GetTodayMissions(this.repository);

  @override
  Future<Either<Failure, DailyMissionsSummary>> call(NoParams params) {
    return repository.getTodayMissions();
  }
}
