import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/breaking_news_repository.dart';

/// Parameters for fetching all articles with pagination.
class AllArticlesParams extends Equatable {
  final int page;
  final int limit;

  const AllArticlesParams({this.page = 1, this.limit = 10});

  @override
  List<Object?> get props => [page, limit];
}

/// Fetches all published articles with pagination.
@injectable
class GetAllArticles implements UseCase<List<Article>, AllArticlesParams> {
  final BreakingNewsRepository _repository;

  GetAllArticles(this._repository);

  @override
  Future<Either<Failure, List<Article>>> call(AllArticlesParams params) {
    return _repository.getAllArticles(page: params.page, limit: params.limit);
  }
}
