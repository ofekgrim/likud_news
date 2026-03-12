import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/branch_weekly_score.dart';

/// A card displaying a single branch row in the leaderboard.
///
/// Shows rank (with medal emoji for top 3), branch name, district tag,
/// score, delta arrow, and a horizontal progress bar proportional to top score.
class BranchRankCard extends StatelessWidget {
  final BranchWeeklyScore score;
  final bool isMyBranch;
  final int position;
  final int topScore;

  const BranchRankCard({
    super.key,
    required this.score,
    required this.isMyBranch,
    required this.position,
    required this.topScore,
  });

  String _rankDisplay(int rank) {
    switch (rank) {
      case 1:
        return '\u{1F947}'; // gold medal
      case 2:
        return '\u{1F948}'; // silver medal
      case 3:
        return '\u{1F949}'; // bronze medal
      default:
        return '#$rank';
    }
  }

  @override
  Widget build(BuildContext context) {
    final delta = score.deltaRank;
    final progress = topScore > 0 ? score.totalScore / topScore : 0.0;

    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isMyBranch ? AppColors.likudBlue : context.colors.border,
          width: isMyBranch ? 2.0 : 0.5,
        ),
        boxShadow: isMyBranch
            ? [
                BoxShadow(
                  color: AppColors.likudBlue.withValues(alpha: 0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Rank
              SizedBox(
                width: 40,
                child: Text(
                  _rankDisplay(score.rank),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: score.rank <= 3 ? 20 : 14,
                    fontWeight: FontWeight.w700,
                    color: score.rank <= 3
                        ? null
                        : context.colors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Branch name + district
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      score.branchName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          Icons.group_outlined,
                          size: 12,
                          color: context.colors.textTertiary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${score.activeMemberCount} ${'leaderboard.members'.tr()}',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                            color: context.colors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Score + delta
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${score.totalScore}',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.likudBlue,
                    ),
                  ),
                  const SizedBox(height: 2),
                  _buildDeltaWidget(context, delta),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 4,
              backgroundColor: context.colors.surfaceMedium,
              valueColor: AlwaysStoppedAnimation<Color>(
                isMyBranch
                    ? AppColors.likudBlue
                    : AppColors.likudBlue.withValues(alpha: 0.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeltaWidget(BuildContext context, int delta) {
    if (delta > 0) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.arrow_upward, size: 12, color: AppColors.success),
          const SizedBox(width: 2),
          Text(
            '$delta',
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.success,
            ),
          ),
        ],
      );
    } else if (delta < 0) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.arrow_downward,
            size: 12,
            color: AppColors.breakingRed,
          ),
          const SizedBox(width: 2),
          Text(
            '${delta.abs()}',
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.breakingRed,
            ),
          ),
        ],
      );
    }
    return Text(
      '-',
      style: TextStyle(
        fontFamily: 'Heebo',
        fontSize: 11,
        fontWeight: FontWeight.w400,
        color: context.colors.textTertiary,
      ),
    );
  }
}
