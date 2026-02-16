import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import 'floating_logo.dart';

/// RTL-aware scaffold with optional floating Likud logo.
///
/// Provides the standard app shell: app bar with logo,
/// notification bell, and consistent styling.
class RtlScaffold extends StatelessWidget {
  final Widget body;
  final bool showLogo;
  final bool showNotificationBell;
  final VoidCallback? onNotificationTap;
  final Widget? floatingActionButton;
  final PreferredSizeWidget? appBar;

  const RtlScaffold({
    super.key,
    required this.body,
    this.showLogo = true,
    this.showNotificationBell = true,
    this.onNotificationTap,
    this.floatingActionButton,
    this.appBar,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar ??
          AppBar(
            centerTitle: true,
            title: showLogo ? const FloatingLogo() : null,
            actions: [
              if (showNotificationBell)
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: onNotificationTap,
                  color: AppColors.textPrimary,
                ),
            ],
          ),
      body: body,
      floatingActionButton: floatingActionButton,
    );
  }
}
