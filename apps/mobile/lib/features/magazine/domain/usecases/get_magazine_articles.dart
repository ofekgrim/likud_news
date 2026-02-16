import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/article.dart';
import '../repositories/magazine_repository.dart';

/// Fetches a paginated list of magazine articles.
@injectable
class GetMagazineArticles
    implements UseCase<List<Article>, MagazineParams> {
  final MagazineRepository repository;

  GetMagazineArticles(this.repository);

  @override
  Future<Either<Failure, List<Article>>> call(MagazineParams params) {
    return repository.getMagazineArticles(page: params.page);
  }
}

/// Parameters for the [GetMagazineArticles] use case.
class MagazineParams extends Equatable {
  final int page;

  const MagazineParams({required this.page});

  @override
  List<Object?> get props => [page];
}
