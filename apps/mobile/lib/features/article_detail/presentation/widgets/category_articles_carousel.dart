import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../home/domain/entities/article.dart';

/// Horizontal carousel of same-category articles ("More from {category}").
///
/// Displays a section header followed by a horizontal [ListView] of article
/// cards. Each card shows the hero image in the top half and the title with
/// a category badge in the bottom half. Returns [SizedBox.shrink] when the
/// articles list is empty.
class CategoryArticlesCarousel extends StatelessWidget {
  /// Articles from the same category to display.
  final List<Article> articles;

  /// Category name for the section header.
  final String? categoryName;

  /// Called when an article card is tapped.
  final ValueChanged<Article>? onArticleTap;

  const CategoryArticlesCarousel({
    super.key,
    required this.articles,
    this.categoryName,
    this.onArticleTap,
  });

  @override
  Widget build(BuildContext context) {
    if (articles.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Section header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              categoryName != null && categoryName!.isNotEmpty
                  ? 'more_from_category'.tr(args: [categoryName!])
                  : 'more_on_topic'.tr(),
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
      ),
    );
  }

  Widget _buildCard(BuildContext context, Article article) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => onArticleTap?.call(article),
      child: Container(
        width: 280,
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
            // Hero image — top half
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              child: article.heroImageUrl != null &&
                      article.heroImageUrl!.isNotEmpty
                  ? AppCachedImage(
                      imageUrl: article.heroImageUrl!,
                      width: 280,
                      height: 110,
                      fit: BoxFit.cover,
                    )
                  : Container(
                      width: 280,
                      height: 110,
                      color: AppColors.surfaceMedium,
                      child: const Icon(
                        Icons.article_outlined,
                        size: 32,
                        color: AppColors.textTertiary,
                      ),
                    ),
            ),

            // Content — bottom half
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category badge
                    if (article.categoryName != null &&
                        article.categoryName!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _parseCategoryColor(article)
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
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

  /// Parses the article's category color hex string, falling back to
  /// [AppColors.likudBlue].
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
