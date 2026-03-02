import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/candidate.dart';
import '../repositories/candidates_repository.dart';

/// Fetches a single candidate by slug.
@injectable
class GetCandidateDetail
    implements UseCase<Candidate, CandidateDetailParams> {
  final CandidatesRepository repository;

  GetCandidateDetail(this.repository);

  @override
  Future<Either<Failure, Candidate>> call(CandidateDetailParams params) {
    return repository.getCandidateBySlug(params.slug);
  }
}

/// Parameters for the [GetCandidateDetail] use case.
class CandidateDetailParams extends Equatable {
  final String slug;

  const CandidateDetailParams({required this.slug});

  @override
  List<Object?> get props => [slug];
}
