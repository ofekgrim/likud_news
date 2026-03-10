import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../article_detail/domain/entities/author.dart';
import '../../domain/repositories/authors_repository.dart';
import '../datasources/authors_remote_datasource.dart';

@LazySingleton(as: AuthorsRepository)
class AuthorsRepositoryImpl implements AuthorsRepository {
  final AuthorsRemoteDataSource _remoteDataSource;

  AuthorsRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Author>>> getAuthors() async {
    try {
      final models = await _remoteDataSource.getAuthors();
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
