import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/story_model.dart';

/// Remote datasource for stories.
abstract class StoriesRemoteDatasource {
  /// Fetches active stories from the REST endpoint.
  ///
  /// Throws [ServerException] on failure.
  Future<List<StoryModel>> getStories();
}

@LazySingleton(as: StoriesRemoteDatasource)
class StoriesRemoteDatasourceImpl implements StoriesRemoteDatasource {
  final ApiClient _apiClient;

  StoriesRemoteDatasourceImpl(this._apiClient);

  @override
  Future<List<StoryModel>> getStories() async {
    try {
      final response = await _apiClient.get<dynamic>(ApiConstants.stories);

      final data = response.data;
      final List<dynamic> items;

      if (data is Map<String, dynamic> && data.containsKey('data')) {
        items = data['data'] as List<dynamic>;
      } else if (data is List) {
        items = data;
      } else {
        items = [];
      }

      return items
          .map((json) => StoryModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }
}
