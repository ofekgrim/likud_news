import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/repositories/tag_articles_repository.dart';
import '../datasources/tag_articles_remote_datasource.dart';

@LazySingleton(as: TagArticlesRepository)
class TagArticlesRepositoryImpl implements TagArticlesRepository {
  final TagArticlesRemoteDataSource _remoteDataSource;

  TagArticlesRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Article>>> getTagArticles({
    required String slug,
    required int page,
  }) async {
    try {
      final models = await _remoteDataSource.getTagArticles(
        slug: slug,
        page: page,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

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
