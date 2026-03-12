import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/article_detail_repository.dart';

/// Submits a new comment on an article.
@lazySingleton
class SubmitComment implements UseCase<void, SubmitCommentParams> {
  final ArticleDetailRepository repository;

  const SubmitComment(this.repository);

  @override
  Future<Either<Failure, void>> call(SubmitCommentParams params) {
    return repository.submitComment(
      articleId: params.articleId,
      body: params.body,
      parentId: params.parentId,
      targetType: params.targetType,
      guestName: params.guestName,
    );
  }
}

/// Parameters for [SubmitComment].
class SubmitCommentParams extends Equatable {
  final String articleId;
  final String body;
  final String? parentId;
  final String targetType; // 'article' or 'story'
  final String? guestName; // Set when user is not authenticated

  const SubmitCommentParams({
    required this.articleId,
    required this.body,
    this.parentId,
    this.targetType = 'article',
    this.guestName,
  });

  @override
  List<Object?> get props => [articleId, body, parentId, targetType, guestName];
}
