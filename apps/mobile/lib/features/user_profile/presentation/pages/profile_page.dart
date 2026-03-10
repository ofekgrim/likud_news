import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../bloc/user_profile_bloc.dart';
import '../widgets/membership_card.dart';
import '../widgets/profile_avatar.dart';

/// User profile page showing avatar, personal info, membership status,
/// category preferences, and action buttons (edit, logout).
///
/// Uses a [CustomScrollView] with Likud branding and RTL layout.
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  @override
  void initState() {
    super.initState();
    context.read<UserProfileBloc>().add(const LoadProfile());
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.colors.surfaceVariant,
        body: BlocConsumer<UserProfileBloc, UserProfileState>(
          listener: (context, state) {
            if (state is UserProfileUpdated) {
              // After a successful update, reload the profile to reflect changes.
              context.read<UserProfileBloc>().add(const LoadProfile());
            }
          },
          builder: (context, state) {
            if (state is UserProfileLoading) {
              return _buildLoadingState();
            }

            if (state is UserProfileError) {
              return _buildErrorState(state.message);
            }

            if (state is UserProfileLoaded) {
              return _buildProfileContent(state.user);
            }

            if (state is UserProfileUpdated) {
              return _buildProfileContent(state.user);
            }

            if (state is UserProfileUpdating) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.likudBlue),
              );
            }

            // Initial state — show loading.
            return _buildLoadingState();
          },
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        _buildAppBar(null),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const ShimmerLoading(width: 100, height: 100, borderRadius: 50),
                const SizedBox(height: 16),
                const ShimmerLoading(width: 160, height: 22, borderRadius: 4),
                const SizedBox(height: 8),
                const ShimmerLoading(width: 120, height: 14, borderRadius: 4),
                const SizedBox(height: 24),
                ...List.generate(
                  3,
                  (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: ShimmerLoading(height: 60, borderRadius: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState(String message) {
    return Column(
      children: [
        // Minimal app bar for error state.
        AppBar(
          backgroundColor: AppColors.likudBlue,
          title: Text(
            'profile_title'.tr(),
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
        Expanded(
          child: ErrorView(
            message: message,
            onRetry: () {
              context.read<UserProfileBloc>().add(const LoadProfile());
            },
          ),
        ),
      ],
    );
  }

  Widget _buildProfileContent(AppUser user) {
    return CustomScrollView(
      slivers: [
        _buildAppBar(user),
        SliverToBoxAdapter(
          child: Column(
            children: [
              // Avatar section.
              Transform.translate(
                offset: const Offset(0, 20),
                child: Column(
                  children: [
                    ProfileAvatar(
                      imageUrl: user.avatarUrl,
                      displayName: user.displayName,
                      radius: 50,
                      showEditOverlay: true,
                      onEditTap: () async {
                        final picker = ImagePicker();
                        final image = await picker.pickImage(
                          source: ImageSource.gallery,
                          maxWidth: 800,
                          maxHeight: 900,
                          imageQuality: 85,
                        );
                        if (image != null && context.mounted) {
                          context.read<UserProfileBloc>().add(
                            PickAndUploadAvatarEvent(filePath: image.path),
                          );
                        }
                      },
                    ),
                    const SizedBox(height: 12),

                    // Display name + verified badge.
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          user.displayName ?? 'profile_anonymous'.tr(),
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: context.colors.textPrimary,
                          ),
                        ),
                        if (user.isVerifiedMember) ...[
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.verified,
                            size: 22,
                            color: AppColors.likudBlue,
                          ),
                        ],
                      ],
                    ),

                    // Contact info.
                    if (user.email != null || user.phone != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        user.email ?? user.phone ?? '',
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 14,
                          color: context.colors.textSecondary,
                        ),
                      ),
                    ],

                    // Role badge.
                    const SizedBox(height: 8),
                    _buildRoleBadge(user.role),
                    const SizedBox(height: 50),
                  ],
                ),
              ),

              // Bio section.
              if (user.bio != null && user.bio!.isNotEmpty)
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 16),
                  child: Text(
                    user.bio!,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      color: context.colors.textPrimary,
                      height: 1.6,
                    ),
                    textAlign: TextAlign.start,
                  ),
                ),

              // Membership card.
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 16),
                child: MembershipCard(
                  user: user,
                  onVerifyTap: () {
                    _showVerifyMembershipDialog(context);
                  },
                ),
              ),

              // Category preferences section.
              if (user.preferredCategories.isNotEmpty)
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 16),
                  child: _buildCategorySection(user.preferredCategories),
                ),

              // Action buttons.
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
                child: _buildActionButton(
                  icon: Icons.edit_outlined,
                  label: 'profile_edit'.tr(),
                  onTap: () {
                    context.push('/profile/edit');
                  },
                ),
              ),

              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
                child: _buildActionButton(
                  icon: Icons.notifications_outlined,
                  label: 'profile_notification_prefs'.tr(),
                  onTap: () {
                    context.push('/profile/notifications');
                  },
                ),
              ),

              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
                child: _buildActionButton(
                  icon: Icons.logout,
                  label: 'profile_logout'.tr(),
                  color: AppColors.breakingRed,
                  onTap: () {
                    _showLogoutConfirmation(context);
                  },
                ),
              ),

              // Bottom padding for floating nav bar.
              const SizedBox(height: 100),
            ],
          ),
        ),
      ],
    );
  }

  SliverAppBar _buildAppBar(AppUser? user) {
    return SliverAppBar(
      expandedHeight: 140,
      pinned: true,
      backgroundColor: AppColors.likudBlue,
      leading: IconButton(
        icon: const Icon(Icons.arrow_forward, color: AppColors.white),
        onPressed: () => context.pop(),
      ),
      title: Text(
        'profile_title'.tr(),
        style: const TextStyle(
          fontFamily: 'Heebo',
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.white,
        ),
      ),
      centerTitle: true,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.likudBlue, AppColors.likudDarkBlue],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleBadge(AppUserRole role) {
    final (label, color, bgColor) = switch (role) {
      AppUserRole.verifiedMember => (
        'profile_role_verified'.tr(),
        AppColors.success,
        AppColors.success.withValues(alpha: 0.1),
      ),
      AppUserRole.member => (
        'profile_role_member'.tr(),
        AppColors.likudBlue,
        AppColors.likudLightBlue,
      ),
      AppUserRole.guest => (
        'profile_role_guest'.tr(),
        context.colors.textTertiary,
        context.colors.surfaceMedium,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildCategorySection(List<String> categories) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.border, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: context.colors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.category_outlined,
                color: AppColors.likudBlue,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'profile_preferred_categories'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: context.colors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: categories
                .map(
                  (cat) => Chip(
                    label: Text(
                      cat,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        color: AppColors.likudBlue,
                      ),
                    ),
                    backgroundColor: AppColors.likudLightBlue,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 4,
                      vertical: 0,
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color color = AppColors.likudBlue,
  }) {
    return Material(
      color: context.colors.cardSurface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.colors.border, width: 0.5),
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: color == AppColors.breakingRed
                        ? AppColors.breakingRed
                        : context.colors.textPrimary,
                  ),
                ),
              ),
              Icon(
                Icons.arrow_back_ios,
                size: 16,
                color: context.colors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showVerifyMembershipDialog(BuildContext context) {
    final membershipIdController = TextEditingController();
    final fullNameController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text(
            'profile_verify_membership'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: membershipIdController,
                textDirection: TextDirection.ltr,
                decoration: InputDecoration(
                  labelText: 'profile_membership_id'.tr(),
                  labelStyle: const TextStyle(fontFamily: 'Heebo'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: fullNameController,
                decoration: InputDecoration(
                  labelText: 'profile_full_name'.tr(),
                  labelStyle: const TextStyle(fontFamily: 'Heebo'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                keyboardType: TextInputType.name,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                'cancel'.tr(),
                style: const TextStyle(fontFamily: 'Heebo'),
              ),
            ),
            FilledButton(
              onPressed: () {
                final membershipId = membershipIdController.text.trim();
                if (membershipId.isEmpty) return;
                final fullName = fullNameController.text.trim();
                context.read<UserProfileBloc>().add(
                  RequestMembershipEvent(
                    membershipId: membershipId,
                    fullName: fullName.isNotEmpty ? fullName : null,
                  ),
                );
                Navigator.of(dialogContext).pop();
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.likudBlue,
              ),
              child: Text(
                'profile_submit'.tr(),
                style: const TextStyle(fontFamily: 'Heebo'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text(
            'profile_logout'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          content: Text(
            'profile_logout_confirm'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              color: context.colors.textSecondary,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                'cancel'.tr(),
                style: const TextStyle(fontFamily: 'Heebo'),
              ),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                context.read<AuthBloc>().add(const LogoutEvent());
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.breakingRed,
              ),
              child: Text(
                'profile_logout'.tr(),
                style: const TextStyle(fontFamily: 'Heebo'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
