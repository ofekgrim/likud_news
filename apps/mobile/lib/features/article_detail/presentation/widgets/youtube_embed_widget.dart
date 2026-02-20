import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/content_block.dart';

/// Renders a [YouTubeEmbedBlock] as a tappable thumbnail with a play overlay.
///
/// Displays the YouTube video thumbnail at 16:9 aspect ratio with a centered
/// red play button. Tapping opens the YouTube video in an external browser or
/// the YouTube app. Optional caption and credit text appear below the thumbnail.
class YouTubeEmbedWidget extends StatelessWidget {
  /// The YouTube embed content block to render.
  final YouTubeEmbedBlock block;

  const YouTubeEmbedWidget({
    super.key,
    required this.block,
  });

  /// Thumbnail URL for the YouTube video at maximum resolution.
  String get _thumbnailUrl =>
      'https://img.youtube.com/vi/${block.videoId}/maxresdefault.jpg';

  /// Full YouTube video URL.
  String get _videoUrl =>
      'https://www.youtube.com/watch?v=${block.videoId}';

  Future<void> _openVideo() async {
    final uri = Uri.parse(_videoUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Thumbnail with play button overlay
          GestureDetector(
            onTap: _openVideo,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Video thumbnail
                    AppCachedImage(
                      imageUrl: _thumbnailUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                    ),

                    // Gradient scrim at bottom for better text readability
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 80,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              AppColors.black.withValues(alpha: 0.6),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Centered play button
                    Center(
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.breakingRed.withValues(alpha: 0.9),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.black.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.play_arrow_rounded,
                          color: AppColors.white,
                          size: 32,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Caption
          if (block.caption != null && block.caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 8),
              child: Text(
                block.caption!,
                textAlign: TextAlign.start,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ),

          // Credit
          if (block.credit != null && block.credit!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 4),
              child: Text(
                block.credit!,
                textAlign: TextAlign.start,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  color: AppColors.textTertiary,
                  height: 1.4,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
