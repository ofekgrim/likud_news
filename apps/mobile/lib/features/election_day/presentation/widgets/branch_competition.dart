import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/branch_turnout.dart';

/// Mini-leaderboard showing district turnout competition.
///
/// Displays the top 5 branches ranked by turnout percentage with
/// horizontal bar chart visualization. The user's branch is highlighted.
class BranchCompetition extends StatelessWidget {
  /// List of branch turnout data (will be sorted and limited to top 5).
  final List<BranchTurnout> branches;

  const BranchCompetition({super.key, required this.branches});

  @override
  Widget build(BuildContext context) {
    if (branches.isEmpty) return const SizedBox.shrink();

    // Sort by turnout and take top 5.
    final sorted = List<BranchTurnout>.from(branches)
      ..sort((a, b) => b.turnoutPct.compareTo(a.turnoutPct));
    final top5 = sorted.take(5).toList();

    // Find the max turnout for bar scaling.
    final maxPct =
        top5.isNotEmpty ? top5.first.turnoutPct.clamp(1.0, 100.0) : 100.0;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        margin: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title.
            Row(
              children: [
                const Icon(
                  Icons.emoji_events_outlined,
                  size: 20,
                  color: AppColors.likudBlue,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'branch_competition.title'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Branch rows.
            ...top5.asMap().entries.map((entry) {
              final index = entry.key;
              final branch = entry.value;
              return _buildBranchRow(branch, index + 1, maxPct);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildBranchRow(BranchTurnout branch, int rank, double maxPct) {
    final barWidth = maxPct > 0 ? (branch.turnoutPct / maxPct) : 0.0;
    final isMyBranch = branch.isMyBranch;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Branch name and percentage.
          Row(
            children: [
              // Rank badge.
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isMyBranch
                      ? AppColors.likudBlue
                      : AppColors.surfaceMedium,
                  borderRadius: BorderRadius.circular(6),
                ),
                alignment: Alignment.center,
                child: Text(
                  '$rank',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color:
                        isMyBranch ? AppColors.white : AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Branch name.
              Expanded(
                child: Text(
                  branch.branchName,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    fontWeight: isMyBranch ? FontWeight.w700 : FontWeight.w500,
                    color: isMyBranch
                        ? AppColors.likudBlue
                        : AppColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),

              // Percentage.
              Text(
                '${branch.turnoutPct.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color:
                      isMyBranch ? AppColors.likudBlue : AppColors.textPrimary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 4),

          // Horizontal bar.
          Padding(
            padding: const EdgeInsetsDirectional.only(start: 32),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: barWidth.clamp(0.0, 1.0),
                backgroundColor: AppColors.surfaceMedium,
                valueColor: AlwaysStoppedAnimation<Color>(
                  isMyBranch ? AppColors.likudBlue : AppColors.likudBlue.withValues(alpha: 0.5),
                ),
                minHeight: 6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
