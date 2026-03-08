import 'package:equatable/equatable.dart';

/// Actions that can earn a user points in the gamification system.
enum PointAction {
  quizComplete,
  endorsement,
  pollVote,
  eventRsvp,
  comment,
  share,
  loginStreak,
  profileComplete,
  dailyQuizComplete,
  articleRead,
  dailyLogin,
  streakBonus,
}

/// Immutable entity representing a single points-earning event.
class UserPointsEntry extends Equatable {
  final String id;
  final PointAction action;
  final int points;
  final DateTime earnedAt;

  const UserPointsEntry({
    required this.id,
    required this.action,
    required this.points,
    required this.earnedAt,
  });

  @override
  List<Object?> get props => [id, action, points, earnedAt];
}
