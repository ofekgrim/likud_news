import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';

/// Full-screen image viewer dialog with pinch-to-zoom and pan support.
///
/// Displays the image over a dark overlay with optional credit and caption
/// text at the bottom. The user can close the dialog by tapping the X button
/// or tapping the background outside the image.
class FullImageDialog extends StatelessWidget {
  final String imageUrl;
  final String? credit;
  final String? caption;

  const FullImageDialog({
    super.key,
    required this.imageUrl,
    this.credit,
    this.caption,
  });

  /// Shows the full-screen image viewer dialog.
  static void show(
    BuildContext context, {
    required String imageUrl,
    String? credit,
    String? caption,
  }) {
    showDialog(
      context: context,
      barrierColor: Colors.transparent,
      useSafeArea: false,
      builder: (_) => FullImageDialog(
        imageUrl: imageUrl,
        credit: credit,
        caption: caption,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: GestureDetector(
        onTap: () => Navigator.of(context).pop(),
        child: Container(
          color: AppColors.black.withValues(alpha: 0.95),
          child: SafeArea(
            child: Stack(
              children: [
                // Zoomable image
                Center(
                  child: GestureDetector(
                    // Prevent background tap from closing when tapping image
                    onTap: () {},
                    child: InteractiveViewer(
                      minScale: 0.5,
                      maxScale: 4.0,
                      child: AppCachedImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.contain,
                        width: double.infinity,
                      ),
                    ),
                  ),
                ),

                // Close button — top right
                Positioned(
                  top: 16,
                  right: 16,
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.black.withValues(alpha: 0.5),
                      ),
                      child: const Icon(
                        Icons.close,
                        color: AppColors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ),

                // Credit and caption — bottom left
                if (credit != null || caption != null)
                  Positioned(
                    bottom: 24,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (credit != null)
                            Text(
                              credit!,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 12,
                                color: AppColors.white,
                                height: 1.4,
                              ),
                            ),
                          if (credit != null && caption != null)
                            const SizedBox(height: 4),
                          if (caption != null)
                            Text(
                              caption!,
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 13,
                                color: AppColors.white.withValues(alpha: 0.85),
                                height: 1.4,
                              ),
                            ),
                        ],
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
