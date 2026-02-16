import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/repositories/magazine_repository.dart';
import '../datasources/magazine_remote_datasource.dart';

/// Concrete implementation of [MagazineRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: MagazineRepository)
class MagazineRepositoryImpl implements MagazineRepository {
  final MagazineRemoteDataSource _remoteDataSource;

  MagazineRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Article>>> getMagazineArticles({
    required int page,
  }) async {
    try {
      final models = await _remoteDataSource.getMagazineArticles(page: page);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Article?>> getFeaturedArticle() async {
    try {
      final model = await _remoteDataSource.getFeaturedArticle();
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
