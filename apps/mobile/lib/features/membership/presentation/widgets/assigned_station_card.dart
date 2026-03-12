import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/membership_info.dart';

/// Card showing the member's assigned polling station.
///
/// Displays station name, address, district, and opening hours.
/// Provides navigation via Waze (with fallback to Google Maps).
class AssignedStationCard extends StatelessWidget {
  final PollingStation station;
  final String? district;

  const AssignedStationCard({
    super.key,
    required this.station,
    this.district,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: context.colors.cardSurface,
      child: Padding(
        padding: const EdgeInsetsDirectional.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header.
            Row(
              children: [
                const Icon(
                  Icons.how_to_vote_outlined,
                  color: AppColors.likudBlue,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'your_polling_station'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: context.colors.textPrimary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: context.colors.border, height: 1),
            const SizedBox(height: 12),

            // Station name.
            _buildInfoRow(
              context,
              icon: Icons.place_outlined,
              label: station.name,
              isBold: true,
            ),
            const SizedBox(height: 10),

            // Address.
            _buildInfoRow(
              context,
              icon: Icons.location_on_outlined,
              label: station.address,
            ),

            // District.
            if (district != null && district!.isNotEmpty) ...[
              const SizedBox(height: 10),
              _buildInfoRow(
                context,
                icon: Icons.map_outlined,
                label: '${'membership_district'.tr()}: $district',
              ),
            ],

            // Opening hours.
            if (station.openingHours != null &&
                station.openingHours!.isNotEmpty) ...[
              const SizedBox(height: 10),
              _buildInfoRow(
                context,
                icon: Icons.access_time_outlined,
                label: '${'opening_hours'.tr()}: ${station.openingHours}',
              ),
            ],

            const SizedBox(height: 16),

            // Navigate button.
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton.icon(
                onPressed: () => _navigateToStation(context),
                icon: const Icon(Icons.navigation_outlined, size: 20),
                label: Text(
                  'navigate_with_waze'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.likudBlue,
                  side: const BorderSide(color: AppColors.likudBlue),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    bool isBold = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: context.colors.textSecondary, size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: isBold ? 15 : 13,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
              color: isBold
                  ? context.colors.textPrimary
                  : context.colors.textSecondary,
            ),
            textDirection: TextDirection.rtl,
          ),
        ),
      ],
    );
  }

  /// Attempts to navigate using Waze, falling back to Google Maps.
  Future<void> _navigateToStation(BuildContext context) async {
    final lat = station.latitude;
    final lng = station.longitude;

    if (lat == null || lng == null) {
      // Fall back to opening a search for the address.
      final addressEncoded = Uri.encodeComponent(station.address);
      final googleMapsUri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$addressEncoded',
      );
      if (await canLaunchUrl(googleMapsUri)) {
        await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
      }
      return;
    }

    // Try Waze first.
    final wazeUri = Uri.parse(
      'https://waze.com/ul?ll=$lat,$lng&navigate=yes',
    );

    if (await canLaunchUrl(wazeUri)) {
      await launchUrl(wazeUri, mode: LaunchMode.externalApplication);
      return;
    }

    // Fallback to Google Maps.
    final googleMapsUri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
    );
    if (await canLaunchUrl(googleMapsUri)) {
      await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
    }
  }
}
