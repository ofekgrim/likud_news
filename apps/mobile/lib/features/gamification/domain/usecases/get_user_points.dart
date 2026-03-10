import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/gamification_repository.dart';

/// Fetches the authenticated user's total points.
@injectable
class GetUserPoints implements UseCase<int, NoParams> {
  final GamificationRepository repository;

  GetUserPoints(this.repository);

  @override
  Future<Either<Failure, int>> call(NoParams params) {
    return repository.getUserPoints();
  }
}
