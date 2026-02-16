import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/article_model.dart';

/// Contract for the favorites & reading history remote data source.
abstract class FavoritesRemoteDataSource {
  /// Fetches a paginated list of favorite articles from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getFavorites({
    required String deviceId,
    required int page,
  });

  /// Removes an article from the user's favorites via the API.
  ///
  /// Throws a [DioException] on failure.
  Future<void> removeFavorite({
    required String deviceId,
    required int articleId,
  });

  /// Fetches a paginated list of reading history articles from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getReadingHistory({
    required String deviceId,
    required int page,
  });
}

/// Implementation of [FavoritesRemoteDataSource] using [ApiClient].
@LazySingleton(as: FavoritesRemoteDataSource)
class FavoritesRemoteDataSourceImpl implements FavoritesRemoteDataSource {
  final ApiClient _apiClient;

  FavoritesRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<ArticleModel>> getFavorites({
    required String deviceId,
    required int page,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.favorites,
      queryParameters: {
        'deviceId': deviceId,
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
        .map((json) => ArticleModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> removeFavorite({
    required String deviceId,
    required int articleId,
  }) async {
    await _apiClient.delete(
      '${ApiConstants.favorites}/$articleId?deviceId=$deviceId',
    );
  }

  @override
  Future<List<ArticleModel>> getReadingHistory({
    required String deviceId,
    required int page,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.history,
      queryParameters: {
        'deviceId': deviceId,
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
        .map((json) => ArticleModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
