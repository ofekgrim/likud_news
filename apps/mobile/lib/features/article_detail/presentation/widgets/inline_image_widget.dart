import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/content_block.dart';
import 'full_image_dialog.dart';

/// Renders an [ImageBlock] inline within the article body.
///
/// Displays the image at full width with rounded corners and supports
/// tap-to-zoom via [FullImageDialog]. Shows optional credit and caption
/// text below the image with RTL alignment.
class InlineImageWidget extends StatelessWidget {
  /// The image content block to render.
  final ImageBlock block;

  /// Optional font scale multiplier for caption/credit text.
  final double fontScale;

  const InlineImageWidget({
    super.key,
    required this.block,
    this.fontScale = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Tappable image
          Semantics(
            label: block.altText,
            image: true,
            child: GestureDetector(
              onTap: () => FullImageDialog.show(
                context,
                imageUrl: block.fullUrl ?? block.url,
                credit: block.credit,
                caption: block.captionHe,
              ),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: AppCachedImage(
                  imageUrl: block.url,
                  fit: BoxFit.cover,
                  borderRadius: 8,
                  width: double.infinity,
                ),
              ),
            ),
          ),

          // Credit
          if (block.credit != null && block.credit!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 6, end: 0),
              child: Text(
                block.credit!,
                textAlign: TextAlign.start,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12 * fontScale,
                  color: AppColors.textTertiary,
                  height: 1.4,
                ),
              ),
            ),

          // Caption
          if (block.captionHe != null && block.captionHe!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 4),
              child: Text(
                block.captionHe!,
                textAlign: TextAlign.start,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14 * fontScale,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
