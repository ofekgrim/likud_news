import 'package:injectable/injectable.dart';

import '../../../../core/network/api_client.dart';
import '../../domain/entities/quiz_answer.dart';
import '../models/match_result_model.dart';
import '../models/policy_statement_model.dart';

/// Contract for the candidate matcher remote data source.
abstract class CandidateMatcherRemoteDataSource {
  /// Fetches policy statements for an election.
  ///
  /// Calls `GET /primaries/matcher/statements/:electionId`.
  Future<List<PolicyStatementModel>> getStatements(String electionId);

  /// Submits quiz responses.
  ///
  /// Calls `POST /primaries/matcher/responses`.
  Future<void> submitResponses({
    required String electionId,
    required List<({String statementId, QuizAnswer answer, double? importanceWeight})>
        responses,
  });

  /// Computes and returns match results.
  ///
  /// Calls `GET /primaries/matcher/match/:electionId`.
  Future<MatchResultResponseModel> getMatchResults(String electionId);
}

/// Implementation of [CandidateMatcherRemoteDataSource] using [ApiClient].
@LazySingleton(as: CandidateMatcherRemoteDataSource)
class CandidateMatcherRemoteDataSourceImpl
    implements CandidateMatcherRemoteDataSource {
  final ApiClient _apiClient;

  CandidateMatcherRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<PolicyStatementModel>> getStatements(String electionId) async {
    final response = await _apiClient.get(
      '/primaries/matcher/statements/$electionId',
      queryParameters: {'limit': 100},
    );
    final data = response.data as Map<String, dynamic>;
    // API wraps in { data: [...] } or returns array directly
    final List<dynamic> items;
    if (data.containsKey('data')) {
      items = data['data'] as List<dynamic>;
    } else if (data.containsKey('items')) {
      items = data['items'] as List<dynamic>;
    } else {
      items = [];
    }
    return items
        .map((item) =>
            PolicyStatementModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> submitResponses({
    required String electionId,
    required List<({String statementId, QuizAnswer answer, double? importanceWeight})>
        responses,
  }) async {
    await _apiClient.post(
      '/primaries/matcher/responses',
      data: {
        'electionId': electionId,
        'responses': responses
            .map((r) => {
                  'statementId': r.statementId,
                  'answer': r.answer.value,
                  if (r.importanceWeight != null)
                    'importanceWeight': r.importanceWeight,
                })
            .toList(),
      },
    );
  }

  @override
  Future<MatchResultResponseModel> getMatchResults(String electionId) async {
    final response = await _apiClient.get(
      '/primaries/matcher/match/$electionId',
    );
    final data = response.data as Map<String, dynamic>;
    final resultJson = data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data;
    return MatchResultResponseModel.fromJson(resultJson);
  }
}
