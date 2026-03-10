import 'package:equatable/equatable.dart';

sealed class NotificationInboxEvent extends Equatable {
  const NotificationInboxEvent();

  @override
  List<Object?> get props => [];
}

class LoadNotifications extends NotificationInboxEvent {
  const LoadNotifications();
}

class RefreshNotifications extends NotificationInboxEvent {
  const RefreshNotifications();
}

class LoadMoreNotifications extends NotificationInboxEvent {
  const LoadMoreNotifications();
}

class MarkNotificationAsRead extends NotificationInboxEvent {
  final String logId;
  final String contentType;
  final String? contentId;

  const MarkNotificationAsRead({
    required this.logId,
    required this.contentType,
    this.contentId,
  });

  @override
  List<Object?> get props => [logId, contentType, contentId];
}

class MarkAllNotificationsAsRead extends NotificationInboxEvent {
  const MarkAllNotificationsAsRead();
}

class DismissNotificationEvent extends NotificationInboxEvent {
  final String logId;

  const DismissNotificationEvent({required this.logId});

  @override
  List<Object?> get props => [logId];
}
