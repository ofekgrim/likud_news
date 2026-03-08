import '../../domain/entities/user_points_entry.dart';

/// Data model for points history entries, handles JSON serialization.
///
/// Maps API responses to the domain [UserPointsEntry] entity via [toEntity].
class UserPointsEntryModel {
  final String id;
  final String action;
  final int points;
  final DateTime earnedAt;

  const UserPointsEntryModel({
    required this.id,
    required this.action,
    required this.points,
    required this.earnedAt,
  });

  factory UserPointsEntryModel.fromJson(Map<String, dynamic> json) {
    return UserPointsEntryModel(
      id: json['id'] as String,
      action: json['action'] as String,
      points: json['points'] as int,
      earnedAt: DateTime.parse(json['earnedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'action': action,
      'points': points,
      'earnedAt': earnedAt.toIso8601String(),
    };
  }

  /// Converts the raw action string from the API to a [PointAction] enum value.
  static PointAction _parseAction(String action) {
    switch (action) {
      case 'quiz_complete':
        return PointAction.quizComplete;
      case 'endorsement':
        return PointAction.endorsement;
      case 'poll_vote':
        return PointAction.pollVote;
      case 'event_rsvp':
        return PointAction.eventRsvp;
      case 'comment':
        return PointAction.comment;
      case 'share':
        return PointAction.share;
      case 'login_streak':
        return PointAction.loginStreak;
      case 'profile_complete':
        return PointAction.profileComplete;
      case 'daily_quiz_complete':
        return PointAction.dailyQuizComplete;
      case 'article_read':
        return PointAction.articleRead;
      case 'daily_login':
        return PointAction.dailyLogin;
      case 'streak_bonus':
        return PointAction.streakBonus;
      default:
        return PointAction.comment;
    }
  }

  UserPointsEntry toEntity() {
    return UserPointsEntry(
      id: id,
      action: _parseAction(action),
      points: points,
      earnedAt: earnedAt,
    );
  }
}
