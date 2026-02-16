import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';

/// Abstract contract for the magazine feature data operations.
///
/// Implemented by [MagazineRepositoryImpl] in the data layer.
abstract class MagazineRepository {
  /// Fetches a paginated list of magazine articles.
  ///
  /// [page] starts at 1. Each page returns a fixed number of articles.
  Future<Either<Failure, List<Article>>> getMagazineArticles({
    required int page,
  });

  /// Fetches the current featured/hero magazine article, if any.
  Future<Either<Failure, Article?>> getFeaturedArticle();
}
