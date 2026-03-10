import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/branded_placeholder.dart';
import '../../domain/entities/article.dart';

/// Horizontal carousel showing trending (most-read) articles.
class TrendingCarousel extends StatelessWidget {
  final List<Article> articles;
  final void Function(Article article) onArticleTap;

  const TrendingCarousel({
    super.key,
    required this.articles,
    required this.onArticleTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 8),
          child: Row(
            children: [
              const Icon(
                Icons.trending_up,
                size: 20,
                color: AppColors.likudBlue,
              ),
              const SizedBox(width: 6),
              Text(
                'trending'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: context.colors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 180,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
            itemCount: articles.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final article = articles[index];
              return _TrendingCard(
                article: article,
                onTap: () => onArticleTap(article),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _TrendingCard extends StatelessWidget {
  final Article article;
  final VoidCallback onTap;

  const _TrendingCard({required this.article, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: article.title,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
        width: 220,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: context.colors.cardSurface,
          boxShadow: [
            BoxShadow(
              color: context.colors.shadow,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            SizedBox(
              height: 100,
              width: double.infinity,
              child: article.heroImageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: article.heroImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          const BrandedPlaceholder(iconSize: 32),
                      errorWidget: (_, __, ___) =>
                          const BrandedPlaceholder(iconSize: 32),
                    )
                  : const BrandedPlaceholder(iconSize: 32),
            ),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category badge + view count
                    Row(
                      children: [
                        if (article.categoryName != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _parseCategoryColor(article.categoryColor),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              article.categoryName!,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        const Spacer(),
                        Icon(
                          Icons.visibility_outlined,
                          size: 12,
                          color: context.colors.textTertiary,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          _formatViewCount(article.viewCount),
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 10,
                            color: context.colors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Title
                    Expanded(
                      child: Text(
                        article.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: context.colors.textPrimary,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }

  Color _parseCategoryColor(String? hex) {
    if (hex == null || hex.isEmpty) return AppColors.likudBlue;
    try {
      final colorHex = hex.replaceAll('#', '');
      return Color(int.parse('FF$colorHex', radix: 16));
    } catch (_) {
      return AppColors.likudBlue;
    }
  }

  String _formatViewCount(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
