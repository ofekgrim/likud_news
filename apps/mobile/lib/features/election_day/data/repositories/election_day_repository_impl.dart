import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/branch_turnout.dart';
import '../../domain/entities/election_result.dart';
import '../../domain/entities/polling_station.dart';
import '../../domain/entities/station_report.dart';
import '../../domain/entities/turnout_snapshot.dart';
import '../../domain/repositories/election_day_repository.dart';
import '../datasources/election_day_remote_datasource.dart';

/// Concrete implementation of [ElectionDayRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: ElectionDayRepository)
class ElectionDayRepositoryImpl implements ElectionDayRepository {
  final ElectionDayRemoteDataSource _remoteDataSource;

  ElectionDayRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, String?>> resolveActiveElectionId() async {
    try {
      final id = await _remoteDataSource.resolveActiveElectionId();
      return Right(id);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<PollingStation>>> getPollingStations({
    String? electionId,
    String? district,
    String? city,
    int page = 1,
  }) async {
    try {
      final models = await _remoteDataSource.getPollingStations(
        electionId: electionId,
        district: district,
        city: city,
        page: page,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PollingStation>> getStationById(String id) async {
    try {
      final model = await _remoteDataSource.getStationById(id);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, StationReport>> submitReport({
    required String stationId,
    required int waitMinutes,
    String? crowdLevel,
    String? note,
  }) async {
    try {
      final json = await _remoteDataSource.submitReport(
        stationId: stationId,
        waitMinutes: waitMinutes,
        crowdLevel: crowdLevel,
        note: note,
      );
      final report = StationReport(
        id: json['id'] as String? ?? '',
        stationId: json['stationId'] as String? ?? stationId,
        userId: json['userId'] as String?,
        waitMinutes: json['waitMinutes'] as int? ?? waitMinutes,
        crowdLevel: json['crowdLevel'] as String?,
        note: json['note'] as String?,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : DateTime.now(),
      );
      return Right(report);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<ElectionResult>>> getElectionResults(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getElectionResults(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<TurnoutSnapshot>>> getTurnoutSnapshots(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getTurnoutSnapshots(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<TurnoutSnapshot>>> getTurnoutTimeline(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getTurnoutTimeline(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> claimIVotedBadge() async {
    try {
      final result = await _remoteDataSource.claimIVotedBadge();
      return Right(result);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> saveVotingPlan(String timeSlot) async {
    try {
      final result = await _remoteDataSource.saveVotingPlan(timeSlot);
      return Right(result);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<BranchTurnout>>> getBranchTurnouts(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getTurnoutSnapshots(electionId);
      // Derive branch turnouts from district-level snapshots.
      final districtSnapshots =
          models.where((m) => m.district != null && m.district!.isNotEmpty);

      final branches = districtSnapshots.map((m) {
        final pct = m.eligibleVoters > 0
            ? (m.actualVoters / m.eligibleVoters) * 100
            : 0.0;
        return BranchTurnout(
          branchName: m.district!,
          turnoutPct: pct,
          rank: 0, // Will be assigned after sorting.
        );
      }).toList()
        ..sort((a, b) => b.turnoutPct.compareTo(a.turnoutPct));

      // Assign ranks.
      final ranked = branches.asMap().entries.map((entry) {
        return BranchTurnout(
          branchName: entry.value.branchName,
          turnoutPct: entry.value.turnoutPct,
          rank: entry.key + 1,
          isMyBranch: entry.value.isMyBranch,
        );
      }).toList();

      return Right(ranked);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  /// Maps Dio exceptions to domain [Failure] types.
  Failure _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return const NetworkFailure();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data is Map<String, dynamic>
            ? (e.response!.data as Map<String, dynamic>)['message'] as String?
            : null;
        if (statusCode == 404) {
          return NotFoundFailure(message: message ?? 'Resource not found');
        }
        if (statusCode == 401) {
          return UnauthorizedFailure(message: message ?? 'Unauthorized');
        }
        return ServerFailure(
          message: message ?? 'Server error',
          statusCode: statusCode,
        );
      default:
        return ServerFailure(message: e.message ?? 'Unexpected error');
    }
  }
}
