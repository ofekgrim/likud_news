import 'package:equatable/equatable.dart';

import '../../../home/domain/entities/article.dart';

/// Immutable search result entity.
///
/// Contains the list of matching articles and total count
/// for pagination purposes.
class SearchResult extends Equatable {
  final List<Article> articles;
  final int totalArticles;

  const SearchResult({
    required this.articles,
    required this.totalArticles,
  });

  @override
  List<Object?> get props => [articles, totalArticles];
}
