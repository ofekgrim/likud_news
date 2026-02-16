import '../../../home/data/models/article_model.dart';
import '../../domain/entities/search_result.dart';

/// Data model for search results, handles JSON serialization.
///
/// Maps API responses to the domain [SearchResult] entity via [toEntity].
/// Supports both wrapped and flat response formats:
///   - `{ "data": [...], "total": N }`
///   - `{ "articles": [...], "total_articles": N }`
///   - Direct list `[...]`
class SearchResultModel {
  final List<ArticleModel> articles;
  final int totalArticles;

  const SearchResultModel({
    required this.articles,
    required this.totalArticles,
  });

  factory SearchResultModel.fromJson(dynamic json) {
    if (json is Map<String, dynamic>) {
      // Extract articles list from possible wrapper keys.
      final List<dynamic> items;
      if (json.containsKey('data')) {
        items = json['data'] as List<dynamic>;
      } else if (json.containsKey('articles')) {
        items = json['articles'] as List<dynamic>;
      } else {
        items = [];
      }

      final articles = items
          .map((e) => ArticleModel.fromJson(e as Map<String, dynamic>))
          .toList();

      // Extract total count from possible keys.
      final total = json['total'] as int? ??
          json['total_articles'] as int? ??
          json['totalArticles'] as int? ??
          articles.length;

      return SearchResultModel(
        articles: articles,
        totalArticles: total,
      );
    }

    // Fallback: direct list response.
    if (json is List<dynamic>) {
      final articles = json
          .map((e) => ArticleModel.fromJson(e as Map<String, dynamic>))
          .toList();
      return SearchResultModel(
        articles: articles,
        totalArticles: articles.length,
      );
    }

    return const SearchResultModel(articles: [], totalArticles: 0);
  }

  SearchResult toEntity() {
    return SearchResult(
      articles: articles.map((m) => m.toEntity()).toList(),
      totalArticles: totalArticles,
    );
  }
}
