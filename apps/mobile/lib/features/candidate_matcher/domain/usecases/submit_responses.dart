import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/quiz_answer.dart';
import '../repositories/candidate_matcher_repository.dart';

/// Submits quiz responses to the backend.
@injectable
class SubmitResponses implements UseCase<void, SubmitResponsesParams> {
  final CandidateMatcherRepository repository;

  SubmitResponses(this.repository);

  @override
  Future<Either<Failure, void>> call(SubmitResponsesParams params) {
    return repository.submitResponses(
      electionId: params.electionId,
      responses: params.responses,
    );
  }
}

/// Parameters for [SubmitResponses].
class SubmitResponsesParams extends Equatable {
  final String electionId;
  final List<({String statementId, QuizAnswer answer, double? importanceWeight})>
      responses;

  const SubmitResponsesParams({
    required this.electionId,
    required this.responses,
  });

  @override
  List<Object?> get props => [electionId, responses];
}
