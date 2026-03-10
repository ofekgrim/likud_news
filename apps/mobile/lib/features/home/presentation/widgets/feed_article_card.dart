import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: context.colors.cardSurface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: context.colors.border.withValues(alpha: 0.5),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: context.colors.shadow,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            padding: const EdgeInsets.all(12),
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
                        color: context.colors.surfaceMedium,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.article_outlined,
                        color: context.colors.textTertiary,
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
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.breakingRed,
                                AppColors.breakingRed.withValues(alpha: 0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.breakingRed.withValues(alpha: 0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.bolt,
                                size: 11,
                                color: AppColors.white,
                              ),
                              const SizedBox(width: 3),
                              const Text(
                                'מבזק',
                                style: TextStyle(
                                  fontFamily: 'Heebo',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.white,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ],
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
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: context.colors.textPrimary,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Author + date.
                  Row(
                    children: [
                      if (_authorDisplay.isNotEmpty) ...[
                        Flexible(
                          child: Text(
                            _authorDisplay,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 11,
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '\u2022',
                          style: TextStyle(
                            fontSize: 11,
                            color: context.colors.textTertiary,
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      if (article.publishedAt != null)
                        Text(
                          _formatDate(article.publishedAt!),
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            color: context.colors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Engagement stats row with badges.
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (article.readingTimeMinutes > 0)
                        _StatBadge(
                          icon: Icons.schedule_outlined,
                          label: '${article.readingTimeMinutes} דק\'',
                        ),
                      if (article.viewCount > 0)
                        _StatBadge(
                          icon: Icons.visibility_outlined,
                          label: _formatCount(article.viewCount),
                        ),
                      if (article.commentCount > 0)
                        _StatBadge(
                          icon: Icons.chat_bubble_outline,
                          label: _formatCount(article.commentCount),
                          color: AppColors.likudBlue,
                        ),
                      if (article.shareCount > 0)
                        _StatBadge(
                          icon: Icons.share_outlined,
                          label: _formatCount(article.shareCount),
                        ),
                    ],
                  ),
                ],
              ),
            ),
              ],
            ),
          ),
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

  String get _authorDisplay {
    if (article.authorEntityName != null && article.authorEntityName!.isNotEmpty) {
      return article.authorEntityName!;
    }
    if (article.author != null && article.author!.isNotEmpty) {
      return article.author!;
    }
    return '';
  }

  String _formatCount(int count) {
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

/// Engagement stat badge with icon and label.
class _StatBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _StatBadge({
    required this.icon,
    required this.label,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final badgeColor = color ?? context.colors.textTertiary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: badgeColor,
          ),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: badgeColor,
            ),
          ),
        ],
      ),
    );
  }
}
