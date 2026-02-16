import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/article.dart';

/// Article card displayed in the news feed list.
///
/// Shows a thumbnail image on the leading side (right in RTL),
/// with title, author, date, and category on the trailing side.
class FeedArticleCard extends StatelessWidget {
  final Article article;
  final VoidCallback? onTap;

  const FeedArticleCard({
    super.key,
    required this.article,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail.
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: article.heroImageUrl != null &&
                      article.heroImageUrl!.isNotEmpty
                  ? AppCachedImage(
                      imageUrl: article.heroImageUrl!,
                      width: 120,
                      height: 80,
                      fit: BoxFit.cover,
                    )
                  : Container(
                      width: 120,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMedium,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.article_outlined,
                        color: AppColors.textTertiary,
                        size: 28,
                      ),
                    ),
            ),
            const SizedBox(width: 12),
            // Text content.
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category + breaking badge row.
                  Row(
                    children: [
                      if (article.categoryName != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _parseCategoryColor(article.categoryColor)
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            article.categoryName!,
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color:
                                  _parseCategoryColor(article.categoryColor),
                            ),
                          ),
                        ),
                      if (article.isBreaking) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.breakingRed,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'מבזק',
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Title.
                  Text(
                    article.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Author + date.
                  Row(
                    children: [
                      if (article.author != null &&
                          article.author!.isNotEmpty) ...[
                        Flexible(
                          child: Text(
                            article.author!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          '\u2022',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textTertiary,
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      if (article.publishedAt != null)
                        Text(
                          _formatDate(article.publishedAt!),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      const Spacer(),
                      // View count.
                      if (article.viewCount > 0) ...[
                        const Icon(
                          Icons.visibility_outlined,
                          size: 13,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          _formatViewCount(article.viewCount),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 60) {
      return 'לפני ${diff.inMinutes} דק\'';
    } else if (diff.inHours < 24) {
      return 'לפני ${diff.inHours} שע\'';
    } else if (diff.inDays < 7) {
      return 'לפני ${diff.inDays} ימים';
    }
    return DateFormat('dd/MM/yyyy').format(date);
  }

  String _formatViewCount(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
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
