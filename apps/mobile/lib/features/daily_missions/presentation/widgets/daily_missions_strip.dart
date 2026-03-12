import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/daily_mission.dart';
import '../../domain/entities/daily_missions_summary.dart';
import '../bloc/daily_missions_bloc.dart';
import '../bloc/daily_missions_state.dart';

/// Compact horizontal strip for home page integration.
///
/// Shows up to 3 mission indicators in a row with completion progress.
/// Displays a celebration message if all missions are completed.
/// Tapping navigates to the full daily missions page.
class DailyMissionsStrip extends StatelessWidget {
  const DailyMissionsStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyMissionsBloc, DailyMissionsState>(
      builder: (context, state) {
        if (state is! DailyMissionsLoaded) {
          return const SizedBox.shrink();
        }

        final summary = state.summary;
        if (summary.missions.isEmpty) {
          return const SizedBox.shrink();
        }

        return GestureDetector(
          onTap: () => context.push('/missions'),
          child: Container(
            margin: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 0),
            padding: const EdgeInsetsDirectional.all(12),
            decoration: BoxDecoration(
              color: context.colors.cardSurface,
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
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: summary.allCompleted
                ? _buildAllCompleteCelebration(context, summary)
                : _buildMissionProgress(context, summary),
          ),
        );
      },
    );
  }

  Widget _buildAllCompleteCelebration(
    BuildContext context,
    DailyMissionsSummary summary,
  ) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.celebration,
            color: AppColors.success,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'missions.all_complete'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.success,
                ),
              ),
              Text(
                'missions.bonus_earned'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: context.colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
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
            '+${summary.bonusPoints}',
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.success,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMissionProgress(
    BuildContext context,
    DailyMissionsSummary summary,
  ) {
    final completedCount =
        summary.missions.where((m) => m.isCompleted).length;
    final totalCount = summary.missions.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              Icons.task_alt,
              size: 18,
              color: AppColors.likudBlue,
            ),
            const SizedBox(width: 6),
            Text(
              'missions.title'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: context.colors.textPrimary,
              ),
            ),
            const Spacer(),
            Text(
              '$completedCount/$totalCount',
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.likudBlue,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.chevron_right,
              size: 18,
              color: context.colors.textTertiary,
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            for (int i = 0;
                i < summary.missions.length && i < 3;
                i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: _buildMiniMissionIndicator(
                  context,
                  summary.missions[i],
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildMiniMissionIndicator(
    BuildContext context,
    DailyMission mission,
  ) {
    final isHebrew = context.locale.languageCode == 'he';
    final description =
        isHebrew ? mission.descriptionHe : mission.descriptionEn;

    return Container(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 8,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: mission.isCompleted
            ? AppColors.success.withValues(alpha: 0.08)
            : context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: mission.isCompleted
              ? AppColors.success.withValues(alpha: 0.3)
              : context.colors.border,
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            mission.isCompleted ? Icons.check_circle : _missionIcon(mission),
            size: 14,
            color: mission.isCompleted
                ? AppColors.success
                : AppColors.likudBlue,
          ),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              description,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: mission.isCompleted
                    ? AppColors.success
                    : context.colors.textSecondary,
                decoration: mission.isCompleted
                    ? TextDecoration.lineThrough
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _missionIcon(DailyMission mission) {
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
}
