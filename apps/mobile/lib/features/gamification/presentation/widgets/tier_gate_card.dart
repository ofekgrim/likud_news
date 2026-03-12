import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/tier_info.dart';

/// Card showing locked/unlocked feature status based on tier.
///
/// - Unlocked: colored with checkmark icon
/// - Locked: grey with lock icon and "Reach [tier] to unlock" text
class TierGateCard extends StatelessWidget {
  final TierInfo tierInfo;

  const TierGateCard({super.key, required this.tierInfo});

  @override
  Widget build(BuildContext context) {
    final allFeatures = _buildFeatureList();

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
          Row(
            children: [
              const Icon(
                Icons.lock_open_rounded,
                color: AppColors.likudBlue,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'tier.title'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...allFeatures.map((f) => _buildFeatureRow(context, f)),
        ],
      ),
    );
  }

  List<_FeatureDisplay> _buildFeatureList() {
    final features = <_FeatureDisplay>[];

    // Feature definitions with i18n keys and required tiers
    const featureDefs = [
      _FeatureDef(
        feature: 'ama_early_access',
        i18nKey: 'tier.ama_access',
        icon: Icons.question_answer_rounded,
        requiredTier: 2,
      ),
      _FeatureDef(
        feature: 'vip_events',
        i18nKey: 'tier.vip_events',
        icon: Icons.event_available_rounded,
        requiredTier: 3,
      ),
      _FeatureDef(
        feature: 'mk_qa',
        i18nKey: 'tier.mk_qa',
        icon: Icons.forum_rounded,
        requiredTier: 4,
      ),
      _FeatureDef(
        feature: 'merchandise',
        i18nKey: 'tier.merchandise',
        icon: Icons.shopping_bag_rounded,
        requiredTier: 5,
      ),
    ];

    for (final def in featureDefs) {
      final isUnlocked = tierInfo.unlockedFeatures.contains(def.feature);
      final locked = tierInfo.lockedFeatures
          .cast<LockedFeature?>()
          .firstWhere(
            (l) => l!.feature == def.feature,
            orElse: () => null,
          );

      features.add(_FeatureDisplay(
        i18nKey: def.i18nKey,
        icon: def.icon,
        isUnlocked: isUnlocked,
        requiredTierName: locked?.requiredTierName,
      ));
    }

    return features;
  }

  Widget _buildFeatureRow(BuildContext context, _FeatureDisplay feature) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 10),
      child: Row(
        children: [
          // Status icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: feature.isUnlocked
                  ? AppColors.success.withValues(alpha: 0.12)
                  : context.colors.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              feature.isUnlocked ? feature.icon : Icons.lock_rounded,
              size: 18,
              color: feature.isUnlocked
                  ? AppColors.success
                  : context.colors.textTertiary,
            ),
          ),
          const SizedBox(width: 12),
          // Feature name and status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  feature.i18nKey.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: feature.isUnlocked
                        ? context.colors.textPrimary
                        : context.colors.textTertiary,
                  ),
                ),
                if (!feature.isUnlocked && feature.requiredTierName != null)
                  Text(
                    'tier.reach_to_unlock'.tr(
                      namedArgs: {'tier': feature.requiredTierName!},
                    ),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      color: context.colors.textTertiary,
                    ),
                  ),
              ],
            ),
          ),
          // Checkmark or lock badge
          Icon(
            feature.isUnlocked
                ? Icons.check_circle_rounded
                : Icons.lock_outline_rounded,
            size: 20,
            color: feature.isUnlocked
                ? AppColors.success
                : context.colors.textTertiary,
          ),
        ],
      ),
    );
  }
}

class _FeatureDef {
  final String feature;
  final String i18nKey;
  final IconData icon;
  final int requiredTier;

  const _FeatureDef({
    required this.feature,
    required this.i18nKey,
    required this.icon,
    required this.requiredTier,
  });
}

class _FeatureDisplay {
  final String i18nKey;
  final IconData icon;
  final bool isUnlocked;
  final String? requiredTierName;

  const _FeatureDisplay({
    required this.i18nKey,
    required this.icon,
    required this.isUnlocked,
    this.requiredTierName,
  });
}
