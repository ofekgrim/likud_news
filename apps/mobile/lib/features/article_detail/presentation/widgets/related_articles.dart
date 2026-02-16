import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../home/domain/entities/article.dart';

/// Horizontal scrolling list of related articles.
///
/// Shown at the bottom of the article detail page. Each card
/// displays the hero image, title, and category. Tapping a card
/// invokes [onArticleTap] with the selected [Article].
class RelatedArticles extends StatelessWidget {
  final List<Article> articles;
  final ValueChanged<Article>? onArticleTap;

  const RelatedArticles({
    super.key,
    required this.articles,
    this.onArticleTap,
  });

  @override
  Widget build(BuildContext context) {
    if (articles.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'כתבות קשורות',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Horizontal list
        SizedBox(
          height: 200,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: articles.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) =>
                _buildCard(context, articles[index]),
          ),
        ),
      ],
    );
  }

  Widget _buildCard(BuildContext context, Article article) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => onArticleTap?.call(article),
      child: Container(
        width: 220,
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
            // Image
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              child: article.heroImageUrl != null &&
                      article.heroImageUrl!.isNotEmpty
                  ? AppCachedImage(
                      imageUrl: article.heroImageUrl!,
                      width: 220,
                      height: 110,
                      fit: BoxFit.cover,
                    )
                  : Container(
                      width: 220,
                      height: 110,
                      color: AppColors.surfaceMedium,
                      child: const Icon(
                        Icons.article_outlined,
                        size: 32,
                        color: AppColors.textTertiary,
                      ),
                    ),
            ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category
                    if (article.categoryName != null &&
                        article.categoryName!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          article.categoryName!,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: _parseCategoryColor(article),
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),

                    // Title
                    Expanded(
                      child: Text(
                        article.title,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          height: 1.3,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _parseCategoryColor(Article article) {
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
}
