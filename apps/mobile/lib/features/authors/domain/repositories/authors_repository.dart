import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../../../article_detail/domain/entities/author.dart';

/// Abstract contract for the authors feature data operations.
abstract class AuthorsRepository {
  /// Fetches all active authors.
  Future<Either<Failure, List<Author>>> getAuthors();
}
