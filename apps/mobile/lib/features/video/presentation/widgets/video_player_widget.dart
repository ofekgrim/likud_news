import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/video_article.dart';

/// Video player widget that handles multiple video source types.
///
/// Detects the video source from [VideoArticle.videoUrl] and renders:
/// - **YouTube** URLs: Shows thumbnail with play button; tap opens a
///   full-screen WebView player dialog.
/// - **Direct video** (MP4, WebM): Uses Chewie wrapping a native
///   [VideoPlayerController] for inline playback.
/// - **Social embeds** (X/Twitter, Facebook, Instagram): Shows thumbnail
///   with play button; tap opens an in-app WebView using platform embed APIs.
///
/// All variants display at 16:9 aspect ratio.
class VideoPlayerWidget extends StatefulWidget {
  final VideoArticle video;

  const VideoPlayerWidget({super.key, required this.video});

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _initialized = false;

  // ---------------------------------------------------------------------------
  // Source detection
  // ---------------------------------------------------------------------------

  /// Extracts the 11-character YouTube video ID from common URL patterns.
  ///
  /// Supported formats:
  /// - `https://www.youtube.com/watch?v=XXXX`
  /// - `https://www.youtube.com/embed/XXXX`
  /// - `https://youtu.be/XXXX`
  String? get _youtubeId {
    final url = widget.video.videoUrl;
    if (url == null) return null;
    final match = RegExp(
      r'(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
    ).firstMatch(url);
    return match?.group(1);
  }

  bool get _isYouTube => _youtubeId != null;

  bool get _isSocialEmbed {
    final url = widget.video.videoUrl;
    if (url == null) return false;
    return url.contains('x.com') ||
        url.contains('twitter.com') ||
        url.contains('facebook.com') ||
        url.contains('instagram.com');
  }

  bool get _isDirectVideo =>
      !_isYouTube && !_isSocialEmbed && widget.video.videoUrl != null;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    if (_isDirectVideo) {
      _initDirectVideo();
    }
  }

  void _initDirectVideo() {
    _videoController = VideoPlayerController.networkUrl(
      Uri.parse(widget.video.videoUrl!),
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
      setState(() => _initialized = true);
    });
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Navigation actions
  // ---------------------------------------------------------------------------

  /// Opens YouTube video in a full-screen dialog with an embedded WebView.
  void _openYouTube() {
    final videoId = _youtubeId;
    if (videoId == null) return;

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => _YouTubePlayerPage(videoId: videoId),
      ),
    );
  }

  /// Opens a social media video URL in a full-screen in-app WebView dialog.
  ///
  /// Uses platform embed APIs (Twitter widgets.js, Facebook plugins,
  /// Instagram /embed/) to display content without requiring user login.
  void _openSocialEmbed() {
    final url = widget.video.videoUrl;
    if (url == null) return;

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        fullscreenDialog: true,
        builder: (_) => _SocialEmbedPage(url: url, title: widget.video.title),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: _isYouTube
          ? _buildThumbnailWithPlay(onTap: _openYouTube)
          : _isSocialEmbed
          ? _buildThumbnailWithPlay(onTap: _openSocialEmbed)
          : _buildDirectPlayer(),
    );
  }

  /// Renders a thumbnail image with a centered play button overlay.
  ///
  /// Used for YouTube and social embed sources where playback happens in a
  /// separate full-screen page.
  Widget _buildThumbnailWithPlay({required VoidCallback onTap}) {
    final thumbnailUrl =
        widget.video.heroImageUrl ??
        (_isYouTube
            ? 'https://img.youtube.com/vi/$_youtubeId/maxresdefault.jpg'
            : null);

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Thumbnail image
          if (thumbnailUrl != null)
            AppCachedImage(
              imageUrl: thumbnailUrl,
              fit: BoxFit.cover,
              width: double.infinity,
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

          // Gradient scrim at the bottom
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
              width: 64,
              height: 64,
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
                size: 36,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Renders the Chewie player for direct MP4/WebM video URLs.
  ///
  /// While the video controller is still initializing, shows the hero image
  /// (if available) with a loading spinner overlay.
  Widget _buildDirectPlayer() {
    if (!_initialized || _chewieController == null) {
      return Container(
        color: AppColors.black,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (widget.video.heroImageUrl != null)
              AppCachedImage(
                imageUrl: widget.video.heroImageUrl!,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            const Center(
              child: CircularProgressIndicator(
                color: AppColors.likudBlue,
                strokeWidth: 2,
              ),
            ),
          ],
        ),
      );
    }

    return Chewie(controller: _chewieController!);
  }
}

// =============================================================================
// _YouTubePlayerPage
// =============================================================================

/// Full-screen YouTube player page using WebView.
///
/// Isolated from the video list scroll view to avoid platform view lifecycle
/// issues. Creates and owns its own [WebViewController]. The YouTube embed is
/// loaded via the privacy-enhanced domain (`youtube-nocookie.com`) with
/// autoplay enabled.
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
    // Allow landscape for better video experience.
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
    // Restore default orientation preferences.
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
      body: SafeArea(child: WebViewWidget(controller: _controller)),
    );
  }
}

// =============================================================================
// _SocialEmbedPage
// =============================================================================

/// Full-screen social video page using platform embed APIs.
///
/// Loads social media URLs (X/Twitter, Facebook, Instagram) via their
/// official embed/widget endpoints, which display content publicly
/// without requiring user login. Falls back to a direct iframe for
/// unknown sources.
class _SocialEmbedPage extends StatefulWidget {
  final String url;
  final String title;

  const _SocialEmbedPage({required this.url, required this.title});

  @override
  State<_SocialEmbedPage> createState() => _SocialEmbedPageState();
}

class _SocialEmbedPageState extends State<_SocialEmbedPage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  /// Builds an HTML page that uses the platform's official embed/widget
  /// API so the content loads without authentication.
  String _buildEmbedHtml() {
    final url = widget.url;

    // ── X / Twitter ──────────────────────────────────────────────────
    if (url.contains('x.com') || url.contains('twitter.com')) {
      return '''
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:16px;background:#000;display:flex;justify-content:center;align-items:start;min-height:100vh;}
  .twitter-tweet{max-width:100%!important;}
</style>
</head><body>
<blockquote class="twitter-tweet" data-theme="dark" data-width="100%">
  <a href="$url"></a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js"></script>
</body></html>''';
    }

    // ── Facebook ─────────────────────────────────────────────────────
    if (url.contains('facebook.com')) {
      final encoded = Uri.encodeComponent(url);
      return '''
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style>
</head><body>
<iframe
  src="https://www.facebook.com/plugins/video.php?href=$encoded&show_text=false&width=560&height=315"
  width="100%" height="315"
  style="border:none;overflow:hidden"
  scrolling="no" frameborder="0"
  allow="autoplay;clipboard-write;encrypted-media;picture-in-picture;web-share"
  allowFullScreen="true">
</iframe>
</body></html>''';
    }

    // ── Instagram ────────────────────────────────────────────────────
    if (url.contains('instagram.com')) {
      final embedUrl = url.endsWith('/') ? '${url}embed/' : '$url/embed/';
      return '''
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;}iframe{width:100%;min-height:80vh;border:none;}</style>
</head><body>
<iframe src="$embedUrl" frameborder="0" scrolling="no"
  allowtransparency="true" allowfullscreen="true"
  style="width:100%;min-height:80vh;border:none;">
</iframe>
</body></html>''';
    }

    // ── Fallback ─────────────────────────────────────────────────────
    return '''
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#000;}iframe{width:100%;height:100vh;border:none;}</style>
</head><body>
<iframe src="$url" frameborder="0" allowfullscreen
  style="width:100%;height:100vh;border:none;">
</iframe>
</body></html>''';
  }

  @override
  void initState() {
    super.initState();
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
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) '
        'Version/17.0 Mobile/15E148 Safari/604.1',
      )
      ..loadHtmlString(_buildEmbedHtml());
  }

  @override
  void dispose() {
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
        title: Text(
          widget.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            onPressed: () async {
              final uri = Uri.tryParse(widget.url);
              if (uri != null && await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            tooltip: 'Open externally',
          ),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(
                  color: AppColors.likudBlue,
                  strokeWidth: 2,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
