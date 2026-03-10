import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/story.dart';
import '../repositories/stories_repository.dart';

/// Fetches active stories for the stories tab.
@lazySingleton
class GetStoriesUseCase implements UseCase<List<Story>, NoParams> {
  final StoriesRepository _repository;

  GetStoriesUseCase(this._repository);

  @override
  Future<Either<Failure, List<Story>>> call(NoParams params) {
    return _repository.getStories();
  }
}
