import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/ticker_item.dart';
import '../repositories/home_repository.dart';

/// Fetches active ticker items for the breaking-news marquee bar.
@injectable
class GetTickerItems implements UseCase<List<TickerItem>, NoParams> {
  final HomeRepository repository;

  GetTickerItems(this.repository);

  @override
  Future<Either<Failure, List<TickerItem>>> call(NoParams params) {
    return repository.getTickerItems();
  }
}
