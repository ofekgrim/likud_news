import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/favorites_repository.dart';

/// Fetches a paginated list of the user's favorite articles.
@injectable
class GetFavorites implements UseCase<List<Article>, FavoritesParams> {
  final FavoritesRepository repository;

  GetFavorites(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(FavoritesParams params) {
    return repository.getFavorites(
      deviceId: params.deviceId,
      page: params.page,
    );
  }
}

/// Parameters for the [GetFavorites] use case.
class FavoritesParams extends Equatable {
  final String deviceId;
  final int page;

  const FavoritesParams({required this.deviceId, required this.page});

  @override
  List<Object?> get props => [deviceId, page];
}
