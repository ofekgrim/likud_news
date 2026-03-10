import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../domain/entities/feed_item.dart';

/// Card widget for displaying a campaign event in the feed
class FeedEventCard extends StatelessWidget {
  final FeedEventContent event;
  final bool isPinned;
  final VoidCallback? onTap;

  const FeedEventCard({
    super.key,
    required this.event,
    this.isPinned = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isPinned ? AppColors.likudBlue : Colors.transparent,
          width: isPinned ? 2 : 0,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event Image
            if (event.imageUrl != null)
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(12),
                    ),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: Image.network(
                        event.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            Container(
                          color: context.colors.surfaceMedium,
                          child: const Icon(Icons.event, size: 48),
                        ),
                      ),
                    ),
                  ),
                  // Gradient overlay
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(12),
                        ),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.6),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Pinned badge
                  if (isPinned)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.likudBlue,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.push_pin,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                ],
              ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Event type badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.likudBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.event_outlined,
                          color: AppColors.likudBlue,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          event.eventType ?? 'campaign_event'.tr(),
                          style: TextStyle(
                            color: AppColors.likudBlue,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Title
                  Text(
                    event.title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                      color: context.colors.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  // Description
                  if (event.description != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      event.description!,
                      style: TextStyle(
                        fontSize: 14,
                        color: context.colors.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Date and location pills
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      // Date pill
                      _InfoPill(
                        icon: Icons.calendar_today_outlined,
                        text: _formatDate(event.startTime),
                      ),
                      // Time pill
                      _InfoPill(
                        icon: Icons.access_time,
                        text: _formatTime(event.startTime),
                      ),
                      // Location pill
                      if (event.location != null)
                        _InfoPill(
                          icon: Icons.location_on_outlined,
                          text: event.location!,
                        ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Footer
                  Row(
                    children: [
                      // RSVP count
                      Icon(Icons.people_outline, size: 16, color: context.colors.textTertiary),
                      const SizedBox(width: 4),
                      Text(
                        '${event.rsvpCount} ${'attending'.tr()}',
                        style: TextStyle(
                          fontSize: 13,
                          color: context.colors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),

                      // Max attendees
                      if (event.maxAttendees != null) ...[
                        Text(
                          ' / ${event.maxAttendees}',
                          style: TextStyle(
                            fontSize: 13,
                            color: context.colors.textTertiary,
                          ),
                        ),
                      ],

                      const Spacer(),

                      // RSVP button
                      ElevatedButton.icon(
                        onPressed: () {
                          if (!requireAuth(context)) return;
                          onTap?.call();
                        },
                        icon: Icon(
                          event.userHasRsvped
                              ? Icons.check_circle
                              : Icons.add_circle_outline,
                          size: 18,
                        ),
                        label: Text(
                          event.userHasRsvped
                              ? 'attending'.tr()
                              : 'rsvp'.tr(),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: event.userHasRsvped
                              ? context.colors.surfaceMedium
                              : AppColors.likudBlue,
                          foregroundColor: event.userHasRsvped
                              ? context.colors.textSecondary
                              : Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now);

    if (difference.inDays == 0) {
      return 'today'.tr();
    } else if (difference.inDays == 1) {
      return 'tomorrow'.tr();
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ${'days'.tr()}';
    } else {
      return DateFormat('dd/MM/yyyy').format(date);
    }
  }

  String _formatTime(DateTime time) {
    return DateFormat('HH:mm').format(time);
  }
}

/// Widget for displaying date/time/location info pills
class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoPill({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: context.colors.textSecondary),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: context.colors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
