import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';
import '../../../home/domain/entities/category.dart';

/// Abstract contract for the categories feature data operations.
///
/// Implemented by [CategoriesRepositoryImpl] in the data layer.
abstract class CategoriesRepository {
  /// Fetches all active categories.
  Future<Either<Failure, List<Category>>> getCategories();

  /// Fetches a paginated list of articles for the given category [slug].
  ///
  /// [page] starts at 1. Each page returns a fixed number of articles.
  Future<Either<Failure, List<Article>>> getCategoryArticles({
    required String slug,
    required int page,
  });
}
