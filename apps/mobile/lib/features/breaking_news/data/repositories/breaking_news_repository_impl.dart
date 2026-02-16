import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';
import '../../domain/repositories/breaking_news_repository.dart';
import '../datasources/breaking_news_remote_datasource.dart';

/// Concrete implementation of [BreakingNewsRepository].
///
/// Delegates REST and SSE operations to the remote datasource and
/// translates exceptions into typed [Failure] objects for the domain layer.
@LazySingleton(as: BreakingNewsRepository)
class BreakingNewsRepositoryImpl implements BreakingNewsRepository {
  final BreakingNewsRemoteDatasource _remoteDatasource;

  BreakingNewsRepositoryImpl(this._remoteDatasource);

  @override
  Future<Either<Failure, List<Article>>> getBreakingArticles() async {
    try {
      final articles = await _remoteDatasource.getBreakingArticles();
      return Right(articles);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Stream<Article> watchBreakingNews() {
    return _remoteDatasource.watchBreakingNews();
  }
}
