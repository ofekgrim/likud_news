import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// A slider for adjusting the importance weight of a policy category.
///
/// Weight range: 0.5 (low) to 3.0 (high), default 1.0.
/// Displays the category name, current weight label, and a slider.
class ImportanceSlider extends StatelessWidget {
  final String categoryKey;
  final String categoryLabel;
  final double value;
  final ValueChanged<double> onChanged;

  const ImportanceSlider({
    super.key,
    required this.categoryKey,
    required this.categoryLabel,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(
        horizontal: 16,
        vertical: 6,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  categoryLabel,
                  textDirection: TextDirection.rtl,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: context.colors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 8,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: _weightColor(value).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _weightLabel(value),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _weightColor(value),
                  ),
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: AppColors.likudBlue,
              inactiveTrackColor: AppColors.likudBlue.withValues(alpha: 0.15),
              thumbColor: AppColors.likudBlue,
              overlayColor: AppColors.likudBlue.withValues(alpha: 0.12),
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
            ),
            child: Slider(
              value: value,
              min: 0.5,
              max: 3.0,
              divisions: 5,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  String _weightLabel(double weight) {
    if (weight <= 0.75) return 'matcher_importance_low'.tr();
    if (weight <= 1.5) return 'matcher_importance_medium'.tr();
    return 'matcher_importance_high'.tr();
  }

  Color _weightColor(double weight) {
    if (weight <= 0.75) return AppColors.textTertiary;
    if (weight <= 1.5) return AppColors.likudBlue;
    return AppColors.success;
  }
}
