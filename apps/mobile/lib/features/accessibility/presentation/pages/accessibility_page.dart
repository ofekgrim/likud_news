import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/rtl_scaffold.dart';

/// Static accessibility statement page.
///
/// Displays a standard Hebrew accessibility statement including
/// font size, contrast information, and contact details for
/// accessibility issues.
class AccessibilityPage extends StatelessWidget {
  const AccessibilityPage({super.key});

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'accessibility_title'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header icon
            const Icon(
              Icons.accessibility_new,
              size: 48,
              color: AppColors.likudBlue,
            ),
            const SizedBox(height: 16),

            _buildSection(
              context,
              title: 'accessibility_intro_title'.tr(),
              content: 'accessibility_intro_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'accessibility_features_title'.tr(),
              content:
                  '${'accessibility_feature_1'.tr()}\n'
                  '${'accessibility_feature_2'.tr()}\n'
                  '${'accessibility_feature_3'.tr()}\n'
                  '${'accessibility_feature_4'.tr()}\n'
                  '${'accessibility_feature_5'.tr()}',
            ),

            _buildSection(
              context,
              title: 'accessibility_standards_title'.tr(),
              content: 'accessibility_standards_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'accessibility_updated_title'.tr(),
              content: 'accessibility_updated_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'accessibility_contact_title'.tr(),
              content: 'accessibility_contact_text'.tr(),
            ),

            const SizedBox(height: 16),

            // Last updated
            Center(
              child: Text(
                'accessibility_updated_text'.tr(),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  /// Builds a styled section with title and content.
  Widget _buildSection(
    BuildContext context, {
    required String title,
    required String content,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.likudBlue,
                  ),
              textDirection: TextDirection.rtl,
            ),
            const SizedBox(height: 12),
            Text(
              content,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary,
                    height: 1.6,
                  ),
              textDirection: TextDirection.rtl,
            ),
          ],
        ),
      ),
    );
  }
}
