import 'package:flutter/material.dart';
import '../../core/widgets/liquid_glass_container.dart';
import '../theme/app_colors.dart';
import '../theme/theme_context.dart';

class LiquidGlassNavItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;

  const LiquidGlassNavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });
}

class LiquidGlassNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;
  final List<LiquidGlassNavItem> items;

  const LiquidGlassNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    return LiquidGlassContainer(
      borderRadius: 30,
      blurSigma: 1,
      backgroundColor: context.colors.glassBg,
      backgroundOpacity: 0.85,
      border: Border.all(
        color: context.colors.glassBorder,
        width: 0.5,
      ),
      boxShadow: [
        BoxShadow(
          color: context.colors.shadow,
          blurRadius: 20,
          offset: const Offset(0, 4),
        ),
      ],
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(items.length, (index) {
          final item = items[index];
          final isSelected = index == selectedIndex;
          return Expanded(
            child: Semantics(
              selected: isSelected,
              label: item.label,
              button: true,
              child: InkWell(
                onTap: () => onTap(index),
                borderRadius: BorderRadius.circular(20),
                child: AnimatedContainer(
                duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.likudBlue.withValues(alpha: 0.1)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedScale(
                      scale: isSelected ? 1.15 : 1.0,
                      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
                      child: Icon(
                        isSelected ? item.selectedIcon : item.icon,
                        size: 24,
                        color: isSelected
                            ? AppColors.likudBlue
                            : context.colors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 10,
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.w400,
                        color: isSelected
                            ? AppColors.likudBlue
                            : context.colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ),
          );
        }),
      ),
    );
  }
}
