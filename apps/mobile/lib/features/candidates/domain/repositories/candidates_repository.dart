import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/candidate.dart';
import '../entities/election.dart';
import '../entities/endorsement.dart';

/// Abstract contract for the candidates feature data operations.
///
/// Implemented by [CandidatesRepositoryImpl] in the data layer.
abstract class CandidatesRepository {
  /// Fetches all active elections.
  Future<Either<Failure, List<Election>>> getElections();

  /// Fetches a single election by ID.
  Future<Either<Failure, Election>> getElection(String id);

  /// Fetches all active candidates for a given election.
  Future<Either<Failure, List<Candidate>>> getCandidatesByElection(
    String electionId,
  );

  /// Fetches a single candidate by slug.
  Future<Either<Failure, Candidate>> getCandidateBySlug(String slug);

  /// Fetches a single candidate by ID.
  Future<Either<Failure, Candidate>> getCandidateById(String id);

  /// Endorses a candidate in a given election.
  Future<Either<Failure, Endorsement>> endorseCandidate(
    String candidateId,
    String electionId,
  );

  /// Removes the current user's endorsement for a given election.
  Future<Either<Failure, void>> removeEndorsement(String electionId);

  /// Fetches the current user's endorsement for a given election, if any.
  Future<Either<Failure, Endorsement?>> getMyEndorsement(String electionId);
}
