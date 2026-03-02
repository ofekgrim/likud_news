import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/community_average.dart';
import '../../domain/entities/quiz_answer.dart';
import '../../domain/entities/quiz_election.dart';
import '../../domain/entities/quiz_question.dart';
import '../../domain/entities/quiz_result.dart';
import '../../domain/repositories/quiz_repository.dart';
import '../datasources/quiz_remote_datasource.dart';
import '../models/quiz_answer_model.dart';

/// Concrete implementation of [QuizRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: QuizRepository)
class QuizRepositoryImpl implements QuizRepository {
  final QuizRemoteDataSource _remoteDataSource;

  QuizRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<QuizElection>>> getQuizElections() async {
    try {
      final models = await _remoteDataSource.getQuizElections();
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, String>> resolveActiveElectionId() async {
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
  Future<Either<Failure, List<QuizQuestion>>> getQuestions(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getQuestions(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<CandidateMatch>>> submitQuiz(
    String electionId,
    List<QuizAnswer> answers,
  ) async {
    try {
      final answerModels =
          answers.map((a) => QuizAnswerModel.fromEntity(a)).toList();
      final models =
          await _remoteDataSource.submitQuiz(electionId, answerModels);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, QuizResult?>> getMyResults(
    String electionId,
  ) async {
    try {
      final model = await _remoteDataSource.getMyResults(electionId);
      return Right(model?.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<CommunityAverage>>> getQuizAverages(
    String electionId,
  ) async {
    try {
      final models = await _remoteDataSource.getQuizAverages(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
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
        if (statusCode == 401) {
          return UnauthorizedFailure(message: message ?? 'Unauthorized');
        }
        if (statusCode == 404) {
          return NotFoundFailure(message: message ?? 'Resource not found');
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
