import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/article_detail_model.dart';
import '../models/comment_model.dart';

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

  /// Fetches comments for an article, paginated.
  Future<List<CommentModel>> getComments({
    required String articleId,
    int page = 1,
    int limit = 20,
  });

  /// Submits a new comment on an article.
  Future<void> submitComment({
    required String articleId,
    required String authorName,
    required String body,
    String? parentId,
  });

  /// Increments the share count for an article.
  Future<void> incrementShareCount(String articleId);

  /// Likes a comment. Returns updated likesCount.
  Future<int> likeComment({
    required String articleId,
    required String commentId,
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

  @override
  Future<List<CommentModel>> getComments({
    required String articleId,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '${ApiConstants.articles}/$articleId/comments',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data?['data'] as List<dynamic>? ?? [];
    return data
        .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> submitComment({
    required String articleId,
    required String authorName,
    required String body,
    String? parentId,
  }) async {
    await _apiClient.post(
      '${ApiConstants.articles}/$articleId/comments',
      data: {
        'authorName': authorName,
        'body': body,
        if (parentId != null) 'parentId': parentId,
      },
    );
  }

  @override
  Future<void> incrementShareCount(String articleId) async {
    await _apiClient.post('${ApiConstants.articles}/$articleId/share');
  }

  @override
  Future<int> likeComment({
    required String articleId,
    required String commentId,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '${ApiConstants.articles}/$articleId/comments/$commentId/like',
    );
    return (response.data?['likesCount'] as int?) ?? 0;
  }
}
