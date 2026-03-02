import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/community_average.dart';
import '../../domain/entities/quiz_result.dart';

/// Section that compares the user's quiz results to community averages.
///
/// Shows side-by-side horizontal bars for each candidate: the user's match
/// percentage vs. the community average match percentage.
class CommunityComparisonSection extends StatelessWidget {
  final List<CandidateMatch> userResults;
  final List<CommunityAverage> communityAverages;

  const CommunityComparisonSection({
    super.key,
    required this.userResults,
    required this.communityAverages,
  });

  @override
  Widget build(BuildContext context) {
    if (communityAverages.isEmpty) return const SizedBox.shrink();

    // Build a map of candidateId -> community average for quick lookup
    final avgMap = <String, CommunityAverage>{};
    for (final avg in communityAverages) {
      avgMap[avg.candidateId] = avg;
    }

    // Sort user results by match percentage descending
    final sorted = List<CandidateMatch>.from(userResults)
      ..sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));

    final totalResponses =
        communityAverages.isNotEmpty ? communityAverages.first.totalResponses : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.likudBlue.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.groups_outlined,
                size: 20,
                color: AppColors.likudBlue,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'quiz_compare_to_community'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (totalResponses > 0)
                    Text(
                      'quiz_total_responses'.tr(args: ['$totalResponses']),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Legend
        Row(
          children: [
            _LegendDot(
              color: AppColors.likudBlue,
              label: 'quiz_your_match'.tr(),
            ),
            const SizedBox(width: 16),
            _LegendDot(
              color: AppColors.textTertiary,
              label: 'quiz_community_average'.tr(),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Comparison bars for each candidate
        ...sorted.map((match) {
          final communityAvg = avgMap[match.candidateId];
          final avgPct = communityAvg?.averageMatchPercentage ?? 0;

          return _ComparisonBar(
            candidateName: match.candidateName,
            userPercentage: match.matchPercentage,
            communityPercentage: avgPct,
          );
        }),
      ],
    );
  }
}

/// A small colored dot with a label, used in the legend.
class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

/// Double horizontal bar comparing user vs community match percentage.
class _ComparisonBar extends StatelessWidget {
  final String candidateName;
  final int userPercentage;
  final int communityPercentage;

  const _ComparisonBar({
    required this.candidateName,
    required this.userPercentage,
    required this.communityPercentage,
  });

  @override
  Widget build(BuildContext context) {
    final diff = userPercentage - communityPercentage;
    final diffLabel = diff > 0 ? '+$diff%' : '$diff%';
    final diffColor = diff > 0
        ? AppColors.success
        : diff < 0
            ? AppColors.breakingRed
            : AppColors.textSecondary;

    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Candidate name and diff badge
          Row(
            children: [
              Expanded(
                child: Text(
                  candidateName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              if (diff != 0)
                Container(
                  padding: const EdgeInsetsDirectional.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: diffColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    diffLabel,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: diffColor,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),

          // User bar
          _PercentageBar(
            percentage: userPercentage,
            color: AppColors.likudBlue,
          ),
          const SizedBox(height: 4),

          // Community bar
          _PercentageBar(
            percentage: communityPercentage,
            color: AppColors.textTertiary,
          ),
        ],
      ),
    );
  }
}

/// A single horizontal progress bar with percentage label.
class _PercentageBar extends StatelessWidget {
  final int percentage;
  final Color color;

  const _PercentageBar({required this.percentage, required this.color});

  @override
  Widget build(BuildContext context) {
    final clampedPercentage = percentage.clamp(0, 100);

    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: clampedPercentage / 100,
              backgroundColor: AppColors.surfaceMedium,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 8,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 36,
          child: Text(
            '$percentage%',
            textAlign: TextAlign.end,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ),
      ],
    );
  }
}
