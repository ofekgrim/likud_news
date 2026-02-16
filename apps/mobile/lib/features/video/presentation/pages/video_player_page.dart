import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/video_article.dart';
import '../widgets/video_player_widget.dart';

/// Full-screen video player page.
///
/// Shows the video player, title, category badge, and share controls.
/// Uses [VideoPlayerWidget] as a placeholder for media_kit integration.
class VideoPlayerPage extends StatelessWidget {
  final VideoArticle video;

  const VideoPlayerPage({
    super.key,
    required this.video,
  });

  void _onShare() {
    final shareText =
        '${video.title}\n${video.videoUrl ?? video.slug ?? ''}';
    Share.share(shareText);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        backgroundColor: AppColors.black,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward, color: AppColors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: AppColors.white),
            onPressed: _onShare,
          ),
        ],
        title: const Text(
          '\u05D5\u05D9\u05D3\u05D0\u05D5',
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Video player.
          VideoPlayerWidget(video: video),
          // Video info.
          Expanded(
            child: Container(
              color: AppColors.white,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category badge.
                    if (video.categoryName != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: _parseCategoryColor(video.categoryColor)
                              .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          video.categoryName!,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color:
                                _parseCategoryColor(video.categoryColor),
                          ),
                        ),
                      ),
                    // Title.
                    Text(
                      video.title,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        height: 1.3,
                      ),
                      textDirection: TextDirection.rtl,
                    ),
                    // Subtitle.
                    if (video.subtitle != null &&
                        video.subtitle!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        video.subtitle!,
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                        textDirection: TextDirection.rtl,
                      ),
                    ],
                    const SizedBox(height: 20),
                    // Share button.
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _onShare,
                        icon: const Icon(Icons.share_outlined),
                        label: const Text(
                          '\u05E9\u05EA\u05E3',
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.likudBlue,
                          side: const BorderSide(color: AppColors.likudBlue),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
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
