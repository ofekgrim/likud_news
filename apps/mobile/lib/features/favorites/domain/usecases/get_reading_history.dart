import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/favorites_repository.dart';

/// Fetches a paginated list of the user's reading history.
@injectable
class GetReadingHistory implements UseCase<List<Article>, HistoryParams> {
  final FavoritesRepository repository;

  GetReadingHistory(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(HistoryParams params) {
    return repository.getReadingHistory(
      deviceId: params.deviceId,
      page: params.page,
    );
  }
}

/// Parameters for the [GetReadingHistory] use case.
class HistoryParams extends Equatable {
  final String deviceId;
  final int page;

  const HistoryParams({required this.deviceId, required this.page});

  @override
  List<Object?> get props => [deviceId, page];
}
