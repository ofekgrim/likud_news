import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/enhanced_favorites_repository.dart';

/// Deletes a bookmark folder.
///
/// Articles in the folder are not deleted, only un-assigned from the folder.
@injectable
class DeleteFolder implements UseCase<void, DeleteFolderParams> {
  final EnhancedFavoritesRepository repository;

  DeleteFolder(this.repository);

  @override
  Future<Either<Failure, void>> call(DeleteFolderParams params) {
    return repository.deleteFolder(id: params.id);
  }
}

/// Parameters for the [DeleteFolder] use case.
class DeleteFolderParams extends Equatable {
  final String id;

  const DeleteFolderParams({required this.id});

  @override
  List<Object?> get props => [id];
}
