import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/daily_quiz.dart';
import '../../domain/repositories/daily_quiz_repository.dart';
import '../datasources/daily_quiz_remote_datasource.dart';

/// Concrete implementation of [DailyQuizRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: DailyQuizRepository)
class DailyQuizRepositoryImpl implements DailyQuizRepository {
  final DailyQuizRemoteDataSource _remoteDataSource;

  DailyQuizRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, DailyQuiz?>> getTodayQuiz() async {
    try {
      final model = await _remoteDataSource.getTodayQuiz();
      return Right(model?.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, DailyQuizResult>> submitQuiz(
    String quizId,
    List<int> answers,
  ) async {
    try {
      final model = await _remoteDataSource.submitQuiz(quizId, answers);
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
