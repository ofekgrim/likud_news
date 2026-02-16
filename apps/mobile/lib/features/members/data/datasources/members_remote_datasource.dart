import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../home/data/models/article_model.dart';
import '../models/member_model.dart';

/// Contract for the members feature remote data source.
abstract class MembersRemoteDataSource {
  /// Fetches all members from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<MemberModel>> getMembers();

  /// Fetches a single member's detail with related articles.
  ///
  /// Throws a [DioException] on failure.
  Future<MemberModel> getMemberDetail(int id);

  /// Fetches articles related to a specific member.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ArticleModel>> getMemberArticles(int id);
}

/// Implementation of [MembersRemoteDataSource] using [ApiClient].
@LazySingleton(as: MembersRemoteDataSource)
class MembersRemoteDataSourceImpl implements MembersRemoteDataSource {
  final ApiClient _apiClient;

  MembersRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<MemberModel>> getMembers() async {
    final response = await _apiClient.get(ApiConstants.members);
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => MemberModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<MemberModel> getMemberDetail(int id) async {
    final response = await _apiClient.get('${ApiConstants.members}/$id');
    final data = response.data as Map<String, dynamic>;
    final memberJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return MemberModel.fromJson(memberJson);
  }

  @override
  Future<List<ArticleModel>> getMemberArticles(int id) async {
    final response = await _apiClient.get(
      '${ApiConstants.members}/$id/articles',
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
