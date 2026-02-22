import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/author_articles_repository.dart';

@injectable
class GetAuthorArticles
    implements UseCase<AuthorArticlesResult, AuthorArticlesParams> {
  final AuthorArticlesRepository repository;

  GetAuthorArticles(this.repository);

  @override
  Future<Either<Failure, AuthorArticlesResult>> call(
    AuthorArticlesParams params,
  ) {
    return repository.getAuthorArticles(
      authorId: params.authorId,
      page: params.page,
    );
  }
}

class AuthorArticlesParams extends Equatable {
  final String authorId;
  final int page;

  const AuthorArticlesParams({
    required this.authorId,
    required this.page,
  });

  @override
  List<Object?> get props => [authorId, page];
}
