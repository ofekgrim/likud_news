import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Renders the opening paragraph of an article with a decorative drop cap.
///
/// The first character is displayed in a large, bold Likud-blue style while
/// the remaining text flows around it using [RichText] with a [WidgetSpan].
/// Designed for RTL Hebrew text.
class DropCapParagraph extends StatelessWidget {
  /// Plain text content (HTML tags should be stripped before passing).
  final String text;

  const DropCapParagraph({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    if (text.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    final firstChar = text.characters.first;
    final remainingText = text.substring(firstChar.length);

    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
      child: RichText(
        textDirection: TextDirection.rtl,
        text: TextSpan(
          children: [
            WidgetSpan(
              alignment: PlaceholderAlignment.top,
              child: Padding(
                padding: const EdgeInsetsDirectional.only(
                  end: 8,
                  bottom: 4,
                ),
                child: Text(
                  firstChar,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 56,
                    fontWeight: FontWeight.w800,
                    color: AppColors.likudBlue,
                    height: 1,
                  ),
                ),
              ),
            ),
            TextSpan(
              text: remainingText,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 18,
                fontWeight: FontWeight.w400,
                height: 1.9,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
