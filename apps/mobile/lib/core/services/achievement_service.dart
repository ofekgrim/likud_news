import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../widgets/achievement_popup.dart';

/// Centralized service for showing achievement popups.
/// Call methods from BLoCs or pages when gamification events occur.
class AchievementService {
  static final AchievementService _instance = AchievementService._();
  factory AchievementService() => _instance;
  AchievementService._();

  GlobalKey<NavigatorState>? _navigatorKey;

  void init(GlobalKey<NavigatorState> navigatorKey) {
    _navigatorKey = navigatorKey;
  }

  BuildContext? get _context => _navigatorKey?.currentContext;

  void showBadgeEarned(String badgeName) {
    final ctx = _context;
    if (ctx == null) return;
    AchievementPopup.show(
      ctx,
      title: 'badge_earned'.tr(),
      description: badgeName,
      icon: Icons.military_tech,
    );
  }

  void showStreakMilestone(int days) {
    final ctx = _context;
    if (ctx == null) return;
    AchievementPopup.show(
      ctx,
      title: 'streak_milestone'.tr(),
      description: '$days 🔥',
      icon: Icons.local_fire_department,
      iconColor: Colors.deepOrange,
    );
  }

  void showTierPromotion(String tierName) {
    final ctx = _context;
    if (ctx == null) return;
    AchievementPopup.show(
      ctx,
      title: 'tier_promotion'.tr(),
      description: tierName,
      icon: Icons.arrow_upward,
      iconColor: Colors.greenAccent,
    );
  }
}
