import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/rtl_scaffold.dart';

/// Full navigation menu page ("More" / hamburger menu).
///
/// Provides navigation to all app sections, social media links,
/// and app version info.
class MorePage extends StatelessWidget {
  const MorePage({super.key});

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'more_title'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      showNotificationBell: false,
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          // User greeting
          _buildGreeting(context),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.border),

          // Navigation tiles
          _buildNavTile(
            context,
            icon: Icons.category_outlined,
            title: 'categories'.tr(),
            route: '/categories',
          ),
          _buildNavTile(
            context,
            icon: Icons.people_outline,
            title: 'likud_members'.tr(),
            route: '/members',
          ),
          _buildNavTile(
            context,
            icon: Icons.favorite_outline,
            title: 'favorites'.tr(),
            route: '/favorites',
          ),
          _buildNavTile(
            context,
            icon: Icons.search,
            title: 'search'.tr(),
            route: '/search',
          ),

          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 8),

          _buildNavTile(
            context,
            icon: Icons.settings_outlined,
            title: 'settings'.tr(),
            route: '/settings',
          ),
          _buildNavTile(
            context,
            icon: Icons.mail_outline,
            title: 'contact_us'.tr(),
            route: '/contact',
          ),
          _buildNavTile(
            context,
            icon: Icons.info_outline,
            title: 'about'.tr(),
            route: '/about',
          ),
          _buildNavTile(
            context,
            icon: Icons.accessibility_new,
            title: 'accessibility'.tr(),
            route: '/accessibility',
          ),
          _buildNavTile(
            context,
            icon: Icons.privacy_tip_outlined,
            title: 'privacy_title'.tr(),
            route: '/privacy',
          ),

          const SizedBox(height: 16),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 16),

          // Social media row
          _buildSocialMediaRow(context),

          const SizedBox(height: 24),

          // App version
          _buildVersionInfo(context),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  /// User greeting section at the top.
  Widget _buildGreeting(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.likudLightBlue,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.person_outline,
              color: AppColors.likudBlue,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'greeting'.tr(),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                ),
                Text(
                  'welcome'.tr(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Navigation list tile.
  Widget _buildNavTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String route,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      leading: Icon(icon, color: AppColors.likudBlue),
      title: Text(
        title,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
      ),
      trailing: const Icon(
        Icons.chevron_left,
        color: AppColors.textTertiary,
      ),
      onTap: () => context.push(route),
    );
  }

  /// Social media links row.
  Widget _buildSocialMediaRow(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Text(
            'follow_us'.tr(),
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _SocialButton(
                icon: Icons.facebook,
                label: 'Facebook',
                url: 'https://www.facebook.com/Likud',
              ),
              const SizedBox(width: 16),
              _SocialButton(
                icon: Icons.close, // X (Twitter) icon
                label: 'X',
                url: 'https://twitter.com/Likud_Party',
              ),
              const SizedBox(width: 16),
              _SocialButton(
                icon: Icons.camera_alt_outlined,
                label: 'Instagram',
                url: 'https://www.instagram.com/likud_party',
              ),
              const SizedBox(width: 16),
              _SocialButton(
                icon: Icons.play_circle_outline,
                label: 'YouTube',
                url: 'https://www.youtube.com/likud',
              ),
              const SizedBox(width: 16),
              _SocialButton(
                icon: Icons.send,
                label: 'Telegram',
                url: 'https://t.me/likud_party',
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// App version info at the bottom.
  Widget _buildVersionInfo(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Text(
            'app_name'.tr(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'version'.tr(),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textTertiary,
                ),
          ),
        ],
      ),
    );
  }
}

/// A circular social media button that opens a URL.
class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String url;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.url,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: InkWell(
        onTap: () => _openUrl(),
        borderRadius: BorderRadius.circular(24),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.likudLightBlue,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Icon(
            icon,
            color: AppColors.likudBlue,
            size: 22,
          ),
        ),
      ),
    );
  }

  Future<void> _openUrl() async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
