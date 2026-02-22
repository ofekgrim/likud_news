import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/article_model.dart';
import '../../../article_detail/domain/entities/author.dart';

abstract class AuthorArticlesRemoteDataSource {
  /// Fetches paginated articles by author ID.
  /// Also returns author info from the response.
  Future<AuthorArticlesResponse> getAuthorArticles({
    required String authorId,
    required int page,
  });
}

/// Wrapper for the author articles API response.
class AuthorArticlesResponse {
  final Author author;
  final List<ArticleModel> articles;

  const AuthorArticlesResponse({
    required this.author,
    required this.articles,
  });
}

@LazySingleton(as: AuthorArticlesRemoteDataSource)
class AuthorArticlesRemoteDataSourceImpl
    implements AuthorArticlesRemoteDataSource {
  final ApiClient _apiClient;

  AuthorArticlesRemoteDataSourceImpl(this._apiClient);

  @override
  Future<AuthorArticlesResponse> getAuthorArticles({
    required String authorId,
    required int page,
  }) async {
    final response = await _apiClient.get(
      '${ApiConstants.authors}/$authorId/articles',
      queryParameters: {'page': page, 'limit': 20},
    );
    final data = response.data as Map<String, dynamic>;

    final authorJson = data['author'] as Map<String, dynamic>?;
    final author = authorJson != null
        ? Author(
            id: authorJson['id'] as String,
            nameHe: authorJson['nameHe'] as String? ?? '',
            nameEn: authorJson['nameEn'] as String?,
            roleHe: authorJson['roleHe'] as String?,
            roleEn: authorJson['roleEn'] as String?,
            bioHe: authorJson['bioHe'] as String?,
            avatarUrl: authorJson['avatarUrl'] as String?,
            avatarThumbnailUrl: authorJson['avatarThumbnailUrl'] as String?,
          )
        : Author(id: authorId, nameHe: '');

    final List<dynamic> items = data['data'] as List<dynamic>? ?? [];
    final articles = items
        .map((json) => ArticleModel.fromJson(json as Map<String, dynamic>))
        .toList();

    return AuthorArticlesResponse(author: author, articles: articles);
  }
}
