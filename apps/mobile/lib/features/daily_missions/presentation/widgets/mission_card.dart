import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/daily_mission.dart';

/// Widget displaying a single daily mission with icon, description,
/// points badge, and circular progress indicator.
class MissionCard extends StatelessWidget {
  final DailyMission mission;
  final VoidCallback? onComplete;

  const MissionCard({
    super.key,
    required this.mission,
    this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    final isHebrew = context.locale.languageCode == 'he';
    final description =
        isHebrew ? mission.descriptionHe : mission.descriptionEn;

    return GestureDetector(
      onTap: () => _navigateToFeature(context),
      child: Container(
        padding: const EdgeInsetsDirectional.all(14),
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: mission.isCompleted
                ? AppColors.success.withValues(alpha: 0.4)
                : context.colors.border,
            width: mission.isCompleted ? 1.5 : 0.5,
          ),
          boxShadow: [
            BoxShadow(
              color: mission.isCompleted
                  ? AppColors.success.withValues(alpha: 0.08)
                  : context.colors.shadow,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Progress indicator with icon
            _buildProgressIndicator(context),
            const SizedBox(width: 14),
            // Description and points
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    description,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: mission.isCompleted
                          ? context.colors.textSecondary
                          : context.colors.textPrimary,
                      decoration: mission.isCompleted
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.stars_rounded,
                        size: 14,
                        color: mission.isCompleted
                            ? AppColors.success
                            : Colors.amber,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${mission.points} ${'missions.points'.tr()}',
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: mission.isCompleted
                              ? AppColors.success
                              : context.colors.textSecondary,
                        ),
                      ),
                      if (!mission.isCompleted &&
                          mission.targetCount > 1) ...[
                        const SizedBox(width: 8),
                        Text(
                          '${mission.currentCount}/${mission.targetCount}',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: context.colors.textTertiary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            // Completion checkmark or chevron
            if (mission.isCompleted)
              Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                ),
              )
            else
              Icon(
                Icons.chevron_right,
                color: context.colors.textTertiary,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressIndicator(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 44,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Circular progress
          CircularProgressIndicator(
            value: mission.isCompleted ? 1.0 : mission.progress,
            strokeWidth: 3,
            backgroundColor: context.colors.border,
            valueColor: AlwaysStoppedAnimation(
              mission.isCompleted ? AppColors.success : AppColors.likudBlue,
            ),
          ),
          // Mission type icon
          Icon(
            _missionIcon,
            size: 20,
            color: mission.isCompleted
                ? AppColors.success
                : AppColors.likudBlue,
          ),
        ],
      ),
    );
  }

  IconData get _missionIcon {
    switch (mission.type) {
      case 'quiz_complete':
        return Icons.quiz;
      case 'article_read':
        return Icons.article_outlined;
      case 'poll_vote':
        return Icons.poll_outlined;
      case 'share':
        return Icons.share_outlined;
      case 'event_rsvp':
        return Icons.event_outlined;
      case 'comment':
        return Icons.comment_outlined;
      case 'login':
        return Icons.login;
      case 'endorsement':
        return Icons.thumb_up_outlined;
      default:
        return Icons.task_alt_outlined;
    }
  }

  void _navigateToFeature(BuildContext context) {
    if (mission.isCompleted) return;

    switch (mission.type) {
      case 'quiz_complete':
        context.push('/daily-quiz');
        break;
      case 'article_read':
        context.go('/');
        break;
      case 'poll_vote':
        context.push('/polls');
        break;
      case 'share':
        context.go('/');
        break;
      case 'event_rsvp':
        context.push('/events');
        break;
      case 'comment':
        context.go('/');
        break;
      case 'endorsement':
        context.push('/primaries');
        break;
      default:
        break;
    }
  }
}
