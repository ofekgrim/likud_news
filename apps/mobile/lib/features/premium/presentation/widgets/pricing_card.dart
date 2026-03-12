import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

/// A pricing card for monthly or annual VIP subscription.
///
/// Shows the plan name, price, optional savings badge, and a subscribe button.
class PricingCard extends StatelessWidget {
  final bool isAnnual;
  final bool isSelected;
  final VoidCallback? onSubscribe;

  const PricingCard({
    super.key,
    required this.isAnnual,
    this.isSelected = false,
    this.onSubscribe,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = const Color(0xFF0099DB);
    final goldColor = const Color(0xFFFFD700);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? primaryColor : theme.dividerColor,
          width: isSelected ? 2 : 1,
        ),
        color: isSelected
            ? primaryColor.withValues(alpha: 0.05)
            : theme.colorScheme.surface,
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Plan name
                Text(
                  isAnnual ? 'premium.annual'.tr() : 'premium.monthly'.tr(),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                // Price
                Text(
                  isAnnual
                      ? 'premium.annual_price'.tr()
                      : 'premium.monthly_price'.tr(),
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: primaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                // Subscribe button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onSubscribe,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsetsDirectional.symmetric(
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'premium.subscribe'.tr(),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Savings badge for annual plan
          if (isAnnual)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Center(
                child: Transform.translate(
                  offset: const Offset(0, -12),
                  child: Container(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: goldColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'premium.save'.tr(),
                      style: const TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
