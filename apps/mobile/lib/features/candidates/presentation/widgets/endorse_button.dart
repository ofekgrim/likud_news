import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// Reusable endorse/un-endorse button widget.
///
/// Two visual states:
/// - Not endorsed: filled Likud blue button with thumb-up icon.
/// - Endorsed: outlined button with checkmark icon.
///
/// Shows a loading indicator while the API call is in progress.
class EndorseButton extends StatelessWidget {
  final bool isEndorsed;
  final bool isLoading;
  final VoidCallback onPressed;

  const EndorseButton({
    super.key,
    required this.isEndorsed,
    this.isLoading = false,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return SizedBox(
        width: double.infinity,
        height: 48,
        child: OutlinedButton(
          onPressed: null,
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: context.colors.border),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.likudBlue,
            ),
          ),
        ),
      );
    }

    if (isEndorsed) {
      return SizedBox(
        width: double.infinity,
        height: 48,
        child: OutlinedButton.icon(
          onPressed: onPressed,
          icon: const Icon(
            Icons.check_circle,
            color: AppColors.success,
            size: 20,
          ),
          label: Text(
            'candidates_remove_endorsement'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: context.colors.textPrimary,
            ),
          ),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppColors.success),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: const Icon(
          Icons.thumb_up,
          color: AppColors.white,
          size: 20,
        ),
        label: Text(
          'candidates_endorse'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.white,
          ),
        ),
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.likudBlue,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
