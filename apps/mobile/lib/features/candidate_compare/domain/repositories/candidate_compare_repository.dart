import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/compare_result.dart';

/// Abstract contract for candidate comparison data operations.
///
/// Implemented by [CandidateCompareRepositoryImpl] in the data layer.
abstract class CandidateCompareRepository {
  /// Fetches a comparison of candidates by their IDs.
  ///
  /// The [ids] list must contain at least 2 candidate IDs.
  Future<Either<Failure, CompareResult>> compareCandidates(List<String> ids);
}
