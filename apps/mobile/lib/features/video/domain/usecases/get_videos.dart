import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/video_article.dart';
import '../repositories/video_repository.dart';

/// Fetches a paginated list of video articles.
@injectable
class GetVideos implements UseCase<List<VideoArticle>, VideoParams> {
  final VideoRepository repository;

  GetVideos(this.repository);

  @override
  Future<Either<Failure, List<VideoArticle>>> call(VideoParams params) {
    return repository.getVideos(page: params.page);
  }
}

/// Parameters for the [GetVideos] use case.
class VideoParams extends Equatable {
  final int page;

  const VideoParams({required this.page});

  @override
  List<Object?> get props => [page];
}
