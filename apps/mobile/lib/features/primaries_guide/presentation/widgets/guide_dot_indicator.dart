import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Row of dots showing the current position in the guide.
///
/// Active dot uses Likud blue, inactive dots use grey.
class GuideDotIndicator extends StatelessWidget {
  final int count;
  final int activeIndex;
  final ValueChanged<int>? onDotTap;

  const GuideDotIndicator({
    super.key,
    required this.count,
    required this.activeIndex,
    this.onDotTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (index) {
        final isActive = index == activeIndex;
        return GestureDetector(
          onTap: onDotTap != null ? () => onDotTap!(index) : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            margin: const EdgeInsetsDirectional.only(end: 8),
            width: isActive ? 24 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: isActive
                  ? AppColors.likudBlue
                  : AppColors.likudBlue.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        );
      }),
    );
  }
}
