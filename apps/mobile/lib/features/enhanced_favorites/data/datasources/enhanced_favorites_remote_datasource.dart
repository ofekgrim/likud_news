import 'package:dio/dio.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/secure_storage_service.dart';
import '../../../home/data/models/article_model.dart';
import '../models/bookmark_folder_model.dart';

/// Contract for the enhanced favorites remote data source.
abstract class EnhancedFavoritesRemoteDataSource {
  /// Fetches all bookmark folders for the authenticated user.
  ///
  /// Throws a [DioException] on failure.
  Future<List<BookmarkFolderModel>> getFolders();

  /// Creates a new bookmark folder.
  ///
  /// Throws a [DioException] on failure.
  Future<BookmarkFolderModel> createFolder({
    required String name,
    String? color,
  });

  /// Updates an existing bookmark folder.
  ///
  /// Throws a [DioException] on failure.
  Future<BookmarkFolderModel> updateFolder({
    required String id,
    String? name,
    String? color,
    int? sortOrder,
    bool? isPublic,
  });

  /// Deletes a bookmark folder.
  ///
  /// Throws a [DioException] on failure.
  Future<void> deleteFolder({required String id});

  /// Fetches a paginated list of favorites in a specific folder.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getFolderFavorites({
    required String folderId,
    int page = 1,
    int limit = 20,
  });

  /// Moves a favorite article into a folder (or removes from folder).
  ///
  /// Throws a [DioException] on failure.
  Future<void> moveToFolder({
    required String articleId,
    String? folderId,
  });

  /// Updates the personal note attached to a favorited article.
  ///
  /// Throws a [DioException] on failure.
  Future<void> updateNote({
    required String articleId,
    required String note,
  });
}

/// Implementation of [EnhancedFavoritesRemoteDataSource] using [ApiClient].
///
/// All requests require authentication via Bearer token obtained
/// from [SecureStorageService].
@LazySingleton(as: EnhancedFavoritesRemoteDataSource)
class EnhancedFavoritesRemoteDataSourceImpl
    implements EnhancedFavoritesRemoteDataSource {
  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;

  EnhancedFavoritesRemoteDataSourceImpl(
    this._apiClient,
    this._secureStorage,
  );

  /// Builds an [Options] object with the Bearer authorization header.
  Future<Options> _authOptions() async {
    final token = await _secureStorage.getAccessToken();
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  @override
  Future<List<BookmarkFolderModel>> getFolders() async {
    final options = await _authOptions();
    final response = await _apiClient.dio.get(
      ApiConstants.appUsersMeFolders,
      options: options,
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) =>
            BookmarkFolderModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<BookmarkFolderModel> createFolder({
    required String name,
    String? color,
  }) async {
    final options = await _authOptions();
    final body = <String, dynamic>{
      'name': name,
    };
    if (color != null) {
      body['color'] = color;
    }
    final response = await _apiClient.dio.post(
      ApiConstants.appUsersMeFolders,
      data: body,
      options: options,
    );
    final data = response.data;
    final Map<String, dynamic> folderJson =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return BookmarkFolderModel.fromJson(folderJson);
  }

  @override
  Future<BookmarkFolderModel> updateFolder({
    required String id,
    String? name,
    String? color,
    int? sortOrder,
    bool? isPublic,
  }) async {
    final options = await _authOptions();
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (color != null) body['color'] = color;
    if (sortOrder != null) body['sortOrder'] = sortOrder;
    if (isPublic != null) body['isPublic'] = isPublic;

    final response = await _apiClient.dio.put(
      '${ApiConstants.appUsersMeFolders}/$id',
      data: body,
      options: options,
    );
    final data = response.data;
    final Map<String, dynamic> folderJson =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return BookmarkFolderModel.fromJson(folderJson);
  }

  @override
  Future<void> deleteFolder({required String id}) async {
    final options = await _authOptions();
    await _apiClient.dio.delete(
      '${ApiConstants.appUsersMeFolders}/$id',
      options: options,
    );
  }

  @override
  Future<List<ArticleModel>> getFolderFavorites({
    required String folderId,
    int page = 1,
    int limit = 20,
  }) async {
    final options = await _authOptions();
    final response = await _apiClient.dio.get(
      '${ApiConstants.appUsersMeFolders}/$folderId/favorites',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
      options: options,
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
  Future<void> moveToFolder({
    required String articleId,
    String? folderId,
  }) async {
    final options = await _authOptions();
    await _apiClient.dio.put(
      '${ApiConstants.favorites}/$articleId/folder',
      data: {
        'folderId': folderId,
      },
      options: options,
    );
  }

  @override
  Future<void> updateNote({
    required String articleId,
    required String note,
  }) async {
    final options = await _authOptions();
    await _apiClient.dio.put(
      '${ApiConstants.favorites}/$articleId/note',
      data: {
        'note': note,
      },
      options: options,
    );
  }
}
