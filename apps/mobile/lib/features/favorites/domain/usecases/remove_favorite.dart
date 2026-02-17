import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/favorites_repository.dart';

/// Removes an article from the user's favorites.
@injectable
class RemoveFavorite implements UseCase<void, RemoveFavoriteParams> {
  final FavoritesRepository repository;

  RemoveFavorite(this.repository);

  @override
  Future<Either<Failure, void>> call(RemoveFavoriteParams params) {
    return repository.removeFavorite(
      deviceId: params.deviceId,
      articleId: params.articleId,
    );
  }
}

/// Parameters for the [RemoveFavorite] use case.
class RemoveFavoriteParams extends Equatable {
  final String deviceId;
  final String articleId;

  const RemoveFavoriteParams({
    required this.deviceId,
    required this.articleId,
  });

  @override
  List<Object?> get props => [deviceId, articleId];
}
