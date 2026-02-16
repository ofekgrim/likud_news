import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/search_result.dart';
import '../repositories/search_repository.dart';

/// Searches articles by query with pagination support.
@injectable
class SearchArticles implements UseCase<SearchResult, SearchParams> {
  final SearchRepository repository;

  SearchArticles(this.repository);

  @override
  Future<Either<Failure, SearchResult>> call(SearchParams params) {
    return repository.search(query: params.query, page: params.page);
  }
}

/// Parameters for the [SearchArticles] use case.
class SearchParams extends Equatable {
  final String query;
  final int page;

  const SearchParams({
    required this.query,
    this.page = 1,
  });

  @override
  List<Object?> get props => [query, page];
}
