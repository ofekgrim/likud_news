import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/compare_result_model.dart';

/// Contract for the candidate compare feature remote data source.
abstract class CandidateCompareRemoteDataSource {
  /// Fetches a comparison of candidates by their IDs.
  ///
  /// Calls `GET /candidates/compare?ids=uuid1,uuid2`.
  /// Throws a [DioException] on failure.
  Future<CompareResultModel> compareCandidates(List<String> ids);
}

/// Implementation of [CandidateCompareRemoteDataSource] using [ApiClient].
@LazySingleton(as: CandidateCompareRemoteDataSource)
class CandidateCompareRemoteDataSourceImpl
    implements CandidateCompareRemoteDataSource {
  final ApiClient _apiClient;

  CandidateCompareRemoteDataSourceImpl(this._apiClient);

  @override
  Future<CompareResultModel> compareCandidates(List<String> ids) async {
    final response = await _apiClient.get(
      '${ApiConstants.candidates}/compare',
      queryParameters: {'ids': ids.join(',')},
    );
    final data = response.data as Map<String, dynamic>;
    final resultJson = data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data;
    return CompareResultModel.fromJson(resultJson);
  }
}
