import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../app/theme/app_colors.dart';

/// Branded placeholder for articles without hero images.
/// Shows the fortress icon on a light blue background.
class BrandedPlaceholder extends StatelessWidget {
  final double? width;
  final double? height;
  final double iconSize;

  const BrandedPlaceholder({
    super.key,
    this.width,
    this.height,
    this.iconSize = 48,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: AppColors.likudBlue.withValues(alpha: 0.08),
      child: Center(
        child: SvgPicture.asset(
          'assets/images/fortress_icon.svg',
          width: iconSize,
          height: iconSize,
          colorFilter: ColorFilter.mode(
            AppColors.likudBlue.withValues(alpha: 0.3),
            BlendMode.srcIn,
          ),
        ),
      ),
    );
  }
}
