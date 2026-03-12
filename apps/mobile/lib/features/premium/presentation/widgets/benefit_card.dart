import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../domain/entities/vip_benefit.dart';

/// A card displaying a single VIP benefit with icon, title, and description.
///
/// Shows a locked/unlocked visual state based on [isUnlocked].
class BenefitCard extends StatelessWidget {
  final VipBenefit benefit;
  final bool isUnlocked;

  const BenefitCard({
    super.key,
    required this.benefit,
    this.isUnlocked = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isUnlocked
        ? const Color(0xFFFFD700)
        : theme.colorScheme.onSurface.withValues(alpha: 0.4);

    return Container(
      margin: const EdgeInsetsDirectional.only(bottom: 12),
      padding: const EdgeInsetsDirectional.all(16),
      decoration: BoxDecoration(
        color: isUnlocked
            ? const Color(0xFFFFD700).withValues(alpha: 0.08)
            : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isUnlocked
              ? const Color(0xFFFFD700).withValues(alpha: 0.3)
              : theme.dividerColor,
        ),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _mapIcon(benefit.icon),
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  benefit.titleKey.tr(),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isUnlocked
                        ? theme.colorScheme.onSurface
                        : theme.colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  benefit.descriptionKey.tr(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
          if (isUnlocked)
            Icon(
              Icons.check_circle,
              color: const Color(0xFFFFD700),
              size: 22,
            )
          else
            Icon(
              Icons.lock_outline,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
              size: 22,
            ),
        ],
      ),
    );
  }

  /// Maps string icon names from the API to Material icons.
  IconData _mapIcon(String iconName) {
    switch (iconName) {
      case 'block':
        return Icons.block;
      case 'flash_on':
        return Icons.flash_on;
      case 'history':
        return Icons.history;
      case 'verified':
        return Icons.verified;
      case 'support_agent':
        return Icons.support_agent;
      default:
        return Icons.star;
    }
  }
}
