import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/bookmark_folder.dart';
import '../repositories/enhanced_favorites_repository.dart';

/// Fetches all bookmark folders for the authenticated user.
@injectable
class GetFolders implements UseCase<List<BookmarkFolder>, NoParams> {
  final EnhancedFavoritesRepository repository;

  GetFolders(this.repository);

  @override
  Future<Either<Failure, List<BookmarkFolder>>> call(NoParams params) {
    return repository.getFolders();
  }
}
