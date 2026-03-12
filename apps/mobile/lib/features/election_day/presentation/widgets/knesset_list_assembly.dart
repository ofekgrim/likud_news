import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/knesset_slot.dart';

/// Visual grid showing 120 Knesset list slots in a 10x12 layout.
///
/// Slot colors by type:
/// - leader = gold
/// - reserved_minority = purple
/// - reserved_woman = pink
/// - national = blue
/// - district = green
///
/// Filled slots show candidate initials; confirmed slots have a checkmark.
/// Empty slots show slot number with a dashed border.
class KnessetListAssembly extends StatelessWidget {
  final List<KnessetSlot> slots;

  const KnessetListAssembly({super.key, required this.slots});

  static const int _columns = 10;
  static const int _totalSlots = 120;

  @override
  Widget build(BuildContext context) {
    // Ensure we have a full 120-slot list, filling gaps with empty national slots.
    final slotMap = <int, KnessetSlot>{};
    for (final slot in slots) {
      slotMap[slot.slotNumber] = slot;
    }

    final allSlots = List.generate(_totalSlots, (i) {
      final slotNumber = i + 1;
      return slotMap[slotNumber] ??
          KnessetSlot(slotNumber: slotNumber, slotType: SlotType.national);
    });

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(12, 8, 12, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Legend.
          _buildLegend(),
          const SizedBox(height: 12),

          // Grid.
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: _columns,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
              childAspectRatio: 1,
            ),
            itemCount: _totalSlots,
            itemBuilder: (context, index) {
              return _SlotCell(slot: allSlots[index]);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Wrap(
      spacing: 12,
      runSpacing: 6,
      children: [
        _LegendItem(
          color: _slotColor(SlotType.leader),
          label: 'results.slot_leader'.tr(),
        ),
        _LegendItem(
          color: _slotColor(SlotType.reservedMinority),
          label: 'results.slot_reserved'.tr(),
        ),
        _LegendItem(
          color: _slotColor(SlotType.reservedWoman),
          label: 'results.slot_reserved'.tr(),
        ),
        _LegendItem(
          color: _slotColor(SlotType.national),
          label: 'results.slot_national'.tr(),
        ),
        _LegendItem(
          color: _slotColor(SlotType.district),
          label: 'results.slot_district'.tr(),
        ),
      ],
    );
  }

  static Color _slotColor(SlotType type) {
    switch (type) {
      case SlotType.leader:
        return const Color(0xFFD4A017); // gold
      case SlotType.reservedMinority:
        return const Color(0xFF8B5CF6); // purple
      case SlotType.reservedWoman:
        return const Color(0xFFEC4899); // pink
      case SlotType.national:
        return AppColors.likudBlue;
      case SlotType.district:
        return const Color(0xFF16A34A); // green
    }
  }
}

/// A single slot cell in the grid.
class _SlotCell extends StatelessWidget {
  final KnessetSlot slot;

  const _SlotCell({required this.slot});

  @override
  Widget build(BuildContext context) {
    final color = KnessetListAssembly._slotColor(slot.slotType);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      transitionBuilder: (child, animation) {
        return FadeTransition(opacity: animation, child: child);
      },
      child: slot.isFilled
          ? _buildFilledSlot(color)
          : _buildEmptySlot(color),
    );
  }

  Widget _buildFilledSlot(Color color) {
    return Container(
      key: ValueKey('filled-${slot.slotNumber}-${slot.candidateId}'),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color, width: 1.5),
      ),
      child: Stack(
        children: [
          // Candidate initials.
          Center(
            child: Text(
              slot.initials,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
          // Checkmark overlay for confirmed slots.
          if (slot.isConfirmed)
            PositionedDirectional(
              top: 1,
              start: 1,
              child: Icon(
                Icons.check_circle,
                size: 10,
                color: AppColors.success,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptySlot(Color color) {
    return Container(
      key: ValueKey('empty-${slot.slotNumber}'),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 1,
          strokeAlign: BorderSide.strokeAlignInside,
        ),
      ),
      child: Center(
        child: Text(
          '${slot.slotNumber}',
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 9,
            fontWeight: FontWeight.w500,
            color: color.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }
}

/// A small legend indicator (color dot + label).
class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 10,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
