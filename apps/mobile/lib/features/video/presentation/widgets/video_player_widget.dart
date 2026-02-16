import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/video_article.dart';

/// Placeholder video player widget.
///
/// Shows the hero image with a large play button overlay.
/// Tapping toggles between play/pause state.
/// Can be replaced with a real media_kit player integration later.
class VideoPlayerWidget extends StatefulWidget {
  final VideoArticle video;

  const VideoPlayerWidget({
    super.key,
    required this.video,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  bool _isPlaying = false;

  void _togglePlayState() {
    setState(() {
      _isPlaying = !_isPlaying;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePlayState,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video thumbnail / hero image.
            if (widget.video.heroImageUrl != null &&
                widget.video.heroImageUrl!.isNotEmpty)
              AppCachedImage(
                imageUrl: widget.video.heroImageUrl!,
                fit: BoxFit.cover,
              )
            else
              Container(
                color: AppColors.black,
                child: const Icon(
                  Icons.videocam_off_outlined,
                  color: AppColors.textTertiary,
                  size: 48,
                ),
              ),
            // Dark overlay when not playing.
            if (!_isPlaying)
              Container(
                color: AppColors.black.withValues(alpha: 0.35),
              ),
            // Play/Pause button.
            Center(
              child: AnimatedOpacity(
                opacity: _isPlaying ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.black.withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isPlaying ? Icons.pause : Icons.play_arrow,
                    size: 36,
                    color: AppColors.likudBlue,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
