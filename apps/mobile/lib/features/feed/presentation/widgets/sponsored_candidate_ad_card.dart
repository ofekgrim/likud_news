import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/branded_placeholder.dart';
import '../../domain/entities/feed_item.dart';

/// Looks identical to FeedArticleCard but renders a candidate sponsored ad.
/// A small "ממומן" badge is overlaid on the hero image for identification.
class SponsoredCandidateAdCard extends StatelessWidget {
  final FeedCandidateAdContent candidateAd;
  final VoidCallback? onTap;

  const SponsoredCandidateAdCard({
    super.key,
    required this.candidateAd,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap ?? () => _handleTap(context),
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero image with sponsored badge overlay
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: candidateAd.imageUrl != null
                        ? Image.network(
                            candidateAd.imageUrl!,
                            fit: BoxFit.cover,
                            semanticLabel: candidateAd.title,
                            errorBuilder: (_, __, ___) =>
                                const BrandedPlaceholder(),
                          )
                        : const BrandedPlaceholder(),
                  ),
                ),
                // Sponsored badge (top-right, orange to distinguish from breaking)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade700,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.campaign_outlined,
                          color: Colors.white,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'sponsored'.tr(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Candidate name row (replaces category badge)
                  Row(
                    children: [
                      if (candidateAd.candidatePhotoUrl != null)
                        ClipOval(
                          child: Image.network(
                            candidateAd.candidatePhotoUrl!,
                            width: 20,
                            height: 20,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.person,
                              size: 20,
                              color: AppColors.likudBlue,
                            ),
                          ),
                        )
                      else
                        const Icon(
                          Icons.person,
                          size: 20,
                          color: AppColors.likudBlue,
                        ),
                      const SizedBox(width: 6),
                      Text(
                        candidateAd.candidateName,
                        style: TextStyle(
                          color: AppColors.likudBlue,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Title
                  Text(
                    candidateAd.title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                      color: context.colors.textPrimary,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    textDirection: TextDirection.rtl,
                  ),

                  // Content / subtitle
                  if (candidateAd.contentHe != null &&
                      candidateAd.contentHe!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      candidateAd.contentHe!,
                      style: TextStyle(
                        fontSize: 14,
                        color: context.colors.textSecondary,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.rtl,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleTap(BuildContext context) {
    final type = candidateAd.linkedContentType;
    final id = candidateAd.linkedContentId;
    final slug = candidateAd.linkedContentSlug;
    final url = candidateAd.ctaUrl;

    switch (type) {
      case 'article':
        if (slug != null && slug.isNotEmpty) {
          context.push('/article/$slug');
        } else if (url != null) {
          _launchUrl(url);
        }
      case 'candidate':
        if (id != null) context.push('/candidates/$id');
      case 'event':
        if (id != null) context.push('/events/$id');
      case 'poll':
        context.push('/polls');
      default:
        if (url != null) _launchUrl(url);
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
