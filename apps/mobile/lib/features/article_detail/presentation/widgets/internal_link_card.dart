import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/content_block.dart';

/// Renders an [ArticleLinkBlock] as a mini article card or inline link.
///
/// Supports two display styles:
/// - **card**: a bordered container with an image thumbnail and title,
///   suitable for prominent inline links within article body content.
/// - **inline**: a simple text button with the article title and an arrow icon,
///   for lighter-weight references.
///
/// Tapping navigates to the linked article's detail page via go_router.
class InternalLinkCard extends StatelessWidget {
  /// The article link content block to render.
  final ArticleLinkBlock block;

  const InternalLinkCard({
    super.key,
    required this.block,
  });

  @override
  Widget build(BuildContext context) {
    if (block.linkedArticleTitle == null ||
        block.linkedArticleTitle!.isEmpty) {
      return const SizedBox.shrink();
    }

    if (block.displayStyle == 'inline') {
      return _buildInlineLink(context);
    }

    return _buildCardLink(context);
  }

  /// Card-style layout: bordered container with image + title row.
  Widget _buildCardLink(BuildContext context) {
    return GestureDetector(
      onTap: () => _navigate(context),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Thumbnail image
              ClipRRect(
                borderRadius: const BorderRadiusDirectional.only(
                  topStart: Radius.circular(10),
                  bottomStart: Radius.circular(10),
                ),
                child: _buildImage(),
              ),

              // Title + icon
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  child: Text(
                    block.linkedArticleTitle!,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      height: 1.4,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),

              // Arrow icon
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 12),
                child: Icon(
                  Icons.arrow_back,
                  color: AppColors.likudBlue,
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Builds the 80x80 image thumbnail or a fallback icon placeholder.
  Widget _buildImage() {
    if (block.linkedArticleImageUrl != null &&
        block.linkedArticleImageUrl!.isNotEmpty) {
      return AppCachedImage(
        imageUrl: block.linkedArticleImageUrl!,
        width: 80,
        height: 80,
        fit: BoxFit.cover,
      );
    }

    return Container(
      width: 80,
      height: 80,
      color: AppColors.surfaceMedium,
      child: const Icon(
        Icons.article_outlined,
        size: 28,
        color: AppColors.textTertiary,
      ),
    );
  }

  /// Inline-style layout: a simple text button with title and arrow.
  Widget _buildInlineLink(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: TextButton(
        onPressed: () => _navigate(context),
        style: TextButton.styleFrom(
          foregroundColor: AppColors.likudBlue,
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.article_outlined, size: 16),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                block.linkedArticleTitle!,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.arrow_back, size: 14),
          ],
        ),
      ),
    );
  }

  /// Navigates to the linked article's detail page.
  void _navigate(BuildContext context) {
    final slug = block.linkedArticleSlug;
    if (slug != null && slug.isNotEmpty) {
      context.push('/article/$slug');
    }
  }
}
