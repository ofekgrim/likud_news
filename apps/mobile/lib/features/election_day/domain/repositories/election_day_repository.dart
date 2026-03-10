import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/election_result.dart';
import '../entities/polling_station.dart';
import '../entities/station_report.dart';
import '../entities/turnout_snapshot.dart';

/// Abstract contract for the Election Day data layer.
///
/// Implementations handle API calls, caching, and error mapping.
abstract class ElectionDayRepository {
  /// Resolves 'active' to the real election UUID.
  Future<Either<Failure, String?>> resolveActiveElectionId();

  /// Fetches a paginated list of polling stations.
  ///
  /// Supports optional filtering by [electionId], [district], and [city].
  Future<Either<Failure, List<PollingStation>>> getPollingStations({
    String? electionId,
    String? district,
    String? city,
    int page = 1,
  });

  /// Fetches a single polling station by [id].
  Future<Either<Failure, PollingStation>> getStationById(String id);

  /// Submits a wait-time report for a polling station.
  Future<Either<Failure, StationReport>> submitReport({
    required String stationId,
    required int waitMinutes,
    String? crowdLevel,
    String? note,
  });

  /// Fetches election results for a given [electionId].
  Future<Either<Failure, List<ElectionResult>>> getElectionResults(
    String electionId,
  );

  /// Fetches turnout snapshots for a given [electionId].
  Future<Either<Failure, List<TurnoutSnapshot>>> getTurnoutSnapshots(
    String electionId,
  );

  /// Fetches the turnout timeline (time-series) for a given [electionId].
  Future<Either<Failure, List<TurnoutSnapshot>>> getTurnoutTimeline(
    String electionId,
  );
}
