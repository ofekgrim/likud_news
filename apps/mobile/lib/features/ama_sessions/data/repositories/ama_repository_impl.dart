import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/ama_question.dart';
import '../../domain/entities/ama_session.dart';
import '../../domain/repositories/ama_repository.dart';
import '../datasources/ama_remote_datasource.dart';

/// Concrete implementation of [AmaRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: AmaRepository)
class AmaRepositoryImpl implements AmaRepository {
  final AmaRemoteDataSource _remoteDataSource;

  AmaRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<AmaSession>>> getSessions({
    String? status,
  }) async {
    try {
      final models = await _remoteDataSource.getSessions(status: status);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<AmaSession>>> getUpcomingSessions() async {
    try {
      final models = await _remoteDataSource.getUpcomingSessions();
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AmaSession>> getSession(String sessionId) async {
    try {
      final model = await _remoteDataSource.getSession(sessionId);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<AmaQuestion>>> getQuestions(
    String sessionId, {
    String? status,
  }) async {
    try {
      final models = await _remoteDataSource.getQuestions(
        sessionId,
        status: status,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AmaQuestion>> submitQuestion(
    String sessionId,
    String text,
  ) async {
    try {
      final model = await _remoteDataSource.submitQuestion(sessionId, text);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> upvoteQuestion(String questionId) async {
    try {
      await _remoteDataSource.upvoteQuestion(questionId);
      return const Right(null);
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
