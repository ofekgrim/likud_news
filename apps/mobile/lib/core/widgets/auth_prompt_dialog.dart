import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/theme_context.dart';
import '../services/permission_service.dart';

/// Shows a bottom sheet prompting the user to log in or upgrade membership.
///
/// [requiredRole] - the minimum role needed for the action.
/// [currentRole] - the user's current role (null = not logged in).
/// [actionDescription] - localized text like "post a comment".
Future<void> showAuthPromptDialog(
  BuildContext context, {
  required AppUserRole requiredRole,
  AppUserRole? currentRole,
  required String actionDescription,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: context.colors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) {
      final isNotLoggedIn = currentRole == null;

      return Directionality(
        textDirection: TextDirection.rtl,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: ctx.colors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Icon(
                isNotLoggedIn ? Icons.lock_outline : Icons.workspace_premium,
                size: 48,
                color: AppColors.likudBlue,
              ),
              const SizedBox(height: 16),
              Text(
                isNotLoggedIn
                    ? 'login_required_action'.tr()
                    : requiredRole == AppUserRole.verifiedMember
                    ? 'verified_member_required'.tr()
                    : 'member_required'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: ctx.colors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                actionDescription,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: ctx.colors.textSecondary,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    if (isNotLoggedIn) {
                      context.push('/login');
                    }
                    // For role upgrade — future: navigate to membership page
                    context.push('/membership');
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.likudBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    isNotLoggedIn
                        ? 'login_to_continue'.tr()
                        : 'upgrade_membership'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(
                  'cancel'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: ctx.colors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
