import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/repositories/author_articles_repository.dart';
import '../datasources/author_articles_remote_datasource.dart';

@LazySingleton(as: AuthorArticlesRepository)
class AuthorArticlesRepositoryImpl implements AuthorArticlesRepository {
  final AuthorArticlesRemoteDataSource _remoteDataSource;

  AuthorArticlesRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, AuthorArticlesResult>> getAuthorArticles({
    required String authorId,
    required int page,
  }) async {
    try {
      final response = await _remoteDataSource.getAuthorArticles(
        authorId: authorId,
        page: page,
      );
      return Right(AuthorArticlesResult(
        author: response.author,
        articles: response.articles.map((m) => m.toEntity()).toList(),
      ));
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
