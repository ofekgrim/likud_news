import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/video_article.dart';

/// Abstract contract for the video feature data operations.
///
/// Implemented by [VideoRepositoryImpl] in the data layer.
abstract class VideoRepository {
  /// Fetches a paginated list of video articles.
  ///
  /// [page] starts at 1. Each page returns a fixed number of video articles.
  Future<Either<Failure, List<VideoArticle>>> getVideos({required int page});
}
