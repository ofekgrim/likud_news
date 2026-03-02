import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/candidate.dart';
import '../../domain/entities/election.dart';
import '../../domain/entities/endorsement.dart';
import '../../domain/repositories/candidates_repository.dart';
import '../datasources/candidates_remote_datasource.dart';

/// Concrete implementation of [CandidatesRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: CandidatesRepository)
class CandidatesRepositoryImpl implements CandidatesRepository {
  final CandidatesRemoteDataSource _remoteDataSource;

  CandidatesRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Election>>> getElections() async {
    try {
      final models = await _remoteDataSource.getElections();
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Election>> getElection(String id) async {
    try {
      final model = await _remoteDataSource.getElection(id);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Candidate>>> getCandidatesByElection(
    String electionId,
  ) async {
    try {
      final models =
          await _remoteDataSource.getCandidatesByElection(electionId);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Candidate>> getCandidateBySlug(String slug) async {
    try {
      final model = await _remoteDataSource.getCandidateBySlug(slug);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Candidate>> getCandidateById(String id) async {
    try {
      final model = await _remoteDataSource.getCandidateById(id);
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Endorsement>> endorseCandidate(
    String candidateId,
    String electionId,
  ) async {
    try {
      final model = await _remoteDataSource.endorseCandidate(
        candidateId,
        electionId,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> removeEndorsement(String electionId) async {
    try {
      await _remoteDataSource.removeEndorsement(electionId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Endorsement?>> getMyEndorsement(
    String electionId,
  ) async {
    try {
      final model = await _remoteDataSource.getMyEndorsement(electionId);
      return Right(model?.toEntity());
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
