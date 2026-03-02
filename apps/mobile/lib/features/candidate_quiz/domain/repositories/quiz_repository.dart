import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/community_average.dart';
import '../entities/quiz_answer.dart';
import '../entities/quiz_election.dart';
import '../entities/quiz_question.dart';
import '../entities/quiz_result.dart';

/// Abstract contract for the candidate quiz feature data operations.
///
/// Implemented by [QuizRepositoryImpl] in the data layer.
abstract class QuizRepository {
  /// Fetches all elections that have quizzes.
  Future<Either<Failure, List<QuizElection>>> getQuizElections();

  /// Resolves 'active' to the real election UUID.
  Future<Either<Failure, String>> resolveActiveElectionId();

  /// Fetches all active quiz questions for the given election.
  Future<Either<Failure, List<QuizQuestion>>> getQuestions(String electionId);

  /// Submits the user's quiz answers and returns ranked candidate matches.
  Future<Either<Failure, List<CandidateMatch>>> submitQuiz(
    String electionId,
    List<QuizAnswer> answers,
  );

  /// Fetches the user's existing quiz results for the given election.
  ///
  /// Returns `null` inside the [Right] if the user has not yet taken the quiz.
  Future<Either<Failure, QuizResult?>> getMyResults(String electionId);

  /// Fetches community average match percentages per candidate for an election.
  Future<Either<Failure, List<CommunityAverage>>> getQuizAverages(
    String electionId,
  );
}
