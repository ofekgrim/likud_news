import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import '../../app/router.dart';
import '../../app/theme/app_colors.dart';
import '../services/notification_count_service.dart';
import 'floating_logo.dart';

/// RTL-aware scaffold with optional floating Likud logo.
///
/// Provides the standard app shell: app bar with logo,
/// notification bell, and consistent styling.
class RtlScaffold extends StatelessWidget {
  final Widget body;
  final bool showLogo;
  final bool showNotificationBell;
  final bool showDrawerIcon;
  final VoidCallback? onNotificationTap;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final PreferredSizeWidget? appBar;

  const RtlScaffold({
    super.key,
    required this.body,
    this.showLogo = true,
    this.showNotificationBell = true,
    this.showDrawerIcon = false,
    this.onNotificationTap,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.appBar,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar ??
          AppBar(
            centerTitle: true,
            leading: showDrawerIcon
                ? IconButton(
                    icon: const Icon(Icons.menu),
                    onPressed: () =>
                        AppRouter.scaffoldKey.currentState?.openDrawer(),
                    color: AppColors.textPrimary,
                  )
                : null,
            title: showLogo ? const FloatingLogo() : null,
            actions: [
              if (showNotificationBell)
                ValueListenableBuilder<int>(
                  valueListenable: GetIt.I<NotificationCountService>().unreadCount,
                  builder: (context, count, child) => Badge(
                    isLabelVisible: count > 0,
                    label: Text(
                      count > 99 ? '99+' : '$count',
                      style: const TextStyle(fontSize: 10),
                    ),
                    child: child!,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: onNotificationTap ?? () => context.push('/notifications'),
                    color: AppColors.textPrimary,
                  ),
                ),
            ],
          ),
      body: body,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
    );
  }
}
