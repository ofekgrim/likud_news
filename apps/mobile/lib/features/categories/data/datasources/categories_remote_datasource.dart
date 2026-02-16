import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/article_model.dart';
import '../../../home/data/models/category_model.dart';

/// Contract for the categories feature remote data source.
abstract class CategoriesRemoteDataSource {
  /// Fetches all active categories from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CategoryModel>> getCategories();

  /// Fetches a paginated list of articles for the given category [slug].
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getCategoryArticles({
    required String slug,
    required int page,
  });
}

/// Implementation of [CategoriesRemoteDataSource] using [ApiClient].
@LazySingleton(as: CategoriesRemoteDataSource)
class CategoriesRemoteDataSourceImpl implements CategoriesRemoteDataSource {
  final ApiClient _apiClient;

  CategoriesRemoteDataSourceImpl(this._apiClient);

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

  @override
  Future<List<ArticleModel>> getCategoryArticles({
    required String slug,
    required int page,
  }) async {
    final response = await _apiClient.get(
      '${ApiConstants.categories}/$slug/articles',
      queryParameters: {'page': page, 'limit': 20},
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
