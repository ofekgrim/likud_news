import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/article_detail.dart';
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
    required int articleId,
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
    required int articleId,
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
}
