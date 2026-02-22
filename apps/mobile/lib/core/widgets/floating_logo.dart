import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../app/theme/app_colors.dart';

/// Floating "מצודת הליכוד" logo badge with fortress icon.
///
/// Pill-shaped gradient badge displayed in the app bar center.
/// Contains the fortress+menorah SVG icon and two-line Hebrew text.
class FloatingLogo extends StatelessWidget {
  final double height;

  const FloatingLogo({super.key, this.height = 44});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsetsDirectional.only(
        start: 10,
        end: 16,
        top: 4,
        bottom: 4,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF00C4F5),
            Color(0xFF0068A0),
          ],
        ),
        borderRadius: BorderRadius.circular(height / 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF003050).withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Fortress + menorah icon.
          SvgPicture.asset(
            'assets/images/fortress_icon.svg',
            height: height * 0.72,
          ),
          const SizedBox(width: 8),
          // Two-line Hebrew text.
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'מצודת',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: height * 0.26,
                  fontWeight: FontWeight.w700,
                  color: AppColors.white,
                  height: 1.15,
                ),
              ),
              Text(
                'הליכוד',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: height * 0.32,
                  fontWeight: FontWeight.w900,
                  color: AppColors.white,
                  letterSpacing: 0.5,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
