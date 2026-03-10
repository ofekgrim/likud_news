import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/quiz_result.dart';
import 'match_percentage_circle.dart';

/// Card displaying a candidate's match result from the quiz.
///
/// Shows the candidate's name, match percentage circle, and an optional
/// "Best Match" badge for the top-ranked candidate.
/// Tapping the card navigates to the candidate detail page.
class CandidateMatchCard extends StatelessWidget {
  final CandidateMatch match;
  final int rank;
  final bool isBestMatch;
  final VoidCallback? onTap;

  const CandidateMatchCard({
    super.key,
    required this.match,
    required this.rank,
    this.isBestMatch = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsetsDirectional.only(bottom: 12),
        padding: const EdgeInsetsDirectional.all(16),
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isBestMatch ? AppColors.likudBlue : context.colors.border,
            width: isBestMatch ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isBestMatch
                  ? AppColors.likudBlue.withValues(alpha: 0.12)
                  : context.colors.shadow,
              blurRadius: isBestMatch ? 12 : 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Rank number
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isBestMatch
                    ? AppColors.likudBlue
                    : AppColors.surfaceMedium,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                '$rank',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isBestMatch ? AppColors.white : context.colors.textPrimary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Candidate info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          match.candidateName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: isBestMatch ? 17 : 15,
                            fontWeight: FontWeight.w600,
                            color: context.colors.textPrimary,
                          ),
                        ),
                      ),
                      if (isBestMatch) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsetsDirectional.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.likudBlue,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            'quiz_best_match'.tr(),
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'quiz_view_candidate'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.likudBlue,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Match percentage circle
            MatchPercentageCircle(
              percentage: match.matchPercentage,
              size: isBestMatch ? 80 : 64,
            ),
          ],
        ),
      ),
    );
  }
}
