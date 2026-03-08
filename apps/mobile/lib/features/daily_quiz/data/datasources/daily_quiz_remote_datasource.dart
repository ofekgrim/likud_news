import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/daily_quiz_model.dart';

/// Contract for the daily quiz remote data source.
abstract class DailyQuizRemoteDataSource {
  /// Fetches today's daily quiz.
  ///
  /// Returns null if no quiz is available today.
  /// Throws a [DioException] on failure.
  Future<DailyQuizModel?> getTodayQuiz();

  /// Submits quiz answers and returns the result.
  ///
  /// Throws a [DioException] on failure.
  Future<DailyQuizResultModel> submitQuiz(String quizId, List<int> answers);
}

/// Implementation of [DailyQuizRemoteDataSource] using [ApiClient].
@LazySingleton(as: DailyQuizRemoteDataSource)
class DailyQuizRemoteDataSourceImpl implements DailyQuizRemoteDataSource {
  final ApiClient _apiClient;

  DailyQuizRemoteDataSourceImpl(this._apiClient);

  @override
  Future<DailyQuizModel?> getTodayQuiz() async {
    final response = await _apiClient.get(
      ApiConstants.gamificationDailyQuizToday,
    );
    final data = response.data;
    if (data == null || (data is Map<String, dynamic> && data.isEmpty)) {
      return null;
    }

    final map = data as Map<String, dynamic>;

    // API returns {"quiz": {...}, "userCompleted": bool}
    final quizJson = map.containsKey('quiz')
        ? map['quiz'] as Map<String, dynamic>?
        : map.containsKey('data')
            ? map['data'] as Map<String, dynamic>?
            : map;
    if (quizJson == null) return null;

    // Merge userCompleted from wrapper into quiz data for the model
    final userCompleted = map['userCompleted'] as bool? ?? false;
    final userScore = map['userScore'] as int?;
    final enriched = <String, dynamic>{
      ...quizJson,
      'userHasCompleted': userCompleted,
      if (userScore != null) 'userScore': userScore,
    };

    return DailyQuizModel.fromJson(enriched);
  }

  @override
  Future<DailyQuizResultModel> submitQuiz(
    String quizId,
    List<int> answers,
  ) async {
    final response = await _apiClient.post(
      ApiConstants.gamificationDailyQuizSubmit,
      data: {
        'quizId': quizId,
        'answers': answers,
      },
    );
    final data = response.data;
    final resultData = data is Map<String, dynamic> && data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return DailyQuizResultModel.fromJson(resultData);
  }
}
