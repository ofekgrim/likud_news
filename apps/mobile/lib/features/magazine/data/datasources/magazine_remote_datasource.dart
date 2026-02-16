import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/article_model.dart';

/// Contract for the magazine feature remote data source.
abstract class MagazineRemoteDataSource {
  /// Fetches a paginated list of magazine articles from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getMagazineArticles({required int page});

  /// Fetches the featured/hero magazine article from the API.
  ///
  /// Returns `null` if no featured article is available.
  /// Throws a [DioException] on failure.
  Future<ArticleModel?> getFeaturedArticle();
}

/// Implementation of [MagazineRemoteDataSource] using [ApiClient].
@LazySingleton(as: MagazineRemoteDataSource)
class MagazineRemoteDataSourceImpl implements MagazineRemoteDataSource {
  final ApiClient _apiClient;

  MagazineRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<ArticleModel>> getMagazineArticles({required int page}) async {
    final response = await _apiClient.get(
      ApiConstants.articles,
      queryParameters: {
        'category': 'magazine',
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
  Future<ArticleModel?> getFeaturedArticle() async {
    final response = await _apiClient.get(
      ApiConstants.articles,
      queryParameters: {
        'category': 'magazine',
        'isHero': true,
      },
    );
    final data = response.data;

    // The API may return a single object or a list.
    if (data is Map<String, dynamic>) {
      final innerData = data.containsKey('data') ? data['data'] : data;
      if (innerData is List<dynamic>) {
        if (innerData.isEmpty) return null;
        return ArticleModel.fromJson(
          innerData.first as Map<String, dynamic>,
        );
      }
      if (innerData is Map<String, dynamic>) {
        return ArticleModel.fromJson(innerData);
      }
      return null;
    }

    if (data is List<dynamic>) {
      if (data.isEmpty) return null;
      return ArticleModel.fromJson(data.first as Map<String, dynamic>);
    }

    return null;
  }
}
