import '../../domain/entities/poll_vote.dart';

/// Data model for a poll vote. Handles JSON serialization.
///
/// Maps API responses to the domain [PollVote] entity via [toEntity].
class PollVoteModel {
  final String id;
  final String pollId;
  final int optionIndex;
  final DateTime createdAt;

  const PollVoteModel({
    required this.id,
    required this.pollId,
    required this.optionIndex,
    required this.createdAt,
  });

  factory PollVoteModel.fromJson(Map<String, dynamic> json) {
    return PollVoteModel(
      id: json['id'] as String,
      pollId: json['pollId'] as String,
      optionIndex: json['optionIndex'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pollId': pollId,
      'optionIndex': optionIndex,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  PollVote toEntity() {
    return PollVote(
      id: id,
      pollId: pollId,
      optionIndex: optionIndex,
      createdAt: createdAt,
    );
  }
}
