import 'dart:async';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/content_block.dart';

/// Renders a [FacebookEmbedBlock] as a Facebook video/post embed using WebView.
///
/// Uses Facebook's plugin endpoint (`facebook.com/plugins/video.php`) for video
/// URLs and (`facebook.com/plugins/post.php`) for regular posts. Falls back to
/// a static card if the embed fails.
class FacebookEmbedWidget extends StatefulWidget {
  final FacebookEmbedBlock block;

  const FacebookEmbedWidget({
    super.key,
    required this.block,
  });

  @override
  State<FacebookEmbedWidget> createState() => _FacebookEmbedWidgetState();
}

class _FacebookEmbedWidgetState extends State<FacebookEmbedWidget> {
  late final WebViewController _controller;
  double _webViewHeight = 400;
  bool _isLoading = true;
  bool _hasError = false;
  Timer? _timeoutTimer;

  bool get _isVideo => widget.block.postUrl.contains('/videos/') ||
      widget.block.postUrl.contains('/reel/');

  @override
  void initState() {
    super.initState();
    _initWebView();
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
            if (url.startsWith('about:blank') ||
                url.contains('facebook.com') ||
                url.contains('fbcdn.net') ||
                url.contains('connect.facebook.net')) {
              return NavigationDecision.navigate;
            }
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
        'EmbedHeight',
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
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
        'AppleWebKit/605.1.15 (KHTML, like Gecko) '
        'Version/17.0 Mobile/15E148 Safari/604.1',
      )
      ..loadHtmlString(_buildHtml());
  }

  void _pollForHeight() {
    _controller.runJavaScript('''
      (function poll() {
        var body = document.body;
        if (body && body.scrollHeight > 100) {
          EmbedHeight.postMessage(body.scrollHeight.toString());
        } else {
          setTimeout(poll, 300);
        }
      })();
    ''');
  }

  String _buildHtml() {
    final encoded = Uri.encodeComponent(widget.block.postUrl);
    final pluginType = _isVideo ? 'video' : 'post';
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
      display: flex;
      justify-content: center;
      width: 100%;
      overflow: hidden;
    }
    iframe { width: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://www.facebook.com/plugins/$pluginType.php?href=$encoded&show_text=true&width=560"
    width="100%" height="400"
    style="border:none;overflow:hidden"
    scrolling="no" frameborder="0"
    allow="autoplay;clipboard-write;encrypted-media;picture-in-picture;web-share"
    allowFullScreen="true">
  </iframe>
  <script>
    setTimeout(function() {
      var body = document.body;
      if (body) {
        EmbedHeight.postMessage(Math.max(body.scrollHeight, 400).toString());
      }
    }, 3000);
  </script>
</body>
</html>
''';
  }

  Future<void> _openInBrowser() async {
    final uri = Uri.tryParse(widget.block.postUrl);
    if (uri != null && await canLaunchUrl(uri)) {
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
              child: ShimmerLoading(height: 400, borderRadius: 12),
            ),
        ],
      ),
    );
  }

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
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFF1877F2),
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: const Text(
                  'f',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Facebook',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              onPressed: _openInBrowser,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.likudBlue,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'view_on_facebook'.tr(),
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
