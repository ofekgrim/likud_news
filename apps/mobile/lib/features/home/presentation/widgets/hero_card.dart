import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/article.dart';

/// Full-width hero article card with gradient text overlay.
///
/// Displays the main article image with a bottom gradient
/// containing the title, subtitle, and category badge.
class HeroCard extends StatelessWidget {
  final Article article;
  final VoidCallback? onTap;

  const HeroCard({
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
        height: 280,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background image.
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
                    AppColors.black.withValues(alpha: 0.8),
                  ],
                  stops: const [0.3, 1.0],
                ),
              ),
            ),

            // Text content.
            Positioned(
              bottom: 16,
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
                    const SizedBox(height: 8),
                  ],
                  // Title.
                  Text(
                    article.title,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      color: AppColors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      height: 1.3,
                    ),
                  ),
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

            // "Breaking" red badge.
            if (article.isBreaking)
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.breakingRed,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bolt, color: AppColors.white, size: 14),
                      SizedBox(width: 2),
                      Text(
                        'מבזק',
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          color: AppColors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
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
