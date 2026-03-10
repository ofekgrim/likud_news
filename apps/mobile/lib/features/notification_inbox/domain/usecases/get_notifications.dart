import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../entities/notification_item.dart';
import '../repositories/notification_inbox_repository.dart';

@injectable
class GetNotifications {
  final NotificationInboxRepository _repository;

  GetNotifications(this._repository);

  Future<Either<Failure, List<NotificationItem>>> call({
    required String deviceId,
    int page = 1,
    int limit = 20,
  }) {
    return _repository.getNotifications(
      deviceId: deviceId,
      page: page,
      limit: limit,
    );
  }
}
