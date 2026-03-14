import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../article_detail/presentation/widgets/block_renderer.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../../domain/entities/member.dart';
import '../../domain/entities/member_detail.dart';
import '../bloc/members_bloc.dart';

/// Premium personal page for a Likud member.
///
/// Uses a [CustomScrollView] with a collapsible [SliverAppBar] showing
/// a cover image, overlapping circular photo, contact/social rows,
/// bio text, optional personal page HTML, and related articles.
class MemberDetailPage extends StatefulWidget {
  final String memberId;

  const MemberDetailPage({super.key, required this.memberId});

  @override
  State<MemberDetailPage> createState() => _MemberDetailPageState();
}

class _MemberDetailPageState extends State<MemberDetailPage> {
  @override
  void initState() {
    super.initState();
    context.read<MembersBloc>().add(LoadMemberDetail(id: widget.memberId));
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<MembersBloc, MembersState>(
        builder: (context, state) {
          if (state is MembersLoading || state is MembersInitial) {
            return _buildLoadingState(context);
          }

          if (state is MembersError) {
            return Scaffold(
              appBar: AppBar(
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                ),
              ),
              body: ErrorView(
                message: state.message,
                onRetry: () => context.read<MembersBloc>().add(
                  LoadMemberDetail(id: widget.memberId),
                ),
              ),
            );
          }

          if (state is MemberDetailLoaded) {
            return _buildDetailContent(context, state.memberDetail);
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

  Widget _buildDetailContent(BuildContext context, MemberDetail detail) {
    final member = detail.member;

    return CustomScrollView(
      slivers: [
        // Collapsible app bar with cover image.
        SliverAppBar(
          expandedHeight: 220,
          pinned: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
          title: Text(
            member.name,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.white,
            ),
          ),
          centerTitle: true,
          flexibleSpace: FlexibleSpaceBar(background: _buildCoverImage(member)),
        ),

        // Overlapping circular photo.
        SliverToBoxAdapter(
          child: Transform.translate(
            offset: const Offset(0, 20),
            child: Column(
              children: [
                // Circular photo with white border.
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: context.colors.surface, width: 3),
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
                        member.photoUrl != null && member.photoUrl!.isNotEmpty
                        ? AppCachedImage(
                            imageUrl: member.photoUrl!,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            width: 100,
                            height: 100,
                            color: context.colors.surfaceMedium,
                            child: Icon(
                              Icons.person,
                              color: context.colors.textTertiary,
                              size: 48,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 12),

                // Name.
                Text(
                  member.name,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: context.colors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),

                // Title.
                if (member.title != null && member.title!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    member.title!,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      color: context.colors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],

                // Office.
                if (member.office != null && member.office!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    member.office!,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: context.colors.textTertiary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 16),

                // Contact row.
                _buildContactRow(member),

                // Social links row.
                _buildSocialLinks(member),

                // Bio.
                if (member.bio != null && member.bio!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 24,
                    ),
                    child: Text(
                      member.bio!,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        color: context.colors.textPrimary,
                        height: 1.6,
                      ),
                      textDirection: TextDirection.rtl,
                      textAlign: TextAlign.start,
                    ),
                  ),
                ],

                // Bio blocks (rich content from admin BlockEditor).
                if (member.bioBlocks.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 16,
                    ),
                    child: BlockRenderer(
                      blocks: member.bioBlocks,
                      fontScale: 1.0,
                    ),
                  ),
                ],

                // Personal page HTML.
                if (member.personalPageHtml != null &&
                    member.personalPageHtml!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 16,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsetsDirectional.only(start: 8),
                          child: Text(
                            'member_personal_page'.tr(),
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: context.colors.textPrimary,
                            ),
                            textDirection: TextDirection.rtl,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Card(
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          color: context.colors.cardSurface,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Directionality(
                              textDirection: TextDirection.rtl,
                              child: HtmlWidget(
                                member.personalPageHtml!,
                                textStyle: TextStyle(
                                  fontFamily: 'Heebo',
                                  fontSize: 14,
                                  color: context.colors.textPrimary,
                                  height: 1.6,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Related articles.
                if (detail.articles.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsetsDirectional.symmetric(
                      horizontal: 16,
                    ),
                    child: Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(
                        'member_articles'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: context.colors.textPrimary,
                        ),
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...detail.articles.map(
                    (article) => Column(
                      children: [
                        FeedArticleCard(
                          article: article,
                          onTap: () {
                            context.push('/article/${article.slug}');
                          },
                        ),
                        Divider(
                          height: 1,
                          indent: 16,
                          endIndent: 16,
                          color: context.colors.border,
                        ),
                      ],
                    ),
                  ),
                ],

                // Bottom padding for floating nav bar.
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCoverImage(Member member) {
    if (member.coverImageUrl != null && member.coverImageUrl!.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          AppCachedImage(imageUrl: member.coverImageUrl!, fit: BoxFit.cover),
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

  Widget _buildContactRow(Member member) {
    final hasPhone = member.phone != null && member.phone!.isNotEmpty;
    final hasEmail = member.email != null && member.email!.isNotEmpty;
    final hasWebsite = member.website != null && member.website!.isNotEmpty;

    if (!hasPhone && !hasEmail && !hasWebsite) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        decoration: BoxDecoration(
          color: context.colors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.colors.border, width: 0.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasPhone)
              _ContactIconButton(
                icon: Icons.phone,
                label: 'member_phone'.tr(),
                onTap: () => _launchPhone(member.phone!),
              ),
            if (hasPhone && (hasEmail || hasWebsite)) const SizedBox(width: 20),
            if (hasEmail)
              _ContactIconButton(
                icon: Icons.email_outlined,
                label: 'member_email'.tr(),
                onTap: () => _launchEmail(member.email!),
              ),
            if (hasEmail && hasWebsite) const SizedBox(width: 20),
            if (hasWebsite)
              _ContactIconButton(
                icon: Icons.language,
                label: 'member_website'.tr(),
                onTap: () => _launchUrl(member.website!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSocialLinks(Member member) {
    final hasSocial =
        (member.socialFacebook != null && member.socialFacebook!.isNotEmpty) ||
        (member.socialTwitter != null && member.socialTwitter!.isNotEmpty) ||
        (member.socialInstagram != null && member.socialInstagram!.isNotEmpty);

    if (!hasSocial) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (member.socialFacebook != null &&
              member.socialFacebook!.isNotEmpty)
            _SocialButton(
              icon: Icons.facebook,
              color: const Color(0xFF1877F2),
              onTap: () => _launchUrl(member.socialFacebook!),
            ),
          if (member.socialTwitter != null &&
              member.socialTwitter!.isNotEmpty) ...[
            const SizedBox(width: 12),
            _SocialButton(
              icon: Icons.alternate_email,
              color: const Color(0xFF1DA1F2),
              onTap: () => _launchUrl(member.socialTwitter!),
            ),
          ],
          if (member.socialInstagram != null &&
              member.socialInstagram!.isNotEmpty) ...[
            const SizedBox(width: 12),
            _SocialButton(
              icon: Icons.camera_alt_outlined,
              color: const Color(0xFFE4405F),
              onTap: () => _launchUrl(member.socialInstagram!),
            ),
          ],
        ],
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
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 10,
                color: context.colors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Social media icon button.
class _SocialButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Icon(icon, color: color, size: 28),
      ),
    );
  }
}
