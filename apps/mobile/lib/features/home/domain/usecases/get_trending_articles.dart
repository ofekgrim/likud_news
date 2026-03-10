import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/article.dart';
import '../repositories/home_repository.dart';

/// Fetches trending articles (most viewed in last 7 days).
@injectable
class GetTrendingArticles implements UseCase<List<Article>, NoParams> {
  final HomeRepository repository;

  GetTrendingArticles(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(NoParams params) {
    return repository.getTrendingArticles(limit: 5);
  }
}
