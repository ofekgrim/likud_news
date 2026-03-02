import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Horizontal scrolling filter bar for candidate districts.
///
/// Shows an "All" chip followed by one chip per unique district.
/// The selected chip is styled with Likud blue.
class DistrictFilterBar extends StatelessWidget {
  final List<String> districts;
  final String? selectedDistrict;
  final ValueChanged<String?> onDistrictSelected;

  const DistrictFilterBar({
    super.key,
    required this.districts,
    this.selectedDistrict,
    required this.onDistrictSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
        children: [
          // "All" chip.
          _buildChip(
            label: 'candidates_all_districts'.tr(),
            isSelected: selectedDistrict == null || selectedDistrict!.isEmpty,
            onTap: () => onDistrictSelected(null),
          ),
          const SizedBox(width: 8),
          // District chips.
          ...districts.map(
            (district) => Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: _buildChip(
                label: district,
                isSelected: selectedDistrict == district,
                onTap: () => onDistrictSelected(district),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 13,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          color: isSelected ? AppColors.white : AppColors.textPrimary,
        ),
        textDirection: TextDirection.rtl,
      ),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.likudBlue,
      backgroundColor: AppColors.surfaceMedium,
      checkmarkColor: AppColors.white,
      side: BorderSide(
        color: isSelected ? AppColors.likudBlue : AppColors.border,
        width: 0.5,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}
