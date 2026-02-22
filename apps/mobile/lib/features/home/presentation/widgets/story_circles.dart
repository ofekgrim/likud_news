import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/story.dart';

/// Horizontal row of Instagram-style story circles.
///
/// Each circle shows a story thumbnail with a gradient border and title below.
/// Tapping a circle triggers [onStoryTap] with the selected [Story] and its index.
class StoryCircles extends StatelessWidget {
  final List<Story> stories;
  final void Function(Story story, int index)? onStoryTap;

  const StoryCircles({
    super.key,
    required this.stories,
    this.onStoryTap,
  });

  @override
  Widget build(BuildContext context) {
    if (stories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: stories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final story = stories[index];
          return _StoryCircleItem(
            story: story,
            onTap: () => onStoryTap?.call(story, index),
          );
        },
      ),
    );
  }
}

class _StoryCircleItem extends StatelessWidget {
  final Story story;
  final VoidCallback? onTap;

  const _StoryCircleItem({
    required this.story,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 72,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Circle with gradient border
            Container(
              width: 64,
              height: 64,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.likudBlue,
                    AppColors.likudBlue.withValues(alpha: 0.6),
                    const Color(0xFF4FC3F7),
                  ],
                ),
              ),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                ),
                child: ClipOval(
                  child: AppCachedImage(
                    imageUrl: story.displayImageUrl,
                    width: 54,
                    height: 54,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 6),
            // Story title
            Text(
              story.title,
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
