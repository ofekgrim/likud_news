import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../home/domain/entities/story.dart';

/// Contract for the stories repository.
abstract class StoriesRepository {
  /// Fetches active stories.
  Future<Either<Failure, List<Story>>> getStories();
}
