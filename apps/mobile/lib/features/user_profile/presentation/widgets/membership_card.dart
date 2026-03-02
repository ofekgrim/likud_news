import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../auth/domain/entities/app_user.dart';

/// Card widget displaying the user's Likud membership status.
///
/// Shows a colored badge indicating [MembershipStatus], the membership ID
/// for verified users, and a "Verify Membership" button for unverified users.
class MembershipCard extends StatelessWidget {
  final AppUser user;
  final VoidCallback? onVerifyTap;

  const MembershipCard({
    super.key,
    required this.user,
    this.onVerifyTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with title and status badge.
          Row(
            textDirection: TextDirection.rtl,
            children: [
              Icon(
                Icons.card_membership,
                color: AppColors.likudBlue,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'profile_membership'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                  textDirection: TextDirection.rtl,
                ),
              ),
              _buildStatusBadge(),
            ],
          ),

          const SizedBox(height: 12),

          // Membership details or verification prompt.
          if (user.membershipStatus == MembershipStatus.verified) ...[
            _buildInfoRow(
              'profile_membership_id'.tr(),
              user.membershipId ?? '-',
            ),
            if (user.membershipVerifiedAt != null) ...[
              const SizedBox(height: 6),
              _buildInfoRow(
                'profile_verified_date'.tr(),
                _formatDate(user.membershipVerifiedAt!),
              ),
            ],
          ] else if (user.membershipStatus == MembershipStatus.pending) ...[
            Text(
              'profile_membership_pending'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
              textDirection: TextDirection.rtl,
            ),
          ] else ...[
            // Unverified or expired — show verification button.
            Text(
              'profile_membership_unverified'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
              textDirection: TextDirection.rtl,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onVerifyTap,
                icon: const Icon(Icons.verified_outlined, size: 18),
                label: Text(
                  'profile_verify_membership'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.likudBlue,
                  side: const BorderSide(color: AppColors.likudBlue),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    final (label, color, bgColor) = switch (user.membershipStatus) {
      MembershipStatus.verified => (
        'profile_status_verified'.tr(),
        AppColors.success,
        AppColors.success.withValues(alpha: 0.1),
      ),
      MembershipStatus.pending => (
        'profile_status_pending'.tr(),
        AppColors.warning,
        AppColors.warning.withValues(alpha: 0.1),
      ),
      MembershipStatus.expired => (
        'profile_status_expired'.tr(),
        AppColors.breakingRed,
        AppColors.breakingRed.withValues(alpha: 0.1),
      ),
      MembershipStatus.unverified => (
        'profile_status_unverified'.tr(),
        AppColors.textTertiary,
        AppColors.surfaceMedium,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      textDirection: TextDirection.rtl,
      children: [
        Text(
          '$label: ',
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
          textDirection: TextDirection.rtl,
        ),
        Text(
          value,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          textDirection: TextDirection.rtl,
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }
}
