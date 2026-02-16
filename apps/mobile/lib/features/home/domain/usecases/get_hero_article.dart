import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/article.dart';
import '../repositories/home_repository.dart';

/// Fetches the hero article for the home screen.
@injectable
class GetHeroArticle implements UseCase<Article, NoParams> {
  final HomeRepository repository;

  GetHeroArticle(this.repository);

  @override
  Future<Either<Failure, Article>> call(NoParams params) {
    return repository.getHeroArticle();
  }
}
