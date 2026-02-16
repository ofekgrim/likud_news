import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';

/// Abstract contract for the favorites & reading history feature data operations.
///
/// Implemented by [FavoritesRepositoryImpl] in the data layer.
abstract class FavoritesRepository {
  /// Fetches a paginated list of the user's favorite articles.
  ///
  /// [deviceId] identifies the current device.
  /// [page] starts at 1. Each page returns a fixed number of articles.
  Future<Either<Failure, List<Article>>> getFavorites({
    required String deviceId,
    required int page,
  });

  /// Removes an article from the user's favorites.
  ///
  /// [deviceId] identifies the current device.
  /// [articleId] is the ID of the article to remove.
  Future<Either<Failure, void>> removeFavorite({
    required String deviceId,
    required int articleId,
  });

  /// Fetches a paginated list of the user's reading history.
  ///
  /// [deviceId] identifies the current device.
  /// [page] starts at 1. Each page returns a fixed number of articles.
  Future<Either<Failure, List<Article>>> getReadingHistory({
    required String deviceId,
    required int page,
  });
}
