import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../home/domain/entities/article.dart';

/// A single breaking news card.
///
/// Displays author avatar, headline, summary, timestamp,
/// category badge, and a share button.
class BreakingNewsCard extends StatelessWidget {
  final Article article;
  final VoidCallback? onTap;

  const BreakingNewsCard({
    super.key,
    required this.article,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: avatar + author + timestamp + share
            Row(
              children: [
                // Author avatar
                _buildAvatar(),
                const SizedBox(width: 10),

                // Author name
                Expanded(
                  child: Text(
                    article.author ?? '',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

                // Timestamp
                if (article.publishedAt != null)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 8),
                    child: Text(
                      _formatTime(article.publishedAt!),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ),

                // Share button
                SizedBox(
                  width: 32,
                  height: 32,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    iconSize: 18,
                    icon: const Icon(Icons.share_outlined),
                    color: AppColors.textTertiary,
                    onPressed: _onShare,
                    tooltip: 'שיתוף',
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Headline
            Text(
              article.title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
                height: 1.4,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),

            // Summary / subtitle
            if (article.subtitle != null && article.subtitle!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                article.subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],

            // Category badge
            if (article.categoryName != null &&
                article.categoryName!.isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildCategoryBadge(theme),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (article.heroImageUrl != null && article.heroImageUrl!.isNotEmpty) {
      return ClipOval(
        child: AppCachedImage(
          imageUrl: article.heroImageUrl!,
          width: 36,
          height: 36,
          fit: BoxFit.cover,
        ),
      );
    }

    // Fallback: initials avatar
    final initials = (article.author ?? '?')
        .split(' ')
        .take(2)
        .map((w) => w.isNotEmpty ? w[0] : '')
        .join();

    return CircleAvatar(
      radius: 18,
      backgroundColor: AppColors.likudLightBlue,
      child: Text(
        initials,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.likudDarkBlue,
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(ThemeData theme) {
    final badgeColor = _parseCategoryColor();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        article.categoryName!,
        style: theme.textTheme.labelSmall?.copyWith(
          color: badgeColor,
          fontWeight: FontWeight.w600,
        ),
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

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'עכשיו';
    if (diff.inMinutes < 60) return 'לפני ${diff.inMinutes} דק\'';
    if (diff.inHours < 24) return 'לפני ${diff.inHours} שע\'';

    // Format as dd/MM HH:mm for older items.
    final d = dateTime.day.toString().padLeft(2, '0');
    final m = dateTime.month.toString().padLeft(2, '0');
    final h = dateTime.hour.toString().padLeft(2, '0');
    final min = dateTime.minute.toString().padLeft(2, '0');
    return '$d/$m $h:$min';
  }

  void _onShare() {
    final text = article.title;
    final slug = article.slug ?? article.id.toString();
    final url = 'https://likud.news/articles/$slug';
    Share.share('$text\n$url');
  }
}
