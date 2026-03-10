import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/floating_logo.dart';
import '../../../../core/widgets/rtl_scaffold.dart';

/// Static about page for the application.
///
/// Displays the app logo, title, description, version info,
/// and developer credit.
class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'about'.tr(),
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 32),

            // App logo
            const FloatingLogo(height: 56),
            const SizedBox(height: 24),

            // App title
            Text(
              'app_name'.tr(),
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: context.colors.textPrimary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),

            Text(
              'about_subtitle'.tr(),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: context.colors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // Description
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.colors.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.colors.border),
              ),
              child: Text(
                'about_description'.tr(),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: context.colors.textPrimary,
                      height: 1.7,
                    ),
                textAlign: TextAlign.right,
                textDirection: TextDirection.rtl,
              ),
            ),
            const SizedBox(height: 32),

            // Version info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.likudAccentBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        color: AppColors.likudBlue,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'version'.tr(),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.likudBlue,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'build'.tr(),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.likudBlue,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Developer credit
            Text(
              'developed_by'.tr(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: context.colors.textTertiary,
                    fontWeight: FontWeight.w500,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'copyright'.tr(args: [DateTime.now().year.toString()]),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: context.colors.textTertiary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
