import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// Three-level importance selector widget.
///
/// Allows the user to indicate how important a question topic is to them.
/// Levels: 1 = Low, 2 = Medium, 3 = High.
/// Hebrew labels are loaded from i18n keys.
class ImportanceSelector extends StatelessWidget {
  final int selectedImportance;
  final ValueChanged<int> onChanged;

  const ImportanceSelector({
    super.key,
    required this.selectedImportance,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'quiz_importance_label'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: context.colors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildChip(
              context: context,
              importance: 1,
              labelKey: 'quiz_importance_low',
              icon: Icons.arrow_downward_rounded,
            ),
            const SizedBox(width: 8),
            _buildChip(
              context: context,
              importance: 2,
              labelKey: 'quiz_importance_medium',
              icon: Icons.remove_rounded,
            ),
            const SizedBox(width: 8),
            _buildChip(
              context: context,
              importance: 3,
              labelKey: 'quiz_importance_high',
              icon: Icons.arrow_upward_rounded,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildChip({
    required BuildContext context,
    required int importance,
    required String labelKey,
    required IconData icon,
  }) {
    final isSelected = selectedImportance == importance;
    final Color chipColor = _getColorForImportance(importance);

    return Expanded(
      child: GestureDetector(
        onTap: () => onChanged(importance),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? chipColor.withValues(alpha: 0.12)
                : context.colors.surfaceVariant,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? chipColor : context.colors.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected ? chipColor : context.colors.textTertiary,
              ),
              const SizedBox(width: 4),
              Text(
                labelKey.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? chipColor : context.colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getColorForImportance(int importance) {
    switch (importance) {
      case 1:
        return AppColors.textTertiary;
      case 2:
        return AppColors.warning;
      case 3:
        return AppColors.breakingRed;
      default:
        return AppColors.textSecondary;
    }
  }
}
