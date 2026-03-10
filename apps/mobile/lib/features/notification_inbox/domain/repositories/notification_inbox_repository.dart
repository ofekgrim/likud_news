import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/notification_item.dart';

abstract class NotificationInboxRepository {
  Future<Either<Failure, List<NotificationItem>>> getNotifications({
    required String deviceId,
    int page = 1,
    int limit = 20,
  });

  Future<Either<Failure, void>> markAsOpened({
    required String logId,
    required String deviceId,
  });

  Future<Either<Failure, void>> markAllAsRead({required String deviceId});

  Future<Either<Failure, void>> dismissNotification({
    required String logId,
    required String deviceId,
  });
}
