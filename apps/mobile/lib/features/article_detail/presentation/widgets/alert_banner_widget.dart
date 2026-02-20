import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Alert banner displayed above article content for breaking news or alerts.
///
/// Renders a full-width banner with a configurable background color (parsed from
/// a hex string), a warning icon, and bold white text. Only renders when
/// [enabled] is true and [text] is not empty.
class AlertBannerWidget extends StatelessWidget {
  /// The alert message to display.
  final String text;

  /// Optional hex color string (e.g., "#DC2626" or "DC2626").
  /// Defaults to [AppColors.breakingRed] if null or invalid.
  final String? colorHex;

  /// Whether the banner should be visible.
  final bool enabled;

  const AlertBannerWidget({
    super.key,
    required this.text,
    this.colorHex,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled || text.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      color: _parseColor(),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Row(
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              color: AppColors.white,
              size: 18,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Parses [colorHex] into a [Color]. Falls back to [AppColors.breakingRed].
  Color _parseColor() {
    if (colorHex != null && colorHex!.isNotEmpty) {
      try {
        final hex = colorHex!.replaceFirst('#', '');
        return Color(int.parse('FF$hex', radix: 16));
      } catch (_) {
        // Fall through to default.
      }
    }
    return AppColors.breakingRed;
  }
}
