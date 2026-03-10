import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/community_poll.dart';
import '../entities/poll_vote.dart';

/// Abstract contract for community polls data operations.
///
/// Implemented by [PollsRepositoryImpl] in the data layer.
abstract class PollsRepository {
  /// Fetches the list of community polls.
  ///
  /// When [activeOnly] is true, only active polls are returned.
  Future<Either<Failure, List<CommunityPoll>>> getPolls({
    bool activeOnly = true,
  });

  /// Fetches a single poll by its [id].
  Future<Either<Failure, CommunityPoll>> getPoll(String id);

  /// Submits a vote on a poll.
  ///
  /// [pollId] is the ID of the poll to vote on.
  /// [optionIndex] is the index of the selected option.
  Future<Either<Failure, void>> vote({
    required String pollId,
    required int optionIndex,
  });

  /// Gets the current user's vote for a poll (if any).
  ///
  /// Returns null inside Right if the user hasn't voted yet.
  Future<Either<Failure, PollVote?>> getMyVote(String pollId);

  /// Fetches the results/updated data for a poll.
  Future<Either<Failure, CommunityPoll>> getResults(String pollId);
}
