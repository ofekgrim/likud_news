import 'dart:async';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../bloc/user_profile_bloc.dart';

/// Notification preferences page with granular category toggles
/// and quiet hours time pickers.
///
/// Changes are debounced and saved automatically via
/// [UpdateProfileEvent] dispatched to the [UserProfileBloc].
class NotificationPrefsPage extends StatefulWidget {
  const NotificationPrefsPage({super.key});

  @override
  State<NotificationPrefsPage> createState() => _NotificationPrefsPageState();
}

class _NotificationPrefsPageState extends State<NotificationPrefsPage> {
  bool _initialized = false;

  // Granular notification toggles
  bool _notifBreakingNews = true;
  bool _notifPrimariesUpdates = true;
  bool _notifDailyQuizReminder = true;
  bool _notifStreakAchievements = true;
  bool _notifEvents = true;
  bool _notifGotv = true;
  bool _notifAmaSessions = false;

  // Quiet hours
  String? _quietHoursStart;
  String? _quietHoursEnd;

  // GOTV snooze state (local only — 24h snooze)
  DateTime? _gotvSnoozedUntil;

  // Debounce timer for auto-save
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    context.read<UserProfileBloc>().add(const LoadProfile());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _initFromState(UserProfileState state) {
    if (_initialized) return;

    AppUser? user;
    if (state is UserProfileLoaded) {
      user = state.user;
    } else if (state is UserProfileUpdated) {
      user = state.user;
    }

    if (user != null) {
      final prefs = user.notificationPrefs;
      _notifBreakingNews = prefs['notifBreakingNews'] as bool? ?? true;
      _notifPrimariesUpdates = prefs['notifPrimariesUpdates'] as bool? ?? true;
      _notifDailyQuizReminder =
          prefs['notifDailyQuizReminder'] as bool? ?? true;
      _notifStreakAchievements =
          prefs['notifStreakAchievements'] as bool? ?? true;
      _notifEvents = prefs['notifEvents'] as bool? ?? true;
      _notifGotv = prefs['notifGotv'] as bool? ?? true;
      _notifAmaSessions = prefs['notifAmaSessions'] as bool? ?? false;
      _quietHoursStart = prefs['quietHoursStart'] as String?;
      _quietHoursEnd = prefs['quietHoursEnd'] as String?;
      _initialized = true;
    }
  }

  void _debouncedSave() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), _onSave);
  }

  void _onSave() {
    final notificationPrefs = <String, dynamic>{
      'notifBreakingNews': _notifBreakingNews,
      'notifPrimariesUpdates': _notifPrimariesUpdates,
      'notifDailyQuizReminder': _notifDailyQuizReminder,
      'notifStreakAchievements': _notifStreakAchievements,
      'notifEvents': _notifEvents,
      'notifGotv': _notifGotv,
      'notifAmaSessions': _notifAmaSessions,
      'quietHoursStart': _quietHoursStart,
      'quietHoursEnd': _quietHoursEnd,
    };

    context.read<UserProfileBloc>().add(
          UpdateProfileEvent(notificationPrefs: notificationPrefs),
        );
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
                  duration: const Duration(seconds: 1),
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
              padding: const EdgeInsetsDirectional.all(16),
              children: [
                // Description text.
                Padding(
                  padding: const EdgeInsetsDirectional.only(bottom: 16),
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

                // ── Breaking News (always ON) ──
                _buildToggleCard(
                  icon: Icons.flash_on,
                  iconColor: AppColors.breakingRed,
                  title: 'notif_breaking_news'.tr(),
                  subtitle: 'notif_breaking_news_desc'.tr(),
                  value: _notifBreakingNews,
                  alwaysOn: true,
                  enabled: false, // cannot be toggled
                  onChanged: null,
                ),
                const SizedBox(height: 8),

                // ── Primaries Updates ──
                _buildToggleCard(
                  icon: Icons.how_to_vote_outlined,
                  iconColor: AppColors.likudBlue,
                  title: 'notif_primaries_updates'.tr(),
                  subtitle: 'notif_primaries_updates_desc'.tr(),
                  value: _notifPrimariesUpdates,
                  enabled: !isUpdating,
                  onChanged: (value) {
                    setState(() => _notifPrimariesUpdates = value);
                    _debouncedSave();
                  },
                ),
                const SizedBox(height: 8),

                // ── Daily Quiz Reminder ──
                _buildToggleCard(
                  icon: Icons.quiz_outlined,
                  iconColor: AppColors.warning,
                  title: 'notif_daily_quiz_reminder'.tr(),
                  subtitle: 'notif_daily_quiz_reminder_desc'.tr(),
                  value: _notifDailyQuizReminder,
                  enabled: !isUpdating,
                  onChanged: (value) {
                    setState(() => _notifDailyQuizReminder = value);
                    _debouncedSave();
                  },
                ),
                const SizedBox(height: 8),

                // ── Streak & Achievements ──
                _buildToggleCard(
                  icon: Icons.emoji_events_outlined,
                  iconColor: Colors.amber,
                  title: 'notif_streak_achievements'.tr(),
                  subtitle: 'notif_streak_achievements_desc'.tr(),
                  value: _notifStreakAchievements,
                  enabled: !isUpdating,
                  onChanged: (value) {
                    setState(() => _notifStreakAchievements = value);
                    _debouncedSave();
                  },
                ),
                const SizedBox(height: 8),

                // ── Events & RSVP ──
                _buildToggleCard(
                  icon: Icons.event_outlined,
                  iconColor: AppColors.success,
                  title: 'notif_events'.tr(),
                  subtitle: 'notif_events_desc'.tr(),
                  value: _notifEvents,
                  enabled: !isUpdating,
                  onChanged: (value) {
                    setState(() => _notifEvents = value);
                    _debouncedSave();
                  },
                ),
                const SizedBox(height: 8),

                // ── GOTV (snooze instead of disable) ──
                _buildGotvCard(isUpdating: isUpdating),
                const SizedBox(height: 8),

                // ── AMA Sessions ──
                _buildToggleCard(
                  icon: Icons.question_answer_outlined,
                  iconColor: Colors.deepPurple,
                  title: 'notif_ama_sessions'.tr(),
                  subtitle: 'notif_ama_sessions_desc'.tr(),
                  value: _notifAmaSessions,
                  enabled: !isUpdating,
                  onChanged: (value) {
                    setState(() => _notifAmaSessions = value);
                    _debouncedSave();
                  },
                ),

                const SizedBox(height: 24),

                // ── Quiet Hours Section ──
                _buildQuietHoursSection(isUpdating: isUpdating),
              ],
            );
          },
        ),
      ),
    );
  }

  // ── Toggle Card ───────────────────────────────────────────────────────

  Widget _buildToggleCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required bool enabled,
    bool alwaysOn = false,
    ValueChanged<bool>? onChanged,
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
        value: alwaysOn ? true : value,
        onChanged: enabled ? onChanged : null,
        activeThumbColor: AppColors.likudBlue,
        inactiveThumbColor: alwaysOn
            ? AppColors.likudBlue.withValues(alpha: 0.6)
            : null,
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

  // ── GOTV Card (snooze, not disable) ───────────────────────────────────

  Widget _buildGotvCard({required bool isUpdating}) {
    final isSnoozed = _gotvSnoozedUntil != null &&
        _gotvSnoozedUntil!.isAfter(DateTime.now());

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
      child: Column(
        children: [
          SwitchListTile(
            value: _notifGotv && !isSnoozed,
            onChanged: null, // cannot be permanently disabled
            activeThumbColor: AppColors.likudBlue,
            inactiveThumbColor: isSnoozed
                ? Colors.orange.withValues(alpha: 0.6)
                : AppColors.likudBlue.withValues(alpha: 0.6),
            secondary:
                const Icon(Icons.how_to_vote, color: AppColors.likudBlue, size: 24),
            title: Text(
              'notif_gotv'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
              ),
            ),
            subtitle: Text(
              isSnoozed
                  ? 'notif_gotv_snoozed'.tr(args: [
                      _formatTime(TimeOfDay.fromDateTime(_gotvSnoozedUntil!)),
                    ])
                  : 'notif_gotv_desc'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 12,
                color: isSnoozed ? Colors.orange : context.colors.textSecondary,
                height: 1.3,
              ),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            contentPadding: const EdgeInsetsDirectional.fromSTEB(16, 4, 8, 4),
          ),
          if (!isSnoozed)
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 12),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: isUpdating ? null : _onSnoozeGotv,
                  icon: const Icon(Icons.snooze, size: 18),
                  label: Text(
                    'notif_gotv_snooze'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.orange,
                    side: const BorderSide(color: Colors.orange, width: 1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _onSnoozeGotv() {
    setState(() {
      _gotvSnoozedUntil = DateTime.now().add(const Duration(hours: 24));
    });
  }

  // ── Quiet Hours Section ───────────────────────────────────────────────

  Widget _buildQuietHoursSection({required bool isUpdating}) {
    final hasQuietHours =
        _quietHoursStart != null && _quietHoursEnd != null;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with icon and toggle
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 4),
            child: Row(
              children: [
                Icon(
                  Icons.nights_stay_outlined,
                  color: Colors.indigo.shade300,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'notif_quiet_hours_title'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: context.colors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'notif_quiet_hours_desc'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          color: context.colors.textSecondary,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: hasQuietHours,
                  onChanged: isUpdating
                      ? null
                      : (enabled) {
                          setState(() {
                            if (enabled) {
                              _quietHoursStart = '22:00';
                              _quietHoursEnd = '07:00';
                            } else {
                              _quietHoursStart = null;
                              _quietHoursEnd = null;
                            }
                          });
                          _debouncedSave();
                        },
                  activeThumbColor: AppColors.likudBlue,
                ),
              ],
            ),
          ),

          // Time pickers
          if (hasQuietHours) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: _buildTimePickerTile(
                      label: 'notif_quiet_hours_start'.tr(),
                      value: _quietHoursStart!,
                      enabled: !isUpdating,
                      onTap: () => _pickTime(isStart: true),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(horizontal: 12),
                    child: Icon(
                      Icons.arrow_forward,
                      color: context.colors.textSecondary,
                      size: 20,
                    ),
                  ),
                  Expanded(
                    child: _buildTimePickerTile(
                      label: 'notif_quiet_hours_end'.tr(),
                      value: _quietHoursEnd!,
                      enabled: !isUpdating,
                      onTap: () => _pickTime(isStart: false),
                    ),
                  ),
                ],
              ),
            ),
          ] else
            const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildTimePickerTile({
    required String label,
    required String value,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: context.colors.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: context.colors.border, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 11,
                color: context.colors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 16,
                  color: AppColors.likudBlue,
                ),
                const SizedBox(width: 6),
                Text(
                  value,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: context.colors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickTime({required bool isStart}) async {
    final current = isStart ? _quietHoursStart : _quietHoursEnd;
    final parts = (current ?? '22:00').split(':');
    final initialTime = TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );

    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted = _formatTime(picked);
      setState(() {
        if (isStart) {
          _quietHoursStart = formatted;
        } else {
          _quietHoursEnd = formatted;
        }
      });
      _debouncedSave();
    }
  }

  String _formatTime(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
