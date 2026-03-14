import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/feed_item.dart';
import '../entities/feed_response.dart';
import '../repositories/feed_repository.dart';

/// Use case for getting paginated mixed-content feed
@injectable
class GetFeed implements UseCase<FeedResponse, GetFeedParams> {
  final FeedRepository repository;

  GetFeed(this.repository);

  @override
  Future<Either<Failure, FeedResponse>> call(GetFeedParams params) async {
    return await repository.getFeed(
      page: params.page,
      limit: params.limit,
      types: params.types,
      categoryId: params.categoryId,
      deviceId: params.deviceId,
      userId: params.userId,
      mode: params.mode,
    );
  }
}

/// Feed display mode — mirrors backend FeedMode enum.
enum FeedMode { latest, personalized }

/// Parameters for GetFeed use case
class GetFeedParams extends Equatable {
  final int page;
  final int limit;
  final List<FeedItemType>? types;
  final String? categoryId;
  final String? deviceId;
  final String? userId;
  final FeedMode? mode;

  const GetFeedParams({
    this.page = 1,
    this.limit = 20,
    this.types,
    this.categoryId,
    this.deviceId,
    this.userId,
    this.mode,
  });

  GetFeedParams copyWith({
    int? page,
    int? limit,
    List<FeedItemType>? types,
    String? categoryId,
    String? deviceId,
    String? userId,
    FeedMode? mode,
  }) {
    return GetFeedParams(
      page: page ?? this.page,
      limit: limit ?? this.limit,
      types: types ?? this.types,
      categoryId: categoryId ?? this.categoryId,
      deviceId: deviceId ?? this.deviceId,
      userId: userId ?? this.userId,
      mode: mode ?? this.mode,
    );
  }

  @override
  List<Object?> get props => [page, limit, types, categoryId, deviceId, userId, mode];
}
