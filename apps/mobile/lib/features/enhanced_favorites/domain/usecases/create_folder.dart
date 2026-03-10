import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/bookmark_folder.dart';
import '../repositories/enhanced_favorites_repository.dart';

/// Creates a new bookmark folder for organizing favorites.
@injectable
class CreateFolder implements UseCase<BookmarkFolder, CreateFolderParams> {
  final EnhancedFavoritesRepository repository;

  CreateFolder(this.repository);

  @override
  Future<Either<Failure, BookmarkFolder>> call(CreateFolderParams params) {
    return repository.createFolder(
      name: params.name,
      color: params.color,
    );
  }
}

/// Parameters for the [CreateFolder] use case.
class CreateFolderParams extends Equatable {
  final String name;
  final String? color;

  const CreateFolderParams({
    required this.name,
    this.color,
  });

  @override
  List<Object?> get props => [name, color];
}
