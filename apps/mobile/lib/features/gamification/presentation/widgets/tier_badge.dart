import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/tier_info.dart';
import '../../domain/entities/user_streak.dart';

/// Tier badge widget displaying the user's current gamification tier.
///
/// Shows tier name, icon, and progress bar toward next tier.
/// Tiers: 1=Active, 2=Leader, 3=Ambassador, 4=General, 5=Lion.
/// Tapping navigates to the tier detail page.
class TierBadge extends StatelessWidget {
  final UserStreak streak;
  final TierInfo? tierInfo;

  const TierBadge({super.key, required this.streak, this.tierInfo});

  @override
  Widget build(BuildContext context) {
    // Use tierInfo for accurate XP-based tier when available, fall back to streak.tier
    final effectiveTier = tierInfo?.currentTier ?? (streak.tier + 1);
    final tierData = _getTierData(effectiveTier - 1);
    final nextTierData =
        effectiveTier < 5 ? _getTierData(effectiveTier) : null;

    return GestureDetector(
      onTap: () => context.push('/gamification/tier'),
      child: Container(
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
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Current tier display
          Row(
            children: [
              // Tier icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      tierData.color.withValues(alpha: 0.2),
                      tierData.color.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: tierData.color.withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                child: Icon(
                  tierData.icon,
                  color: tierData.color,
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getLocalizedTierName(streak.tier),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: tierData.color,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      streak.tierName.isNotEmpty
                          ? streak.tierName
                          : tierData.fallbackName,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: context.colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              // Tier level badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: tierData.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${streak.tier + 1}/5',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: tierData.color,
                  ),
                ),
              ),
            ],
          ),

          // Progress to next tier
          if (nextTierData != null) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _getLocalizedTierName(streak.tier),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: tierData.color,
                  ),
                ),
                Text(
                  _getLocalizedTierName(streak.tier + 1),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: context.colors.textTertiary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: _computeTierProgress(streak.tier, streak.currentStreak),
                minHeight: 8,
                backgroundColor: context.colors.surfaceMedium,
                valueColor: AlwaysStoppedAnimation<Color>(tierData.color),
              ),
            ),
          ],

          // Max tier reached
          if (nextTierData == null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: tierData.color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.emoji_events_rounded,
                    color: tierData.color,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'tier_lion'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: tierData.color,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    ),
    );
  }

  /// Returns localized tier name based on tier index.
  String _getLocalizedTierName(int tier) {
    switch (tier) {
      case 0:
        return 'tier_activist'.tr();
      case 1:
        return 'tier_leader'.tr();
      case 2:
        return 'tier_ambassador'.tr();
      case 3:
        return 'tier_general'.tr();
      case 4:
        return 'tier_lion'.tr();
      default:
        return 'tier_activist'.tr();
    }
  }

  /// Approximate tier progress based on streak thresholds.
  double _computeTierProgress(int currentTier, int currentStreak) {
    // Approximate XP thresholds per tier:
    // 0→1: 7 days, 1→2: 30 days, 2→3: 100 days, 3→4: 365 days
    const thresholds = [0, 7, 30, 100, 365];
    if (currentTier >= 4) return 1.0;

    final start = thresholds[currentTier];
    final end = thresholds[currentTier + 1];
    final range = end - start;
    if (range <= 0) return 0.0;

    final progress = (currentStreak - start).clamp(0, range);
    return progress / range;
  }
}

/// Data class holding visual properties for each tier.
class _TierVisualData {
  final Color color;
  final IconData icon;
  final String fallbackName;

  const _TierVisualData({
    required this.color,
    required this.icon,
    required this.fallbackName,
  });
}

_TierVisualData _getTierData(int tier) {
  switch (tier) {
    case 0:
      return const _TierVisualData(
        color: AppColors.likudBlue,
        icon: Icons.person_rounded,
        fallbackName: 'Activist',
      );
    case 1:
      return const _TierVisualData(
        color: Color(0xFF16A34A),
        icon: Icons.military_tech_rounded,
        fallbackName: 'Leader',
      );
    case 2:
      return const _TierVisualData(
        color: Color(0xFF7C3AED),
        icon: Icons.public_rounded,
        fallbackName: 'Ambassador',
      );
    case 3:
      return const _TierVisualData(
        color: Color(0xFFDC2626),
        icon: Icons.shield_rounded,
        fallbackName: 'General',
      );
    case 4:
      return const _TierVisualData(
        color: Color(0xFFD97706),
        icon: Icons.emoji_events_rounded,
        fallbackName: 'Lion',
      );
    default:
      return const _TierVisualData(
        color: AppColors.likudBlue,
        icon: Icons.person_rounded,
        fallbackName: 'Activist',
      );
  }
}
