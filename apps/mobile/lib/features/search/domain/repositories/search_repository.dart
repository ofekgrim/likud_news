import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/search_result.dart';

/// Abstract contract for the search feature data operations.
///
/// Implemented by [SearchRepositoryImpl] in the data layer.
abstract class SearchRepository {
  /// Searches articles by [query] with pagination support.
  ///
  /// [page] starts at 1. Each page returns a fixed number of articles.
  Future<Either<Failure, SearchResult>> search({
    required String query,
    required int page,
  });
}
