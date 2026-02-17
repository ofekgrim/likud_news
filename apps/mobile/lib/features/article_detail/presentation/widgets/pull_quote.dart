import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// A decorative pull quote block used to highlight short, impactful
/// quotations within an article.
///
/// Renders a centered Hebrew quotation mark, the quote text in italic,
/// and a thin blue decorative line underneath, all on a light surface
/// background.
class PullQuote extends StatelessWidget {
  /// Plain text content of the quote (HTML tags should be stripped).
  final String text;

  const PullQuote({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    if (text.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsetsDirectional.symmetric(
          vertical: 32,
          horizontal: 24,
        ),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Opening Hebrew quotation mark
            const Text(
              '\u05F4', // ״ — Hebrew punctuation gershayim
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 48,
                fontWeight: FontWeight.w800,
                color: AppColors.likudBlue,
                height: 1,
              ),
            ),
            const SizedBox(height: 8),

            // Quote text
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 20,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 12),

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
