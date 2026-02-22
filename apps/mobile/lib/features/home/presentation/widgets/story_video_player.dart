import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// Manages video playback for a single video story.
class StoryVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool isMuted;
  final bool isPaused;
  final VoidCallback? onVideoReady;

  const StoryVideoPlayer({
    super.key,
    required this.videoUrl,
    this.isMuted = false,
    this.isPaused = false,
    this.onVideoReady,
  });

  @override
  State<StoryVideoPlayer> createState() => _StoryVideoPlayerState();
}

class _StoryVideoPlayerState extends State<StoryVideoPlayer> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl))
      ..initialize().then((_) {
        if (mounted) {
          setState(() => _isInitialized = true);
          _controller.setLooping(true);
          _controller.setVolume(widget.isMuted ? 0.0 : 1.0);
          if (!widget.isPaused) {
            _controller.play();
          }
          widget.onVideoReady?.call();
        }
      });
  }

  @override
  void didUpdateWidget(StoryVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isMuted != oldWidget.isMuted) {
      _controller.setVolume(widget.isMuted ? 0.0 : 1.0);
    }
    if (widget.isPaused != oldWidget.isPaused) {
      widget.isPaused ? _controller.pause() : _controller.play();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return SizedBox.expand(
      child: FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: _controller.value.size.width,
          height: _controller.value.size.height,
          child: VideoPlayer(_controller),
        ),
      ),
    );
  }
}
