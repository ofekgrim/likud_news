import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/ama_session.dart';

/// A card widget displaying a single AMA session.
///
/// Shows candidate name, title, scheduled time, and status badge.
/// Live sessions display an animated red dot indicator.
class AmaSessionCard extends StatefulWidget {
  final AmaSession session;
  final VoidCallback onTap;

  const AmaSessionCard({
    super.key,
    required this.session,
    required this.onTap,
  });

  @override
  State<AmaSessionCard> createState() => _AmaSessionCardState();
}

class _AmaSessionCardState extends State<AmaSessionCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController? _pulseController;

  @override
  void initState() {
    super.initState();
    if (widget.session.isLive) {
      _pulseController = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1200),
      )..repeat(reverse: true);
    } else {
      _pulseController = null;
    }
  }

  @override
  void dispose() {
    _pulseController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.session;
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    return InkWell(
      onTap: widget.onTap,
      borderRadius: BorderRadius.circular(16),
      child: Card(
        elevation: 0,
        color: context.colors.cardSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: session.isLive
              ? const BorderSide(color: AppColors.breakingRed, width: 1.5)
              : BorderSide(color: context.colors.border),
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status badge
              _buildStatusBadge(session),

              const SizedBox(height: 12),

              // Title
              Text(
                session.title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: context.colors.textPrimary,
                  height: 1.4,
                ),
              ),

              const SizedBox(height: 8),

              // Candidate name
              Text(
                session.candidateName,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.likudBlue,
                ),
              ),

              // Description
              if (session.description != null &&
                  session.description!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  session.description!,
                  style: TextStyle(
                    fontSize: 14,
                    color: context.colors.textSecondary,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              const SizedBox(height: 12),

              // Footer: scheduled time + question count
              Row(
                children: [
                  Icon(
                    Icons.schedule,
                    size: 16,
                    color: context.colors.textSecondary.withValues(alpha: 0.7),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    dateFormat.format(session.scheduledAt),
                    style: TextStyle(
                      fontSize: 13,
                      color:
                          context.colors.textSecondary.withValues(alpha: 0.7),
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 16,
                    color: context.colors.textSecondary.withValues(alpha: 0.7),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${session.questionCount} ${'ama.questions_count'.tr()}',
                    style: TextStyle(
                      fontSize: 13,
                      color:
                          context.colors.textSecondary.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(AmaSession session) {
    final Color badgeColor;
    final Color textColor;
    final String label;
    final IconData icon;

    if (session.isLive) {
      badgeColor = AppColors.breakingRed.withValues(alpha: 0.1);
      textColor = AppColors.breakingRed;
      label = 'ama.live_now'.tr();
      icon = Icons.fiber_manual_record;
    } else if (session.isScheduled) {
      badgeColor = AppColors.likudBlue.withValues(alpha: 0.1);
      textColor = AppColors.likudBlue;
      label = 'ama.upcoming'.tr();
      icon = Icons.event;
    } else if (session.status == 'archived') {
      badgeColor = context.colors.textSecondary.withValues(alpha: 0.1);
      textColor = context.colors.textSecondary;
      label = 'ama.archived'.tr();
      icon = Icons.archive_outlined;
    } else {
      badgeColor = context.colors.textSecondary.withValues(alpha: 0.1);
      textColor = context.colors.textSecondary;
      label = 'ama.ended'.tr();
      icon = Icons.check_circle_outline;
    }

    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 8, 4),
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (session.isLive && _pulseController != null)
            FadeTransition(
              opacity: _pulseController,
              child: Icon(icon, size: 12, color: textColor),
            )
          else
            Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
