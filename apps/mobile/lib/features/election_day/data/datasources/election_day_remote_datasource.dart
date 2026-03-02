import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/election_result_model.dart';
import '../models/polling_station_model.dart';
import '../models/turnout_snapshot_model.dart';

/// Contract for the Election Day remote data source.
abstract class ElectionDayRemoteDataSource {
  /// Resolves 'active' to the real election UUID.
  ///
  /// Fetches elections with status=active and returns the first one's ID.
  /// Returns null if no active election exists.
  Future<String?> resolveActiveElectionId();

  /// Fetches a paginated list of polling stations from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<PollingStationModel>> getPollingStations({
    String? electionId,
    String? district,
    String? city,
    int page = 1,
  });

  /// Fetches a single polling station by [id].
  ///
  /// Throws a [DioException] on failure.
  Future<PollingStationModel> getStationById(String id);

  /// Submits a wait-time report for a polling station.
  ///
  /// Returns the created report data as a JSON map.
  /// Throws a [DioException] on failure.
  Future<Map<String, dynamic>> submitReport({
    required String stationId,
    required int waitMinutes,
    String? crowdLevel,
    String? note,
  });

  /// Fetches election results for a given [electionId].
  ///
  /// Throws a [DioException] on failure.
  Future<List<ElectionResultModel>> getElectionResults(String electionId);

  /// Fetches turnout snapshots for a given [electionId].
  ///
  /// Throws a [DioException] on failure.
  Future<List<TurnoutSnapshotModel>> getTurnoutSnapshots(String electionId);

  /// Fetches the turnout timeline (time-series) for a given [electionId].
  ///
  /// Throws a [DioException] on failure.
  Future<List<TurnoutSnapshotModel>> getTurnoutTimeline(String electionId);
}

/// Implementation of [ElectionDayRemoteDataSource] using [ApiClient].
@LazySingleton(as: ElectionDayRemoteDataSource)
class ElectionDayRemoteDataSourceImpl implements ElectionDayRemoteDataSource {
  final ApiClient _apiClient;

  ElectionDayRemoteDataSourceImpl(this._apiClient);

  @override
  Future<String?> resolveActiveElectionId() async {
    final response = await _apiClient.get(
      ApiConstants.elections,
      queryParameters: {'status': 'active'},
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data is List<dynamic>
                ? data
                : [];
    if (items.isEmpty) return null;

    // Pick the election with electionDate closest to now.
    final now = DateTime.now();
    Map<String, dynamic>? best;
    Duration? bestDiff;

    for (final item in items) {
      final map = item as Map<String, dynamic>;
      final dateStr = map['electionDate'] as String?;
      if (dateStr == null) continue;
      final date = DateTime.tryParse(dateStr);
      if (date == null) continue;
      final diff = date.difference(now).abs();
      if (bestDiff == null || diff < bestDiff) {
        best = map;
        bestDiff = diff;
      }
    }

    return (best ?? items.first as Map<String, dynamic>)['id'] as String?;
  }

  @override
  Future<List<PollingStationModel>> getPollingStations({
    String? electionId,
    String? district,
    String? city,
    int page = 1,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': 50,
    };
    if (electionId != null) queryParams['electionId'] = electionId;
    if (district != null) queryParams['district'] = district;
    if (city != null) queryParams['city'] = city;

    final response = await _apiClient.get(
      ApiConstants.pollingStations,
      queryParameters: queryParams,
    );

    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data is List<dynamic>
                ? data
                : [];
    return items
        .map((json) =>
            PollingStationModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<PollingStationModel> getStationById(String id) async {
    final response = await _apiClient.get('${ApiConstants.pollingStations}/$id');
    final data = response.data;
    final Map<String, dynamic> json =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return PollingStationModel.fromJson(json);
  }

  @override
  Future<Map<String, dynamic>> submitReport({
    required String stationId,
    required int waitMinutes,
    String? crowdLevel,
    String? note,
  }) async {
    final response = await _apiClient.post(
      '${ApiConstants.pollingStations}/$stationId/report',
      data: {
        'waitMinutes': waitMinutes,
        if (crowdLevel != null) 'crowdLevel': crowdLevel,
        if (note != null) 'note': note,
      },
    );
    final data = response.data;
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }

  @override
  Future<List<ElectionResultModel>> getElectionResults(
    String electionId,
  ) async {
    final response = await _apiClient.get(
      '${ApiConstants.electionResults}/election/$electionId',
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data is List<dynamic>
                ? data
                : [];
    return items
        .map((json) =>
            ElectionResultModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<TurnoutSnapshotModel>> getTurnoutSnapshots(
    String electionId,
  ) async {
    final response = await _apiClient.get(
      '${ApiConstants.electionResults}/turnout/$electionId',
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data is List<dynamic>
                ? data
                : [];
    return items
        .map((json) =>
            TurnoutSnapshotModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<TurnoutSnapshotModel>> getTurnoutTimeline(
    String electionId,
  ) async {
    final response = await _apiClient.get(
      '${ApiConstants.electionResults}/turnout/$electionId/timeline',
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data is List<dynamic>
                ? data
                : [];
    return items
        .map((json) =>
            TurnoutSnapshotModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
