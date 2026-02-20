import 'dart:async';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/content_block.dart';

/// Renders a [TweetEmbedBlock] as a full Twitter/X embed using WebView.
///
/// Loads Twitter's embed JavaScript (`widgets.js`) inside a sized WebView to
/// render the tweet with full fidelity — profile picture, text, media,
/// timestamp, and engagement metrics. Falls back to a static preview card
/// if the WebView fails to load within 10 seconds.
class TweetEmbedWidget extends StatefulWidget {
  final TweetEmbedBlock block;

  const TweetEmbedWidget({
    super.key,
    required this.block,
  });

  @override
  State<TweetEmbedWidget> createState() => _TweetEmbedWidgetState();
}

class _TweetEmbedWidgetState extends State<TweetEmbedWidget> {
  late final WebViewController _controller;
  double _webViewHeight = 350;
  bool _isLoading = true;
  bool _hasError = false;
  Timer? _timeoutTimer;

  String get _tweetUrl => 'https://x.com/i/status/${widget.block.tweetId}';

  @override
  void initState() {
    super.initState();
    _initWebView();
    // Fallback: if tweet doesn't render in 10s, show static card.
    _timeoutTimer = Timer(const Duration(seconds: 10), () {
      if (_isLoading && mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    });
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.transparent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final url = request.url;
            // Allow initial load + Twitter widget resources
            if (url.startsWith('about:blank') ||
                url.contains('platform.twitter.com') ||
                url.contains('cdn.syndication.twimg.com') ||
                url.contains('pbs.twimg.com') ||
                url.contains('abs.twimg.com') ||
                url.contains('syndication.twitter.com') ||
                url.contains('twitter.com/i/status')) {
              return NavigationDecision.navigate;
            }
            // Open all other URLs externally (links inside the tweet)
            launchUrl(
              Uri.parse(url),
              mode: LaunchMode.externalApplication,
            );
            return NavigationDecision.prevent;
          },
          onPageFinished: (_) {
            _pollForHeight();
          },
          onWebResourceError: (_) {
            if (mounted) {
              setState(() {
                _hasError = true;
                _isLoading = false;
              });
            }
          },
        ),
      )
      ..addJavaScriptChannel(
        'TweetHeight',
        onMessageReceived: (message) {
          final height = double.tryParse(message.message);
          if (height != null && height > 0 && mounted) {
            setState(() {
              _webViewHeight = height + 16;
              _isLoading = false;
            });
            _timeoutTimer?.cancel();
          }
        },
      )
      ..loadHtmlString(_buildHtml());
  }

  /// Polls for the rendered tweet height. Twitter's widgets.js creates an
  /// iframe asynchronously, so we poll until the container has content.
  void _pollForHeight() {
    _controller.runJavaScript('''
      (function poll() {
        var container = document.getElementById('tweet-container');
        if (container && container.offsetHeight > 100) {
          TweetHeight.postMessage(container.offsetHeight.toString());
        } else {
          setTimeout(poll, 300);
        }
      })();
    ''');
  }

  String _buildHtml() {
    final tweetId = widget.block.tweetId;
    final authorHandle = widget.block.authorHandle ?? 'i';
    return '''
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    }
    #tweet-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .twitter-tweet { margin: 0 !important; }
  </style>
</head>
<body>
  <div id="tweet-container">
    <blockquote class="twitter-tweet" data-lang="he" data-dnt="true">
      <a href="https://twitter.com/$authorHandle/status/$tweetId"></a>
    </blockquote>
  </div>
  <script>
    window.twttr = (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
      if (d.getElementById(id)) return t;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js, fjs);
      t._e = [];
      t.ready = function(f) { t._e.push(f); };
      return t;
    }(document, "script", "twitter-wjs"));

    twttr.ready(function(twttr) {
      twttr.events.bind('rendered', function(event) {
        setTimeout(function() {
          var container = document.getElementById('tweet-container');
          if (container) {
            TweetHeight.postMessage(container.offsetHeight.toString());
          }
        }, 500);
      });
    });
  </script>
</body>
</html>
''';
  }

  Future<void> _openTweet() async {
    final uri = Uri.parse(_tweetUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
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
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _hasError ? _buildFallbackCard() : _buildWebView(),
          ),
          // Caption below
          if (widget.block.caption != null &&
              widget.block.caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsetsDirectional.only(top: 8),
              child: Text(
                widget.block.caption!,
                textAlign: TextAlign.start,
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
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

  Widget _buildWebView() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      height: _webViewHeight,
      child: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Positioned.fill(
              child: ShimmerLoading(height: 350, borderRadius: 12),
            ),
        ],
      ),
    );
  }

  /// Static fallback card matching the original design.
  Widget _buildFallbackCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: X logo + handle
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.black,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: const Text(
                  '\ud835\udd4f',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.white,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              if (widget.block.authorHandle != null &&
                  widget.block.authorHandle!.isNotEmpty)
                Expanded(
                  child: Text(
                    '@${widget.block.authorHandle}',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
            ],
          ),

          // Preview text
          if (widget.block.previewText != null &&
              widget.block.previewText!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              widget.block.previewText!,
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 15,
                color: AppColors.textPrimary,
                height: 1.6,
              ),
              maxLines: 6,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          const SizedBox(height: 12),

          // "View on X" button
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              onPressed: _openTweet,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.likudBlue,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'view_on_x'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
