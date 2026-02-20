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
      authorName: params.authorName,
      body: params.body,
      parentId: params.parentId,
    );
  }
}

/// Parameters for [SubmitComment].
class SubmitCommentParams extends Equatable {
  final String articleId;
  final String authorName;
  final String body;
  final String? parentId;

  const SubmitCommentParams({
    required this.articleId,
    required this.authorName,
    required this.body,
    this.parentId,
  });

  @override
  List<Object?> get props => [articleId, authorName, body, parentId];
}
