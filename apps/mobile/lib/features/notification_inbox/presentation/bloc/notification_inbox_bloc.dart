import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/services/device_id_service.dart';
import '../../domain/usecases/dismiss_notification.dart';
import '../../domain/usecases/get_notifications.dart';
import '../../domain/usecases/mark_all_notifications_read.dart';
import '../../domain/usecases/mark_notification_opened.dart';
import 'notification_inbox_event.dart';
import 'notification_inbox_state.dart';

@injectable
class NotificationInboxBloc
    extends Bloc<NotificationInboxEvent, NotificationInboxState> {
  final GetNotifications _getNotifications;
  final MarkNotificationOpened _markOpened;
  final MarkAllNotificationsRead _markAllRead;
  final DismissNotification _dismissNotification;
  final DeviceIdService _deviceIdService;

  NotificationInboxBloc(
    this._getNotifications,
    this._markOpened,
    this._markAllRead,
    this._dismissNotification,
    this._deviceIdService,
  ) : super(const NotificationInboxInitial()) {
    on<LoadNotifications>(_onLoad);
    on<RefreshNotifications>(_onRefresh);
    on<LoadMoreNotifications>(_onLoadMore);
    on<MarkNotificationAsRead>(_onMarkAsRead);
    on<MarkAllNotificationsAsRead>(_onMarkAllAsRead);
    on<DismissNotificationEvent>(_onDismiss);
  }

  Future<void> _onLoad(
    LoadNotifications event,
    Emitter<NotificationInboxState> emit,
  ) async {
    emit(const NotificationInboxLoading());
    final deviceId = _deviceIdService.deviceId;
    final result = await _getNotifications(deviceId: deviceId, page: 1);
    result.fold(
      (failure) => emit(NotificationInboxError(failure.message ?? 'Unknown error')),
      (items) => emit(NotificationInboxLoaded(
        notifications: items,
        hasMore: items.length >= 20,
        page: 1,
      )),
    );
  }

  Future<void> _onRefresh(
    RefreshNotifications event,
    Emitter<NotificationInboxState> emit,
  ) async {
    final deviceId = _deviceIdService.deviceId;
    final result = await _getNotifications(deviceId: deviceId, page: 1);
    result.fold(
      (failure) => emit(NotificationInboxError(failure.message ?? 'Unknown error')),
      (items) => emit(NotificationInboxLoaded(
        notifications: items,
        hasMore: items.length >= 20,
        page: 1,
      )),
    );
  }

  Future<void> _onLoadMore(
    LoadMoreNotifications event,
    Emitter<NotificationInboxState> emit,
  ) async {
    final currentState = state;
    if (currentState is! NotificationInboxLoaded || !currentState.hasMore) return;

    final deviceId = _deviceIdService.deviceId;
    final nextPage = currentState.page + 1;
    final result = await _getNotifications(deviceId: deviceId, page: nextPage);
    result.fold(
      (failure) => null,
      (items) => emit(NotificationInboxLoaded(
        notifications: [...currentState.notifications, ...items],
        hasMore: items.length >= 20,
        page: nextPage,
      )),
    );
  }

  Future<void> _onMarkAsRead(
    MarkNotificationAsRead event,
    Emitter<NotificationInboxState> emit,
  ) async {
    final deviceId = _deviceIdService.deviceId;
    await _markOpened(logId: event.logId, deviceId: deviceId);
  }

  Future<void> _onMarkAllAsRead(
    MarkAllNotificationsAsRead event,
    Emitter<NotificationInboxState> emit,
  ) async {
    final deviceId = _deviceIdService.deviceId;
    await _markAllRead(deviceId: deviceId);
    // Refresh the list to reflect read state
    add(const RefreshNotifications());
  }

  Future<void> _onDismiss(
    DismissNotificationEvent event,
    Emitter<NotificationInboxState> emit,
  ) async {
    final currentState = state;
    if (currentState is! NotificationInboxLoaded) return;

    final deviceId = _deviceIdService.deviceId;
    await _dismissNotification(logId: event.logId, deviceId: deviceId);

    // Remove from local list immediately
    final updated = currentState.notifications
        .where((n) => n.id != event.logId)
        .toList();
    emit(NotificationInboxLoaded(
      notifications: updated,
      hasMore: currentState.hasMore,
      page: currentState.page,
    ));
  }
}
