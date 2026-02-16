import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/video_article_model.dart';

/// Contract for the video feature remote data source.
abstract class VideoRemoteDataSource {
  /// Fetches a paginated list of video articles from the API.
  ///
  /// Filters articles by the video category.
  /// Throws a [DioException] on failure.
  Future<List<VideoArticleModel>> getVideos({required int page});
}

/// Implementation of [VideoRemoteDataSource] using [ApiClient].
@LazySingleton(as: VideoRemoteDataSource)
class VideoRemoteDataSourceImpl implements VideoRemoteDataSource {
  final ApiClient _apiClient;

  VideoRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<VideoArticleModel>> getVideos({required int page}) async {
    final response = await _apiClient.get(
      ApiConstants.articles,
      queryParameters: {
        'category': 'video',
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
        .map((json) =>
            VideoArticleModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
