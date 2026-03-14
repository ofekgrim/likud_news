import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../feed/domain/usecases/get_feed.dart';

/// Toggle between "Latest" and "For You" feed modes.
class FeedModeToggle extends StatelessWidget {
  final FeedMode currentMode;
  final ValueChanged<FeedMode> onModeChanged;

  const FeedModeToggle({
    super.key,
    required this.currentMode,
    required this.onModeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: [
          _buildTab(
            context,
            label: 'latest_news'.tr(),
            isActive: currentMode == FeedMode.latest,
            onTap: () => onModeChanged(FeedMode.latest),
          ),
          const SizedBox(width: 8),
          _buildTab(
            context,
            label: 'for_you'.tr(),
            icon: Icons.auto_awesome_outlined,
            isActive: currentMode == FeedMode.personalized,
            onTap: () => onModeChanged(FeedMode.personalized),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(
    BuildContext context, {
    required String label,
    IconData? icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.likudBlue
              : context.colors.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 16,
                color: isActive ? Colors.white : context.colors.textSecondary,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isActive ? Colors.white : context.colors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
