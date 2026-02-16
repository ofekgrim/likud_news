import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/magazine_repository.dart';

/// Fetches the featured/hero magazine article.
@injectable
class GetFeaturedArticle implements UseCase<Article?, NoParams> {
  final MagazineRepository repository;

  GetFeaturedArticle(this.repository);

  @override
  Future<Either<Failure, Article?>> call(NoParams params) {
    return repository.getFeaturedArticle();
  }
}
