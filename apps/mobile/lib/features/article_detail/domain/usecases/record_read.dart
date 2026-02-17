import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/article_detail_repository.dart';

/// Records a read event when the user opens an article.
///
/// Fire-and-forget: the caller does not need to wait for the result
/// but errors are still captured via [Either].
@lazySingleton
class RecordRead implements UseCase<void, RecordReadParams> {
  final ArticleDetailRepository repository;

  const RecordRead(this.repository);

  @override
  Future<Either<Failure, void>> call(RecordReadParams params) {
    return repository.recordRead(
      deviceId: params.deviceId,
      articleId: params.articleId,
    );
  }
}

/// Parameters for [RecordRead].
class RecordReadParams extends Equatable {
  final String deviceId;
  final String articleId;

  const RecordReadParams({
    required this.deviceId,
    required this.articleId,
  });

  @override
  List<Object?> get props => [deviceId, articleId];
}
