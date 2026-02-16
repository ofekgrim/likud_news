import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/sse_client.dart';
import '../../../home/domain/entities/article.dart';

/// Remote datasource for breaking news.
///
/// Handles two responsibilities:
/// 1. REST call to fetch the current list of breaking articles.
/// 2. SSE stream subscription for real-time breaking news updates.
abstract class BreakingNewsRemoteDatasource {
  /// Fetches the current breaking articles from the REST endpoint.
  ///
  /// Throws [ServerException] on failure.
  Future<List<Article>> getBreakingArticles();

  /// Returns a stream of newly published breaking articles via SSE.
  Stream<Article> watchBreakingNews();
}

@LazySingleton(as: BreakingNewsRemoteDatasource)
class BreakingNewsRemoteDatasourceImpl implements BreakingNewsRemoteDatasource {
  final ApiClient _apiClient;
  final SseClient _sseClient;

  BreakingNewsRemoteDatasourceImpl(this._apiClient, this._sseClient);

  @override
  Future<List<Article>> getBreakingArticles() async {
    try {
      final response = await _apiClient.get<dynamic>(
        ApiConstants.articlesBreaking,
      );

      final data = response.data;
      final List<dynamic> items;

      if (data is Map<String, dynamic>) {
        // Supports both { "data": [...] } and { "articles": [...] } shapes.
        items = (data['data'] ?? data['articles'] ?? []) as List<dynamic>;
      } else if (data is List) {
        items = data;
      } else {
        items = [];
      }

      return items
          .cast<Map<String, dynamic>>()
          .map(_articleFromJson)
          .toList();
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Stream<Article> watchBreakingNews() {
    return _sseClient.breakingStream().where((event) {
      return event.event == 'breaking' || event.event == 'message';
    }).map((event) {
      final json = event.json;

      // The SSE payload may wrap the article under a "data" or "article" key.
      final Map<String, dynamic> articleJson;
      if (json.containsKey('article')) {
        articleJson = json['article'] as Map<String, dynamic>;
      } else if (json.containsKey('data')) {
        articleJson = json['data'] as Map<String, dynamic>;
      } else {
        articleJson = json;
      }

      return _articleFromJson(articleJson);
    });
  }

  /// Maps a JSON map to an [Article] entity.
  Article _articleFromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] as int,
      title: json['title'] as String,
      titleEn: json['title_en'] as String?,
      subtitle: json['subtitle'] as String?,
      content: json['content'] as String?,
      heroImageUrl: json['hero_image_url'] as String?,
      heroImageCaption: json['hero_image_caption'] as String?,
      author: json['author'] as String?,
      hashtags: (json['hashtags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      isHero: json['is_hero'] as bool? ?? false,
      isBreaking: json['is_breaking'] as bool? ?? true,
      viewCount: json['view_count'] as int? ?? 0,
      slug: json['slug'] as String?,
      publishedAt: json['published_at'] != null
          ? DateTime.tryParse(json['published_at'] as String)
          : null,
      categoryId: json['category_id'] as int?,
      categoryName: json['category_name'] as String?,
      categoryColor: json['category_color'] as String?,
    );
  }
}
