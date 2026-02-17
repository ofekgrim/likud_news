import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/article_detail_repository.dart';

/// Toggles the bookmark/favorite status for an article.
///
/// Returns the new favorite state (`true` = favorited, `false` = unfavorited).
@lazySingleton
class ToggleFavorite implements UseCase<bool, ToggleFavoriteParams> {
  final ArticleDetailRepository repository;

  const ToggleFavorite(this.repository);

  @override
  Future<Either<Failure, bool>> call(ToggleFavoriteParams params) {
    return repository.toggleFavorite(
      deviceId: params.deviceId,
      articleId: params.articleId,
    );
  }
}

/// Parameters for [ToggleFavorite].
class ToggleFavoriteParams extends Equatable {
  final String deviceId;
  final String articleId;

  const ToggleFavoriteParams({
    required this.deviceId,
    required this.articleId,
  });

  @override
  List<Object?> get props => [deviceId, articleId];
}
