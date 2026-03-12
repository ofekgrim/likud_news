import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/compare_result.dart';
import '../repositories/candidate_compare_repository.dart';

/// Fetches a comparison result for a list of candidate IDs.
@injectable
class GetCandidateComparison
    implements UseCase<CompareResult, CandidateComparisonParams> {
  final CandidateCompareRepository repository;

  GetCandidateComparison(this.repository);

  @override
  Future<Either<Failure, CompareResult>> call(
    CandidateComparisonParams params,
  ) {
    return repository.compareCandidates(params.ids);
  }
}

/// Parameters for the [GetCandidateComparison] use case.
class CandidateComparisonParams extends Equatable {
  final List<String> ids;

  const CandidateComparisonParams({required this.ids});

  @override
  List<Object?> get props => [ids];
}
