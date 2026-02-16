import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/categories_repository.dart';

/// Fetches a paginated list of articles for a specific category.
@injectable
class GetCategoryArticles
    implements UseCase<List<Article>, CategoryArticlesParams> {
  final CategoriesRepository repository;

  GetCategoryArticles(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(CategoryArticlesParams params) {
    return repository.getCategoryArticles(
      slug: params.slug,
      page: params.page,
    );
  }
}

/// Parameters for the [GetCategoryArticles] use case.
class CategoryArticlesParams extends Equatable {
  final String slug;
  final int page;

  const CategoryArticlesParams({
    required this.slug,
    required this.page,
  });

  @override
  List<Object?> get props => [slug, page];
}
