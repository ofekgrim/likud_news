import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../domain/entities/membership_info.dart';
import '../../domain/entities/voting_eligibility.dart';
import '../bloc/membership_bloc.dart';
import '../../../../core/utils/auth_guard.dart';

/// Membership dashboard page.
///
/// Displays the user's Likud membership status, verification form,
/// branch info, and voting eligibility.
class MembershipPage extends StatefulWidget {
  const MembershipPage({super.key});

  @override
  State<MembershipPage> createState() => _MembershipPageState();
}

class _MembershipPageState extends State<MembershipPage> {
  final _formKey = GlobalKey<FormState>();
  final _membershipIdController = TextEditingController();
  final _fullNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<MembershipBloc>().add(const LoadMembership());
  }

  @override
  void dispose() {
    _membershipIdController.dispose();
    _fullNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'membership_title'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: BlocConsumer<MembershipBloc, MembershipState>(
        listener: (context, state) {
          if (state is VerificationSubmitted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('membership_verification_submitted'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
            // Reload membership info after verification submission.
            context.read<MembershipBloc>().add(const LoadMembership());
          }
        },
        builder: (context, state) {
          if (state is MembershipLoading) {
            return const Center(
              child: CircularProgressIndicator(
                color: AppColors.likudBlue,
              ),
            );
          }

          if (state is MembershipError) {
            return ErrorView(
              message: state.message,
              onRetry: () {
                context.read<MembershipBloc>().add(const LoadMembership());
              },
            );
          }

          if (state is MembershipLoaded) {
            return _buildDashboard(context, state.info, state.eligibility);
          }

          // Initial state — show loading.
          return const Center(
            child: CircularProgressIndicator(
              color: AppColors.likudBlue,
            ),
          );
        },
      ),
    );
  }

  Widget _buildDashboard(
    BuildContext context,
    MembershipInfo info,
    VotingEligibility? eligibility,
  ) {
    return RefreshIndicator(
      color: AppColors.likudBlue,
      onRefresh: () async {
        context.read<MembershipBloc>().add(const LoadMembership());
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsetsDirectional.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status card.
            _buildStatusCard(context, info),
            const SizedBox(height: 16),

            // Verification section.
            _buildVerificationSection(context, info),
            const SizedBox(height: 16),

            // Branch info section.
            if (info.branch != null || info.district != null) ...[
              _buildBranchInfoCard(context, info),
              const SizedBox(height: 16),
            ],

            // Voting eligibility section.
            if (eligibility != null) ...[
              _buildVotingEligibilityCard(context, eligibility),
              const SizedBox(height: 16),
            ],

            // Action cards.
            _buildActionCards(context),

            // Bottom padding for floating nav bar.
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Status Card
  // ---------------------------------------------------------------------------

  Widget _buildStatusCard(BuildContext context, MembershipInfo info) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: AppColors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with title and status badge.
            Row(
              children: [
                const Icon(
                  Icons.card_membership,
                  color: AppColors.likudBlue,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'membership_status'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
                _buildStatusBadge(info.status),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 16),

            // Membership ID.
            if (info.membershipId != null &&
                info.membershipId!.isNotEmpty) ...[
              _buildInfoRow(
                icon: Icons.badge_outlined,
                label: 'membership_id'.tr(),
                value: info.membershipId!,
              ),
              const SizedBox(height: 12),
            ],

            // Verified date.
            if (info.verifiedAt != null) ...[
              _buildInfoRow(
                icon: Icons.verified_outlined,
                label: 'membership_verified'.tr(),
                value: DateFormat('dd/MM/yyyy').format(info.verifiedAt!),
              ),
            ],

            // If no membership ID and not verified, show prompt.
            if (info.membershipId == null &&
                info.status == MembershipStatus.none)
              Text(
                'membership_not_verified'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
                textDirection: TextDirection.rtl,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(MembershipStatus status) {
    final Color backgroundColor;
    final Color textColor;

    switch (status) {
      case MembershipStatus.verified:
        backgroundColor =
            AppColors.success.withValues(alpha: 0.12);
        textColor = AppColors.success;
      case MembershipStatus.pending:
        backgroundColor =
            AppColors.warning.withValues(alpha: 0.12);
        textColor = AppColors.warning;
      case MembershipStatus.expired:
        backgroundColor =
            AppColors.breakingRed.withValues(alpha: 0.12);
        textColor = AppColors.breakingRed;
      case MembershipStatus.none:
        backgroundColor =
            AppColors.textSecondary.withValues(alpha: 0.12);
        textColor = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.localizationKey.tr(),
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, color: AppColors.textSecondary, size: 20),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
            textDirection: TextDirection.ltr,
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Verification Section
  // ---------------------------------------------------------------------------

  Widget _buildVerificationSection(
    BuildContext context,
    MembershipInfo info,
  ) {
    // Already verified — show green checkmark.
    if (info.status == MembershipStatus.verified) {
      return _buildVerifiedCard();
    }

    // Pending verification — show "Under Review" message.
    if (info.status == MembershipStatus.pending) {
      return _buildPendingCard();
    }

    // Not verified or expired — show verification form.
    return _buildVerificationForm(context);
  }

  Widget _buildVerifiedCard() {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: AppColors.success.withValues(alpha: 0.06),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle,
                color: AppColors.success,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'membership_verified'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.success,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'membership_verify_subtitle'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPendingCard() {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: AppColors.warning.withValues(alpha: 0.06),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.hourglass_top,
                color: AppColors.warning,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'membership_pending'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.warning,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'membership_verify_subtitle'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationForm(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: AppColors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'membership_verify_title'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                textDirection: TextDirection.rtl,
              ),
              const SizedBox(height: 4),
              Text(
                'membership_verify_subtitle'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
                textDirection: TextDirection.rtl,
              ),
              const SizedBox(height: 20),

              // Membership ID field (numeric).
              TextFormField(
                controller: _membershipIdController,
                textDirection: TextDirection.ltr,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(
                  label: 'membership_id'.tr(),
                  icon: Icons.badge_outlined,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'membership_id'.tr();
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Full name field.
              TextFormField(
                controller: _fullNameController,
                textDirection: TextDirection.rtl,
                decoration: _inputDecoration(
                  label: 'full_name'.tr(),
                  icon: Icons.person_outline,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'full_name_required'.tr();
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Verify button.
              SizedBox(
                height: 48,
                child: FilledButton.icon(
                  onPressed: _onVerify,
                  icon: const Icon(Icons.verified_user_outlined),
                  label: Text(
                    'membership_verify_button'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.likudBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Branch Info Card
  // ---------------------------------------------------------------------------

  Widget _buildBranchInfoCard(BuildContext context, MembershipInfo info) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: AppColors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  color: AppColors.likudBlue,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'membership_branch'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                  textDirection: TextDirection.rtl,
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 12),

            if (info.branch != null)
              _buildInfoRow(
                icon: Icons.home_work_outlined,
                label: 'membership_branch'.tr(),
                value: info.branch!,
              ),

            if (info.branch != null && info.district != null)
              const SizedBox(height: 8),

            if (info.district != null)
              _buildInfoRow(
                icon: Icons.map_outlined,
                label: 'membership_district'.tr(),
                value: info.district!,
              ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Voting Eligibility Card
  // ---------------------------------------------------------------------------

  Widget _buildVotingEligibilityCard(
    BuildContext context,
    VotingEligibility eligibility,
  ) {
    final isEligible = eligibility.isEligible;
    final statusColor = isEligible ? AppColors.success : AppColors.breakingRed;
    final statusIcon = isEligible ? Icons.check_circle : Icons.cancel;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: AppColors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header.
            Row(
              children: [
                const Icon(
                  Icons.how_to_vote_outlined,
                  color: AppColors.likudBlue,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'membership_voting_title'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 16),

            // Eligibility status row.
            Row(
              children: [
                Icon(statusIcon, color: statusColor, size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEligible
                            ? 'membership_eligible'.tr()
                            : 'membership_not_eligible'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                        textDirection: TextDirection.rtl,
                      ),
                      if (eligibility.reason != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          eligibility.reason!,
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                          textDirection: TextDirection.rtl,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),

            // Election name.
            if (eligibility.electionName != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border, width: 0.5),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.event_outlined,
                      color: AppColors.textSecondary,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        eligibility.electionName!,
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimary,
                        ),
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Registration deadline.
            if (eligibility.registrationDeadline != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(
                    Icons.schedule,
                    color: AppColors.textSecondary,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'membership_registration_deadline'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('dd/MM/yyyy')
                        .format(eligibility.registrationDeadline!),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    textDirection: TextDirection.ltr,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Action Cards
  // ---------------------------------------------------------------------------

  Widget _buildActionCards(BuildContext context) {
    return Column(
      children: [
        _ActionCard(
          icon: Icons.person_outline,
          title: 'profile_edit'.tr(),
          onTap: () {
            context.push('/profile/edit');
          },
        ),
        const SizedBox(height: 8),
        _ActionCard(
          icon: Icons.how_to_vote_outlined,
          title: 'primaries'.tr(),
          onTap: () {
            context.go('/primaries');
          },
        ),
        const SizedBox(height: 8),
        _ActionCard(
          icon: Icons.settings_outlined,
          title: 'settings'.tr(),
          onTap: () {
            context.push('/settings');
          },
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Input Decoration
  // ---------------------------------------------------------------------------

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: AppColors.textSecondary),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.likudBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.breakingRed),
      ),
      filled: true,
      fillColor: AppColors.surfaceLight,
    );
  }

  // ---------------------------------------------------------------------------
  // Submit Verification
  // ---------------------------------------------------------------------------

  void _onVerify() {
    if (!requireAuth(context)) return;
    if (_formKey.currentState?.validate() ?? false) {
      context.read<MembershipBloc>().add(
            SubmitVerification(
              membershipId: _membershipIdController.text.trim(),
              fullName: _fullNameController.text.trim(),
            ),
          );
    }
  }
}

// ---------------------------------------------------------------------------
// Private Widgets
// ---------------------------------------------------------------------------

/// Action card for navigation to related screens.
class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 0.5),
      ),
      color: AppColors.white,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsetsDirectional.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.likudBlue, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                  textDirection: TextDirection.rtl,
                ),
              ),
              const Icon(
                Icons.chevron_left,
                color: AppColors.textTertiary,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
