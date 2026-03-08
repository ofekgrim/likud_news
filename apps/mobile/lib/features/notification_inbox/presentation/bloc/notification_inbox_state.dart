import 'package:equatable/equatable.dart';
import '../../domain/entities/notification_item.dart';

sealed class NotificationInboxState extends Equatable {
  const NotificationInboxState();

  @override
  List<Object?> get props => [];
}

class NotificationInboxInitial extends NotificationInboxState {
  const NotificationInboxInitial();
}

class NotificationInboxLoading extends NotificationInboxState {
  const NotificationInboxLoading();
}

class NotificationInboxLoaded extends NotificationInboxState {
  final List<NotificationItem> notifications;
  final bool hasMore;
  final int page;

  const NotificationInboxLoaded({
    required this.notifications,
    this.hasMore = true,
    this.page = 1,
  });

  @override
  List<Object?> get props => [notifications, hasMore, page];
}

class NotificationInboxError extends NotificationInboxState {
  final String message;

  const NotificationInboxError(this.message);

  @override
  List<Object?> get props => [message];
}
