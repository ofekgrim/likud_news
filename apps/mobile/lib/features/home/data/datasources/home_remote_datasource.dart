import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/article_model.dart';
import '../models/category_model.dart';
import '../models/ticker_item_model.dart';

/// Contract for the home feature remote data source.
abstract class HomeRemoteDataSource {
  /// Fetches the hero article from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<ArticleModel> getHeroArticle();

  /// Fetches a paginated list of feed articles from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getFeedArticles({required int page});

  /// Fetches active ticker items from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<TickerItemModel>> getTickerItems();

  /// Fetches all active categories from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CategoryModel>> getCategories();
}

/// Implementation of [HomeRemoteDataSource] using [ApiClient].
@LazySingleton(as: HomeRemoteDataSource)
class HomeRemoteDataSourceImpl implements HomeRemoteDataSource {
  final ApiClient _apiClient;

  HomeRemoteDataSourceImpl(this._apiClient);

  @override
  Future<ArticleModel> getHeroArticle() async {
    final response = await _apiClient.get(ApiConstants.articlesHero);
    final data = response.data as Map<String, dynamic>;
    // Support both wrapped { "data": {...} } and flat response.
    final articleJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return ArticleModel.fromJson(articleJson);
  }

  @override
  Future<List<ArticleModel>> getFeedArticles({required int page}) async {
    final response = await _apiClient.get(
      ApiConstants.articles,
      queryParameters: {'page': page},
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
  Future<List<TickerItemModel>> getTickerItems() async {
    final response = await _apiClient.get(ApiConstants.ticker);
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => TickerItemModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<CategoryModel>> getCategories() async {
    final response = await _apiClient.get(ApiConstants.categories);
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => CategoryModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
