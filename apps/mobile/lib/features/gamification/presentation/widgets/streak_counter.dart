import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/user_streak.dart';

/// Prominent streak counter widget showing current streak with fire icon.
///
/// Features:
/// - Red glow/pulse animation when [UserStreak.atRisk] is true
/// - Green checkmark overlay when [UserStreak.activityDoneToday] is true
/// - Tapping navigates to the gamification page
class StreakCounter extends StatefulWidget {
  final UserStreak streak;

  /// When true, renders a compact version suitable for the home AppBar.
  final bool compact;

  /// When false, tapping the widget does nothing. Set to false when the
  /// widget is already rendered inside the gamification page to prevent
  /// pushing a duplicate route.
  final bool tappable;

  const StreakCounter({
    super.key,
    required this.streak,
    this.compact = false,
    this.tappable = true,
  });

  @override
  State<StreakCounter> createState() => _StreakCounterState();
}

class _StreakCounterState extends State<StreakCounter>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    if (widget.streak.atRisk) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant StreakCounter oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.streak.atRisk && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!widget.streak.atRisk && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.compact) {
      return _buildCompact(context);
    }
    return _buildFull(context);
  }

  /// Compact version for the home screen — just the number + fire icon.
  Widget _buildCompact(BuildContext context) {
    return GestureDetector(
      onTap: widget.tappable ? () => context.push('/gamification') : null,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: widget.streak.atRisk ? _pulseAnimation.value : 1.0,
            child: child,
          );
        },
        child: Container(
          padding: const EdgeInsetsDirectional.symmetric(
            horizontal: 10,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: widget.streak.atRisk
                ? Colors.red.withValues(alpha: 0.12)
                : Colors.orange.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: widget.streak.atRisk
                  ? Colors.red.withValues(alpha: 0.3)
                  : Colors.orange.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.local_fire_department_rounded,
                color: widget.streak.atRisk ? Colors.red : Colors.deepOrange,
                size: 18,
              ),
              const SizedBox(width: 4),
              Text(
                '${widget.streak.currentStreak}',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: widget.streak.atRisk
                      ? Colors.red
                      : context.colors.textPrimary,
                ),
              ),
              if (widget.streak.activityDoneToday) ...[
                const SizedBox(width: 3),
                const Icon(
                  Icons.check_circle,
                  color: AppColors.success,
                  size: 14,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// Full version for the gamification page.
  Widget _buildFull(BuildContext context) {
    return GestureDetector(
      onTap: widget.tappable ? () => context.push('/gamification') : null,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          final glowColor = widget.streak.atRisk
              ? Colors.red.withValues(alpha: 0.3 * _pulseAnimation.value)
              : Colors.transparent;

          return Container(
            decoration: BoxDecoration(
              color: context.colors.cardSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: widget.streak.atRisk
                    ? Colors.red.withValues(alpha: 0.5)
                    : context.colors.border,
                width: widget.streak.atRisk ? 1.5 : 0.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: widget.streak.atRisk
                      ? glowColor
                      : context.colors.shadow,
                  blurRadius: widget.streak.atRisk ? 16 : 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            child: child,
          );
        },
        child: Row(
          children: [
            // Fire icon container
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: widget.streak.atRisk
                        ? Colors.red.withValues(alpha: 0.12)
                        : Colors.orange.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    Icons.local_fire_department_rounded,
                    color: widget.streak.atRisk
                        ? Colors.red
                        : Colors.deepOrange,
                    size: 30,
                  ),
                ),
                // Green checkmark overlay when activity done today
                if (widget.streak.activityDoneToday)
                  const PositionedDirectional(
                    end: -4,
                    bottom: -4,
                    child: CircleAvatar(
                      radius: 10,
                      backgroundColor: AppColors.success,
                      child: Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 12,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 16),
            // Streak info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'streak_days'.tr(args: ['${widget.streak.currentStreak}']),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: context.colors.textPrimary,
                        ),
                      ),
                      if (widget.streak.atRisk) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsetsDirectional.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'streak_at_risk'.tr(),
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.red,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'gamification_streak_best'.tr(
                      args: ['${widget.streak.longestStreak}'],
                    ),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      color: context.colors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            // Streak number badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: widget.streak.atRisk
                      ? [Colors.red.shade400, Colors.red.shade700]
                      : [Colors.orange.shade400, Colors.deepOrange],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${widget.streak.currentStreak}',
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
