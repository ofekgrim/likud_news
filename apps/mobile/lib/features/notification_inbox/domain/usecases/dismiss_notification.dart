import 'package:dartz/dartz.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/notification_inbox_repository.dart';

@injectable
class DismissNotification {
  final NotificationInboxRepository _repository;

  DismissNotification(this._repository);

  Future<Either<Failure, void>> call({
    required String logId,
    required String deviceId,
  }) {
    return _repository.dismissNotification(logId: logId, deviceId: deviceId);
  }
}
