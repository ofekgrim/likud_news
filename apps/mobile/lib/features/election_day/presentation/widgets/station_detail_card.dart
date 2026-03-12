import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import 'polling_station_map_item.dart';
import 'traffic_light_indicator.dart';
import 'wait_time_reporter.dart';

/// Info card displayed when a station marker is tapped on the map.
///
/// Shows station name, address, traffic-light indicator, report count,
/// a "Navigate" button (Waze deep link), and a "Report wait time"
/// button that opens [WaitTimeReporter] as a bottom sheet.
class StationDetailCard extends StatelessWidget {
  /// The station to display.
  final PollingStationMapItem station;

  /// Called when the user submits a wait-time report.
  final void Function(String stationId, int minutes)? onReport;

  const StationDetailCard({
    super.key,
    required this.station,
    this.onReport,
  });

  Future<void> _navigateWithWaze() async {
    final uri = Uri.parse(
      'waze://?ll=${station.lat},${station.lng}&navigate=yes',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      // Fall back to Google Maps.
      final fallback = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}',
      );
      if (await canLaunchUrl(fallback)) {
        await launchUrl(fallback, mode: LaunchMode.externalApplication);
      }
    }
  }

  void _openWaitTimeReporter(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: AppColors.white,
      builder: (_) => WaitTimeReporter(
        stationId: station.id,
        stationName: station.name,
        onReport: (stationId, minutes) {
          onReport?.call(stationId, minutes);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(20, 16, 20, 24),
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          boxShadow: [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 16,
              offset: Offset(0, -4),
            ),
          ],
        ),
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

            // Station name and traffic indicator row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        station.name,
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 16,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              station.address,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 13,
                                color: AppColors.textSecondary,
                                height: 1.4,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                TrafficLightIndicator(
                  avgWaitMinutes: station.avgWaitMinutes,
                  crowdLevel: station.crowdLevel,
                ),
              ],
            ),

            // Report count
            if (station.reportsCount > 0) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.bar_chart_outlined,
                    size: 14,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${station.reportsCount} ${'station_map.report_count'.tr()}',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                // Navigate button
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _navigateWithWaze,
                    icon: const Icon(Icons.navigation_outlined, size: 18),
                    label: Text('station_map.navigate'.tr()),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.likudBlue,
                      side: const BorderSide(color: AppColors.likudBlue),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      textStyle: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Report wait time button
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _openWaitTimeReporter(context),
                    icon: const Icon(Icons.timer_outlined, size: 18),
                    label: Text('station_map.report_wait'.tr()),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.likudBlue,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      textStyle: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
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
