import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/rtl_scaffold.dart';

/// Israeli-compliant accessibility statement page.
///
/// References IS 5568, חוק שוויון זכויות לאנשים עם מוגבלויות,
/// and תקנות נגישות השירות (התשע"ג-2013, סעיף 35).
class AccessibilityPage extends StatelessWidget {
  const AccessibilityPage({super.key});

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'accessibility_title'.tr(),
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header icon
            const Icon(
              Icons.accessibility_new,
              size: 48,
              color: AppColors.likudBlue,
            ),
            const SizedBox(height: 16),

            // 1. Commitment intro
            _buildSection(
              context,
              title: 'accessibility_intro_title'.tr(),
              content: 'accessibility_intro_text'.tr(),
            ),

            // 2. Legal framework
            _buildSection(
              context,
              title: 'accessibility_legal_title'.tr(),
              content: 'accessibility_legal_text'.tr(),
            ),

            // 3. Accommodations list (8 items)
            _buildBulletSection(
              context,
              title: 'accessibility_features_title'.tr(),
              items: [
                'accessibility_feature_1'.tr(),
                'accessibility_feature_2'.tr(),
                'accessibility_feature_3'.tr(),
                'accessibility_feature_4'.tr(),
                'accessibility_feature_5'.tr(),
                'accessibility_feature_6'.tr(),
                'accessibility_feature_7'.tr(),
                'accessibility_feature_8'.tr(),
              ],
            ),

            // 4. Accessibility coordinator
            _buildSection(
              context,
              title: 'accessibility_coordinator_title'.tr(),
              content: 'accessibility_coordinator_text'.tr(),
              icon: Icons.contact_phone,
            ),

            // 5. Report issues
            _buildSection(
              context,
              title: 'accessibility_report_title'.tr(),
              content: 'accessibility_report_text'.tr(),
              icon: Icons.report_outlined,
            ),

            // 6. Response timeline
            _buildSection(
              context,
              title: 'accessibility_response_title'.tr(),
              content: 'accessibility_response_text'.tr(),
            ),

            // 7. Last audit
            _buildSection(
              context,
              title: 'accessibility_audit_title'.tr(),
              content: 'accessibility_audit_text'.tr(),
            ),

            // 8. Known limitations
            _buildSection(
              context,
              title: 'accessibility_known_issues_title'.tr(),
              content: 'accessibility_known_issues_text'.tr(),
            ),

            // 9. Complaint escalation
            _buildSection(
              context,
              title: 'accessibility_complaint_title'.tr(),
              content: 'accessibility_complaint_text'.tr(),
              icon: Icons.gavel,
            ),

            // 10. Last updated footer
            const SizedBox(height: 8),
            Center(
              child: Text(
                'accessibility_updated_text'.tr(),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: context.colors.textTertiary,
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required String content,
    IconData? icon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.colors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              textDirection: TextDirection.rtl,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 20, color: AppColors.likudBlue),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.likudBlue,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              content,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: context.colors.textPrimary,
                height: 1.6,
              ),
              textDirection: TextDirection.rtl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletSection(
    BuildContext context, {
    required String title,
    required List<String> items,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.colors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.colors.border),
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
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  textDirection: TextDirection.rtl,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsetsDirectional.only(top: 6),
                      child: Icon(
                        Icons.check_circle,
                        size: 16,
                        color: AppColors.likudBlue,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item,
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: context.colors.textPrimary,
                          height: 1.5,
                        ),
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
