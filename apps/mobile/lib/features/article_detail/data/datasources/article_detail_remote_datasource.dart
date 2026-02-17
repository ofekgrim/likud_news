import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/article_detail_model.dart';

/// Remote data source for article detail operations.
///
/// Communicates with the REST API to fetch article content,
/// toggle favorites, and record read events.
abstract class ArticleDetailRemoteDataSource {
  /// Fetches the full article detail by its URL [slug].
  Future<ArticleDetailModel> getArticleBySlug(String slug);

  /// Toggles the favorite status for an article.
  ///
  /// Returns `true` if the article is now favorited, `false` otherwise.
  Future<bool> toggleFavorite({
    required String deviceId,
    required String articleId,
  });

  /// Records that the device user read the given article.
  Future<void> recordRead({
    required String deviceId,
    required String articleId,
  });
}

@LazySingleton(as: ArticleDetailRemoteDataSource)
class ArticleDetailRemoteDataSourceImpl
    implements ArticleDetailRemoteDataSource {
  final ApiClient _apiClient;

  const ArticleDetailRemoteDataSourceImpl(this._apiClient);

  @override
  Future<ArticleDetailModel> getArticleBySlug(String slug) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '${ApiConstants.articles}/$slug',
    );
    return ArticleDetailModel.fromJson(response.data!);
  }

  @override
  Future<bool> toggleFavorite({
    required String deviceId,
    required String articleId,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiConstants.favorites,
      data: {
        'deviceId': deviceId,
        'articleId': articleId,
      },
    );
    return response.data!['isFavorite'] as bool;
  }

  @override
  Future<void> recordRead({
    required String deviceId,
    required String articleId,
  }) async {
    await _apiClient.post(
      ApiConstants.history,
      data: {
        'deviceId': deviceId,
        'articleId': articleId,
      },
    );
  }
}
