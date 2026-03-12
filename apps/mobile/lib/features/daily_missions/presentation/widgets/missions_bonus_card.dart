import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/daily_missions_summary.dart';

/// Widget showing the bonus multiplier progress for completing all missions.
///
/// Displays a progress bar tracking completed missions vs total,
/// and a celebration state when all missions are completed.
class MissionsBonusCard extends StatelessWidget {
  final DailyMissionsSummary summary;

  const MissionsBonusCard({
    super.key,
    required this.summary,
  });

  @override
  Widget build(BuildContext context) {
    final completedCount =
        summary.missions.where((m) => m.isCompleted).length;
    final totalCount = summary.missions.length;
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;

    return Container(
      padding: const EdgeInsetsDirectional.all(16),
      decoration: BoxDecoration(
        color: summary.allCompleted
            ? AppColors.success.withValues(alpha: 0.08)
            : context.colors.cardSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: summary.allCompleted
              ? AppColors.success.withValues(alpha: 0.4)
              : context.colors.border,
          width: summary.allCompleted ? 1.5 : 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: context.colors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                summary.allCompleted
                    ? Icons.celebration
                    : Icons.emoji_events_outlined,
                size: 24,
                color:
                    summary.allCompleted ? AppColors.success : Colors.amber,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  summary.allCompleted
                      ? 'missions.bonus_earned'.tr()
                      : 'missions.complete_all'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: summary.allCompleted
                        ? AppColors.success
                        : context.colors.textPrimary,
                  ),
                ),
              ),
              if (summary.allCompleted)
                Container(
                  padding: const EdgeInsetsDirectional.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '+${summary.bonusPoints} ${'missions.bonus'.tr()}',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.success,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: context.colors.border,
              valueColor: AlwaysStoppedAnimation(
                summary.allCompleted
                    ? AppColors.success
                    : AppColors.likudBlue,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${'missions.progress'.tr()}: $completedCount/$totalCount',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: context.colors.textSecondary,
                ),
              ),
              if (!summary.allCompleted)
                Text(
                  '${summary.missions.where((m) => m.isCompleted).fold(0, (sum, m) => sum + m.points)} ${'missions.points'.tr()}',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.likudBlue,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
