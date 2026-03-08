import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/notification_item.dart';
import '../../domain/repositories/notification_inbox_repository.dart';
import '../datasources/notification_inbox_remote_datasource.dart';

@LazySingleton(as: NotificationInboxRepository)
class NotificationInboxRepositoryImpl implements NotificationInboxRepository {
  final NotificationInboxRemoteDataSource _remoteDataSource;

  NotificationInboxRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<NotificationItem>>> getNotifications({
    required String deviceId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final models = await _remoteDataSource.getNotifications(
        deviceId: deviceId,
        page: page,
        limit: limit,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAsOpened({
    required String logId,
    required String deviceId,
  }) async {
    try {
      await _remoteDataSource.markAsOpened(logId: logId, deviceId: deviceId);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAllAsRead({
    required String deviceId,
  }) async {
    try {
      await _remoteDataSource.markAllAsRead(deviceId: deviceId);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> dismissNotification({
    required String logId,
    required String deviceId,
  }) async {
    try {
      await _remoteDataSource.dismissNotification(
        logId: logId,
        deviceId: deviceId,
      );
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
