import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/daily_mission.dart';
import '../../domain/entities/daily_missions_summary.dart';
import '../../domain/repositories/daily_missions_repository.dart';
import '../datasources/daily_missions_remote_datasource.dart';

/// Concrete implementation of [DailyMissionsRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: DailyMissionsRepository)
class DailyMissionsRepositoryImpl implements DailyMissionsRepository {
  final DailyMissionsRemoteDataSource _remoteDataSource;

  DailyMissionsRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, DailyMissionsSummary>> getTodayMissions() async {
    try {
      final model = await _remoteDataSource.getTodayMissions();
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, DailyMission>> completeMission(
    String missionId,
  ) async {
    try {
      final model = await _remoteDataSource.completeMission(missionId);
      return Right(model.toEntity());
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
        final message =
            e.response?.data is Map<String, dynamic>
                ? (e.response!.data as Map<String, dynamic>)['message']
                    as String?
                : null;
        return ServerFailure(
          message: message ?? 'Server error',
          statusCode: statusCode,
        );
      default:
        return ServerFailure(message: e.message ?? 'Unexpected error');
    }
  }
}
