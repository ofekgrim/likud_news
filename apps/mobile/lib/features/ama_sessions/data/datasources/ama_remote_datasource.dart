import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/ama_question_model.dart';
import '../models/ama_session_model.dart';

/// Contract for the AMA sessions remote data source.
abstract class AmaRemoteDataSource {
  /// Fetches AMA sessions, optionally filtered by [status].
  ///
  /// Throws a [DioException] on failure.
  Future<List<AmaSessionModel>> getSessions({String? status});

  /// Fetches upcoming AMA sessions.
  ///
  /// Throws a [DioException] on failure.
  Future<List<AmaSessionModel>> getUpcomingSessions();

  /// Fetches a single AMA session by [sessionId].
  ///
  /// Throws a [DioException] on failure.
  Future<AmaSessionModel> getSession(String sessionId);

  /// Fetches questions for a session, optionally filtered by [status].
  ///
  /// Throws a [DioException] on failure.
  Future<List<AmaQuestionModel>> getQuestions(
    String sessionId, {
    String? status,
  });

  /// Submits a new question to a session.
  ///
  /// Throws a [DioException] on failure.
  Future<AmaQuestionModel> submitQuestion(String sessionId, String text);

  /// Upvotes a question.
  ///
  /// Throws a [DioException] on failure.
  Future<void> upvoteQuestion(String questionId);
}

/// Implementation of [AmaRemoteDataSource] using [ApiClient].
@LazySingleton(as: AmaRemoteDataSource)
class AmaRemoteDataSourceImpl implements AmaRemoteDataSource {
  final ApiClient _apiClient;

  AmaRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<AmaSessionModel>> getSessions({String? status}) async {
    final response = await _apiClient.get(
      ApiConstants.amaSessions,
      queryParameters: {
        if (status != null) 'status': status,
      },
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => AmaSessionModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<AmaSessionModel>> getUpcomingSessions() async {
    final response = await _apiClient.get(
      ApiConstants.amaSessionsUpcoming,
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => AmaSessionModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<AmaSessionModel> getSession(String sessionId) async {
    final response = await _apiClient.get(
      '${ApiConstants.amaSessions}/$sessionId',
    );
    final data = response.data;
    final Map<String, dynamic> json =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return AmaSessionModel.fromJson(json);
  }

  @override
  Future<List<AmaQuestionModel>> getQuestions(
    String sessionId, {
    String? status,
  }) async {
    final response = await _apiClient.get(
      '${ApiConstants.amaSessions}/$sessionId/questions',
      queryParameters: {
        if (status != null) 'status': status,
      },
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) => AmaQuestionModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<AmaQuestionModel> submitQuestion(
    String sessionId,
    String text,
  ) async {
    final response = await _apiClient.post(
      '${ApiConstants.amaSessions}/$sessionId/questions',
      data: {'text': text},
    );
    final data = response.data;
    final Map<String, dynamic> json =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as Map<String, dynamic>
            : data as Map<String, dynamic>;
    return AmaQuestionModel.fromJson(json);
  }

  @override
  Future<void> upvoteQuestion(String questionId) async {
    await _apiClient.post(
      '${ApiConstants.amaQuestions}/$questionId/upvote',
    );
  }
}
