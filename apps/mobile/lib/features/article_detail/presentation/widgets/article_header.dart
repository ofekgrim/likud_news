import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/article_detail.dart';

/// Hero image header with gradient overlay and title text.
///
/// Displays the article's hero image at full width with a dark
/// gradient at the bottom overlaying the title, subtitle, author,
/// and publish time.
class ArticleHeader extends StatelessWidget {
  final ArticleDetail article;

  const ArticleHeader({super.key, required this.article});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const headerHeight = 360.0;

    return SizedBox(
      height: headerHeight,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Hero image
          if (article.heroImageUrl != null &&
              article.heroImageUrl!.isNotEmpty)
            AppCachedImage(
              imageUrl: article.heroImageUrl!,
              width: double.infinity,
              height: headerHeight,
              fit: BoxFit.cover,
            )
          else
            Container(color: AppColors.likudDarkBlue),

          // Gradient overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppColors.black.withValues(alpha: 0.0),
                  AppColors.black.withValues(alpha: 0.15),
                  AppColors.black.withValues(alpha: 0.7),
                  AppColors.black.withValues(alpha: 0.85),
                ],
                stops: const [0.0, 0.3, 0.7, 1.0],
              ),
            ),
          ),

          // Breaking badge
          if (article.isBreaking)
            Positioned(
              top: MediaQuery.of(context).padding.top + 56,
              right: 16,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.breakingRed,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'חדשות חמות',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),

          // Title + meta overlay
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Category badge
                if (article.categoryName != null &&
                    article.categoryName!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _parseCategoryColor()
                            .withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        article.categoryName!,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: AppColors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),

                // Title
                Text(
                  article.title,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w800,
                    height: 1.3,
                  ),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),

                // Subtitle
                if (article.subtitle != null &&
                    article.subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    article.subtitle!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.white.withValues(alpha: 0.85),
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

                const SizedBox(height: 10),

                // Author + time row
                Row(
                  children: [
                    if (article.author != null &&
                        article.author!.isNotEmpty) ...[
                      Icon(
                        Icons.person_outline,
                        size: 14,
                        color: AppColors.white.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        article.author!,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: AppColors.white.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    if (article.publishedAt != null) ...[
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: AppColors.white.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatPublishTime(article.publishedAt!),
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: AppColors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                    const Spacer(),
                    Icon(
                      Icons.visibility_outlined,
                      size: 14,
                      color: AppColors.white.withValues(alpha: 0.7),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${article.viewCount}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: AppColors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _parseCategoryColor() {
    if (article.categoryColor != null && article.categoryColor!.isNotEmpty) {
      try {
        final hex = article.categoryColor!.replaceFirst('#', '');
        return Color(int.parse('FF$hex', radix: 16));
      } catch (_) {
        // Fall through to default.
      }
    }
    return AppColors.likudBlue;
  }

  String _formatPublishTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'עכשיו';
    if (diff.inMinutes < 60) return 'לפני ${diff.inMinutes} דק\'';
    if (diff.inHours < 24) return 'לפני ${diff.inHours} שע\'';

    final d = dateTime.day.toString().padLeft(2, '0');
    final m = dateTime.month.toString().padLeft(2, '0');
    final y = dateTime.year;
    final h = dateTime.hour.toString().padLeft(2, '0');
    final min = dateTime.minute.toString().padLeft(2, '0');
    return '$d/$m/$y $h:$min';
  }
}
