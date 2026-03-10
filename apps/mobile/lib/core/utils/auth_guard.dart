import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/theme_context.dart';
import '../../../features/auth/presentation/bloc/auth_bloc.dart';

/// Shows a sign-in bottom sheet if the user is not authenticated.
/// Returns `true` if the user IS authenticated (action can proceed).
/// Returns `false` if the user is NOT authenticated (popup shown).
bool requireAuth(BuildContext context) {
  final authState = context.read<AuthBloc>().state;
  if (authState is AuthAuthenticated) return true;

  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    backgroundColor: context.colors.surface,
    builder: (_) => _SignInPromptSheet(parentContext: context),
  );
  return false;
}

/// Bottom sheet prompting the user to sign in.
class _SignInPromptSheet extends StatelessWidget {
  final BuildContext parentContext;

  const _SignInPromptSheet({required this.parentContext});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.colors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: AppColors.likudLightBlue,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_outline,
                color: AppColors.likudBlue,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              'auth_required_title'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: context.colors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),

            // Subtitle
            Text(
              'auth_required_subtitle'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: context.colors.textSecondary,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Sign in button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  parentContext.push('/login');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'auth_sign_in'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Continue as guest
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'auth_continue_guest'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: context.colors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }
}
