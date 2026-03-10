import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/community_poll_model.dart';
import '../models/poll_vote_model.dart';

/// Contract for the community polls remote data source.
abstract class PollsRemoteDataSource {
  /// Fetches a list of community polls from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CommunityPollModel>> getPolls({bool activeOnly = true});

  /// Fetches a single poll by [id].
  ///
  /// Throws a [DioException] on failure.
  Future<CommunityPollModel> getPoll(String id);

  /// Submits a vote on a poll.
  ///
  /// Throws a [DioException] on failure.
  Future<void> vote({
    required String pollId,
    required int optionIndex,
  });

  /// Gets the current user's vote for a poll.
  ///
  /// Returns null if the user hasn't voted yet.
  /// Throws a [DioException] on failure.
  Future<PollVoteModel?> getMyVote(String pollId);

  /// Fetches the latest results for a poll.
  ///
  /// Throws a [DioException] on failure.
  Future<CommunityPollModel> getResults(String pollId);
}

/// Implementation of [PollsRemoteDataSource] using [ApiClient].
@LazySingleton(as: PollsRemoteDataSource)
class PollsRemoteDataSourceImpl implements PollsRemoteDataSource {
  final ApiClient _apiClient;

  PollsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<CommunityPollModel>> getPolls({bool activeOnly = true}) async {
    final response = await _apiClient.get(
      ApiConstants.communityPolls,
      queryParameters: {
        if (activeOnly) 'isActive': true,
      },
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) =>
            CommunityPollModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<CommunityPollModel> getPoll(String id) async {
    final response = await _apiClient.get(
      '${ApiConstants.communityPolls}/$id',
    );
    final data = response.data;
    final Map<String, dynamic> json =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return CommunityPollModel.fromJson(json);
  }

  @override
  Future<void> vote({
    required String pollId,
    required int optionIndex,
  }) async {
    await _apiClient.post(
      '${ApiConstants.communityPolls}/$pollId/vote',
      data: {'optionIndex': optionIndex},
    );
  }

  @override
  Future<PollVoteModel?> getMyVote(String pollId) async {
    final response = await _apiClient.get(
      '${ApiConstants.communityPolls}/$pollId/my-vote',
    );
    final data = response.data;
    if (data == null) return null;
    final Map<String, dynamic> json =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    if (json.isEmpty) return null;

    // Backend returns { voted: bool, optionIndex: int? }
    final voted = json['voted'] as bool? ?? false;
    if (!voted || json['optionIndex'] == null) return null;

    return PollVoteModel(
      id: '',
      pollId: pollId,
      optionIndex: json['optionIndex'] as int,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<CommunityPollModel> getResults(String pollId) async {
    final response = await _apiClient.get(
      '${ApiConstants.communityPolls}/$pollId/results',
    );
    final data = response.data;
    final Map<String, dynamic> json =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return CommunityPollModel.fromJson(json);
  }
}
