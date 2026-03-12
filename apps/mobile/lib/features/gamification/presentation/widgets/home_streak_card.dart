import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/user_streak.dart';

/// Expanded streak card for the home screen.
///
/// Shows current streak, longest streak, tier name, freeze tokens, and
/// progress toward the next milestone. Tapping navigates to /gamification.
class HomeStreakCard extends StatelessWidget {
  final UserStreak streak;

  const HomeStreakCard({super.key, required this.streak});

  @override
  Widget build(BuildContext context) {
    final nextMilestone =
        streak.milestones.where((m) => !m.earned).firstOrNull;

    return GestureDetector(
      onTap: () => context.push('/gamification'),
      child: Container(
        margin: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 0),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: streak.atRisk
                ? Colors.red.withValues(alpha: 0.4)
                : context.colors.border,
            width: streak.atRisk ? 1.5 : 0.5,
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
            // Row 1: fire icon + streak count + tier chip + checkmark
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: streak.atRisk
                        ? Colors.red.withValues(alpha: 0.12)
                        : Colors.orange.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.local_fire_department_rounded,
                    color: streak.atRisk ? Colors.red : Colors.deepOrange,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'streak_days'.tr(
                        args: ['${streak.currentStreak}'],
                      ),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: streak.atRisk
                            ? Colors.red
                            : context.colors.textPrimary,
                      ),
                    ),
                    if (streak.atRisk)
                      Text(
                        'streak_at_risk'.tr(),
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.red,
                        ),
                      ),
                  ],
                ),
                const Spacer(),
                // Tier chip
                if (streak.tierName.isNotEmpty)
                  Container(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.likudBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.likudBlue.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      streak.tierName,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.likudBlue,
                      ),
                    ),
                  ),
                // Checkmark when activity done today
                if (streak.activityDoneToday) ...[
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.check_circle,
                    color: AppColors.success,
                    size: 22,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),
            // Row 2: longest streak + freeze tokens
            Row(
              children: [
                Icon(
                  Icons.emoji_events_rounded,
                  size: 16,
                  color: context.colors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${'streak.longest'.tr()}: ${streak.longestStreak}',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    color: context.colors.textSecondary,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.ac_unit_rounded,
                  size: 16,
                  color: Colors.blue.shade300,
                ),
                const SizedBox(width: 4),
                Text(
                  '${streak.freezeTokens} ${'streak.freeze_tokens'.tr()}',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    color: context.colors.textSecondary,
                  ),
                ),
              ],
            ),
            // Row 3: next milestone progress bar
            if (nextMilestone != null && streak.currentStreak < nextMilestone.days) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: streak.currentStreak / nextMilestone.days,
                        backgroundColor:
                            context.colors.border,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.likudBlue.withValues(alpha: 0.7),
                        ),
                        minHeight: 6,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${'streak.next_milestone_prefix'.tr()} ${nextMilestone.days}',
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 11,
                      color: context.colors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
