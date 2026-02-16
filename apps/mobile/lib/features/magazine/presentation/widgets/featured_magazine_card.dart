import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../home/domain/entities/article.dart';

/// Large featured magazine article card with hero image and gradient overlay.
///
/// Displays a full-width hero image (height 300) with a bottom gradient
/// containing the category badge, large title, editorial credit, and subtitle.
/// Tapping navigates to article detail.
class FeaturedMagazineCard extends StatelessWidget {
  final Article article;
  final VoidCallback? onTap;

  const FeaturedMagazineCard({
    super.key,
    required this.article,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: double.infinity,
        height: 300,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Hero image.
            if (article.heroImageUrl != null &&
                article.heroImageUrl!.isNotEmpty)
              AppCachedImage(
                imageUrl: article.heroImageUrl!,
                fit: BoxFit.cover,
              )
            else
              Container(color: AppColors.likudDarkBlue),

            // Gradient overlay.
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppColors.black.withValues(alpha: 0.85),
                  ],
                  stops: const [0.25, 1.0],
                ),
              ),
            ),

            // Text content.
            Positioned(
              bottom: 20,
              right: 16,
              left: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Category badge.
                  if (article.categoryName != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _parseCategoryColor(article.categoryColor),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        article.categoryName!,
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          color: AppColors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                  // Large title with magazine-style typography.
                  Text(
                    article.title,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      color: AppColors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      height: 1.25,
                      letterSpacing: -0.3,
                    ),
                  ),
                  // Editorial credit.
                  if (article.author != null &&
                      article.author!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      article.author!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        color: AppColors.white.withValues(alpha: 0.75),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                  // Subtitle.
                  if (article.subtitle != null &&
                      article.subtitle!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      article.subtitle!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        color: AppColors.white.withValues(alpha: 0.85),
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // "כתבה מרכזית" badge at top.
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: AppColors.likudBlue,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'כתבה מרכזית',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    color: AppColors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
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
