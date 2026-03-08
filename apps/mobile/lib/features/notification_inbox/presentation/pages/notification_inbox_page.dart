import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/notification_count_service.dart';
import '../bloc/notification_inbox_bloc.dart';
import '../bloc/notification_inbox_event.dart';
import '../bloc/notification_inbox_state.dart';
import '../widgets/notification_item_card.dart';

class NotificationInboxPage extends StatelessWidget {
  const NotificationInboxPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => GetIt.I<NotificationInboxBloc>()
        ..add(const LoadNotifications()),
      child: const _NotificationInboxView(),
    );
  }
}

class _NotificationInboxView extends StatelessWidget {
  const _NotificationInboxView();

  void _navigateToContent(BuildContext context, String contentType, String? contentId, String? contentSlug) {
    switch (contentType) {
      case 'article':
        final slug = contentSlug ?? contentId;
        if (slug != null) context.push('/article/$slug');
        break;
      case 'poll':
        context.push('/polls');
        break;
      case 'event':
        if (contentId != null) {
          context.push('/events');
        } else {
          context.push('/events');
        }
        break;
      case 'election':
        if (contentId != null) {
          context.push('/election-day/$contentId');
        }
        break;
      case 'quiz':
        if (contentId != null) {
          context.push('/primaries/quiz');
        }
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'התראות',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1E293B),
          surfaceTintColor: Colors.transparent,
          actions: [
            BlocBuilder<NotificationInboxBloc, NotificationInboxState>(
              builder: (context, state) {
                if (state is NotificationInboxLoaded &&
                    state.notifications.any((n) => !n.isRead)) {
                  return IconButton(
                    icon: const Icon(Icons.done_all, size: 22),
                    tooltip: 'סמן הכל כנקרא',
                    onPressed: () {
                      context
                          .read<NotificationInboxBloc>()
                          .add(const MarkAllNotificationsAsRead());
                      GetIt.I<NotificationCountService>().unreadCount.value = 0;
                    },
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
        backgroundColor: Colors.white,
        body: BlocBuilder<NotificationInboxBloc, NotificationInboxState>(
          builder: (context, state) {
            if (state is NotificationInboxLoading) {
              return const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF0099DB),
                ),
              );
            }

            if (state is NotificationInboxError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'שגיאה בטעינת ההתראות',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context
                          .read<NotificationInboxBloc>()
                          .add(const LoadNotifications()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0099DB),
                      ),
                      child: const Text('נסה שוב'),
                    ),
                  ],
                ),
              );
            }

            if (state is NotificationInboxLoaded) {
              if (state.notifications.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none,
                          size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text(
                        'אין התראות',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'ההתראות שלך יופיעו כאן',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                color: const Color(0xFF0099DB),
                onRefresh: () async {
                  context
                      .read<NotificationInboxBloc>()
                      .add(const RefreshNotifications());
                },
                child: NotificationListener<ScrollNotification>(
                  onNotification: (scrollNotification) {
                    if (scrollNotification is ScrollEndNotification &&
                        scrollNotification.metrics.pixels >=
                            scrollNotification.metrics.maxScrollExtent - 200) {
                      context
                          .read<NotificationInboxBloc>()
                          .add(const LoadMoreNotifications());
                    }
                    return false;
                  },
                  child: ListView.builder(
                    itemCount: state.notifications.length,
                    itemBuilder: (context, index) {
                      final notification = state.notifications[index];
                      return Dismissible(
                        key: ValueKey(notification.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: AlignmentDirectional.centerEnd,
                          padding: const EdgeInsetsDirectional.only(end: 20),
                          color: Colors.red.shade400,
                          child: const Icon(Icons.delete_outline,
                              color: Colors.white),
                        ),
                        onDismissed: (_) {
                          if (!notification.isRead) {
                            GetIt.I<NotificationCountService>().decrement();
                          }
                          context.read<NotificationInboxBloc>().add(
                                DismissNotificationEvent(
                                    logId: notification.id),
                              );
                        },
                        child: NotificationItemCard(
                          notification: notification,
                          onTap: () {
                            if (!notification.isRead) {
                              GetIt.I<NotificationCountService>().decrement();
                            }
                            context.read<NotificationInboxBloc>().add(
                                  MarkNotificationAsRead(
                                    logId: notification.id,
                                    contentType: notification.contentType,
                                    contentId: notification.contentId,
                                  ),
                                );
                            _navigateToContent(
                              context,
                              notification.contentType,
                              notification.contentId,
                              notification.contentSlug,
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}
