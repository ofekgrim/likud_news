import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

/// Floating "מצודת הליכוד" logo overlay.
///
/// Positioned at top-center of screens per the Israel Hayom-style design.
class FloatingLogo extends StatelessWidget {
  final double height;

  const FloatingLogo({super.key, this.height = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.likudBlue,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.15),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: const Text(
        'מצודת הליכוד',
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.white,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
