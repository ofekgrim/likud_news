import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/app.dart';
import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';

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
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      showNotificationBell: false,
      body: ListView(
        padding: EdgeInsets.only(
          top: 8,
          bottom: AppRouter.bottomNavClearance(context),
        ),
        children: [
          // User greeting
          _buildGreeting(context),
          const SizedBox(height: 8),
          Divider(height: 1, color: context.colors.border),

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
            icon: Icons.edit_note,
            title: 'authors_title'.tr(),
            route: '/authors',
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

          Divider(height: 1, color: context.colors.border),

          // Elections section header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
            child: Text(
              'primaries_title'.tr(),
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.likudBlue,
              ),
            ),
          ),
          _buildNavTile(
            context,
            icon: Icons.how_to_vote_outlined,
            title: 'candidates_title'.tr(),
            route: '/primaries',
          ),
          _buildNavTile(
            context,
            icon: Icons.quiz_outlined,
            title: 'quiz_title'.tr(),
            route: '/primaries/quiz',
          ),
          _buildNavTile(
            context,
            icon: Icons.ballot_outlined,
            title: 'election_day_title'.tr(),
            route: '/election-day/active',
          ),
          _buildNavTile(
            context,
            icon: Icons.poll_outlined,
            title: 'polls_title'.tr(),
            route: '/polls',
          ),
          _buildNavTile(
            context,
            icon: Icons.event_outlined,
            title: 'events_title'.tr(),
            route: '/events',
          ),
          _buildNavTile(
            context,
            icon: Icons.card_membership_outlined,
            title: 'membership_title'.tr(),
            route: '/membership',
          ),
          _buildNavTile(
            context,
            icon: Icons.emoji_events_outlined,
            title: 'gamification_title'.tr(),
            route: '/gamification',
          ),

          Divider(height: 1, color: context.colors.border),
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
          Divider(height: 1, color: context.colors.border),
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
  ///
  /// Shows login/register button when unauthenticated, or user profile
  /// info with link to profile page when authenticated.
  Widget _buildGreeting(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthAuthenticated) {
          return _buildAuthenticatedGreeting(context, state.user);
        }
        return _buildGuestGreeting(context);
      },
    );
  }

  Widget _buildGuestGreeting(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: context.colors.likudAccentBg,
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
                    color: context.colors.textPrimary,
                  ),
                ),
                Text(
                  'welcome'.tr(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: context.colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          FilledButton(
            onPressed: () => context.push('/login'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.likudBlue,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              'auth_login_register'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuthenticatedGreeting(BuildContext context, AppUser user) {
    final displayName = user.displayName ?? 'greeting'.tr();
    final initials = displayName.isNotEmpty ? displayName[0] : '?';

    return InkWell(
      onTap: () => context.push('/profile'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.likudBlue,
              backgroundImage: user.avatarUrl != null
                  ? NetworkImage(user.avatarUrl!)
                  : null,
              child: user.avatarUrl == null
                  ? Text(
                      initials,
                      style: const TextStyle(
                        color: AppColors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: context.colors.textPrimary,
                    ),
                  ),
                  if (user.role != AppUserRole.guest)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: user.isVerifiedMember
                            ? AppColors.success.withValues(alpha: 0.12)
                            : context.colors.likudAccentBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        user.isVerifiedMember
                            ? 'profile_role_verified'.tr()
                            : 'profile_role_member'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: user.isVerifiedMember
                              ? AppColors.success
                              : AppColors.likudBlue,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Text(
              'my_profile'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: AppColors.likudBlue,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.chevron_right,
              color: AppColors.likudBlue,
              size: 20,
            ),
          ],
        ),
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
          color: context.colors.textPrimary,
        ),
      ),
      trailing: Icon(Icons.chevron_right, color: context.colors.textTertiary),
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
              color: context.colors.textSecondary,
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
  ///
  /// In debug mode, long-press opens the in-app log viewer.
  Widget _buildVersionInfo(BuildContext context) {
    return GestureDetector(
      onLongPress: kDebugMode ? () => MetzudatApp.showLogViewer(context) : null,
      child: Center(
        child: Column(
          children: [
            Text(
              'app_name'.tr(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: context.colors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'version'.tr(),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: context.colors.textTertiary),
            ),
            if (kDebugMode) ...[
              const SizedBox(height: 4),
              Text(
                '(Long-press for logs)',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: context.colors.textTertiary,
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
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
            color: context.colors.likudAccentBg,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Icon(icon, color: AppColors.likudBlue, size: 22),
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
