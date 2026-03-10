import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/feed_response_model.dart';

/// Remote data source for feed operations via REST API
abstract class FeedRemoteDataSource {
  /// Get paginated mixed-content feed
  ///
  /// Throws [ServerException] on API errors
  Future<FeedResponseModel> getFeed({
    required int page,
    required int limit,
    List<String>? types,
    String? categoryId,
    String? deviceId,
    String? userId,
  });
}

@LazySingleton(as: FeedRemoteDataSource)
class FeedRemoteDataSourceImpl implements FeedRemoteDataSource {
  final ApiClient apiClient;

  FeedRemoteDataSourceImpl(this.apiClient);

  @override
  Future<FeedResponseModel> getFeed({
    required int page,
    required int limit,
    List<String>? types,
    String? categoryId,
    String? deviceId,
    String? userId,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (types != null && types.isNotEmpty) {
      queryParams['types'] = types.join(',');
    }
    if (categoryId != null) {
      queryParams['categoryId'] = categoryId;
    }
    if (deviceId != null) {
      queryParams['deviceId'] = deviceId;
    }
    if (userId != null) {
      queryParams['userId'] = userId;
    }

    final response = await apiClient.get(
      ApiConstants.feed,
      queryParameters: queryParams,
    );

    return FeedResponseModel.fromJson(response.data as Map<String, dynamic>);
  }
}
