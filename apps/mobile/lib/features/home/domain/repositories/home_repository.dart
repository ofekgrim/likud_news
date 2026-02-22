import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/article.dart';
import '../entities/category.dart';
import '../entities/story.dart';
import '../entities/ticker_item.dart';

/// Abstract contract for the home feature data operations.
///
/// Implemented by [HomeRepositoryImpl] in the data layer.
abstract class HomeRepository {
  /// Fetches the current hero article for the home screen.
  Future<Either<Failure, Article>> getHeroArticle();

  /// Fetches a paginated list of feed articles.
  ///
  /// [page] starts at 1. Each page returns a fixed number of articles.
  Future<Either<Failure, List<Article>>> getFeedArticles({required int page, int limit = 10});

  /// Fetches active ticker items for the breaking-news marquee bar.
  Future<Either<Failure, List<TickerItem>>> getTickerItems();

  /// Fetches all active categories for story circles.
  Future<Either<Failure, List<Category>>> getCategories();

  /// Fetches active stories for the home screen story circles.
  Future<Either<Failure, List<Story>>> getStories();
}
