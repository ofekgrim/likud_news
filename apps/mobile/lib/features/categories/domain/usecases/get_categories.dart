import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/category.dart';
import '../repositories/categories_repository.dart';

/// Fetches all active categories.
@injectable
class GetCategories implements UseCase<List<Category>, NoParams> {
  final CategoriesRepository repository;

  GetCategories(this.repository);

  @override
  Future<Either<Failure, List<Category>>> call(NoParams params) {
    return repository.getCategories();
  }
}
