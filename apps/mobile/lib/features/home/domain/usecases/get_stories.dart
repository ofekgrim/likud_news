import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/story.dart';
import '../repositories/home_repository.dart';

/// Fetches active stories for the home screen story circles.
@injectable
class GetStories implements UseCase<List<Story>, NoParams> {
  final HomeRepository repository;

  GetStories(this.repository);

  @override
  Future<Either<Failure, List<Story>>> call(NoParams params) {
    return repository.getStories();
  }
}
