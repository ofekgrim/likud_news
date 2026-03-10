import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/leaderboard_entry.dart';
import '../../domain/entities/user_badge.dart';
import '../../domain/entities/user_points_entry.dart';
import '../../domain/entities/user_streak.dart';
import '../../domain/repositories/gamification_repository.dart';
import '../datasources/gamification_remote_datasource.dart';

/// Concrete implementation of [GamificationRepository].
///
/// Wraps remote datasource calls with try/catch error handling,
/// mapping exceptions to typed [Failure] instances.
@LazySingleton(as: GamificationRepository)
class GamificationRepositoryImpl implements GamificationRepository {
  final GamificationRemoteDataSource _remoteDataSource;

  GamificationRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, int>> getUserPoints() async {
    try {
      final totalPoints = await _remoteDataSource.getUserPoints();
      return Right(totalPoints);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<UserPointsEntry>>> getPointsHistory({
    required int page,
  }) async {
    try {
      final models = await _remoteDataSource.getPointsHistory(page: page);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<UserBadge>>> getUserBadges() async {
    try {
      final rawBadges = await _remoteDataSource.getUserBadges();
      final badges = rawBadges.map((json) {
        final badgeTypeStr = json['badgeType'] as String;
        return UserBadge(
          id: json['id'] as String,
          badgeType: _parseBadgeType(badgeTypeStr),
          earnedAt: DateTime.parse(json['earnedAt'] as String),
        );
      }).toList();
      return Right(badges);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, int>> getUserRank({
    required String period,
  }) async {
    try {
      final rank = await _remoteDataSource.getUserRank(period: period);
      return Right(rank);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<LeaderboardEntry>>> getLeaderboard({
    required String period,
    required int page,
    int limit = 20,
    String? district,
  }) async {
    try {
      final models = await _remoteDataSource.getLeaderboard(
        period: period,
        page: page,
        limit: limit,
        district: district,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserStreak>> getStreak() async {
    try {
      final data = await _remoteDataSource.getStreak();
      final streak = UserStreak(
        currentStreak: data['currentStreak'] as int? ?? 0,
        longestStreak: data['longestStreak'] as int? ?? 0,
        lastActivityDate: data['lastActivityDate'] != null
            ? DateTime.parse(data['lastActivityDate'] as String)
            : null,
      );
      return Right(streak);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> trackAction(
    String action, {
    Map<String, dynamic>? metadata,
  }) async {
    try {
      await _remoteDataSource.trackAction(action, metadata: metadata);
      return const Right(null);
    } on DioException catch (e) {
      return Left(_mapDioException(e));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  /// Converts a raw badge type string from the API to a [BadgeType] enum value.
  static BadgeType _parseBadgeType(String type) {
    switch (type) {
      case 'quiz_taker':
        return BadgeType.quizTaker;
      case 'first_vote':
        return BadgeType.firstVote;
      case 'endorser':
        return BadgeType.endorser;
      case 'poll_voter':
        return BadgeType.pollVoter;
      case 'event_goer':
        return BadgeType.eventGoer;
      case 'top_contributor':
        return BadgeType.topContributor;
      case 'early_bird':
        return BadgeType.earlyBird;
      case 'social_sharer':
        return BadgeType.socialSharer;
      case 'streak_7':
        return BadgeType.streak7;
      case 'streak_30':
        return BadgeType.streak30;
      case 'streak_100':
        return BadgeType.streak100;
      case 'quiz_master':
        return BadgeType.quizMaster;
      case 'news_junkie':
        return BadgeType.newsJunkie;
      case 'community_voice':
        return BadgeType.communityVoice;
      default:
        return BadgeType.quizTaker;
    }
  }

  /// Maps Dio exceptions to domain [Failure] types.
  Failure _mapDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return const NetworkFailure();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message =
            e.response?.data is Map<String, dynamic>
                ? (e.response!.data as Map<String, dynamic>)['message']
                    as String?
                : null;
        return ServerFailure(
          message: message ?? 'Server error',
          statusCode: statusCode,
        );
      default:
        return ServerFailure(message: e.message ?? 'Unexpected error');
    }
  }
}
