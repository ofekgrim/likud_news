import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/article_detail.dart';
import '../../domain/entities/comment.dart';
import '../../domain/repositories/article_detail_repository.dart';
import '../datasources/article_detail_remote_datasource.dart';

/// Concrete implementation of [ArticleDetailRepository].
///
/// Delegates to the remote data source and maps exceptions
/// to domain [Failure] types.
@LazySingleton(as: ArticleDetailRepository)
class ArticleDetailRepositoryImpl implements ArticleDetailRepository {
  final ArticleDetailRemoteDataSource _remoteDataSource;

  const ArticleDetailRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, ArticleDetail>> getArticleBySlug(String slug) async {
    try {
      final model = await _remoteDataSource.getArticleBySlug(slug);
      return Right(model.toEntity());
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> toggleFavorite({
    required String deviceId,
    required String articleId,
  }) async {
    try {
      final isFavorite = await _remoteDataSource.toggleFavorite(
        deviceId: deviceId,
        articleId: articleId,
      );
      return Right(isFavorite);
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> recordRead({
    required String deviceId,
    required String articleId,
  }) async {
    try {
      await _remoteDataSource.recordRead(
        deviceId: deviceId,
        articleId: articleId,
      );
      return const Right(null);
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Comment>>> getComments({
    required String articleId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final models = await _remoteDataSource.getComments(
        articleId: articleId,
        page: page,
        limit: limit,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> submitComment({
    required String articleId,
    required String authorName,
    required String body,
    String? parentId,
  }) async {
    try {
      await _remoteDataSource.submitComment(
        articleId: articleId,
        authorName: authorName,
        body: body,
        parentId: parentId,
      );
      return const Right(null);
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> incrementShareCount(String articleId) async {
    try {
      await _remoteDataSource.incrementShareCount(articleId);
      return const Right(null);
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, int>> likeComment({
    required String articleId,
    required String commentId,
  }) async {
    try {
      final likesCount = await _remoteDataSource.likeComment(
        articleId: articleId,
        commentId: commentId,
      );
      return Right(likesCount);
    } on Exception catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
