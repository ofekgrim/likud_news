import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/notification_inbox_repository.dart';

@injectable
class MarkNotificationOpened {
  final NotificationInboxRepository _repository;

  MarkNotificationOpened(this._repository);

  Future<Either<Failure, void>> call({
    required String logId,
    required String deviceId,
  }) {
    return _repository.markAsOpened(logId: logId, deviceId: deviceId);
  }
}
