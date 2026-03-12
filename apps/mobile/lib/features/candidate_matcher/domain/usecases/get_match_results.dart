import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/match_result.dart';
import '../repositories/candidate_matcher_repository.dart';

/// Computes and returns match results for the user.
@injectable
class GetMatchResults
    implements UseCase<MatchResultResponse, GetMatchResultsParams> {
  final CandidateMatcherRepository repository;

  GetMatchResults(this.repository);

  @override
  Future<Either<Failure, MatchResultResponse>> call(
    GetMatchResultsParams params,
  ) {
    return repository.getMatchResults(params.electionId);
  }
}

/// Parameters for [GetMatchResults].
class GetMatchResultsParams extends Equatable {
  final String electionId;

  const GetMatchResultsParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
