import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/rtl_scaffold.dart';

/// Privacy policy page.
///
/// Displays the standard privacy policy in Hebrew, including
/// data collection information and user rights.
class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'privacy_title'.tr(),
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
              Icons.privacy_tip_outlined,
              size: 48,
              color: AppColors.likudBlue,
            ),
            const SizedBox(height: 16),

            _buildSection(
              context,
              title: 'privacy_intro_title'.tr(),
              content: 'privacy_intro_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'privacy_collection_title'.tr(),
              content:
                  '${'privacy_collection_item_1'.tr()}\n'
                  '${'privacy_collection_item_2'.tr()}\n'
                  '${'privacy_collection_item_3'.tr()}',
            ),

            _buildSection(
              context,
              title: 'privacy_usage_title'.tr(),
              content: 'privacy_usage_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'privacy_sharing_title'.tr(),
              content: 'privacy_sharing_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'privacy_security_title'.tr(),
              content: 'privacy_security_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'privacy_updated_title'.tr(),
              content: 'privacy_updated_text'.tr(),
            ),

            _buildSection(
              context,
              title: 'privacy_contact_title'.tr(),
              content: 'privacy_contact_text'.tr(),
            ),

            const SizedBox(height: 16),

            // Last updated
            Center(
              child: Text(
                'privacy_updated_text'.tr(),
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
