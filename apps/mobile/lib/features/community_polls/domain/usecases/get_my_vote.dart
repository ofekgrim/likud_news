import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/poll_vote.dart';
import '../repositories/polls_repository.dart';

/// Retrieves the current user's vote for a specific poll.
///
/// Returns null inside Right if the user hasn't voted yet.
@injectable
class GetMyVote implements UseCase<PollVote?, String> {
  final PollsRepository repository;

  GetMyVote(this.repository);

  @override
  Future<Either<Failure, PollVote?>> call(String pollId) {
    return repository.getMyVote(pollId);
  }
}
