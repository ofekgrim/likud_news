import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/tier_info.dart';

/// Horizontal progress bar showing XP progress toward the next tier.
///
/// Displays:
/// - Current XP / Next tier XP
/// - Tier icon at each milestone point
/// - Current tier highlighted
/// - "X [tier.points_to_next] [next tier name]" text below
class TierProgressBar extends StatelessWidget {
  final TierInfo tierInfo;

  const TierProgressBar({super.key, required this.tierInfo});

  static const List<int> _tierMinXp = [0, 500, 2000, 7500, 25000];

  @override
  Widget build(BuildContext context) {
    final isMaxTier = tierInfo.nextTierXp == null;
    final progress = tierInfo.progressToNextTier.clamp(0.0, 1.0);

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
          // Header
          Row(
            children: [
              Icon(
                Icons.trending_up_rounded,
                color: AppColors.likudBlue,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'tier.progress'.tr(),
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

          // XP label row
          if (!isMaxTier) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${tierInfo.totalXp} XP',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: context.colors.textPrimary,
                  ),
                ),
                Text(
                  '${tierInfo.nextTierXp} XP',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: context.colors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],

          // Progress bar with tier markers
          SizedBox(
            height: 40,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Background track
                Positioned(
                  top: 14,
                  left: 0,
                  right: 0,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: isMaxTier ? 1.0 : progress,
                      minHeight: 10,
                      backgroundColor: context.colors.surfaceMedium,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _getTierColor(tierInfo.currentTier),
                      ),
                    ),
                  ),
                ),
                // Tier milestone markers
                ..._buildTierMarkers(context),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Points remaining text
          if (!isMaxTier) ...[
            Center(
              child: Text(
                '${tierInfo.nextTierXp! - tierInfo.totalXp} ${'tier.points_to_next'.tr()} ${_getNextTierName()}',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: context.colors.textSecondary,
                ),
              ),
            ),
          ] else ...[
            Center(
              child: Text(
                'tier.max_tier'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: _getTierColor(5),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildTierMarkers(BuildContext context) {
    final maxXp = _tierMinXp.last.toDouble();
    final markers = <Widget>[];

    for (int i = 0; i < _tierMinXp.length; i++) {
      final fraction = _tierMinXp[i] / maxXp;
      final tier = i + 1;
      final isReached = tierInfo.currentTier >= tier;

      markers.add(
        LayoutBuilder(
          builder: (context, constraints) {
            final totalWidth = constraints.maxWidth;
            final position = fraction * totalWidth;
            final clampedPosition =
                position.clamp(0.0, totalWidth - 20);

            return Positioned(
              top: 0,
              left: clampedPosition,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: isReached
                      ? _getTierColor(tier)
                      : context.colors.surfaceMedium,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isReached
                        ? _getTierColor(tier)
                        : context.colors.border,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: Text(
                    '$tier',
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: isReached
                          ? Colors.white
                          : context.colors.textTertiary,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      );
    }

    return markers;
  }

  String _getNextTierName() {
    final nextTier = tierInfo.currentTier + 1;
    switch (nextTier) {
      case 2:
        return 'tier.leader'.tr();
      case 3:
        return 'tier.ambassador'.tr();
      case 4:
        return 'tier.general'.tr();
      case 5:
        return 'tier.lion'.tr();
      default:
        return '';
    }
  }

  static Color _getTierColor(int tier) {
    switch (tier) {
      case 1:
        return AppColors.likudBlue;
      case 2:
        return const Color(0xFF16A34A);
      case 3:
        return const Color(0xFF7C3AED);
      case 4:
        return const Color(0xFFDC2626);
      case 5:
        return const Color(0xFFD97706);
      default:
        return AppColors.likudBlue;
    }
  }
}
