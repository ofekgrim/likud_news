import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

/// Types of badges a user can earn.
enum BadgeType {
  quizTaker,
  firstVote,
  endorser,
  pollVoter,
  eventGoer,
  topContributor,
  earlyBird,
  socialSharer,
}

/// Extension providing display metadata for each badge type.
extension BadgeTypeDisplay on BadgeType {
  /// Returns the i18n key for the badge display name.
  String get i18nKey {
    switch (this) {
      case BadgeType.quizTaker:
        return 'badge_quiz_taker';
      case BadgeType.firstVote:
        return 'badge_first_vote';
      case BadgeType.endorser:
        return 'badge_endorser';
      case BadgeType.pollVoter:
        return 'badge_poll_voter';
      case BadgeType.eventGoer:
        return 'badge_event_goer';
      case BadgeType.topContributor:
        return 'badge_top_contributor';
      case BadgeType.earlyBird:
        return 'badge_early_bird';
      case BadgeType.socialSharer:
        return 'badge_social_sharer';
    }
  }

  /// Returns the Material icon associated with this badge type.
  IconData get icon {
    switch (this) {
      case BadgeType.quizTaker:
        return Icons.quiz;
      case BadgeType.firstVote:
        return Icons.how_to_vote;
      case BadgeType.endorser:
        return Icons.thumb_up;
      case BadgeType.pollVoter:
        return Icons.poll;
      case BadgeType.eventGoer:
        return Icons.event;
      case BadgeType.topContributor:
        return Icons.star;
      case BadgeType.earlyBird:
        return Icons.access_alarm;
      case BadgeType.socialSharer:
        return Icons.share;
    }
  }
}

/// Immutable entity representing a badge earned by the user.
class UserBadge extends Equatable {
  final String id;
  final BadgeType badgeType;
  final DateTime earnedAt;

  const UserBadge({
    required this.id,
    required this.badgeType,
    required this.earnedAt,
  });

  @override
  List<Object?> get props => [id, badgeType, earnedAt];
}
