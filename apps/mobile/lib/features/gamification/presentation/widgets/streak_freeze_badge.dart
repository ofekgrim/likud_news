import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/user_streak.dart';

/// Displays freeze token availability and a "Use Freeze" button.
///
/// Shows a row of ice crystal icons (max 3). Used tokens are faded.
/// When [UserStreak.atRisk] is true, an action button allows using a token.
class StreakFreezeBadge extends StatelessWidget {
  final UserStreak streak;
  final VoidCallback onUseFreeze;

  const StreakFreezeBadge({
    super.key,
    required this.streak,
    required this.onUseFreeze,
  });

  static const int _maxFreezeTokens = 3;

  @override
  Widget build(BuildContext context) {
    final available = streak.freezeTokens;

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
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              const Icon(
                Icons.ac_unit_rounded,
                color: Color(0xFF60A5FA),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'freeze_tokens'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textPrimary,
                ),
              ),
              const Spacer(),
              // Token icons
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(_maxFreezeTokens, (index) {
                  final isAvailable = index < available;
                  return Padding(
                    padding: const EdgeInsetsDirectional.only(start: 4),
                    child: Icon(
                      Icons.ac_unit_rounded,
                      size: 22,
                      color: isAvailable
                          ? const Color(0xFF60A5FA)
                          : context.colors.textTertiary
                              .withValues(alpha: 0.3),
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Explanation text
          Text(
            'freeze_explanation'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: context.colors.textSecondary,
            ),
          ),
          // Use Freeze button — only shown when at risk and tokens available
          if (streak.atRisk && available > 0) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onUseFreeze,
                icon: const Icon(Icons.ac_unit_rounded, size: 18),
                label: Text('use_freeze'.tr()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF60A5FA),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
          // All tokens used warning
          if (streak.atRisk && available == 0) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'streak_at_risk'.tr(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.warning,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
