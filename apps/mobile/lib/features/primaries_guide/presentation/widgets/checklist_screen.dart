import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// Interactive checklist for Primary Day (Screen 6).
///
/// Shows 4 items with checkboxes, descriptions, and action buttons
/// that deep-link to relevant sections of the app.
class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});

  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  final Set<int> _checkedItems = {};

  @override
  Widget build(BuildContext context) {
    final items = _buildChecklistItems(context);
    final checkedCount = _checkedItems.length;

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 16, 24, 0),
      child: Column(
        children: [
          // Icon
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFFF3E5F5),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.checklist,
              size: 40,
              color: AppColors.likudBlue,
            ),
          ),
          const SizedBox(height: 16),

          // Title
          Text(
            'primaries_guide.screen6_title'.tr(),
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),

          // Description
          Text(
            'primaries_guide.screen6_desc'.tr(),
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              color: context.colors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),

          // Progress indicator
          _buildProgressIndicator(checkedCount, items.length),
          const SizedBox(height: 16),

          // Checklist items
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) => items[index],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator(int checked, int total) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      textDirection: TextDirection.rtl,
      children: [
        Icon(
          checked == total ? Icons.check_circle : Icons.radio_button_unchecked,
          size: 18,
          color: checked == total ? AppColors.success : AppColors.likudBlue,
        ),
        const SizedBox(width: 6),
        Text(
          '$checked/$total',
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: checked == total
                ? AppColors.success
                : AppColors.likudBlue,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildChecklistItems(BuildContext context) {
    return [
      _ChecklistItem(
        index: 0,
        icon: Icons.badge_outlined,
        titleKey: 'primaries_guide.checklist_id',
        descKey: 'primaries_guide.checklist_id_desc',
        isChecked: _checkedItems.contains(0),
        onToggle: () => _toggleItem(0),
      ),
      _ChecklistItem(
        index: 1,
        icon: Icons.verified_user_outlined,
        titleKey: 'primaries_guide.checklist_eligibility',
        descKey: 'primaries_guide.checklist_eligibility_desc',
        isChecked: _checkedItems.contains(1),
        onToggle: () => _toggleItem(1),
        actionLabel: 'primaries_guide.checklist_eligibility',
        onAction: () => context.push('/membership'),
      ),
      _ChecklistItem(
        index: 2,
        icon: Icons.location_on_outlined,
        titleKey: 'primaries_guide.checklist_station',
        descKey: 'primaries_guide.checklist_station_desc',
        isChecked: _checkedItems.contains(2),
        onToggle: () => _toggleItem(2),
        actionLabel: 'primaries_guide.checklist_station',
        onAction: () => context.push('/election-day/stations'),
      ),
      _ChecklistItem(
        index: 3,
        icon: Icons.people_outline,
        titleKey: 'primaries_guide.checklist_candidates',
        descKey: 'primaries_guide.checklist_candidates_desc',
        isChecked: _checkedItems.contains(3),
        onToggle: () => _toggleItem(3),
        actionLabel: 'primaries_guide.checklist_candidates',
        onAction: () => context.push('/primaries'),
      ),
    ];
  }

  void _toggleItem(int index) {
    setState(() {
      if (_checkedItems.contains(index)) {
        _checkedItems.remove(index);
      } else {
        _checkedItems.add(index);
      }
    });
  }
}

/// A single checklist item with checkbox, icon, text, and optional action.
class _ChecklistItem extends StatelessWidget {
  final int index;
  final IconData icon;
  final String titleKey;
  final String descKey;
  final bool isChecked;
  final VoidCallback onToggle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _ChecklistItem({
    required this.index,
    required this.icon,
    required this.titleKey,
    required this.descKey,
    required this.isChecked,
    required this.onToggle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsetsDirectional.all(12),
        decoration: BoxDecoration(
          color: isChecked
              ? AppColors.success.withValues(alpha: 0.08)
              : context.colors.cardSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isChecked
                ? AppColors.success.withValues(alpha: 0.4)
                : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          textDirection: TextDirection.rtl,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Checkbox
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: isChecked ? AppColors.success : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isChecked
                      ? AppColors.success
                      : context.colors.textTertiary,
                  width: 2,
                ),
              ),
              child: isChecked
                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 12),

            // Icon
            Icon(
              icon,
              size: 24,
              color: isChecked
                  ? AppColors.success
                  : AppColors.likudBlue,
            ),
            const SizedBox(width: 12),

            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titleKey.tr(),
                    textDirection: TextDirection.rtl,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: context.colors.textPrimary,
                      decoration:
                          isChecked ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    descKey.tr(),
                    textDirection: TextDirection.rtl,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: context.colors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),

            // Action button
            if (onAction != null) ...[
              const SizedBox(width: 8),
              IconButton(
                onPressed: onAction,
                icon: const Icon(
                  Icons.arrow_back_ios_new,
                  size: 16,
                ),
                color: AppColors.likudBlue,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(
                  minWidth: 32,
                  minHeight: 32,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
