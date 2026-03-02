import 'package:equatable/equatable.dart';

/// Represents a user's vote on a community poll.
class PollVote extends Equatable {
  final String id;
  final String pollId;
  final int optionIndex;
  final DateTime createdAt;

  const PollVote({
    required this.id,
    required this.pollId,
    required this.optionIndex,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, pollId, optionIndex, createdAt];
}
