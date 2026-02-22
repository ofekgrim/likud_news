import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/comment.dart';
import '../repositories/article_detail_repository.dart';

/// Fetches paginated comments for an article.
@lazySingleton
class GetComments implements UseCase<List<Comment>, GetCommentsParams> {
  final ArticleDetailRepository repository;

  const GetComments(this.repository);

  @override
  Future<Either<Failure, List<Comment>>> call(GetCommentsParams params) {
    return repository.getComments(
      articleId: params.articleId,
      page: params.page,
      limit: params.limit,
      targetType: params.targetType,
    );
  }
}

/// Parameters for [GetComments].
class GetCommentsParams extends Equatable {
  final String articleId;
  final int page;
  final int limit;
  final String targetType; // 'article' or 'story'

  const GetCommentsParams({
    required this.articleId,
    this.page = 1,
    this.limit = 20,
    this.targetType = 'article',
  });

  @override
  List<Object?> get props => [articleId, page, limit, targetType];
}
