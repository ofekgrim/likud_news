import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/content_block.dart';

/// Renders a [VideoBlock] with in-app playback.
///
/// Supports two video sources:
/// - **YouTube** (`source: 'youtube'`): Shows thumbnail; on tap opens a
///   full-screen dialog with the YouTube embed WebView.
/// - **Upload** (`source: 'upload'`): Uses Chewie wrapping a native
///   [VideoPlayerController] for uploaded MP4/WebM videos.
///
/// Both display at 16:9 aspect ratio with optional caption and credit below.
class VideoPlayerWidget extends StatefulWidget {
  final VideoBlock block;
  final double fontScale;

  const VideoPlayerWidget({
    super.key,
    required this.block,
    this.fontScale = 1.0,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  // Upload video
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _uploadInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.block.source == 'upload' && widget.block.url != null) {
      _initUploadedVideo();
    }
  }

  void _initUploadedVideo() {
    _videoController = VideoPlayerController.networkUrl(
      Uri.parse(widget.block.url!),
    );
    _videoController!.initialize().then((_) {
      if (!mounted) return;
      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        aspectRatio: 16 / 9,
        autoPlay: false,
        looping: false,
        showControls: true,
        materialProgressColors: ChewieProgressColors(
          playedColor: AppColors.likudBlue,
          handleColor: AppColors.likudBlue,
          bufferedColor: AppColors.likudBlue.withValues(alpha: 0.3),
          backgroundColor: AppColors.border,
        ),
      );
      setState(() {
        _uploadInitialized = true;
      });
    });
  }

  /// Opens YouTube video in a full-screen dialog with an embedded WebView.
  /// This avoids platform view lifecycle issues in scrollable content.
  void _playYouTube() {
    final videoId = widget.block.videoId;
    if (videoId == null) return;

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => _YouTubePlayerPage(videoId: videoId),
      ),
    );
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Video area
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: widget.block.source == 'youtube'
                  ? _buildYouTubeThumbnail()
                  : _buildUploadPlayer(),
            ),
          ),

          // Caption
          if (widget.block.caption != null &&
              widget.block.caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 8),
              child: Text(
                widget.block.caption!,
                textAlign: TextAlign.start,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14 * widget.fontScale,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ),

          // Credit
          if (widget.block.credit != null && widget.block.credit!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 4),
              child: Text(
                widget.block.credit!,
                textAlign: TextAlign.start,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12 * widget.fontScale,
                  color: AppColors.textTertiary,
                  height: 1.4,
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// YouTube: thumbnail with play button. Tap opens full-screen player.
  Widget _buildYouTubeThumbnail() {
    final videoId = widget.block.videoId;
    final thumbnailUrl = widget.block.thumbnailUrl ??
        (videoId != null
            ? 'https://img.youtube.com/vi/$videoId/maxresdefault.jpg'
            : null);

    return GestureDetector(
      onTap: _playYouTube,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Thumbnail
          if (thumbnailUrl != null)
            AppCachedImage(
              imageUrl: thumbnailUrl,
              fit: BoxFit.cover,
              width: double.infinity,
            )
          else
            Container(color: AppColors.black),

          // Gradient scrim
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

          // Play button
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
    );
  }

  /// Uploaded video: Chewie native player.
  Widget _buildUploadPlayer() {
    if (!_uploadInitialized || _chewieController == null) {
      return Container(
        color: AppColors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: AppColors.likudBlue,
            strokeWidth: 2,
          ),
        ),
      );
    }

    return Chewie(controller: _chewieController!);
  }
}

/// Full-screen YouTube player page using WebView.
///
/// Isolated from the article scroll view to avoid platform view lifecycle
/// issues. Creates and owns its own WebViewController.
class _YouTubePlayerPage extends StatefulWidget {
  final String videoId;

  const _YouTubePlayerPage({required this.videoId});

  @override
  State<_YouTubePlayerPage> createState() => _YouTubePlayerPageState();
}

class _YouTubePlayerPageState extends State<_YouTubePlayerPage> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    // Lock to landscape for better video experience
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
      DeviceOrientation.portraitUp,
    ]);

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final url = request.url;
            if (url.startsWith('about:blank') ||
                url.contains('youtube.com') ||
                url.contains('youtube-nocookie.com') ||
                url.contains('ytimg.com') ||
                url.contains('googlevideo.com') ||
                url.contains('google.com') ||
                url.contains('gstatic.com') ||
                url.contains('googleapis.com')) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
        ),
      )
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) '
        'Version/17.0 Mobile/15E148 Safari/604.1',
      )
      ..loadRequest(
        Uri.parse(
          'https://www.youtube-nocookie.com/embed/${widget.videoId}'
          '?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1',
        ),
        headers: <String, String>{
          'Referer': 'https://www.youtube-nocookie.com',
        },
      );
  }

  @override
  void dispose() {
    // Restore orientation
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            onPressed: () async {
              final uri = Uri.parse(
                'https://www.youtube.com/watch?v=${widget.videoId}',
              );
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            tooltip: 'Open in YouTube',
          ),
        ],
      ),
      body: SafeArea(
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
