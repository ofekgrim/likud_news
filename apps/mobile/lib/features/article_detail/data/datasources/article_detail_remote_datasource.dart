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
  /// Pass [deviceId] to get favorite status for the current device.
  Future<ArticleDetailModel> getArticleBySlug(String slug, {String? deviceId});

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

  /// Fetches comments for a target (article or story), paginated.
  Future<List<CommentModel>> getComments({
    required String articleId,
    int page = 1,
    int limit = 20,
    String targetType = 'article',
  });

  /// Submits a new comment on a target (article or story).
  Future<void> submitComment({
    required String articleId,
    required String body,
    String? parentId,
    String targetType = 'article',
    String? guestName,
  });

  /// Increments the share count for an article.
  Future<void> incrementShareCount(String articleId);

  /// Likes a comment. Returns updated likesCount.
  Future<int> likeComment({
    required String articleId,
    required String commentId,
    String targetType = 'article',
  });
}

@LazySingleton(as: ArticleDetailRemoteDataSource)
class ArticleDetailRemoteDataSourceImpl
    implements ArticleDetailRemoteDataSource {
  final ApiClient _apiClient;

  const ArticleDetailRemoteDataSourceImpl(this._apiClient);

  /// Returns the base path for comments based on target type.
  String _commentsBasePath(String targetId, String targetType) {
    return targetType == 'story'
        ? '${ApiConstants.stories}/$targetId/comments'
        : '${ApiConstants.articles}/$targetId/comments';
  }

  @override
  Future<ArticleDetailModel> getArticleBySlug(String slug, {String? deviceId}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '${ApiConstants.articles}/$slug',
      queryParameters: {
        if (deviceId != null) 'deviceId': deviceId,
      },
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
    String targetType = 'article',
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      _commentsBasePath(articleId, targetType),
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
    required String body,
    String? parentId,
    String targetType = 'article',
    String? guestName,
  }) async {
    await _apiClient.post(
      _commentsBasePath(articleId, targetType),
      data: {
        'body': body,
        if (parentId != null) 'parentId': parentId,
        if (guestName != null) 'guestName': guestName,
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
    String targetType = 'article',
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '${_commentsBasePath(articleId, targetType)}/$commentId/like',
    );
    return (response.data?['likesCount'] as int?) ?? 0;
  }
}
