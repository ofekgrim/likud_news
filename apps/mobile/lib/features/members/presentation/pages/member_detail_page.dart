import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../home/presentation/widgets/feed_article_card.dart';
import '../../domain/entities/member_detail.dart';
import '../bloc/members_bloc.dart';

/// Full member profile page.
///
/// Shows a large photo, name, title, bio text, social media links,
/// and a list of related articles using [FeedArticleCard].
class MemberDetailPage extends StatefulWidget {
  final String memberId;

  const MemberDetailPage({
    super.key,
    required this.memberId,
  });

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward),
          onPressed: () => context.pop(),
        ),
        centerTitle: true,
        title: const Text(
          '\u05E4\u05E8\u05D5\u05E4\u05D9\u05DC',
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<MembersBloc, MembersState>(
        builder: (context, state) {
          if (state is MembersLoading || state is MembersInitial) {
            return _buildLoadingState();
          }

          if (state is MembersError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context
                  .read<MembersBloc>()
                  .add(LoadMemberDetail(id: widget.memberId)),
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

  Widget _buildLoadingState() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const ShimmerLoading(width: 120, height: 120, borderRadius: 60),
            const SizedBox(height: 16),
            const ShimmerLoading(width: 160, height: 20, borderRadius: 4),
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
    );
  }

  Widget _buildDetailContent(BuildContext context, MemberDetail detail) {
    final member = detail.member;

    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 80),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 24),
          // Large circular photo.
          ClipOval(
            child: member.photoUrl != null && member.photoUrl!.isNotEmpty
                ? AppCachedImage(
                    imageUrl: member.photoUrl!,
                    width: 120,
                    height: 120,
                    fit: BoxFit.cover,
                  )
                : Container(
                    width: 120,
                    height: 120,
                    color: AppColors.surfaceMedium,
                    child: const Icon(
                      Icons.person,
                      color: AppColors.textTertiary,
                      size: 56,
                    ),
                  ),
          ),
          const SizedBox(height: 16),
          // Name.
          Text(
            member.name,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          // Title.
          if (member.title != null && member.title!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              member.title!,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 16),
          // Social media buttons.
          _buildSocialLinks(member),
          // Bio.
          if (member.bio != null && member.bio!.isNotEmpty) ...[
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                member.bio!,
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
          // Related articles.
          if (detail.articles.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  '\u05DB\u05EA\u05D1\u05D5\u05EA \u05E7\u05E9\u05D5\u05E8\u05D5\u05EA',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
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
                  const Divider(
                    height: 1,
                    indent: 16,
                    endIndent: 16,
                    color: AppColors.border,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSocialLinks(member) {
    final hasSocial = (member.socialFacebook != null &&
            member.socialFacebook!.isNotEmpty) ||
        (member.socialTwitter != null && member.socialTwitter!.isNotEmpty) ||
        (member.socialInstagram != null && member.socialInstagram!.isNotEmpty);

    if (!hasSocial) return const SizedBox.shrink();

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (member.socialFacebook != null &&
            member.socialFacebook!.isNotEmpty)
          _SocialButton(
            icon: Icons.facebook,
            label: '\u05E4\u05D9\u05D9\u05E1\u05D1\u05D5\u05E7',
            color: const Color(0xFF1877F2),
            onTap: () => _launchUrl(member.socialFacebook!),
          ),
        if (member.socialTwitter != null &&
            member.socialTwitter!.isNotEmpty) ...[
          const SizedBox(width: 12),
          _SocialButton(
            icon: Icons.alternate_email,
            label: '\u05D8\u05D5\u05D5\u05D9\u05D8\u05E8',
            color: const Color(0xFF1DA1F2),
            onTap: () => _launchUrl(member.socialTwitter!),
          ),
        ],
        if (member.socialInstagram != null &&
            member.socialInstagram!.isNotEmpty) ...[
          const SizedBox(width: 12),
          _SocialButton(
            icon: Icons.camera_alt_outlined,
            label: '\u05D0\u05D9\u05E0\u05E1\u05D8\u05D2\u05E8\u05DD',
            color: const Color(0xFFE4405F),
            onTap: () => _launchUrl(member.socialInstagram!),
          ),
        ],
      ],
    );
  }
}

/// Individual social media icon button.
class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.label,
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 10,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
