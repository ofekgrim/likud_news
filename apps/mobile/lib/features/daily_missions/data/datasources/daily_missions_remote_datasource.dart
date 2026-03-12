import 'package:injectable/injectable.dart';

import '../../../../core/network/api_client.dart';
import '../models/daily_mission_model.dart';
import '../models/daily_missions_summary_model.dart';

/// Contract for the daily missions remote data source.
abstract class DailyMissionsRemoteDataSource {
  /// Fetches today's daily missions summary.
  ///
  /// Throws a [DioException] on failure.
  Future<DailyMissionsSummaryModel> getTodayMissions();

  /// Completes a specific mission by its ID.
  ///
  /// Returns the updated mission data.
  /// Throws a [DioException] on failure.
  Future<DailyMissionModel> completeMission(String missionId);
}

/// Implementation of [DailyMissionsRemoteDataSource] using [ApiClient].
@LazySingleton(as: DailyMissionsRemoteDataSource)
class DailyMissionsRemoteDataSourceImpl
    implements DailyMissionsRemoteDataSource {
  final ApiClient _apiClient;

  DailyMissionsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<DailyMissionsSummaryModel> getTodayMissions() async {
    final response = await _apiClient.get(
      '/engagement/missions/today',
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final payload = data.containsKey('data')
          ? data['data'] as Map<String, dynamic>
          : data;
      return DailyMissionsSummaryModel.fromJson(payload);
    }
    return DailyMissionsSummaryModel(
      missions: const [],
      date: DateTime.now(),
    );
  }

  @override
  Future<DailyMissionModel> completeMission(String missionId) async {
    final response = await _apiClient.post(
      '/engagement/missions/$missionId/complete',
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final payload = data.containsKey('data')
          ? data['data'] as Map<String, dynamic>
          : data;
      return DailyMissionModel.fromJson(payload);
    }
    throw Exception('Invalid response for completeMission');
  }
}
