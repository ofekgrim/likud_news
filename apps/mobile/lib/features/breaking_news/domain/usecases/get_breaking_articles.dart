import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/breaking_news_repository.dart';

/// Fetches the current list of breaking news articles.
@lazySingleton
class GetBreakingArticles implements UseCase<List<Article>, NoParams> {
  final BreakingNewsRepository _repository;

  GetBreakingArticles(this._repository);

  @override
  Future<Either<Failure, List<Article>>> call(NoParams params) {
    return _repository.getBreakingArticles();
  }
}
