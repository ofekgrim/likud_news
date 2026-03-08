import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../domain/entities/notification_item.dart';

class NotificationItemCard extends StatelessWidget {
  final NotificationItem notification;
  final VoidCallback onTap;

  const NotificationItemCard({
    super.key,
    required this.notification,
    required this.onTap,
  });

  IconData _getIcon() {
    switch (notification.contentType) {
      case 'article':
        return Icons.article_outlined;
      case 'poll':
        return Icons.poll_outlined;
      case 'event':
        return Icons.event_outlined;
      case 'election':
        return Icons.how_to_vote_outlined;
      case 'quiz':
        return Icons.quiz_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getIconColor() {
    switch (notification.contentType) {
      case 'article':
        return const Color(0xFF0099DB);
      case 'poll':
        return const Color(0xFF10B981);
      case 'event':
        return const Color(0xFFF59E0B);
      case 'election':
        return const Color(0xFF8B5CF6);
      case 'quiz':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _getTypeLabel() {
    switch (notification.contentType) {
      case 'article':
        return 'כתבה';
      case 'poll':
        return 'סקר';
      case 'event':
        return 'אירוע';
      case 'election':
        return 'בחירות';
      case 'quiz':
        return 'שאלון';
      default:
        return 'התראה';
    }
  }

  /// Formats a [DateTime] as a relative Hebrew time string.
  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'עכשיו';
    if (diff.inMinutes < 60) return 'לפני ${diff.inMinutes} דק\'';
    if (diff.inHours < 24) return 'לפני ${diff.inHours} שע\'';
    if (diff.inDays < 7) return 'לפני ${diff.inDays} ימים';

    final d = dateTime.day.toString().padLeft(2, '0');
    final m = dateTime.month.toString().padLeft(2, '0');
    final y = dateTime.year;
    return '$d/$m/$y';
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsetsDirectional.all(16),
        decoration: BoxDecoration(
          color: notification.isRead
              ? Colors.white
              : const Color(0xFF0099DB).withValues(alpha: 0.04),
          border: Border(
            bottom: BorderSide(
              color: Colors.grey.shade200,
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image or icon
            if (notification.imageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: CachedNetworkImage(
                  imageUrl: notification.imageUrl!,
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: _getIconColor().withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(_getIcon(), size: 24, color: _getIconColor()),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: _getIconColor().withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(_getIcon(), size: 24, color: _getIconColor()),
                  ),
                ),
              )
            else
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getIconColor().withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getIcon(),
                  size: 20,
                  color: _getIconColor(),
                ),
              ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: notification.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: const Color(0xFF1E293B),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        notification.sentAt != null
                            ? _formatRelativeTime(notification.sentAt!)
                            : '',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _getIconColor().withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _getTypeLabel(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: _getIconColor(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Unread indicator
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsetsDirectional.only(start: 8, top: 6),
                decoration: const BoxDecoration(
                  color: Color(0xFF0099DB),
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
