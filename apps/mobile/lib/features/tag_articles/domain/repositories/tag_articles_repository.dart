import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';

abstract class TagArticlesRepository {
  Future<Either<Failure, List<Article>>> getTagArticles({
    required String slug,
    required int page,
  });
}
