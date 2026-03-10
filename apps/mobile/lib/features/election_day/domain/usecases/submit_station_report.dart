import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/station_report.dart';
import '../repositories/election_day_repository.dart';

/// Submits a wait-time report for a polling station.
@injectable
class SubmitStationReport
    implements UseCase<StationReport, StationReportParams> {
  final ElectionDayRepository repository;

  SubmitStationReport(this.repository);

  @override
  Future<Either<Failure, StationReport>> call(StationReportParams params) {
    return repository.submitReport(
      stationId: params.stationId,
      waitMinutes: params.waitMinutes,
      crowdLevel: params.crowdLevel,
      note: params.note,
    );
  }
}

/// Parameters for the [SubmitStationReport] use case.
class StationReportParams extends Equatable {
  final String stationId;
  final int waitMinutes;
  final String? crowdLevel;
  final String? note;

  const StationReportParams({
    required this.stationId,
    required this.waitMinutes,
    this.crowdLevel,
    this.note,
  });

  @override
  List<Object?> get props => [stationId, waitMinutes, crowdLevel, note];
}
