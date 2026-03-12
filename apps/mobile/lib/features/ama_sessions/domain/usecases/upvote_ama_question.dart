import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/ama_repository.dart';

/// Upvotes a question in an AMA session.
@injectable
class UpvoteAmaQuestion implements UseCase<void, String> {
  final AmaRepository repository;

  UpvoteAmaQuestion(this.repository);

  @override
  Future<Either<Failure, void>> call(String questionId) {
    return repository.upvoteQuestion(questionId);
  }
}
