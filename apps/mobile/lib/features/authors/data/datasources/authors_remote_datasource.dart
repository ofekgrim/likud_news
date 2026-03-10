import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/author_model.dart';

/// Contract for the authors feature remote data source.
abstract class AuthorsRemoteDataSource {
  /// Fetches all active authors from the API.
  Future<List<AuthorModel>> getAuthors();
}

@LazySingleton(as: AuthorsRemoteDataSource)
class AuthorsRemoteDataSourceImpl implements AuthorsRemoteDataSource {
  final ApiClient _apiClient;

  AuthorsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<AuthorModel>> getAuthors() async {
    final response = await _apiClient.get(
      ApiConstants.authors,
      queryParameters: {'active': true},
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => AuthorModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
