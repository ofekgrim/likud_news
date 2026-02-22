import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/article_detail_repository.dart';

/// Likes a comment on an article.
@lazySingleton
class LikeComment implements UseCase<int, LikeCommentParams> {
  final ArticleDetailRepository repository;

  const LikeComment(this.repository);

  @override
  Future<Either<Failure, int>> call(LikeCommentParams params) {
    return repository.likeComment(
      articleId: params.articleId,
      commentId: params.commentId,
      targetType: params.targetType,
    );
  }
}

/// Parameters for [LikeComment].
class LikeCommentParams extends Equatable {
  final String articleId;
  final String commentId;
  final String targetType; // 'article' or 'story'

  const LikeCommentParams({
    required this.articleId,
    required this.commentId,
    this.targetType = 'article',
  });

  @override
  List<Object?> get props => [articleId, commentId, targetType];
}
