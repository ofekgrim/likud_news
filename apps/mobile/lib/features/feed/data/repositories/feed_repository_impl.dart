import 'dart:async';
import 'dart:convert';
import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/network/sse_client.dart';
import '../../domain/entities/feed_item.dart';
import '../../domain/entities/feed_response.dart';
import '../../domain/repositories/feed_repository.dart';
import '../datasources/feed_local_datasource.dart';
import '../datasources/feed_remote_datasource.dart';
import '../models/feed_item_model.dart';

@LazySingleton(as: FeedRepository)
class FeedRepositoryImpl implements FeedRepository {
  final FeedRemoteDataSource remoteDataSource;
  final FeedLocalDataSource localDataSource;
  final SseClient sseClient;

  StreamController<FeedItem>? _feedUpdatesController;
  StreamSubscription? _sseSubscription;

  FeedRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.sseClient,
  });

  @override
  Future<Either<Failure, FeedResponse>> getFeed({
    int page = 1,
    int limit = 20,
    List<FeedItemType>? types,
    String? categoryId,
    String? deviceId,
    String? userId,
  }) async {
    try {
      // Convert enum types to strings
      final typeStrings = types?.map(_feedItemTypeToString).toList();

      final model = await remoteDataSource.getFeed(
        page: page,
        limit: limit,
        types: typeStrings,
        categoryId: categoryId,
        deviceId: deviceId,
        userId: userId,
      );

      // Cache first page for offline access
      if (page == 1 && types == null && categoryId == null) {
        localDataSource.cacheFeed(model);
      }

      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } on NetworkException {
      // Fall back to cached feed on network error (first page only)
      if (page == 1) {
        final cached = localDataSource.getCachedFeed();
        if (cached != null) {
          return Right(cached.toEntity());
        }
      }
      return const Left(NetworkFailure());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Stream<FeedItem> subscribeToUpdates() {
    // Create controller if not already created
    _feedUpdatesController ??= StreamController<FeedItem>.broadcast(
      onCancel: _onCancelSubscription,
    );

    // Start SSE connection if not already connected
    if (_sseSubscription == null) {
      _startSseConnection();
    }

    return _feedUpdatesController!.stream;
  }

  void _startSseConnection() {
    final sseStream = sseClient.feedStream();

    _sseSubscription = sseStream.listen(
      (event) {
        try {
          // Parse SSE event data
          final data = event.data;
          if (data.isEmpty) return;

          // Parse JSON
          final json = jsonDecode(data) as Map<String, dynamic>;

          // Convert to FeedItem
          final feedItemModel = FeedItemModel.fromJson(json);
          final feedItem = feedItemModel.toEntity();

          // Emit to stream
          _feedUpdatesController?.add(feedItem);
        } catch (e) {
          // Log error but don't break the stream
          print('Error parsing SSE feed update: $e');
        }
      },
      onError: (error) {
        print('SSE feed connection error: $error');
        // SSE client will auto-reconnect
      },
      onDone: () {
        print('SSE feed connection closed');
        _sseSubscription = null;
      },
    );
  }

  void _onCancelSubscription() {
    // Only close SSE if no more listeners
    if (_feedUpdatesController?.hasListener == false) {
      _sseSubscription?.cancel();
      _sseSubscription = null;
    }
  }

  @override
  Future<void> dispose() async {
    await _sseSubscription?.cancel();
    _sseSubscription = null;
    await _feedUpdatesController?.close();
    _feedUpdatesController = null;
  }

  /// Convert FeedItemType enum to API string
  String _feedItemTypeToString(FeedItemType type) {
    switch (type) {
      case FeedItemType.article:
        return 'article';
      case FeedItemType.poll:
        return 'poll';
      case FeedItemType.event:
        return 'event';
      case FeedItemType.electionUpdate:
        return 'election_update';
      case FeedItemType.quizPrompt:
        return 'quiz_prompt';
      case FeedItemType.dailyQuiz:
        return 'daily_quiz';
    }
  }
}
