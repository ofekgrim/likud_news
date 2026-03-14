import 'package:equatable/equatable.dart';

/// A single option within a community poll.
class PollOption extends Equatable {
  final String label;
  final int voteCount;

  const PollOption({
    required this.label,
    this.voteCount = 0,
  });

  @override
  List<Object?> get props => [label, voteCount];
}

/// Immutable community poll entity used throughout the domain and
/// presentation layers.
class CommunityPoll extends Equatable {
  final String id;
  final String question;
  final String? description;
  final List<PollOption> options;
  final int totalVotes;
  final bool isPinned;
  final bool isActive;
  final DateTime? closedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? myVoteOptionIndex;

  const CommunityPoll({
    required this.id,
    required this.question,
    this.description,
    this.options = const [],
    this.totalVotes = 0,
    this.isPinned = false,
    this.isActive = true,
    this.closedAt,
    required this.createdAt,
    required this.updatedAt,
    this.myVoteOptionIndex,
  });

  /// Whether the poll is still open for voting.
  bool get isOpen => isActive && closedAt == null;

  /// Returns the percentage of votes for a given option index.
  double percentageFor(int index) {
    if (totalVotes == 0 || index < 0 || index >= options.length) return 0;
    return options[index].voteCount / totalVotes;
  }

  /// Creates a copy with the vote applied optimistically.
  CommunityPoll withVote(int optionIndex) {
    if (optionIndex < 0 || optionIndex >= options.length) return this;
    final updatedOptions = List<PollOption>.from(options);
    final old = updatedOptions[optionIndex];
    updatedOptions[optionIndex] = PollOption(
      label: old.label,
      voteCount: old.voteCount + 1,
    );
    return CommunityPoll(
      id: id,
      question: question,
      description: description,
      options: updatedOptions,
      totalVotes: totalVotes + 1,
      isPinned: isPinned,
      isActive: isActive,
      closedAt: closedAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
      myVoteOptionIndex: optionIndex,
    );
  }

  @override
  List<Object?> get props => [
        id,
        question,
        description,
        options,
        totalVotes,
        isPinned,
        isActive,
        closedAt,
        createdAt,
        updatedAt,
        myVoteOptionIndex,
      ];
}
