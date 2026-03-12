import 'package:injectable/injectable.dart';

import '../../../../core/network/api_client.dart';
import '../models/branch_leaderboard_model.dart';

/// Contract for the branch leaderboard remote data source.
abstract class BranchLeaderboardRemoteDataSource {
  /// Fetches the branch leaderboard for the given period.
  ///
  /// [period] is one of: `current`, `previous`, `all_time`.
  /// [limit] controls how many branches to return (default 50).
  /// Throws a [DioException] on failure.
  Future<BranchLeaderboardModel> getBranchLeaderboard({
    String? period,
    int? limit,
  });

  /// Fetches the national leaderboard.
  ///
  /// Throws a [DioException] on failure.
  Future<BranchLeaderboardModel> getNationalLeaderboard();
}

/// Implementation of [BranchLeaderboardRemoteDataSource] using [ApiClient].
@LazySingleton(as: BranchLeaderboardRemoteDataSource)
class BranchLeaderboardRemoteDataSourceImpl
    implements BranchLeaderboardRemoteDataSource {
  final ApiClient _apiClient;

  BranchLeaderboardRemoteDataSourceImpl(this._apiClient);

  @override
  Future<BranchLeaderboardModel> getBranchLeaderboard({
    String? period,
    int? limit,
  }) async {
    final queryParameters = <String, dynamic>{
      'period': period ?? 'current',
      'limit': limit ?? 50,
    };

    final response = await _apiClient.get(
      '/engagement/leaderboard/branches',
      queryParameters: queryParameters,
    );

    final data = response.data;
    if (data is Map<String, dynamic>) {
      return BranchLeaderboardModel.fromJson(data);
    }
    return BranchLeaderboardModel(
      scores: const [],
      weekStart: DateTime.now(),
    );
  }

  @override
  Future<BranchLeaderboardModel> getNationalLeaderboard() async {
    final response = await _apiClient.get(
      '/engagement/leaderboard/national',
    );

    final data = response.data;
    if (data is Map<String, dynamic>) {
      return BranchLeaderboardModel.fromJson(data);
    }
    return BranchLeaderboardModel(
      scores: const [],
      weekStart: DateTime.now(),
    );
  }
}
