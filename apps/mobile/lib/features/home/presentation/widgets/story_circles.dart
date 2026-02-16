import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/category.dart';

/// Horizontal row of category shortcut circles (Instagram-story style).
///
/// Each circle shows a category icon/image with the category name below.
/// Tapping a circle triggers [onCategoryTap] with the selected [Category].
class StoryCircles extends StatelessWidget {
  final List<Category> categories;
  final ValueChanged<Category>? onCategoryTap;

  const StoryCircles({
    super.key,
    required this.categories,
    this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final category = categories[index];
          return _StoryCircleItem(
            category: category,
            onTap: () => onCategoryTap?.call(category),
          );
        },
      ),
    );
  }
}

class _StoryCircleItem extends StatelessWidget {
  final Category category;
  final VoidCallback? onTap;

  const _StoryCircleItem({
    required this.category,
    this.onTap,
  });

  Color get _circleColor {
    if (category.color == null || category.color!.isEmpty) {
      return AppColors.likudBlue;
    }
    try {
      final hex = category.color!.replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return AppColors.likudBlue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 72,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Circle with gradient border.
            Container(
              width: 64,
              height: 64,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: _circleColor, width: 2.5),
              ),
              child: ClipOval(
                child: category.iconUrl != null &&
                        category.iconUrl!.isNotEmpty
                    ? AppCachedImage(
                        imageUrl: category.iconUrl!,
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: _circleColor.withValues(alpha: 0.15),
                        child: Center(
                          child: Text(
                            category.name.isNotEmpty
                                ? category.name[0]
                                : '?',
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: _circleColor,
                            ),
                          ),
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 6),
            // Category label.
            Text(
              category.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
