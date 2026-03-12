import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// The two sub-tabs available in the live results page.
enum ResultsTab {
  rankings,
  listAssembly,
}

/// Segmented control header for toggling between Rankings and List Assembly views.
///
/// Uses a custom segmented control style with Likud blue for the selected tab.
class ResultsToggleHeader extends StatelessWidget {
  final ResultsTab currentTab;
  final ValueChanged<ResultsTab> onTabChanged;

  const ResultsToggleHeader({
    super.key,
    required this.currentTab,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 8),
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.surfaceMedium,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TabButton(
              label: 'results.rankings'.tr(),
              isSelected: currentTab == ResultsTab.rankings,
              onTap: () => onTabChanged(ResultsTab.rankings),
            ),
          ),
          Expanded(
            child: _TabButton(
              label: 'results.list_assembly'.tr(),
              isSelected: currentTab == ResultsTab.listAssembly,
              onTap: () => onTabChanged(ResultsTab.listAssembly),
            ),
          ),
        ],
      ),
    );
  }
}

/// A single tab button within the segmented control.
class _TabButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.likudBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected ? AppColors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
