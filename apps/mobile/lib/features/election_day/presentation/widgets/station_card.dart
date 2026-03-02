import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/polling_station.dart';

/// Card widget displaying a single polling station's details.
///
/// Shows name, address, opening hours, accessibility badge,
/// and a "Navigate" button that opens Google Maps via url_launcher.
class StationCard extends StatelessWidget {
  final PollingStation station;
  final VoidCallback? onReportTap;

  const StationCard({
    super.key,
    required this.station,
    this.onReportTap,
  });

  Future<void> _openNavigation() async {
    final Uri uri;
    if (station.latitude != null && station.longitude != null) {
      uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}',
      );
    } else {
      final encodedAddress = Uri.encodeComponent(station.address);
      uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$encodedAddress',
      );
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsetsDirectional.only(
        start: 16,
        end: 16,
        bottom: 12,
      ),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 0.5),
      ),
      color: AppColors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Station name and accessibility badge.
            Row(
              children: [
                Expanded(
                  child: Text(
                    station.name,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
                if (station.isAccessible)
                  Container(
                    padding: const EdgeInsetsDirectional.only(
                      start: 8,
                    ),
                    child: Tooltip(
                      message: 'election_day_accessible'.tr(),
                      child: const Icon(
                        Icons.accessible,
                        color: AppColors.likudBlue,
                        size: 22,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),

            // Address.
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
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
                    textDirection: TextDirection.rtl,
                  ),
                ),
              ],
            ),

            // District.
            if (station.district != null &&
                station.district!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(
                    Icons.map_outlined,
                    size: 14,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    station.district!,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ],

            // Opening hours.
            if (station.openingTime != null ||
                station.closingTime != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(
                    Icons.schedule,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${station.openingTime ?? '--:--'} - ${station.closingTime ?? '--:--'}',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 12),

            // Action buttons.
            Row(
              children: [
                // Navigate button.
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _openNavigation,
                    icon: const Icon(Icons.directions, size: 18),
                    label: Text('election_day_navigate'.tr()),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.likudBlue,
                      side: const BorderSide(color: AppColors.likudBlue),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Report wait time button.
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onReportTap,
                    icon: const Icon(Icons.timer_outlined, size: 18),
                    label: Text('election_day_report_wait'.tr()),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.border),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
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
