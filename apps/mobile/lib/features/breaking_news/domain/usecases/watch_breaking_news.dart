import 'package:injectable/injectable.dart';

import '../../../home/domain/entities/article.dart';
import '../repositories/breaking_news_repository.dart';

/// Subscribes to the SSE stream for real-time breaking news updates.
///
/// Unlike a standard [UseCase], this returns a [Stream] rather than
/// a [Future] because it provides a continuous flow of events.
@lazySingleton
class WatchBreakingNews {
  final BreakingNewsRepository _repository;

  WatchBreakingNews(this._repository);

  Stream<Article> call() {
    return _repository.watchBreakingNews();
  }
}
