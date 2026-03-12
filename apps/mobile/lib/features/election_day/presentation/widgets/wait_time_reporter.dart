import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Bottom sheet widget for reporting wait time at a polling station.
///
/// Provides a slider with discrete wait-time values and a submit button.
/// The selected minutes value is passed back via [onReport].
class WaitTimeReporter extends StatefulWidget {
  /// The station ID to report against.
  final String stationId;

  /// The station display name (shown in the header).
  final String stationName;

  /// Called when the user taps submit.
  final void Function(String stationId, int minutes) onReport;

  const WaitTimeReporter({
    super.key,
    required this.stationId,
    required this.stationName,
    required this.onReport,
  });

  @override
  State<WaitTimeReporter> createState() => _WaitTimeReporterState();
}

class _WaitTimeReporterState extends State<WaitTimeReporter> {
  /// Discrete slider values.
  static const _sliderValues = [0, 5, 10, 15, 20, 30, 45, 60];

  int _selectedIndex = 0;

  int get _selectedMinutes => _sliderValues[_selectedIndex];

  String _labelForIndex(int index) {
    final minutes = _sliderValues[index];
    if (minutes == 0) return 'station_map.no_wait'.tr();
    if (minutes == 60) return 'station_map.sixty_plus'.tr();
    return '$minutes ${'station_map.minutes'.tr()}';
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              'station_map.report_wait'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),

            // Station name
            Text(
              widget.stationName,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),

            // Current value display
            Center(
              child: Text(
                _labelForIndex(_selectedIndex),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppColors.likudBlue,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Slider
            Slider(
              value: _selectedIndex.toDouble(),
              min: 0,
              max: (_sliderValues.length - 1).toDouble(),
              divisions: _sliderValues.length - 1,
              activeColor: AppColors.likudBlue,
              inactiveColor: AppColors.surfaceMedium,
              label: _labelForIndex(_selectedIndex),
              onChanged: (value) {
                setState(() {
                  _selectedIndex = value.round();
                });
              },
            ),

            // Min / Max labels
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(8, 0, 8, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'station_map.no_wait'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
                  Text(
                    'station_map.sixty_plus'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              height: 48,
              child: FilledButton(
                onPressed: () {
                  widget.onReport(widget.stationId, _selectedMinutes);
                  Navigator.pop(context);
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'station_map.report_wait'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
