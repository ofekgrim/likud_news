import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/video_article.dart';
import 'duration_badge.dart';

/// Grid card for displaying a video thumbnail.
///
/// Shows the hero image with a play icon overlay, duration badge,
/// category color tag, and title text below.
class VideoThumbnailCard extends StatelessWidget {
  final VideoArticle video;
  final VoidCallback? onTap;

  const VideoThumbnailCard({
    super.key,
    required this.video,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail with overlays.
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Hero image.
                    if (video.heroImageUrl != null &&
                        video.heroImageUrl!.isNotEmpty)
                      AppCachedImage(
                        imageUrl: video.heroImageUrl!,
                        fit: BoxFit.cover,
                      )
                    else
                      Container(
                        color: AppColors.surfaceMedium,
                        child: const Icon(
                          Icons.videocam_outlined,
                          color: AppColors.textTertiary,
                          size: 32,
                        ),
                      ),
                    // Play icon overlay.
                    Center(
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.play_arrow,
                          size: 24,
                          color: AppColors.likudBlue,
                        ),
                      ),
                    ),
                    // Duration badge (bottom-left).
                    if (video.duration > 0)
                      Positioned(
                        bottom: 6,
                        left: 6,
                        child: DurationBadge(durationSeconds: video.duration),
                      ),
                    // Category color tag (top-right).
                    if (video.categoryName != null)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _parseCategoryColor(video.categoryColor),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            video.categoryName!,
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: AppColors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // Title.
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
              child: Text(
                video.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  height: 1.3,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _parseCategoryColor(String? colorHex) {
    if (colorHex == null || colorHex.isEmpty) return AppColors.likudBlue;
    try {
      final hex = colorHex.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return AppColors.likudBlue;
    }
  }
}
