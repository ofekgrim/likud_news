import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/search_result_model.dart';

/// Contract for the search feature remote data source.
abstract class SearchRemoteDataSource {
  /// Searches articles by [query] with pagination.
  ///
  /// Throws a [DioException] on failure.
  Future<SearchResultModel> search({
    required String query,
    required int page,
  });
}

/// Implementation of [SearchRemoteDataSource] using [ApiClient].
@LazySingleton(as: SearchRemoteDataSource)
class SearchRemoteDataSourceImpl implements SearchRemoteDataSource {
  final ApiClient _apiClient;

  SearchRemoteDataSourceImpl(this._apiClient);

  @override
  Future<SearchResultModel> search({
    required String query,
    required int page,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.search,
      queryParameters: {
        'q': query,
        'page': page,
        'limit': 20,
      },
    );
    return SearchResultModel.fromJson(response.data);
  }
}
