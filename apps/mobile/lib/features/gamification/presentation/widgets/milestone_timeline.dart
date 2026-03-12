import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/user_streak.dart';

/// Horizontal timeline showing streak milestones (7, 14, 30, 100, 365 days).
///
/// Earned milestones are highlighted with a checkmark and date.
/// The next unearned milestone shows a progress bar.
class MilestoneTimeline extends StatelessWidget {
  final UserStreak streak;

  const MilestoneTimeline({super.key, required this.streak});

  /// Default milestone thresholds when the API doesn't provide them.
  static const List<int> _defaultDays = [7, 14, 30, 100, 365];

  @override
  Widget build(BuildContext context) {
    // Build milestone list from API data or defaults.
    final milestones = streak.milestones.isNotEmpty
        ? streak.milestones
        : _defaultDays
            .map((d) => StreakMilestone(
                  days: d,
                  earned: streak.currentStreak >= d,
                ))
            .toList();

    // Find the next unearned milestone for progress calculation.
    final nextMilestone = milestones.cast<StreakMilestone?>().firstWhere(
          (m) => !m!.earned,
          orElse: () => null,
        );

    // Find previous earned milestone (or 0) for progress range.
    final earnedMilestones = milestones.where((m) => m.earned).toList();
    final previousDays =
        earnedMilestones.isNotEmpty ? earnedMilestones.last.days : 0;

    return Container(
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.border, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: context.colors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header
          Row(
            children: [
              const Icon(
                Icons.emoji_events_rounded,
                color: Colors.amber,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'next_milestone'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Progress bar to next milestone
          if (nextMilestone != null) ...[
            _buildProgressToNext(
              context,
              streak.currentStreak,
              previousDays,
              nextMilestone,
            ),
            const SizedBox(height: 16),
          ],

          // Horizontal scrollable milestone chips
          SizedBox(
            height: 82,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: milestones.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                return _buildMilestoneChip(context, milestones[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressToNext(
    BuildContext context,
    int currentStreak,
    int previousDays,
    StreakMilestone next,
  ) {
    final range = next.days - previousDays;
    final progress = (currentStreak - previousDays).clamp(0, range);
    final fraction = range > 0 ? progress / range : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'streak_days'.tr(args: ['$currentStreak']),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
              ),
            ),
            Text(
              'streak_days'.tr(args: ['${next.days}']),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.colors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: fraction,
            minHeight: 8,
            backgroundColor: context.colors.surfaceMedium,
            valueColor:
                const AlwaysStoppedAnimation<Color>(AppColors.likudBlue),
          ),
        ),
        if (next.bonusPoints > 0) ...[
          const SizedBox(height: 4),
          Text(
            '+${next.bonusPoints} ${'gamification_points'.tr()}',
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.likudBlue,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildMilestoneChip(BuildContext context, StreakMilestone milestone) {
    final isEarned = milestone.earned;

    return Container(
      width: 72,
      decoration: BoxDecoration(
        color: isEarned
            ? AppColors.likudBlue.withValues(alpha: 0.08)
            : context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isEarned
              ? AppColors.likudBlue.withValues(alpha: 0.3)
              : context.colors.border,
          width: isEarned ? 1.5 : 1,
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon or checkmark
          Icon(
            isEarned ? Icons.check_circle_rounded : Icons.flag_rounded,
            size: 22,
            color: isEarned ? AppColors.success : context.colors.textTertiary,
          ),
          const SizedBox(height: 4),
          // Days label
          Text(
            'streak_days'.tr(args: ['${milestone.days}']),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isEarned
                  ? context.colors.textPrimary
                  : context.colors.textTertiary,
            ),
          ),
          // Bonus points or earned date
          if (milestone.bonusPoints > 0)
            Text(
              '+${milestone.bonusPoints}',
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: isEarned
                    ? AppColors.likudBlue
                    : context.colors.textTertiary,
              ),
            ),
        ],
      ),
    );
  }
}
