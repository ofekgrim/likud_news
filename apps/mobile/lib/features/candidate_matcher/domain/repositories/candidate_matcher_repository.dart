import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/match_result.dart';
import '../entities/policy_statement.dart';
import '../entities/quiz_answer.dart';

/// Abstract contract for candidate matcher data operations.
///
/// Implemented by [CandidateMatcherRepositoryImpl] in the data layer.
abstract class CandidateMatcherRepository {
  /// Fetches policy statements for a given election.
  Future<Either<Failure, List<PolicyStatement>>> getStatements(
    String electionId,
  );

  /// Submits the user's quiz responses.
  ///
  /// [responses] maps statement ID to a record of answer and optional weight.
  Future<Either<Failure, void>> submitResponses({
    required String electionId,
    required List<({String statementId, QuizAnswer answer, double? importanceWeight})>
        responses,
  });

  /// Computes and returns match results for the user.
  Future<Either<Failure, MatchResultResponse>> getMatchResults(
    String electionId,
  );
}
