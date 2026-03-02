import '../../domain/entities/community_poll.dart';

/// Data model for a single poll option. Handles JSON serialization.
class PollOptionModel {
  final String label;
  final int voteCount;

  const PollOptionModel({
    required this.label,
    this.voteCount = 0,
  });

  factory PollOptionModel.fromJson(Map<String, dynamic> json) {
    return PollOptionModel(
      label: json['label'] as String,
      voteCount: json['voteCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'voteCount': voteCount,
    };
  }

  PollOption toEntity() {
    return PollOption(
      label: label,
      voteCount: voteCount,
    );
  }
}

/// Data model for community polls. Handles JSON serialization.
///
/// Maps API responses to the domain [CommunityPoll] entity via [toEntity].
class CommunityPollModel {
  final String id;
  final String question;
  final String? description;
  final List<PollOptionModel> options;
  final int totalVotes;
  final bool isPinned;
  final bool isActive;
  final DateTime? closedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CommunityPollModel({
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
  });

  factory CommunityPollModel.fromJson(Map<String, dynamic> json) {
    return CommunityPollModel(
      id: json['id'] as String,
      question: json['question'] as String,
      description: json['description'] as String?,
      options: (json['options'] as List<dynamic>?)
              ?.map((e) =>
                  PollOptionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      totalVotes: json['totalVotes'] as int? ?? 0,
      isPinned: json['isPinned'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      closedAt: json['closedAt'] != null
          ? DateTime.tryParse(json['closedAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question': question,
      'description': description,
      'options': options.map((o) => o.toJson()).toList(),
      'totalVotes': totalVotes,
      'isPinned': isPinned,
      'isActive': isActive,
      'closedAt': closedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  CommunityPoll toEntity() {
    return CommunityPoll(
      id: id,
      question: question,
      description: description,
      options: options.map((o) => o.toEntity()).toList(),
      totalVotes: totalVotes,
      isPinned: isPinned,
      isActive: isActive,
      closedAt: closedAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
