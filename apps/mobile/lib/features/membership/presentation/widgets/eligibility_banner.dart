import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/membership_info.dart';

/// Color-coded eligibility banner for the membership dashboard.
///
/// - Green: Member is eligible to vote.
/// - Yellow: Payment is due (shows "Pay Now" button).
/// - Red: Code 99 freeze (shows "Contact Support" button).
class EligibilityBanner extends StatelessWidget {
  final MembershipInfo info;

  const EligibilityBanner({super.key, required this.info});

  /// Likud payment deep link URL.
  static const String _paymentUrl = 'https://www.likud.org.il/payment';

  /// Likud branch support phone number.
  static const String _supportPhone = '1-700-50-60-70';

  @override
  Widget build(BuildContext context) {
    final BannerConfig config = _resolveBannerConfig();

    return Container(
      width: double.infinity,
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 16,
        vertical: 14,
      ),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: config.borderColor,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Status icon.
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: config.iconBackgroundColor,
              shape: BoxShape.circle,
            ),
            child: Icon(
              config.icon,
              color: config.accentColor,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),

          // Status text.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  config.title,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: config.accentColor,
                  ),
                  textDirection: TextDirection.rtl,
                ),
                if (config.subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    config.subtitle!,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: context.colors.textSecondary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ],
              ],
            ),
          ),

          // Action button (if applicable).
          if (config.actionLabel != null)
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 8),
              child: SizedBox(
                height: 34,
                child: FilledButton(
                  onPressed: () => _onActionTap(context, config.actionType),
                  style: FilledButton.styleFrom(
                    backgroundColor: config.accentColor,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    config.actionLabel!,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.white,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Determines the banner configuration based on membership state.
  BannerConfig _resolveBannerConfig() {
    // Code 99 freeze takes highest priority.
    if (info.code99Freeze) {
      return BannerConfig(
        icon: Icons.block,
        title: 'membership_frozen'.tr(),
        subtitle: 'membership_frozen_subtitle'.tr(),
        accentColor: AppColors.breakingRed,
        backgroundColor: AppColors.breakingRed.withValues(alpha: 0.06),
        borderColor: AppColors.breakingRed.withValues(alpha: 0.2),
        iconBackgroundColor: AppColors.breakingRed.withValues(alpha: 0.12),
        actionLabel: 'contact_support'.tr(),
        actionType: _BannerAction.contactSupport,
      );
    }

    // Payment due.
    if (info.paymentStatus == PaymentStatus.due ||
        info.paymentStatus == PaymentStatus.overdue) {
      return BannerConfig(
        icon: Icons.warning_amber_rounded,
        title: 'payment_due'.tr(),
        subtitle: 'payment_due_subtitle'.tr(),
        accentColor: AppColors.warning,
        backgroundColor: AppColors.warning.withValues(alpha: 0.06),
        borderColor: AppColors.warning.withValues(alpha: 0.2),
        iconBackgroundColor: AppColors.warning.withValues(alpha: 0.12),
        actionLabel: 'pay_now'.tr(),
        actionType: _BannerAction.payNow,
      );
    }

    // Eligible.
    return BannerConfig(
      icon: Icons.check_circle,
      title: 'eligible_to_vote'.tr(),
      subtitle: null,
      accentColor: AppColors.success,
      backgroundColor: AppColors.success.withValues(alpha: 0.06),
      borderColor: AppColors.success.withValues(alpha: 0.2),
      iconBackgroundColor: AppColors.success.withValues(alpha: 0.12),
      actionLabel: null,
      actionType: null,
    );
  }

  Future<void> _onActionTap(
    BuildContext context,
    _BannerAction? actionType,
  ) async {
    switch (actionType) {
      case _BannerAction.payNow:
        final uri = Uri.parse(_paymentUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      case _BannerAction.contactSupport:
        _showSupportDialog(context);
      case null:
        break;
    }
  }

  void _showSupportDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'contact_support'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontWeight: FontWeight.w700,
          ),
          textDirection: TextDirection.rtl,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'membership_frozen_support_text'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
              ),
              textDirection: TextDirection.rtl,
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final uri = Uri.parse('tel:$_supportPhone');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri);
                }
              },
              child: Row(
                children: [
                  const Icon(Icons.phone, color: AppColors.likudBlue, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    _supportPhone,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.likudBlue,
                    ),
                    textDirection: TextDirection.ltr,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              'cancel'.tr(),
              style: const TextStyle(fontFamily: 'Heebo'),
            ),
          ),
        ],
      ),
    );
  }
}

/// Internal action types for the eligibility banner.
enum _BannerAction { payNow, contactSupport }

/// Configuration data for the eligibility banner appearance.
class BannerConfig {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color accentColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color iconBackgroundColor;
  final String? actionLabel;
  final _BannerAction? actionType;

  const BannerConfig({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.accentColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.iconBackgroundColor,
    required this.actionLabel,
    required this.actionType,
  });
}
