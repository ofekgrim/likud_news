import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/community_poll.dart';
import '../../domain/entities/poll_vote.dart';
import '../../domain/repositories/polls_repository.dart';
import '../datasources/polls_remote_datasource.dart';

/// Concrete implementation of [PollsRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: PollsRepository)
class PollsRepositoryImpl implements PollsRepository {
  final PollsRemoteDataSource _remoteDataSource;

  PollsRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<CommunityPoll>>> getPolls({
    bool activeOnly = true,
  }) async {
    try {
      final models = await _remoteDataSource.getPolls(activeOnly: activeOnly);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, CommunityPoll>> getPoll(String id) async {
    try {
      final model = await _remoteDataSource.getPoll(id);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> vote({
    required String pollId,
    required int optionIndex,
  }) async {
    try {
      await _remoteDataSource.vote(
        pollId: pollId,
        optionIndex: optionIndex,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PollVote?>> getMyVote(String pollId) async {
    try {
      final model = await _remoteDataSource.getMyVote(pollId);
      return Right(model?.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, CommunityPoll>> getResults(String pollId) async {
    try {
      final model = await _remoteDataSource.getResults(pollId);
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
