import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/tag_articles_repository.dart';

@injectable
class GetTagArticles implements UseCase<List<Article>, TagArticlesParams> {
  final TagArticlesRepository repository;

  GetTagArticles(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(TagArticlesParams params) {
    return repository.getTagArticles(
      slug: params.slug,
      page: params.page,
    );
  }
}

class TagArticlesParams extends Equatable {
  final String slug;
  final int page;

  const TagArticlesParams({
    required this.slug,
    required this.page,
  });

  @override
  List<Object?> get props => [slug, page];
}
