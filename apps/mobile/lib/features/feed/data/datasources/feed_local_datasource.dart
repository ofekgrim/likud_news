import 'dart:convert';
import 'package:hive/hive.dart';
import '../models/feed_response_model.dart';

/// Key for the cached first-page feed response
const String kFeedCacheKey = 'cached_feed';

/// Key for the cache timestamp
const String kFeedCacheTimestampKey = 'cached_feed_timestamp';

/// Local data source for offline feed caching using Hive.
///
/// Caches the first page of the feed so users see content immediately
/// on app launch, even without network connectivity.
abstract class FeedLocalDataSource {
  /// Returns the cached feed response, or null if no cache exists.
  FeedResponseModel? getCachedFeed();

  /// Stores a feed response in the local cache.
  Future<void> cacheFeed(FeedResponseModel response);

  /// Clears the feed cache.
  Future<void> clearCache();

  /// Returns true if the cache is still fresh (< 5 minutes old).
  bool isCacheFresh();
}

class FeedLocalDataSourceImpl implements FeedLocalDataSource {
  final Box _box;

  FeedLocalDataSourceImpl(this._box);

  @override
  FeedResponseModel? getCachedFeed() {
    final jsonString = _box.get(kFeedCacheKey) as String?;
    if (jsonString == null) return null;

    try {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return FeedResponseModel.fromJson(json);
    } catch (_) {
      // Corrupt cache — clear it
      _box.delete(kFeedCacheKey);
      return null;
    }
  }

  @override
  Future<void> cacheFeed(FeedResponseModel response) async {
    final jsonString = jsonEncode(response.toJson());
    await _box.put(kFeedCacheKey, jsonString);
    await _box.put(kFeedCacheTimestampKey, DateTime.now().millisecondsSinceEpoch);
  }

  @override
  Future<void> clearCache() async {
    await _box.delete(kFeedCacheKey);
    await _box.delete(kFeedCacheTimestampKey);
  }

  @override
  bool isCacheFresh() {
    final timestamp = _box.get(kFeedCacheTimestampKey) as int?;
    if (timestamp == null) return false;

    final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    return DateTime.now().difference(cacheTime).inMinutes < 5;
  }
}
