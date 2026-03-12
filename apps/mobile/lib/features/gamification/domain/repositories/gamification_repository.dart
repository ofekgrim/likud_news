import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/leaderboard_entry.dart';
import '../entities/tier_info.dart';
import '../entities/user_badge.dart';
import '../entities/user_points_entry.dart';
import '../entities/user_streak.dart';

/// Abstract contract for the gamification feature data operations.
///
/// Implemented by [GamificationRepositoryImpl] in the data layer.
abstract class GamificationRepository {
  /// Fetches the authenticated user's total points.
  ///
  /// Returns a map with at least `totalPoints` as an int.
  Future<Either<Failure, int>> getUserPoints();

  /// Fetches the authenticated user's paginated points history.
  ///
  /// [page] starts at 1. Each page returns a fixed number of entries.
  Future<Either<Failure, List<UserPointsEntry>>> getPointsHistory({
    required int page,
  });

  /// Fetches the authenticated user's earned badges.
  Future<Either<Failure, List<UserBadge>>> getUserBadges();

  /// Fetches the authenticated user's rank for a given time period.
  ///
  /// [period] is one of: `weekly`, `monthly`, `all_time`.
  Future<Either<Failure, int>> getUserRank({
    required String period,
  });

  /// Fetches the public leaderboard.
  ///
  /// [period] filters by time period (weekly, monthly, all_time).
  /// [page] and [limit] control pagination.
  /// [district] optionally filters by district.
  Future<Either<Failure, List<LeaderboardEntry>>> getLeaderboard({
    required String period,
    required int page,
    int limit = 20,
    String? district,
  });

  /// Fetches the authenticated user's streak data.
  Future<Either<Failure, UserStreak>> getStreak();

  /// Tracks a user action for gamification purposes.
  ///
  /// [action] is the action type (e.g., 'article_read', 'daily_login').
  /// [metadata] is optional additional data for the action.
  Future<Either<Failure, void>> trackAction(
    String action, {
    Map<String, dynamic>? metadata,
  });

  /// Uses a freeze token to protect the current streak.
  Future<Either<Failure, UserStreak>> useStreakFreeze();

  /// Fetches the authenticated user's tier progression info.
  Future<Either<Failure, TierInfo>> getTierInfo();
}
