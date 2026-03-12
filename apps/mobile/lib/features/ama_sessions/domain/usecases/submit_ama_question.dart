import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/ama_question.dart';
import '../repositories/ama_repository.dart';

/// Parameters for submitting a question to an AMA session.
class SubmitAmaQuestionParams extends Equatable {
  final String sessionId;
  final String text;

  const SubmitAmaQuestionParams({
    required this.sessionId,
    required this.text,
  });

  @override
  List<Object?> get props => [sessionId, text];
}

/// Submits a new question to an AMA session.
@injectable
class SubmitAmaQuestion
    implements UseCase<AmaQuestion, SubmitAmaQuestionParams> {
  final AmaRepository repository;

  SubmitAmaQuestion(this.repository);

  @override
  Future<Either<Failure, AmaQuestion>> call(SubmitAmaQuestionParams params) {
    return repository.submitQuestion(params.sessionId, params.text);
  }
}
