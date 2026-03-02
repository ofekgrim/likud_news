import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/community_poll.dart';
import '../repositories/polls_repository.dart';

/// Fetches the list of community polls.
@injectable
class GetPolls implements UseCase<List<CommunityPoll>, NoParams> {
  final PollsRepository repository;

  GetPolls(this.repository);

  @override
  Future<Either<Failure, List<CommunityPoll>>> call(NoParams params) {
    return repository.getPolls();
  }
}
