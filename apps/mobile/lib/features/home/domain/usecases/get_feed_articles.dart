import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/article.dart';
import '../repositories/home_repository.dart';

/// Fetches a paginated list of feed articles.
@injectable
class GetFeedArticles implements UseCase<List<Article>, FeedParams> {
  final HomeRepository repository;

  GetFeedArticles(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(FeedParams params) {
    return repository.getFeedArticles(page: params.page, limit: params.limit);
  }
}

/// Parameters for the [GetFeedArticles] use case.
class FeedParams extends Equatable {
  final int page;
  final int limit;

  const FeedParams({required this.page, this.limit = 10});

  @override
  List<Object?> get props => [page, limit];
}
