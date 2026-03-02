import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/polls_repository.dart';

/// Submits a vote on a community poll.
@injectable
class VoteOnPoll implements UseCase<void, VoteOnPollParams> {
  final PollsRepository repository;

  VoteOnPoll(this.repository);

  @override
  Future<Either<Failure, void>> call(VoteOnPollParams params) {
    return repository.vote(
      pollId: params.pollId,
      optionIndex: params.optionIndex,
    );
  }
}

/// Parameters for the [VoteOnPoll] use case.
class VoteOnPollParams extends Equatable {
  final String pollId;
  final int optionIndex;

  const VoteOnPollParams({
    required this.pollId,
    required this.optionIndex,
  });

  @override
  List<Object?> get props => [pollId, optionIndex];
}
