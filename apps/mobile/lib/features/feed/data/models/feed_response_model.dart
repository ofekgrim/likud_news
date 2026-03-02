import '../../domain/entities/feed_response.dart';
import 'feed_item_model.dart';

/// Data model for feed response, handles JSON serialization.
///
/// Maps API feed endpoint responses to the domain [FeedResponse] entity.
class FeedResponseModel {
  final List<FeedItemModel> items;
  final FeedMetaModel meta;

  const FeedResponseModel({
    required this.items,
    required this.meta,
  });

  factory FeedResponseModel.fromJson(Map<String, dynamic> json) {
    return FeedResponseModel(
      items: (json['data'] as List<dynamic>?)
              ?.map((e) => FeedItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      meta: FeedMetaModel.fromJson(json['meta'] as Map<String, dynamic>? ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'data': items.map((e) => e.toJson()).toList(),
      'meta': meta.toJson(),
    };
  }

  FeedResponse toEntity() {
    return FeedResponse(
      items: items.map((e) => e.toEntity()).toList(),
      meta: meta.toEntity(),
    );
  }
}

/// Data model for feed metadata
class FeedMetaModel {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final int articlesCount;
  final int pollsCount;
  final int eventsCount;
  final int electionsCount;
  final int quizzesCount;

  const FeedMetaModel({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.articlesCount,
    required this.pollsCount,
    required this.eventsCount,
    required this.electionsCount,
    required this.quizzesCount,
  });

  factory FeedMetaModel.fromJson(Map<String, dynamic> json) {
    return FeedMetaModel(
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
      articlesCount: json['articlesCount'] as int? ?? 0,
      pollsCount: json['pollsCount'] as int? ?? 0,
      eventsCount: json['eventsCount'] as int? ?? 0,
      electionsCount: json['electionsCount'] as int? ?? 0,
      quizzesCount: json['quizzesCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
      'articlesCount': articlesCount,
      'pollsCount': pollsCount,
      'eventsCount': eventsCount,
      'electionsCount': electionsCount,
      'quizzesCount': quizzesCount,
    };
  }

  FeedMeta toEntity() {
    return FeedMeta(
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      articlesCount: articlesCount,
      pollsCount: pollsCount,
      eventsCount: eventsCount,
      electionsCount: electionsCount,
      quizzesCount: quizzesCount,
    );
  }
}
