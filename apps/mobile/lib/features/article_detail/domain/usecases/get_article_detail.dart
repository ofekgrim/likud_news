import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/article_detail.dart';
import '../repositories/article_detail_repository.dart';

/// Fetches the full article detail by its URL slug.
@lazySingleton
class GetArticleDetail implements UseCase<ArticleDetail, GetArticleDetailParams> {
  final ArticleDetailRepository repository;

  const GetArticleDetail(this.repository);

  @override
  Future<Either<Failure, ArticleDetail>> call(GetArticleDetailParams params) {
    return repository.getArticleBySlug(params.slug, deviceId: params.deviceId);
  }
}

/// Parameters for [GetArticleDetail].
class GetArticleDetailParams extends Equatable {
  final String slug;
  final String? deviceId;

  const GetArticleDetailParams({required this.slug, this.deviceId});

  @override
  List<Object?> get props => [slug, deviceId];
}
