import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/candidate_result.dart';

/// Ranked leaderboard of candidates with animated transitions.
///
/// Shows rank number, candidate name, vote count, percentage bar,
/// and a delta arrow indicating rank change. Top 36 candidates
/// (realistic Knesset list size) are separated by a subtle divider.
class ResultsLeaderboard extends StatelessWidget {
  final List<CandidateResult> results;

  const ResultsLeaderboard({super.key, required this.results});

  /// Knesset realistic list size — slots above this get a divider.
  static const int _knessetListSize = 36;

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            'election_day_no_results'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ),
      );
    }

    // Sort by voteCount descending.
    final sorted = List<CandidateResult>.from(results)
      ..sort((a, b) => b.voteCount.compareTo(a.voteCount));

    return Column(
      children: [
        for (int i = 0; i < sorted.length; i++) ...[
          if (i == _knessetListSize) _buildDivider(),
          _LeaderboardRow(
            result: sorted[i],
            displayRank: i + 1,
            isAboveLine: i < _knessetListSize,
          ),
        ],
      ],
    );
  }

  Widget _buildDivider() {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
      child: Row(
        children: [
          const Expanded(
            child: Divider(color: AppColors.warning, thickness: 1.5),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 0, 12, 0),
            child: Text(
              'Top $_knessetListSize',
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.warning,
              ),
            ),
          ),
          const Expanded(
            child: Divider(color: AppColors.warning, thickness: 1.5),
          ),
        ],
      ),
    );
  }
}

/// A single row in the leaderboard.
class _LeaderboardRow extends StatelessWidget {
  final CandidateResult result;
  final int displayRank;
  final bool isAboveLine;

  const _LeaderboardRow({
    required this.result,
    required this.displayRank,
    required this.isAboveLine,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
      margin: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 6),
      padding: const EdgeInsetsDirectional.fromSTEB(10, 10, 10, 10),
      decoration: BoxDecoration(
        color: isAboveLine
            ? AppColors.white
            : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isAboveLine ? AppColors.border : AppColors.surfaceMedium,
          width: 0.5,
        ),
      ),
      child: Row(
        children: [
          // Rank number.
          SizedBox(
            width: 32,
            child: Text(
              '$displayRank',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: displayRank <= 3
                    ? AppColors.likudBlue
                    : AppColors.textPrimary,
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Delta arrow.
          _DeltaArrow(deltaRank: result.deltaRank),
          const SizedBox(width: 8),

          // Candidate name + votes.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.name,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
                const SizedBox(height: 2),
                Text(
                  '${_formatNumber(result.voteCount)} ${'results.votes'.tr()}',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Percentage bar + text.
          SizedBox(
            width: 80,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${result.percentage.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.likudBlue,
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(
                      begin: 0,
                      end: (result.percentage / 100).clamp(0.0, 1.0),
                    ),
                    duration: const Duration(milliseconds: 600),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, child) {
                      return LinearProgressIndicator(
                        value: value,
                        backgroundColor: AppColors.surfaceMedium,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.likudBlue,
                        ),
                        minHeight: 5,
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _formatNumber(int n) {
    if (n >= 1000000) {
      return '${(n / 1000000).toStringAsFixed(1)}M';
    }
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(1)}K';
    }
    return n.toString();
  }
}

/// Shows an arrow icon indicating rank change direction.
class _DeltaArrow extends StatelessWidget {
  final int deltaRank;

  const _DeltaArrow({required this.deltaRank});

  @override
  Widget build(BuildContext context) {
    if (deltaRank > 0) {
      // Moved up (positive delta = moved up in rank).
      return Tooltip(
        message: 'results.rank_up'.tr(),
        child: const Icon(
          Icons.arrow_upward_rounded,
          size: 16,
          color: AppColors.success,
        ),
      );
    }
    if (deltaRank < 0) {
      // Moved down.
      return Tooltip(
        message: 'results.rank_down'.tr(),
        child: const Icon(
          Icons.arrow_downward_rounded,
          size: 16,
          color: AppColors.breakingRed,
        ),
      );
    }
    // Unchanged.
    return const Icon(
      Icons.remove_rounded,
      size: 16,
      color: AppColors.textTertiary,
    );
  }
}
