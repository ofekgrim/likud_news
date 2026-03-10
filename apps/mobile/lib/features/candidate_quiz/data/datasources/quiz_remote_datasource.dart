import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/community_average_model.dart';
import '../models/quiz_answer_model.dart';
import '../models/quiz_election_model.dart';
import '../models/quiz_question_model.dart';
import '../models/quiz_result_model.dart';

/// Contract for the candidate quiz feature remote data source.
abstract class QuizRemoteDataSource {
  /// Fetches all elections that have quizzes.
  Future<List<QuizElectionModel>> getQuizElections();

  /// Resolves 'active' to the real election UUID.
  Future<String> resolveActiveElectionId();

  /// Fetches all active quiz questions for the given election.
  ///
  /// Throws a [DioException] on failure.
  Future<List<QuizQuestionModel>> getQuestions(String electionId);

  /// Submits quiz answers and returns candidate match results.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CandidateMatchModel>> submitQuiz(
    String electionId,
    List<QuizAnswerModel> answers,
  );

  /// Fetches the user's existing quiz results for the given election.
  ///
  /// Returns `null` if the user has not yet taken the quiz.
  /// Throws a [DioException] on failure.
  Future<QuizResultModel?> getMyResults(String electionId);

  /// Fetches community average match percentages per candidate for an election.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CommunityAverageModel>> getQuizAverages(String electionId);
}

/// Implementation of [QuizRemoteDataSource] using [ApiClient].
@LazySingleton(as: QuizRemoteDataSource)
class QuizRemoteDataSourceImpl implements QuizRemoteDataSource {
  final ApiClient _apiClient;

  QuizRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<QuizElectionModel>> getQuizElections() async {
    final response = await _apiClient.get(
      '${ApiConstants.quiz}/elections',
    );
    final data = response.data;
    final List<dynamic> items = data is List<dynamic> ? data : [];
    return items
        .map((json) =>
            QuizElectionModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<String> resolveActiveElectionId() async {
    final response = await _apiClient.get(
      '${ApiConstants.quiz}/election/active',
    );
    final data = response.data as Map<String, dynamic>;
    return data['electionId'] as String;
  }

  @override
  Future<List<QuizQuestionModel>> getQuestions(String electionId) async {
    final response = await _apiClient.get(
      '${ApiConstants.quiz}/election/$electionId',
    );
    final data = response.data;
    // Handle both {data: [...]} wrapped and raw [...] responses
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => QuizQuestionModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<CandidateMatchModel>> submitQuiz(
    String electionId,
    List<QuizAnswerModel> answers,
  ) async {
    final response = await _apiClient.post(
      '${ApiConstants.quiz}/submit',
      data: {
        'electionId': electionId,
        'answers': answers.map((a) => a.toJson()).toList(),
      },
    );
    final data = response.data;
    // Response is an array of {candidateId, candidateName, matchPercentage}
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) =>
            CandidateMatchModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<QuizResultModel?> getMyResults(String electionId) async {
    final response = await _apiClient.get(
      '${ApiConstants.quiz}/me/election/$electionId',
    );
    final data = response.data;
    if (data == null) return null;
    // Handle both {data: {...}} wrapped and raw {...} responses
    final Map<String, dynamic> resultJson =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return QuizResultModel.fromJson(resultJson);
  }

  @override
  Future<List<CommunityAverageModel>> getQuizAverages(
    String electionId,
  ) async {
    final response = await _apiClient.get(
      '${ApiConstants.quiz}/election/$electionId/averages',
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) =>
            CommunityAverageModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
