import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/article.dart';
import '../entities/bookmark_folder.dart';

/// Abstract contract for the enhanced favorites feature data operations.
///
/// Implemented by [EnhancedFavoritesRepositoryImpl] in the data layer.
abstract class EnhancedFavoritesRepository {
  /// Fetches all bookmark folders for the authenticated user.
  Future<Either<Failure, List<BookmarkFolder>>> getFolders();

  /// Creates a new bookmark folder.
  ///
  /// [name] is the display name for the folder.
  /// [color] is an optional hex color string.
  Future<Either<Failure, BookmarkFolder>> createFolder({
    required String name,
    String? color,
  });

  /// Updates an existing bookmark folder.
  ///
  /// Only non-null fields are updated.
  Future<Either<Failure, BookmarkFolder>> updateFolder({
    required String id,
    String? name,
    String? color,
    int? sortOrder,
    bool? isPublic,
  });

  /// Deletes a bookmark folder by [id].
  ///
  /// Articles in the folder are not deleted, only un-assigned.
  Future<Either<Failure, void>> deleteFolder({required String id});

  /// Fetches a paginated list of favorites in a specific folder.
  ///
  /// [folderId] is the target folder.
  /// [page] starts at 1, [limit] defaults to 20.
  Future<Either<Failure, List<Article>>> getFolderFavorites({
    required String folderId,
    int page = 1,
    int limit = 20,
  });

  /// Moves a favorite article into a folder, or removes it from its folder.
  ///
  /// If [folderId] is null, the article is removed from any folder.
  Future<Either<Failure, void>> moveToFolder({
    required String articleId,
    String? folderId,
  });

  /// Updates the personal note attached to a favorited article.
  Future<Either<Failure, void>> updateNote({
    required String articleId,
    required String note,
  });
}
