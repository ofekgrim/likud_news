import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/ama_session.dart';
import '../repositories/ama_repository.dart';

/// Fetches the list of AMA sessions.
@injectable
class GetAmaSessions implements UseCase<List<AmaSession>, NoParams> {
  final AmaRepository repository;

  GetAmaSessions(this.repository);

  @override
  Future<Either<Failure, List<AmaSession>>> call(NoParams params) {
    return repository.getSessions();
  }
}
