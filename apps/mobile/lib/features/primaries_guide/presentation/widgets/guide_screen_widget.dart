import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/guide_screen.dart';

/// Renders a single guide screen with icon, title, and description.
class GuideScreenWidget extends StatelessWidget {
  final GuideScreen screen;

  const GuideScreenWidget({
    super.key,
    required this.screen,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(24, 24, 24, 0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon container
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: screen.backgroundColor,
              shape: BoxShape.circle,
            ),
            child: Icon(
              screen.icon,
              size: 56,
              color: AppColors.likudBlue,
            ),
          ),
          const SizedBox(height: 32),

          // Title
          Text(
            screen.titleKey.tr(),
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),

          // Description
          Text(
            screen.descriptionKey.tr(),
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w400,
              height: 1.6,
              color: context.colors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
