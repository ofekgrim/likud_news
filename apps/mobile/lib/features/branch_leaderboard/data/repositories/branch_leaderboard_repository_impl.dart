import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/branch_leaderboard.dart';
import '../../domain/repositories/branch_leaderboard_repository.dart';
import '../datasources/branch_leaderboard_remote_datasource.dart';

/// Concrete implementation of [BranchLeaderboardRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: BranchLeaderboardRepository)
class BranchLeaderboardRepositoryImpl implements BranchLeaderboardRepository {
  final BranchLeaderboardRemoteDataSource _remoteDataSource;

  BranchLeaderboardRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, BranchLeaderboard>> getBranchLeaderboard({
    String? period,
    int? limit,
  }) async {
    try {
      final model = await _remoteDataSource.getBranchLeaderboard(
        period: period,
        limit: limit,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, BranchLeaderboard>> getNationalLeaderboard() async {
    try {
      final model = await _remoteDataSource.getNationalLeaderboard();
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
