import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../article_detail/domain/entities/author.dart';
import '../repositories/authors_repository.dart';

/// Fetches all active authors.
@injectable
class GetAuthors implements UseCase<List<Author>, NoParams> {
  final AuthorsRepository repository;

  GetAuthors(this.repository);

  @override
  Future<Either<Failure, List<Author>>> call(NoParams params) {
    return repository.getAuthors();
  }
}
