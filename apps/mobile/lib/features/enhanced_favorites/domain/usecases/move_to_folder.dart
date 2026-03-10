import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/enhanced_favorites_repository.dart';

/// Moves a favorited article into a folder, or removes it from its current folder.
@injectable
class MoveToFolder implements UseCase<void, MoveToFolderParams> {
  final EnhancedFavoritesRepository repository;

  MoveToFolder(this.repository);

  @override
  Future<Either<Failure, void>> call(MoveToFolderParams params) {
    return repository.moveToFolder(
      articleId: params.articleId,
      folderId: params.folderId,
    );
  }
}

/// Parameters for the [MoveToFolder] use case.
///
/// If [folderId] is null, the article is removed from any folder.
class MoveToFolderParams extends Equatable {
  final String articleId;
  final String? folderId;

  const MoveToFolderParams({
    required this.articleId,
    this.folderId,
  });

  @override
  List<Object?> get props => [articleId, folderId];
}
