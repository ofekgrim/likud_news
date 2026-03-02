import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../article_detail/presentation/widgets/block_renderer.dart';
import '../../domain/entities/candidate.dart';
import '../../domain/entities/endorsement.dart';
import '../bloc/candidates_bloc.dart';
import '../widgets/endorse_button.dart';
import '../widgets/social_links_row.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../../../core/services/permission_service.dart' as perm;
import '../../../../core/widgets/auth_prompt_dialog.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';

/// Full detail page for a single candidate.
///
/// Uses a [CustomScrollView] with a collapsible [SliverAppBar] showing
/// a cover image and candidate photo overlay, bio blocks, social links,
/// contact info, and an endorse button at the bottom.
class CandidateDetailPage extends StatefulWidget {
  final String slug;

  const CandidateDetailPage({super.key, required this.slug});

  @override
  State<CandidateDetailPage> createState() => _CandidateDetailPageState();
}

class _CandidateDetailPageState extends State<CandidateDetailPage> {
  bool _isEndorseLoading = false;
  Endorsement? _currentEndorsement;

  @override
  void initState() {
    super.initState();
    context.read<CandidatesBloc>().add(LoadCandidateDetail(slug: widget.slug));
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchEmail(String email) async {
    final uri = Uri(scheme: 'mailto', path: email);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  /// Whether the current user has endorsed THIS specific candidate.
  bool _isEndorsedForCandidate(Candidate candidate) =>
      _currentEndorsement != null &&
      _currentEndorsement!.candidateId == candidate.id;

  void _handleEndorse(Candidate candidate) {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) {
      requireAuth(context);
      return;
    }
    final userRole = perm.AppUserRole.fromString(authState.user.role.name);
    if (!perm.PermissionService.canPerform(
      perm.AppPermission.endorseCandidate,
      userRole,
    )) {
      showAuthPromptDialog(
        context,
        requiredRole: perm.PermissionService.minimumRoleFor(
          perm.AppPermission.endorseCandidate,
        ),
        currentRole: userRole,
        actionDescription: 'become_member_to_endorse'.tr(),
      );
      return;
    }
    setState(() {
      _isEndorseLoading = true;
    });

    if (_isEndorsedForCandidate(candidate)) {
      // Remove endorsement for THIS candidate.
      context.read<CandidatesBloc>().add(
        RemoveEndorsementEvent(electionId: candidate.electionId),
      );
    } else {
      // Endorse this candidate (backend handles switching if needed).
      context.read<CandidatesBloc>().add(
        EndorseCandidateEvent(
          candidateId: candidate.id,
          electionId: candidate.electionId,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<CandidatesBloc, CandidatesState>(
        listenWhen: (prev, curr) =>
            curr is EndorsementUpdated ||
            curr is CandidateDetailLoaded ||
            curr is CandidatesError,
        listener: (context, state) {
          if (state is EndorsementUpdated) {
            setState(() {
              _isEndorseLoading = false;
              _currentEndorsement = state.endorsement;
            });
          }
          if (state is CandidateDetailLoaded) {
            _currentEndorsement = state.endorsement;
            // Only fetch endorsement once (initial load when endorsement is null).
            if (state.endorsement == null) {
              context.read<CandidatesBloc>().add(
                LoadMyEndorsement(electionId: state.candidate.electionId),
              );
            }
          }
          if (state is CandidatesError) {
            setState(() {
              _isEndorseLoading = false;
            });
          }
        },
        buildWhen: (prev, curr) =>
            curr is CandidatesLoading ||
            curr is CandidatesInitial ||
            curr is CandidatesError ||
            curr is CandidateDetailLoaded,
        builder: (context, state) {
          if (state is CandidatesLoading || state is CandidatesInitial) {
            return _buildLoadingState(context);
          }

          if (state is CandidatesError) {
            return Scaffold(
              appBar: AppBar(
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                ),
              ),
              body: ErrorView(
                message: state.message,
                onRetry: () => context.read<CandidatesBloc>().add(
                  LoadCandidateDetail(slug: widget.slug),
                ),
              ),
            );
          }

          if (state is CandidateDetailLoaded) {
            return _buildDetailContent(context, state.candidate);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        SliverAppBar(
          expandedHeight: 220,
          pinned: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
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
        ),
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
                  4,
                  (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: ShimmerLoading(height: 14, borderRadius: 4),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailContent(BuildContext context, Candidate candidate) {
    return CustomScrollView(
      slivers: [
        // Collapsible app bar with cover image.
        SliverAppBar(
          expandedHeight: 220,
          pinned: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
          title: Text(
            candidate.fullName,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.white,
            ),
          ),
          centerTitle: true,
          flexibleSpace: FlexibleSpaceBar(
            background: _buildCoverImage(candidate),
          ),
        ),

        // Content body.
        SliverToBoxAdapter(
          child: Transform.translate(
            offset: const Offset(0, 20),
            child: Column(
              children: [
                // Overlapping circular photo.
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.white, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.black.withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child:
                        candidate.photoUrl != null &&
                            candidate.photoUrl!.isNotEmpty
                        ? AppCachedImage(
                            imageUrl: candidate.photoUrl!,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            width: 100,
                            height: 100,
                            color: AppColors.surfaceMedium,
                            child: const Icon(
                              Icons.person,
                              color: AppColors.textTertiary,
                              size: 48,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 12),

                // Name.
                Text(
                  candidate.fullName,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),

                // District.
                if (candidate.district != null &&
                    candidate.district!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    candidate.district!,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],

                // Position.
                if (candidate.position != null &&
                    candidate.position!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    candidate.position!,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],

                // Endorsement count.
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.likudLightBlue,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.thumb_up_outlined,
                        size: 16,
                        color: AppColors.likudBlue,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${'candidates_endorsements'.tr()} ${candidate.endorsementCount}',
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.likudBlue,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Contact row.
                _buildContactRow(candidate),

                // Social links.
                if (candidate.socialLinks.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  SocialLinksRow(socialLinks: candidate.socialLinks),
                ],

                // Bio text.
                if (candidate.bio != null && candidate.bio!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 24,
                    ),
                    child: Text(
                      candidate.bio!,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        color: AppColors.textPrimary,
                        height: 1.6,
                      ),
                      textDirection: TextDirection.rtl,
                      textAlign: TextAlign.start,
                    ),
                  ),
                ],

                // Bio blocks (rich content from admin BlockEditor).
                if (candidate.bioBlocks.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 16,
                    ),
                    child: BlockRenderer(
                      blocks: candidate.bioBlocks,
                      fontScale: 1.0,
                      showAds: false,
                    ),
                  ),
                ],

                // Endorse button.
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsetsDirectional.symmetric(
                    horizontal: 24,
                  ),
                  child: EndorseButton(
                    isEndorsed: _isEndorsedForCandidate(candidate),
                    isLoading: _isEndorseLoading,
                    onPressed: () => _handleEndorse(candidate),
                  ),
                ),

                // Bottom padding for floating nav bar.
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCoverImage(Candidate candidate) {
    if (candidate.coverImageUrl != null &&
        candidate.coverImageUrl!.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          AppCachedImage(imageUrl: candidate.coverImageUrl!, fit: BoxFit.cover),
          // Gradient overlay for text legibility.
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppColors.black.withValues(alpha: 0.3),
                  AppColors.black.withValues(alpha: 0.6),
                ],
              ),
            ),
          ),
        ],
      );
    }

    // Gradient fallback.
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.likudBlue, AppColors.likudDarkBlue],
        ),
      ),
    );
  }

  Widget _buildContactRow(Candidate candidate) {
    final hasPhone = candidate.phone != null && candidate.phone!.isNotEmpty;
    final hasEmail = candidate.email != null && candidate.email!.isNotEmpty;
    final hasWebsite =
        candidate.website != null && candidate.website!.isNotEmpty;

    if (!hasPhone && !hasEmail && !hasWebsite) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasPhone)
              _ContactIconButton(
                icon: Icons.phone,
                label: 'candidates_phone'.tr(),
                onTap: () => _launchPhone(candidate.phone!),
              ),
            if (hasPhone && (hasEmail || hasWebsite)) const SizedBox(width: 20),
            if (hasEmail)
              _ContactIconButton(
                icon: Icons.email_outlined,
                label: 'candidates_email'.tr(),
                onTap: () => _launchEmail(candidate.email!),
              ),
            if (hasEmail && hasWebsite) const SizedBox(width: 20),
            if (hasWebsite)
              _ContactIconButton(
                icon: Icons.language,
                label: 'candidates_website'.tr(),
                onTap: () => _launchUrl(candidate.website!),
              ),
          ],
        ),
      ),
    );
  }
}

/// Contact row icon button (phone, email, website).
class _ContactIconButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ContactIconButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.likudBlue, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 10,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
