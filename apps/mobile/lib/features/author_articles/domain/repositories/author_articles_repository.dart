import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../article_detail/domain/entities/author.dart';
import '../../../home/domain/entities/article.dart';

/// Result wrapper containing both author and articles.
class AuthorArticlesResult {
  final Author author;
  final List<Article> articles;

  const AuthorArticlesResult({required this.author, required this.articles});
}

abstract class AuthorArticlesRepository {
  Future<Either<Failure, AuthorArticlesResult>> getAuthorArticles({
    required String authorId,
    required int page,
  });
}
