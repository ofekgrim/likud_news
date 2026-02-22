import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../article_detail/presentation/bloc/comments_bloc.dart';
import '../../../article_detail/presentation/widgets/comments_section.dart';
import '../../domain/entities/story.dart';
import 'story_video_player.dart';

/// Full-screen Instagram-style story viewer.
///
/// Displays stories one at a time with:
/// - Full-screen image background
/// - Gradient overlay for text readability
/// - Title text at the bottom
/// - Progress bar showing current story position
/// - "Read Article" button if the story is linked to an article
/// - Swipe left/right to navigate between stories
/// - Tap left/right sides to go prev/next
/// - Swipe up to dismiss
/// - Long-press to pause progress
class StoryViewer extends StatefulWidget {
  final List<Story> stories;
  final int initialIndex;

  const StoryViewer({
    super.key,
    required this.stories,
    this.initialIndex = 0,
  });

  @override
  State<StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<StoryViewer>
    with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late int _currentIndex;
  late AnimationController _progressController;

  /// Tracks the vertical drag offset for swipe-up-to-dismiss.
  double _dragOffset = 0.0;

  /// Whether the progress timer is paused (long-press).
  bool _isPaused = false;

  /// Whether sound is muted for video stories.
  bool _isMuted = false;

  /// Returns the duration for the currently displayed story.
  Duration get _currentStoryDuration {
    if (_currentIndex < widget.stories.length) {
      return Duration(seconds: widget.stories[_currentIndex].durationSeconds);
    }
    return const Duration(seconds: 5);
  }

  /// Minimum upward drag distance (in px) to trigger dismiss.
  static const double _dismissThreshold = 120.0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
    _progressController = AnimationController(
      vsync: this,
      duration: _currentStoryDuration,
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _goToNext();
        }
      });
    _progressController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  void _goToNext() {
    if (_currentIndex < widget.stories.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      // Last story — close viewer
      if (mounted) Navigator.of(context).pop();
    }
  }

  void _goToPrevious() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
    _progressController.duration = _currentStoryDuration;
    _progressController.reset();
    _progressController.forward();
  }

  // ── Long-press to pause / resume ──────────────────────────────────────────

  void _onLongPressStart() {
    setState(() => _isPaused = true);
    _progressController.stop();
  }

  void _onLongPressEnd() {
    setState(() => _isPaused = false);
    _progressController.forward();
  }

  // ── Swipe-up to dismiss ───────────────────────────────────────────────────

  void _onVerticalDragUpdate(DragUpdateDetails details) {
    // Only track upward drag (negative dy) or allow pulling back down
    setState(() {
      _dragOffset += details.delta.dy;
      // Clamp: allow slight downward overshoot but mainly track upward
      _dragOffset = _dragOffset.clamp(-MediaQuery.of(context).size.height, 40.0);
    });
    // Pause progress while dragging
    if (!_isPaused) _progressController.stop();
  }

  void _onVerticalDragEnd(DragEndDetails details) {
    final velocity = details.primaryVelocity ?? 0;
    // Dismiss if dragged far enough upward or flung upward fast
    if (_dragOffset < -_dismissThreshold || velocity < -800) {
      Navigator.of(context).pop();
    } else {
      // Snap back
      setState(() => _dragOffset = 0.0);
      if (!_isPaused) _progressController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Compute opacity and scale based on vertical drag
    final progress = (_dragOffset.abs() / _dismissThreshold).clamp(0.0, 1.0);
    final opacity = (1.0 - progress * 0.5).clamp(0.0, 1.0);
    final scale = (1.0 - progress * 0.1).clamp(0.85, 1.0);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black.withValues(alpha: opacity),
        body: GestureDetector(
          onVerticalDragUpdate: _onVerticalDragUpdate,
          onVerticalDragEnd: _onVerticalDragEnd,
          child: Transform.translate(
            offset: Offset(0, _dragOffset),
            child: Transform.scale(
              scale: scale,
              child: Opacity(
                opacity: opacity,
                child: Stack(
                  children: [
                    // Story pages
                    PageView.builder(
                      controller: _pageController,
                      itemCount: widget.stories.length,
                      onPageChanged: _onPageChanged,
                      itemBuilder: (context, index) {
                        final story = widget.stories[index];
                        return _StoryPage(
                          story: story,
                          onTapLeft: _goToPrevious,
                          onTapRight: _goToNext,
                          onLongPressStart: _onLongPressStart,
                          onLongPressEnd: _onLongPressEnd,
                          isMuted: _isMuted,
                          isPaused: _isPaused,
                        );
                      },
                    ),

                    // Progress bars at top
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 8,
                      right: 8,
                      child: AnimatedOpacity(
                        opacity: _isPaused ? 0.0 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: Row(
                          children:
                              List.generate(widget.stories.length, (index) {
                            return Expanded(
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 2),
                                child: index == _currentIndex
                                    ? AnimatedBuilder(
                                        animation: _progressController,
                                        builder: (context, child) {
                                          return LinearProgressIndicator(
                                            value: _progressController.value,
                                            minHeight: 2.5,
                                            color: Colors.white,
                                            backgroundColor: Colors.white
                                                .withValues(alpha: 0.3),
                                          );
                                        },
                                      )
                                    : LinearProgressIndicator(
                                        value:
                                            index < _currentIndex ? 1.0 : 0.0,
                                        minHeight: 2.5,
                                        color: Colors.white,
                                        backgroundColor: Colors.white
                                            .withValues(alpha: 0.3),
                                      ),
                              ),
                            );
                          }),
                        ),
                      ),
                    ),

                    // Close button
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 16,
                      left: 12,
                      child: AnimatedOpacity(
                        opacity: _isPaused ? 0.0 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.black.withValues(alpha: 0.4),
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Sound toggle button
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 16,
                      right: 12,
                      child: AnimatedOpacity(
                        opacity: _isPaused ? 0.0 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: GestureDetector(
                          onTap: () => setState(() => _isMuted = !_isMuted),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.black.withValues(alpha: 0.4),
                            ),
                            child: Icon(
                              _isMuted ? Icons.volume_off : Icons.volume_up,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Swipe-up hint indicator
                    Positioned(
                      bottom: MediaQuery.of(context).padding.bottom + 8,
                      left: 0,
                      right: 0,
                      child: AnimatedOpacity(
                        opacity: _isPaused ? 0.0 : 1.0,
                        duration: const Duration(milliseconds: 200),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.keyboard_arrow_up,
                              color: Colors.white.withValues(alpha: 0.5),
                              size: 20,
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
        ),
      ),
    );
  }
}

class _StoryPage extends StatelessWidget {
  final Story story;
  final VoidCallback onTapLeft;
  final VoidCallback onTapRight;
  final VoidCallback? onLongPressStart;
  final VoidCallback? onLongPressEnd;
  final bool isMuted;
  final bool isPaused;

  const _StoryPage({
    required this.story,
    required this.onTapLeft,
    required this.onTapRight,
    this.onLongPressStart,
    this.onLongPressEnd,
    this.isMuted = false,
    this.isPaused = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Full-screen media (image or video)
        if (story.mediaType == 'video' && story.videoUrl != null)
          StoryVideoPlayer(
            videoUrl: story.videoUrl!,
            isMuted: isMuted,
            isPaused: isPaused,
          )
        else
          AppCachedImage(
            imageUrl: story.imageUrl,
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
                Colors.black.withValues(alpha: 0.3),
                Colors.transparent,
                Colors.transparent,
                Colors.black.withValues(alpha: 0.7),
              ],
              stops: const [0.0, 0.3, 0.6, 1.0],
            ),
          ),
        ),

        // Tap zones (left = previous, right = next) + long-press to pause
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: onTapLeft,
                onLongPress: onLongPressStart,
                onLongPressUp: onLongPressEnd,
                behavior: HitTestBehavior.opaque,
                child: const SizedBox.expand(),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: onTapRight,
                onLongPress: onLongPressStart,
                onLongPressUp: onLongPressEnd,
                behavior: HitTestBehavior.opaque,
                child: const SizedBox.expand(),
              ),
            ),
          ],
        ),

        // Bottom content
        Positioned(
          bottom: MediaQuery.of(context).padding.bottom + 24,
          left: 24,
          right: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Story title
              Text(
                story.title,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 22,
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

              // "Read Article" button if linked
              if (story.articleId != null || story.articleSlug != null) ...[
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).pop();
                    final slug = story.articleSlug ?? story.articleId;
                    context.push('/article/$slug');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.likudBlue,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.article_outlined,
                          color: Colors.white,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'read_article'.tr(),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),

        // Comment button
        Positioned(
          bottom: MediaQuery.of(context).padding.bottom + 80,
          right: 16,
          child: GestureDetector(
            onTap: () => _openCommentsSheet(context),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black.withValues(alpha: 0.4),
              ),
              child: const Icon(
                Icons.comment_outlined,
                color: Colors.white,
                size: 22,
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _openCommentsSheet(BuildContext context) {
    onLongPressStart?.call(); // pause story progress

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.85,
          builder: (_, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
                child: Column(
                  children: [
                    // Drag handle
                    Padding(
                      padding: const EdgeInsets.only(top: 12, bottom: 4),
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    // Comments section
                    Expanded(
                      child: BlocProvider(
                        create: (_) => getIt<CommentsBloc>()
                          ..add(LoadComments(
                            articleId: story.id,
                            targetType: 'story',
                          )),
                        child: CommentsSection(
                          targetId: story.id,
                          targetType: 'story',
                          commentCount: 0,
                          allowComments: true,
                          targetTitle: story.title,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      onLongPressEnd?.call(); // resume story progress
    });
  }
}
