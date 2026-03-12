import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// A traffic-light style indicator showing crowd level and wait time.
///
/// Displays a colored circle (green / yellow / red) based on the
/// average wait time, with a text label below.
class TrafficLightIndicator extends StatelessWidget {
  /// Average wait time in minutes.
  final int avgWaitMinutes;

  /// Crowd level string: 'low', 'medium', or 'high'.
  final String crowdLevel;

  const TrafficLightIndicator({
    super.key,
    required this.avgWaitMinutes,
    required this.crowdLevel,
  });

  @override
  Widget build(BuildContext context) {
    final color = _colorForWait(avgWaitMinutes);
    final label = _labelForCrowd(crowdLevel);
    final waitText = avgWaitMinutes == 0
        ? 'station_map.no_wait'.tr()
        : 'station_map.approx_minutes'.tr(args: ['$avgWaitMinutes']);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.4),
                blurRadius: 6,
                spreadRadius: 1,
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          waitText,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          textDirection: TextDirection.rtl,
        ),
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 11,
            color: color,
            fontWeight: FontWeight.w500,
          ),
          textDirection: TextDirection.rtl,
        ),
      ],
    );
  }

  /// Maps wait time to a traffic-light color.
  static Color _colorForWait(int minutes) {
    if (minutes <= 10) return AppColors.success;
    if (minutes <= 25) return AppColors.warning;
    return AppColors.breakingRed;
  }

  /// Maps crowd level string to a localized label.
  static String _labelForCrowd(String level) {
    switch (level) {
      case 'low':
        return 'station_map.crowd_low'.tr();
      case 'medium':
        return 'station_map.crowd_medium'.tr();
      case 'high':
        return 'station_map.crowd_high'.tr();
      default:
        return 'station_map.crowd_low'.tr();
    }
  }

  /// Returns the marker hue for Google Maps based on wait minutes.
  static double markerHueForWait(int minutes) {
    if (minutes <= 10) return 120.0; // green
    if (minutes <= 25) return 60.0; // yellow
    return 0.0; // red
  }
}
