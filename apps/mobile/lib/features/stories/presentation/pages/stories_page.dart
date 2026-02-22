import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../home/domain/entities/story.dart';
import '../../../home/presentation/widgets/story_circles.dart';
import '../../../home/presentation/widgets/story_viewer.dart';
import '../bloc/stories_bloc.dart';

/// Stories tab page.
///
/// Displays a horizontal row of story circles at the top
/// and a vertical list of story preview cards below.
class StoriesPage extends StatefulWidget {
  const StoriesPage({super.key});

  @override
  State<StoriesPage> createState() => _StoriesPageState();
}

class _StoriesPageState extends State<StoriesPage> {
  @override
  void initState() {
    super.initState();
    context.read<StoriesBloc>().add(const LoadStories());
  }

  void _openStoryViewer(List<Story> stories, int index) {
    Navigator.of(context, rootNavigator: true).push(
      PageRouteBuilder(
        opaque: false,
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: StoryViewer(
              stories: stories,
              initialIndex: index,
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => AppRouter.scaffoldKey.currentState?.openDrawer(),
          color: AppColors.textPrimary,
        ),
        title: Text(
          'stories'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: BlocBuilder<StoriesBloc, StoriesState>(
        builder: (context, state) {
          if (state is StoriesLoading) {
            return _buildLoadingState();
          }

          if (state is StoriesError) {
            return _buildErrorState(state.message);
          }

          if (state is StoriesLoaded) {
            return _buildLoadedState(state.stories);
          }

          // Initial state
          return const SizedBox.shrink();
        },
      ),
    );
  }

  /// Shimmer loading state.
  Widget _buildLoadingState() {
    return SingleChildScrollView(
      padding: EdgeInsets.only(bottom: AppRouter.bottomNavClearance(context)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          // Shimmer circles row
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 6,
              separatorBuilder: (_, __) => const SizedBox(width: 16),
              itemBuilder: (_, __) => _buildShimmerCircle(),
            ),
          ),
          const SizedBox(height: 24),
          // Shimmer cards
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: List.generate(4, (_) => _buildShimmerCard()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerCircle() {
    return SizedBox(
      width: 72,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surfaceMedium,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 48,
            height: 10,
            decoration: BoxDecoration(
              color: AppColors.surfaceMedium,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerCard() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.surfaceMedium,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }

  /// Error state with retry button.
  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                context.read<StoriesBloc>().add(const LoadStories());
              },
              icon: const Icon(Icons.refresh),
              label: Text('try_again'.tr()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.likudBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Loaded state with stories.
  Widget _buildLoadedState(List<Story> stories) {
    if (stories.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.auto_awesome_outlined,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              'no_stories'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        context.read<StoriesBloc>().add(const RefreshStories());
      },
      color: AppColors.likudBlue,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.only(bottom: AppRouter.bottomNavClearance(context)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            // Story circles row
            StoryCircles(
              stories: stories,
              onStoryTap: (story, index) =>
                  _openStoryViewer(stories, index),
            ),
            const SizedBox(height: 24),
            // Story preview cards
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: List.generate(stories.length, (index) {
                  return _StoryPreviewCard(
                    story: stories[index],
                    onTap: () => _openStoryViewer(stories, index),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A story preview card with 16:9 thumbnail, gradient overlay, title, and duration badge.
class _StoryPreviewCard extends StatelessWidget {
  final Story story;
  final VoidCallback? onTap;

  const _StoryPreviewCard({
    required this.story,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Thumbnail image
                AppCachedImage(
                  imageUrl: story.displayImageUrl,
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                ),
                // Gradient overlay
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.7),
                      ],
                      stops: const [0.4, 1.0],
                    ),
                  ),
                ),
                // Duration badge
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.timer_outlined,
                          color: Colors.white,
                          size: 14,
                        ),
                        SizedBox(width: 4),
                        Text(
                          '5s',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Media type icon
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      story.linkUrl != null
                          ? Icons.link
                          : story.articleId != null
                              ? Icons.article_outlined
                              : Icons.image_outlined,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
                // Title text at bottom
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Text(
                    story.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.3,
                      shadows: [
                        Shadow(
                          offset: Offset(0, 1),
                          blurRadius: 4,
                          color: Colors.black54,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
