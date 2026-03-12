import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/match_result.dart';

/// Displays a single candidate match result with photo, name,
/// match percentage bar, and a mini category breakdown.
class MatchResultCard extends StatelessWidget {
  final MatchResult result;
  final int rank;
  final VoidCallback? onTap;

  const MatchResultCard({
    super.key,
    required this.result,
    required this.rank,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isBestMatch = rank == 1;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsetsDirectional.only(bottom: 12),
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isBestMatch ? AppColors.likudBlue : context.colors.border,
            width: isBestMatch ? 2 : 1,
          ),
          boxShadow: isBestMatch
              ? [
                  BoxShadow(
                    color: AppColors.likudBlue.withValues(alpha: 0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  // Rank badge
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: isBestMatch
                          ? AppColors.likudBlue
                          : context.colors.surfaceVariant,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$rank',
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isBestMatch
                            ? AppColors.white
                            : context.colors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Candidate photo
                  _buildPhoto(context),
                  const SizedBox(width: 12),
                  // Name + match percentage
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          result.candidateName,
                          textDirection: TextDirection.rtl,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: context.colors.textPrimary,
                          ),
                        ),
                        if (isBestMatch)
                          Text(
                            'matcher_best_match'.tr(),
                            textDirection: TextDirection.rtl,
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.likudBlue,
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Match percentage
                  Container(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _matchColor(result.matchPct).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'matcher_match_pct'.tr(args: ['${result.matchPct.round()}']),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _matchColor(result.matchPct),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Match percentage bar
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: result.matchPct / 100,
                  backgroundColor: context.colors.surfaceVariant,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _matchColor(result.matchPct),
                  ),
                  minHeight: 6,
                ),
              ),
              // Category breakdown mini chips
              if (result.categoryBreakdown.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: result.categoryBreakdown.entries.map((entry) {
                    return Container(
                      padding: const EdgeInsetsDirectional.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: context.colors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_categoryDisplayName(entry.key)} ${entry.value.round()}%',
                        textDirection: TextDirection.rtl,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: context.colors.textSecondary,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoto(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: result.candidatePhotoUrl != null &&
              result.candidatePhotoUrl!.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: result.candidatePhotoUrl!,
              width: 44,
              height: 44,
              fit: BoxFit.cover,
              placeholder: (_, __) => _photoPlaceholder(context),
              errorWidget: (_, __, ___) => _photoPlaceholder(context),
            )
          : _photoPlaceholder(context),
    );
  }

  Widget _photoPlaceholder(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.likudBlue.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: const Icon(
        Icons.person,
        size: 24,
        color: AppColors.likudBlue,
      ),
    );
  }

  Color _matchColor(double pct) {
    if (pct >= 75) return AppColors.success;
    if (pct >= 50) return AppColors.likudBlue;
    if (pct >= 25) return AppColors.warning;
    return AppColors.breakingRed;
  }

  String _categoryDisplayName(String key) {
    switch (key) {
      case 'security':
        return 'matcher_category_security'.tr();
      case 'economy':
        return 'matcher_category_economy'.tr();
      case 'judiciary':
        return 'matcher_category_judiciary'.tr();
      case 'housing':
        return 'matcher_category_housing'.tr();
      case 'social':
        return 'matcher_category_social'.tr();
      case 'foreign':
        return 'matcher_category_foreign'.tr();
      default:
        return key;
    }
  }
}
