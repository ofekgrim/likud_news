import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/breaking_news_repository.dart';

/// Parameters for searching articles.
class SearchArticlesParams extends Equatable {
  final String query;
  final int page;
  final int limit;

  const SearchArticlesParams({
    required this.query,
    this.page = 1,
    this.limit = 20,
  });

  @override
  List<Object?> get props => [query, page, limit];
}

/// Searches articles on the server with pagination.
///
/// Returns a map containing:
/// - 'articles': List<Article>
/// - 'total': int
/// - 'page': int
/// - 'totalPages': int
@injectable
class SearchArticles implements UseCase<Map<String, dynamic>, SearchArticlesParams> {
  final BreakingNewsRepository _repository;

  SearchArticles(this._repository);

  @override
  Future<Either<Failure, Map<String, dynamic>>> call(SearchArticlesParams params) {
    return _repository.searchArticles(
      params.query,
      page: params.page,
      limit: params.limit,
    );
  }
}
