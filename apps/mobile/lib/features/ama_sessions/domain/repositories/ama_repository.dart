import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/ama_question.dart';
import '../entities/ama_session.dart';

/// Abstract contract for AMA sessions data operations.
///
/// Implemented by [AmaRepositoryImpl] in the data layer.
abstract class AmaRepository {
  /// Fetches AMA sessions, optionally filtered by [status].
  Future<Either<Failure, List<AmaSession>>> getSessions({String? status});

  /// Fetches upcoming AMA sessions (scheduled but not yet started).
  Future<Either<Failure, List<AmaSession>>> getUpcomingSessions();

  /// Fetches a single AMA session by its [sessionId].
  Future<Either<Failure, AmaSession>> getSession(String sessionId);

  /// Fetches questions for a session, optionally filtered by [status].
  Future<Either<Failure, List<AmaQuestion>>> getQuestions(
    String sessionId, {
    String? status,
  });

  /// Submits a new question to a session.
  Future<Either<Failure, AmaQuestion>> submitQuestion(
    String sessionId,
    String text,
  );

  /// Upvotes a question.
  Future<Either<Failure, void>> upvoteQuestion(String questionId);
}
