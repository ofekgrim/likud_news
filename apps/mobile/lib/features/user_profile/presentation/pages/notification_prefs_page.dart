import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../bloc/user_profile_bloc.dart';

/// Notification preferences page.
///
/// Displays toggle switches for different notification categories.
/// Changes are persisted by dispatching [UpdateProfileEvent] with the
/// updated [notificationPrefs] map.
class NotificationPrefsPage extends StatefulWidget {
  const NotificationPrefsPage({super.key});

  @override
  State<NotificationPrefsPage> createState() => _NotificationPrefsPageState();
}

class _NotificationPrefsPageState extends State<NotificationPrefsPage> {
  late Map<String, bool> _prefs;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    context.read<UserProfileBloc>().add(const LoadProfile());
  }

  /// Default notification preference keys and their initial values.
  static const Map<String, bool> _defaults = {
    'breaking_news': true,
    'article_updates': true,
    'membership_updates': true,
    'campaign_events': false,
  };

  void _initFromState(UserProfileState state) {
    if (_initialized) return;

    AppUser? user;
    if (state is UserProfileLoaded) {
      user = state.user;
    } else if (state is UserProfileUpdated) {
      user = state.user;
    }

    if (user != null) {
      _prefs = Map<String, bool>.from(_defaults);
      for (final key in _defaults.keys) {
        if (user.notificationPrefs.containsKey(key)) {
          _prefs[key] = user.notificationPrefs[key] as bool? ?? _defaults[key]!;
        }
      }
      _initialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.colors.surfaceVariant,
        appBar: AppBar(
          backgroundColor: AppColors.likudBlue,
          title: Text(
            'profile_notification_prefs'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.white,
            ),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
        ),
        body: BlocConsumer<UserProfileBloc, UserProfileState>(
          listener: (context, state) {
            if (state is UserProfileUpdated) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'profile_prefs_saved'.tr(),
                    style: const TextStyle(fontFamily: 'Heebo'),
                  ),
                  backgroundColor: AppColors.success,
                ),
              );
            } else if (state is UserProfileError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    state.message,
                    style: const TextStyle(fontFamily: 'Heebo'),
                  ),
                  backgroundColor: AppColors.breakingRed,
                ),
              );
            }
          },
          builder: (context, state) {
            _initFromState(state);

            if (!_initialized) {
              return const Center(
                child: CircularProgressIndicator(
                  color: AppColors.likudBlue,
                ),
              );
            }

            final isUpdating = state is UserProfileUpdating;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Description text.
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    'profile_notification_desc'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      color: context.colors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ),

                // Notification toggles.
                _buildToggleCard(
                  icon: Icons.flash_on,
                  iconColor: AppColors.breakingRed,
                  title: 'notif_breaking_news'.tr(),
                  subtitle: 'notif_breaking_news_desc'.tr(),
                  prefKey: 'breaking_news',
                  enabled: !isUpdating,
                ),
                const SizedBox(height: 8),
                _buildToggleCard(
                  icon: Icons.article_outlined,
                  iconColor: AppColors.likudBlue,
                  title: 'notif_article_updates'.tr(),
                  subtitle: 'notif_article_updates_desc'.tr(),
                  prefKey: 'article_updates',
                  enabled: !isUpdating,
                ),
                const SizedBox(height: 8),
                _buildToggleCard(
                  icon: Icons.card_membership,
                  iconColor: AppColors.success,
                  title: 'notif_membership_updates'.tr(),
                  subtitle: 'notif_membership_updates_desc'.tr(),
                  prefKey: 'membership_updates',
                  enabled: !isUpdating,
                ),
                const SizedBox(height: 8),
                _buildToggleCard(
                  icon: Icons.campaign_outlined,
                  iconColor: AppColors.warning,
                  title: 'notif_campaign_events'.tr(),
                  subtitle: 'notif_campaign_events_desc'.tr(),
                  prefKey: 'campaign_events',
                  enabled: !isUpdating,
                ),

                const SizedBox(height: 24),

                // Save button.
                SizedBox(
                  height: 48,
                  child: FilledButton(
                    onPressed: isUpdating ? null : _onSave,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.likudBlue,
                      disabledBackgroundColor:
                          AppColors.likudBlue.withValues(alpha: 0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: isUpdating
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: AppColors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Text(
                            'profile_save'.tr(),
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.white,
                            ),
                          ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildToggleCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String prefKey,
    required bool enabled,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.border, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: context.colors.shadow,
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SwitchListTile(
        value: _prefs[prefKey] ?? false,
        onChanged: enabled
            ? (value) {
                setState(() {
                  _prefs[prefKey] = value;
                });
              }
            : null,
        activeThumbColor: AppColors.likudBlue,
        secondary: Icon(icon, color: iconColor, size: 24),
        title: Text(
          title,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: context.colors.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 12,
            color: context.colors.textSecondary,
            height: 1.3,
          ),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        contentPadding: const EdgeInsetsDirectional.fromSTEB(16, 4, 8, 4),
      ),
    );
  }

  void _onSave() {
    final notificationPrefs = <String, dynamic>{};
    for (final entry in _prefs.entries) {
      notificationPrefs[entry.key] = entry.value;
    }

    context.read<UserProfileBloc>().add(
          UpdateProfileEvent(notificationPrefs: notificationPrefs),
        );
  }
}
