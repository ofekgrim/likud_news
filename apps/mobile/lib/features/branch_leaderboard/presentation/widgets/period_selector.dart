import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// Horizontal chip row for period selection.
///
/// Chips: "This Week", "Last Week", "All Time".
/// Selected chip is highlighted in Likud blue.
class PeriodSelector extends StatelessWidget {
  final String selectedPeriod;
  final ValueChanged<String> onPeriodChanged;

  const PeriodSelector({
    super.key,
    required this.selectedPeriod,
    required this.onPeriodChanged,
  });

  @override
  Widget build(BuildContext context) {
    final periods = [
      _PeriodOption(value: 'current', labelKey: 'leaderboard.this_week'),
      _PeriodOption(value: 'previous', labelKey: 'leaderboard.last_week'),
      _PeriodOption(value: 'all_time', labelKey: 'leaderboard.all_time'),
    ];

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsetsDirectional.only(start: 4, end: 4),
        itemCount: periods.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final period = periods[index];
          final isSelected = selectedPeriod == period.value;

          return GestureDetector(
            onTap: () => onPeriodChanged(period.value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.likudBlue
                    : context.colors.surfaceMedium,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? AppColors.likudBlue
                      : context.colors.border,
                  width: 1,
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                period.labelKey.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? Colors.white
                      : context.colors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _PeriodOption {
  final String value;
  final String labelKey;

  const _PeriodOption({required this.value, required this.labelKey});
}
