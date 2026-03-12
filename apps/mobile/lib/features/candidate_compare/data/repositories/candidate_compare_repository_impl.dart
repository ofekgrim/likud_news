import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/compare_result.dart';
import '../../domain/repositories/candidate_compare_repository.dart';
import '../datasources/candidate_compare_remote_datasource.dart';

/// Concrete implementation of [CandidateCompareRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: CandidateCompareRepository)
class CandidateCompareRepositoryImpl implements CandidateCompareRepository {
  final CandidateCompareRemoteDataSource _remoteDataSource;

  CandidateCompareRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, CompareResult>> compareCandidates(
    List<String> ids,
  ) async {
    try {
      final model = await _remoteDataSource.compareCandidates(ids);
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
        final message = e.response?.data is Map<String, dynamic>
            ? (e.response!.data as Map<String, dynamic>)['message'] as String?
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
