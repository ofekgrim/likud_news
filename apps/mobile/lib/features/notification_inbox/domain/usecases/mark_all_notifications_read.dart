import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/notification_inbox_repository.dart';

@injectable
class MarkAllNotificationsRead {
  final NotificationInboxRepository _repository;

  MarkAllNotificationsRead(this._repository);

  Future<Either<Failure, void>> call({required String deviceId}) {
    return _repository.markAllAsRead(deviceId: deviceId);
  }
}
