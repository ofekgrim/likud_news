import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/content_block.dart';

/// Enhanced quote widget that renders a [QuoteBlock] with RTL-first styling.
///
/// Features a right-side blue border (for RTL), decorative Hebrew gershayim
/// quote mark, the quote text in italic Heebo, optional attribution line,
/// and a short decorative blue line at the bottom. Built on the same design
/// language as the original [PullQuote] but with full [QuoteBlock] support
/// including attribution.
class QuoteWidget extends StatelessWidget {
  /// The quote content block to render.
  final QuoteBlock block;

  /// Optional font scale multiplier for responsive text sizing.
  final double fontScale;

  const QuoteWidget({
    super.key,
    required this.block,
    this.fontScale = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    if (block.text.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsetsDirectional.only(
          start: 20,
          end: 24,
          top: 28,
          bottom: 28,
        ),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(8),
          border: BorderDirectional(
            start: BorderSide(
              color: AppColors.likudBlue,
              width: 4,
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Decorative Hebrew gershayim quote mark
            Text(
              '\u05F4', // ״
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 48 * fontScale,
                fontWeight: FontWeight.w800,
                color: AppColors.likudBlue,
                height: 1,
              ),
            ),
            const SizedBox(height: 8),

            // Quote text
            Text(
              block.text,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 20 * fontScale,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
                height: 1.6,
              ),
            ),

            // Attribution
            if (block.attribution != null &&
                block.attribution!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                '\u2014 ${block.attribution}', // — attribution
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 15 * fontScale,
                  fontWeight: FontWeight.w400,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Decorative blue line
            Container(
              width: 60,
              height: 3,
              decoration: BoxDecoration(
                color: AppColors.likudBlue,
                borderRadius: BorderRadius.circular(1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
