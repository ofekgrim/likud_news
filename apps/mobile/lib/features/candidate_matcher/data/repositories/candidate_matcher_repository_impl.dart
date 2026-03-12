import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/match_result.dart';
import '../../domain/entities/policy_statement.dart';
import '../../domain/entities/quiz_answer.dart';
import '../../domain/repositories/candidate_matcher_repository.dart';
import '../datasources/candidate_matcher_remote_datasource.dart';

/// Concrete implementation of [CandidateMatcherRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: CandidateMatcherRepository)
class CandidateMatcherRepositoryImpl implements CandidateMatcherRepository {
  final CandidateMatcherRemoteDataSource _remoteDataSource;

  CandidateMatcherRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<PolicyStatement>>> getStatements(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getStatements(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> submitResponses({
    required String electionId,
    required List<({String statementId, QuizAnswer answer, double? importanceWeight})>
        responses,
  }) async {
    try {
      await _remoteDataSource.submitResponses(
        electionId: electionId,
        responses: responses,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, MatchResultResponse>> getMatchResults(
    String electionId,
  ) async {
    try {
      final model = await _remoteDataSource.getMatchResults(electionId);
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
