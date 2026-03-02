import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/entities/bookmark_folder.dart';
import '../../domain/repositories/enhanced_favorites_repository.dart';
import '../datasources/enhanced_favorites_remote_datasource.dart';

/// Concrete implementation of [EnhancedFavoritesRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: EnhancedFavoritesRepository)
class EnhancedFavoritesRepositoryImpl implements EnhancedFavoritesRepository {
  final EnhancedFavoritesRemoteDataSource _remoteDataSource;

  EnhancedFavoritesRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<BookmarkFolder>>> getFolders() async {
    try {
      final models = await _remoteDataSource.getFolders();
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, BookmarkFolder>> createFolder({
    required String name,
    String? color,
  }) async {
    try {
      final model = await _remoteDataSource.createFolder(
        name: name,
        color: color,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, BookmarkFolder>> updateFolder({
    required String id,
    String? name,
    String? color,
    int? sortOrder,
    bool? isPublic,
  }) async {
    try {
      final model = await _remoteDataSource.updateFolder(
        id: id,
        name: name,
        color: color,
        sortOrder: sortOrder,
        isPublic: isPublic,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteFolder({required String id}) async {
    try {
      await _remoteDataSource.deleteFolder(id: id);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Article>>> getFolderFavorites({
    required String folderId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final models = await _remoteDataSource.getFolderFavorites(
        folderId: folderId,
        page: page,
        limit: limit,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> moveToFolder({
    required String articleId,
    String? folderId,
  }) async {
    try {
      await _remoteDataSource.moveToFolder(
        articleId: articleId,
        folderId: folderId,
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateNote({
    required String articleId,
    required String note,
  }) async {
    try {
      await _remoteDataSource.updateNote(
        articleId: articleId,
        note: note,
      );
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
        if (statusCode == 401) {
          return const UnauthorizedFailure();
        }
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
