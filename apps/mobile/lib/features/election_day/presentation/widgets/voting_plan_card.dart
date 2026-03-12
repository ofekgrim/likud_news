import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';

/// "When will you vote?" voting plan selector card.
///
/// Lets the user pick a time slot, add to calendar, and save their plan.
/// Shows the assigned polling station if available.
class VotingPlanCard extends StatefulWidget {
  /// The user's assigned polling station name, if any.
  final String? pollingStationName;

  /// The user's assigned polling station address, if any.
  final String? pollingStationAddress;

  /// Already-selected time slot (from BLoC state), if any.
  final String? selectedTimeSlot;

  /// Called when the user taps "Save Plan".
  final ValueChanged<String>? onSavePlan;

  const VotingPlanCard({
    super.key,
    this.pollingStationName,
    this.pollingStationAddress,
    this.selectedTimeSlot,
    this.onSavePlan,
  });

  @override
  State<VotingPlanCard> createState() => _VotingPlanCardState();
}

class _VotingPlanCardState extends State<VotingPlanCard> {
  String? _selectedSlot;

  static const _timeSlots = [
    _TimeSlot(key: 'morning', startHour: 7, endHour: 10),
    _TimeSlot(key: 'midday', startHour: 10, endHour: 14),
    _TimeSlot(key: 'afternoon', startHour: 14, endHour: 17),
    _TimeSlot(key: 'evening', startHour: 17, endHour: 19),
  ];

  @override
  void initState() {
    super.initState();
    _selectedSlot = widget.selectedTimeSlot;
  }

  @override
  void didUpdateWidget(VotingPlanCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedTimeSlot != oldWidget.selectedTimeSlot) {
      setState(() => _selectedSlot = widget.selectedTimeSlot);
    }
  }

  Future<void> _addToCalendar() async {
    if (_selectedSlot == null) return;

    final slot = _timeSlots.firstWhere((s) => s.key == _selectedSlot);
    final today = DateTime.now();
    final startTime = DateTime(
      today.year,
      today.month,
      today.day,
      slot.startHour,
    );
    final endTime = DateTime(
      today.year,
      today.month,
      today.day,
      slot.endHour,
    );

    final title = Uri.encodeComponent(
      '\u05D4\u05E6\u05D1\u05E2\u05D4 \u05D1\u05E4\u05E8\u05D9\u05D9\u05DE\u05E8\u05D9\u05D6', // הצבעה בפריימריז
    );
    final location = widget.pollingStationAddress != null
        ? Uri.encodeComponent(widget.pollingStationAddress!)
        : '';

    // Use Google Calendar URL scheme.
    final startStr = _formatCalendarDate(startTime);
    final endStr = _formatCalendarDate(endTime);

    final calendarUrl = Uri.parse(
      'https://www.google.com/calendar/render?action=TEMPLATE'
      '&text=$title'
      '&dates=$startStr/$endStr'
      '&location=$location'
      '&sf=true&output=xml',
    );

    try {
      await launchUrl(calendarUrl, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('voting_plan.calendar_error'.tr()),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  String _formatCalendarDate(DateTime dt) {
    return '${dt.year}'
        '${dt.month.toString().padLeft(2, '0')}'
        '${dt.day.toString().padLeft(2, '0')}'
        'T'
        '${dt.hour.toString().padLeft(2, '0')}'
        '${dt.minute.toString().padLeft(2, '0')}'
        '00';
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        margin: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title.
            Text(
              'voting_plan.title'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),

            const SizedBox(height: 12),

            // Time slot buttons.
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _timeSlots.map((slot) {
                final isSelected = _selectedSlot == slot.key;
                return ChoiceChip(
                  label: Text(
                    'voting_plan.${slot.key}'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isSelected
                          ? AppColors.white
                          : AppColors.textPrimary,
                    ),
                  ),
                  selected: isSelected,
                  selectedColor: AppColors.likudBlue,
                  backgroundColor: AppColors.surfaceLight,
                  checkmarkColor: AppColors.white,
                  onSelected: (_) {
                    setState(() => _selectedSlot = slot.key);
                  },
                );
              }).toList(),
            ),

            // Polling station info.
            if (widget.pollingStationName != null) ...[
              const SizedBox(height: 16),
              const Divider(height: 1, color: AppColors.border),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 18,
                    color: AppColors.likudBlue,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'voting_plan.your_station'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsetsDirectional.only(start: 24),
                child: Text(
                  widget.pollingStationName!,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              if (widget.pollingStationAddress != null)
                Padding(
                  padding: const EdgeInsetsDirectional.only(start: 24),
                  child: Text(
                    widget.pollingStationAddress!,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ),
            ],

            const SizedBox(height: 16),

            // Action buttons.
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectedSlot != null ? _addToCalendar : null,
                    icon: const Icon(Icons.calendar_today, size: 16),
                    label: Text(
                      'voting_plan.add_calendar'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.likudBlue,
                      side: const BorderSide(color: AppColors.likudBlue),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _selectedSlot != null
                        ? () {
                            widget.onSavePlan?.call(_selectedSlot!);
                          }
                        : null,
                    icon: const Icon(Icons.check, size: 16),
                    label: Text(
                      'voting_plan.save'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                      ),
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.likudBlue,
                      disabledBackgroundColor:
                          AppColors.likudBlue.withValues(alpha: 0.3),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Internal helper representing a time slot option.
class _TimeSlot {
  final String key;
  final int startHour;
  final int endHour;

  const _TimeSlot({
    required this.key,
    required this.startHour,
    required this.endHour,
  });
}
