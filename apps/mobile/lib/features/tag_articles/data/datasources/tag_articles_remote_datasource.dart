import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/article_model.dart';

abstract class TagArticlesRemoteDataSource {
  Future<List<ArticleModel>> getTagArticles({
    required String slug,
    required int page,
  });
}

@LazySingleton(as: TagArticlesRemoteDataSource)
class TagArticlesRemoteDataSourceImpl implements TagArticlesRemoteDataSource {
  final ApiClient _apiClient;

  TagArticlesRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<ArticleModel>> getTagArticles({
    required String slug,
    required int page,
  }) async {
    final response = await _apiClient.get(
      '${ApiConstants.tags}/$slug/articles',
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
