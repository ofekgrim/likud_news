import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/leaderboard_entry_model.dart';
import '../models/user_points_entry_model.dart';

/// Contract for the gamification remote data source.
abstract class GamificationRemoteDataSource {
  /// Fetches the authenticated user's total points.
  ///
  /// Throws a [DioException] on failure.
  Future<int> getUserPoints();

  /// Fetches the authenticated user's paginated points history.
  ///
  /// Throws a [DioException] on failure.
  Future<List<UserPointsEntryModel>> getPointsHistory({required int page});

  /// Fetches the authenticated user's earned badges as raw JSON maps.
  ///
  /// Each map contains `id`, `badgeType`, and `earnedAt`.
  /// Throws a [DioException] on failure.
  Future<List<Map<String, dynamic>>> getUserBadges();

  /// Fetches the authenticated user's rank for a given time period.
  ///
  /// Throws a [DioException] on failure.
  Future<int> getUserRank({required String period});

  /// Fetches the public leaderboard.
  ///
  /// Throws a [DioException] on failure.
  Future<List<LeaderboardEntryModel>> getLeaderboard({
    required String period,
    required int page,
    int limit = 20,
    String? district,
  });

  /// Fetches the authenticated user's full gamification profile.
  ///
  /// Throws a [DioException] on failure.
  Future<Map<String, dynamic>> getMyProfile();

  /// Fetches the authenticated user's streak data.
  ///
  /// Throws a [DioException] on failure.
  Future<Map<String, dynamic>> getStreak();

  /// Tracks a user action for gamification purposes.
  ///
  /// [action] is the action type (e.g., 'article_read', 'daily_login').
  /// [metadata] is optional additional data for the action.
  /// Throws a [DioException] on failure.
  Future<void> trackAction(String action, {Map<String, dynamic>? metadata});
}

/// Implementation of [GamificationRemoteDataSource] using [ApiClient].
@LazySingleton(as: GamificationRemoteDataSource)
class GamificationRemoteDataSourceImpl implements GamificationRemoteDataSource {
  final ApiClient _apiClient;

  GamificationRemoteDataSourceImpl(this._apiClient);

  @override
  Future<int> getUserPoints() async {
    final response = await _apiClient.get('/gamification/me/points');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data['totalPoints'] as int;
    }
    return 0;
  }

  @override
  Future<List<UserPointsEntryModel>> getPointsHistory({
    required int page,
  }) async {
    final response = await _apiClient.get(
      '/gamification/me/points/history',
      queryParameters: {
        'page': page,
        'limit': 20,
      },
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => UserPointsEntryModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<Map<String, dynamic>>> getUserBadges() async {
    final response = await _apiClient.get('/gamification/me/badges');
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items.cast<Map<String, dynamic>>();
  }

  @override
  Future<int> getUserRank({required String period}) async {
    final response = await _apiClient.get(
      '/gamification/me/rank',
      queryParameters: {'period': period},
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data['rank'] as int;
    }
    return 0;
  }

  @override
  Future<List<LeaderboardEntryModel>> getLeaderboard({
    required String period,
    required int page,
    int limit = 20,
    String? district,
  }) async {
    final queryParameters = <String, dynamic>{
      'period': period,
      'page': page,
      'limit': limit,
    };
    if (district != null) {
      queryParameters['district'] = district;
    }

    final response = await _apiClient.get(
      ApiConstants.gamificationLeaderboard,
      queryParameters: queryParameters,
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) =>
            LeaderboardEntryModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await _apiClient.get('/gamification/me');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data;
    }
    return {};
  }

  @override
  Future<Map<String, dynamic>> getStreak() async {
    final response = await _apiClient.get('/gamification/me/streak');
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data;
    }
    return {};
  }

  @override
  Future<void> trackAction(String action, {Map<String, dynamic>? metadata}) async {
    await _apiClient.post(
      '/gamification/track',
      data: {
        'action': action,
        if (metadata != null) 'metadata': metadata,
      },
    );
  }
}
