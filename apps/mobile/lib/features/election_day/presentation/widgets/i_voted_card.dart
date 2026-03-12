import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../app/theme/app_colors.dart';

/// Branded shareable "I Voted" card for social sharing.
///
/// Renders a 1080x1080 (logical) square card with Likud branding.
/// Uses [RepaintBoundary] + [GlobalKey] to capture the card as a PNG image
/// and share it via the system share sheet.
class IVotedCard extends StatelessWidget {
  /// The user's display name shown on the card.
  final String displayName;

  /// Called after the share action completes (success or failure).
  final VoidCallback? onShared;

  /// Global key for the RepaintBoundary used to capture the card image.
  final GlobalKey _repaintKey = GlobalKey();

  IVotedCard({
    super.key,
    required this.displayName,
    this.onShared,
  });

  /// Captures the card widget as a PNG image.
  Future<Uint8List?> captureAsImage() async {
    try {
      final boundary = _repaintKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;
      if (boundary == null) return null;

      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }

  Future<void> _shareCard() async {
    final imageBytes = await captureAsImage();
    if (imageBytes == null) return;

    await Share.shareXFiles(
      [
        XFile.fromData(
          imageBytes,
          name: 'i_voted.png',
          mimeType: 'image/png',
        ),
      ],
      text: 'i_voted.title'.tr(),
    );

    onShared?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Capturable card area.
        RepaintBoundary(
          key: _repaintKey,
          child: _buildCard(),
        ),

        const SizedBox(height: 16),

        // Share button.
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: _shareCard,
            icon: const Icon(Icons.share, size: 18),
            label: Text('i_voted.share'.tr()),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
              textStyle: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCard() {
    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final dateStr =
        '${now.day.toString().padLeft(2, '0')}.${now.month.toString().padLeft(2, '0')}.${now.year}';

    return AspectRatio(
      aspectRatio: 1.0,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF0099DB),
              Color(0xFF0077B0),
              Color(0xFF1E3A8A),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.likudBlue.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Directionality(
          textDirection: TextDirection.rtl,
          child: Padding(
            padding: const EdgeInsetsDirectional.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),

                // Party logo placeholder.
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.how_to_vote,
                    color: AppColors.white,
                    size: 36,
                  ),
                ),

                const SizedBox(height: 20),

                // Main text.
                const Text(
                  '\u05D4\u05E6\u05D1\u05E2\u05EA\u05D9! \u{1F5F3}\u{FE0F}', // הצבעתי! 🗳️
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 40,
                    fontWeight: FontWeight.w800,
                    color: AppColors.white,
                    height: 1.2,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 12),

                // User name.
                if (displayName.isNotEmpty)
                  Text(
                    displayName,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: AppColors.white.withValues(alpha: 0.9),
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),

                const SizedBox(height: 8),

                // Timestamp.
                Text(
                  '$dateStr  $timeStr',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: AppColors.white.withValues(alpha: 0.7),
                  ),
                ),

                const Spacer(),

                // App branding.
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'app_name'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
