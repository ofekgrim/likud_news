import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/bookmark_folder.dart';
import '../repositories/enhanced_favorites_repository.dart';

/// Updates an existing bookmark folder's properties.
@injectable
class UpdateFolder implements UseCase<BookmarkFolder, UpdateFolderParams> {
  final EnhancedFavoritesRepository repository;

  UpdateFolder(this.repository);

  @override
  Future<Either<Failure, BookmarkFolder>> call(UpdateFolderParams params) {
    return repository.updateFolder(
      id: params.id,
      name: params.name,
      color: params.color,
      sortOrder: params.sortOrder,
      isPublic: params.isPublic,
    );
  }
}

/// Parameters for the [UpdateFolder] use case.
class UpdateFolderParams extends Equatable {
  final String id;
  final String? name;
  final String? color;
  final int? sortOrder;
  final bool? isPublic;

  const UpdateFolderParams({
    required this.id,
    this.name,
    this.color,
    this.sortOrder,
    this.isPublic,
  });

  @override
  List<Object?> get props => [id, name, color, sortOrder, isPublic];
}
