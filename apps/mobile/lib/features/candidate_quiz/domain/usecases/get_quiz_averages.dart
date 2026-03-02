import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/community_average.dart';
import '../repositories/quiz_repository.dart';

/// Fetches community average match percentages per candidate for an election.
@injectable
class GetQuizAverages
    implements UseCase<List<CommunityAverage>, GetQuizAveragesParams> {
  final QuizRepository repository;

  GetQuizAverages(this.repository);

  @override
  Future<Either<Failure, List<CommunityAverage>>> call(
    GetQuizAveragesParams params,
  ) {
    return repository.getQuizAverages(params.electionId);
  }
}

/// Parameters for the [GetQuizAverages] use case.
class GetQuizAveragesParams extends Equatable {
  final String electionId;

  const GetQuizAveragesParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
