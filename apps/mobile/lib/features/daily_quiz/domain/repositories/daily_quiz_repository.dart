import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/daily_quiz.dart';

/// Abstract contract for daily quiz data operations.
///
/// Implemented by [DailyQuizRepositoryImpl] in the data layer.
abstract class DailyQuizRepository {
  /// Fetches today's daily quiz, or null if none is available.
  Future<Either<Failure, DailyQuiz?>> getTodayQuiz();

  /// Submits quiz answers and returns the result.
  ///
  /// [quizId] is the ID of the quiz being submitted.
  /// [answers] is a list of selected option indices, one per question.
  Future<Either<Failure, DailyQuizResult>> submitQuiz(
    String quizId,
    List<int> answers,
  );
}
