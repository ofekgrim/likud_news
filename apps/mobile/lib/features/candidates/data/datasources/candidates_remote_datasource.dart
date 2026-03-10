import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/candidate_model.dart';
import '../models/election_model.dart';
import '../models/endorsement_model.dart';

/// Contract for the candidates feature remote data source.
abstract class CandidatesRemoteDataSource {
  /// Fetches all elections from the API.
  ///
  /// Throws a [DioException] on failure.
  Future<List<ElectionModel>> getElections();

  /// Fetches a single election by ID.
  ///
  /// Throws a [DioException] on failure.
  Future<ElectionModel> getElection(String id);

  /// Fetches all active candidates for a given election.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CandidateModel>> getCandidatesByElection(String electionId);

  /// Fetches a single candidate by slug.
  ///
  /// Throws a [DioException] on failure.
  Future<CandidateModel> getCandidateBySlug(String slug);

  /// Fetches a single candidate by ID.
  ///
  /// Throws a [DioException] on failure.
  Future<CandidateModel> getCandidateById(String id);

  /// Endorses a candidate in a given election.
  ///
  /// Throws a [DioException] on failure.
  Future<EndorsementModel> endorseCandidate(
    String candidateId,
    String electionId,
  );

  /// Removes the current user's endorsement for a given election.
  ///
  /// Throws a [DioException] on failure.
  Future<void> removeEndorsement(String electionId);

  /// Fetches the current user's endorsement for a given election.
  ///
  /// Returns null if no endorsement exists.
  /// Throws a [DioException] on failure.
  Future<EndorsementModel?> getMyEndorsement(String electionId);
}

/// Implementation of [CandidatesRemoteDataSource] using [ApiClient].
@LazySingleton(as: CandidatesRemoteDataSource)
class CandidatesRemoteDataSourceImpl implements CandidatesRemoteDataSource {
  final ApiClient _apiClient;

  CandidatesRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<ElectionModel>> getElections() async {
    final response = await _apiClient.get(ApiConstants.elections);
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => ElectionModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ElectionModel> getElection(String id) async {
    final response = await _apiClient.get('${ApiConstants.elections}/$id');
    final data = response.data as Map<String, dynamic>;
    final electionJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return ElectionModel.fromJson(electionJson);
  }

  @override
  Future<List<CandidateModel>> getCandidatesByElection(
    String electionId,
  ) async {
    final response = await _apiClient.get(
      '${ApiConstants.candidates}/election/$electionId',
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => CandidateModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<CandidateModel> getCandidateBySlug(String slug) async {
    final response = await _apiClient.get(
      '${ApiConstants.candidates}/slug/$slug',
    );
    final data = response.data as Map<String, dynamic>;
    final candidateJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return CandidateModel.fromJson(candidateJson);
  }

  @override
  Future<CandidateModel> getCandidateById(String id) async {
    final response = await _apiClient.get('${ApiConstants.candidates}/$id');
    final data = response.data as Map<String, dynamic>;
    final candidateJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return CandidateModel.fromJson(candidateJson);
  }

  @override
  Future<EndorsementModel> endorseCandidate(
    String candidateId,
    String electionId,
  ) async {
    final response = await _apiClient.post(
      ApiConstants.endorsements,
      data: {
        'candidateId': candidateId,
        'electionId': electionId,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final endorsementJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return EndorsementModel.fromJson(endorsementJson);
  }

  @override
  Future<void> removeEndorsement(String electionId) async {
    await _apiClient.delete(
      '${ApiConstants.endorsements}/election/$electionId',
    );
  }

  @override
  Future<EndorsementModel?> getMyEndorsement(String electionId) async {
    final response = await _apiClient.get(
      '${ApiConstants.endorsements}/me/election/$electionId',
    );
    final data = response.data;
    if (data == null) return null;
    final json = data is Map<String, dynamic> ? data : null;
    if (json == null) return null;
    final endorsementJson =
        json.containsKey('data') ? json['data'] as Map<String, dynamic>? : json;
    if (endorsementJson == null) return null;
    return EndorsementModel.fromJson(endorsementJson);
  }
}
