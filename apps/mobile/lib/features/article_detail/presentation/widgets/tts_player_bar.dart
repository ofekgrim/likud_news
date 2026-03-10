import 'dart:async';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../../../app/router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/services/tts_service.dart';
import '../../../../core/widgets/liquid_glass_container.dart';

/// LiquidGlass-styled TTS player bar for article reading.
///
/// Idle state: compact "Listen to article" button.
/// Active state: glassmorphic player with play/pause, skip, stop,
/// speed control, animated progress bar, and sentence counter.
class TtsPlayerBar extends StatefulWidget {
  final String title;
  final String? subtitle;
  final String content;

  const TtsPlayerBar({
    super.key,
    required this.title,
    this.subtitle,
    required this.content,
  });

  @override
  State<TtsPlayerBar> createState() => _TtsPlayerBarState();
}

class _TtsPlayerBarState extends State<TtsPlayerBar>
    with SingleTickerProviderStateMixin, RouteAware {
  final TtsService _tts = GetIt.I<TtsService>();
  late StreamSubscription<TtsPlaybackState> _stateSub;
  late StreamSubscription<double> _progressSub;
  late StreamSubscription<TtsSpeed> _speedSub;

  TtsPlaybackState _state = TtsPlaybackState.idle;
  double _targetProgress = 0.0;
  TtsSpeed _speed = TtsSpeed.normal;

  late final AnimationController _progressAnim;
  late Animation<double> _progressTween;

  @override
  void initState() {
    super.initState();
    _state = _tts.state;
    _speed = _tts.speed;

    _progressAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _progressTween = Tween<double>(
      begin: 0,
      end: 0,
    ).animate(CurvedAnimation(parent: _progressAnim, curve: Curves.easeInOut));

    _stateSub = _tts.stateStream.listen((state) {
      if (mounted) setState(() => _state = state);
    });
    _progressSub = _tts.progressStream.listen((progress) {
      if (!mounted) return;
      // setState so sentence counter text also rebuilds.
      setState(() {
        final oldValue = _progressTween.value;
        _targetProgress = progress;
        _progressTween = Tween<double>(begin: oldValue, end: _targetProgress)
            .animate(
              CurvedAnimation(parent: _progressAnim, curve: Curves.easeInOut),
            );
        _progressAnim.forward(from: 0);
      });
    });
    _speedSub = _tts.speedStream.listen((speed) {
      if (mounted) setState(() => _speed = speed);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route != null) {
      AppRouter.routeObserver.subscribe(this, route);
    }
  }

  /// Called when a new route is pushed on top — stop TTS.
  @override
  void didPushNext() {
    if (_tts.state != TtsPlaybackState.idle) {
      _tts.stop();
    }
  }

  @override
  void dispose() {
    AppRouter.routeObserver.unsubscribe(this);
    _stateSub.cancel();
    _progressSub.cancel();
    _speedSub.cancel();
    _progressAnim.dispose();
    _tts.stop();
    super.dispose();
  }

  String _buildFullText() {
    final buffer = StringBuffer();
    buffer.writeln(widget.title);
    if (widget.subtitle != null && widget.subtitle!.isNotEmpty) {
      buffer.writeln(widget.subtitle);
    }
    buffer.writeln();
    buffer.write(widget.content);
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    if (_state == TtsPlaybackState.idle) {
      return _buildListenButton();
    }
    return _buildPlayerBar();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    if (minutes > 0) {
      return '$minutes:${seconds.toString().padLeft(2, '0')} ${'tts_minutes'.tr()}';
    }
    return '$seconds ${'tts_seconds'.tr()}';
  }

  Widget _buildListenButton() {
    final fullText = _buildFullText();
    final estimate = TtsService.estimateReadingTime(fullText, speed: _speed);
    final durationLabel = _formatDuration(estimate);

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 16, 8),
      child: Semantics(
        button: true,
        label: 'tts_listen'.tr(),
        child: LiquidGlassContainer(
          borderRadius: 24,
          blurSigma: 12,
          backgroundColor: AppColors.likudBlue,
          backgroundOpacity: 0.08,
          border: Border.all(
            color: AppColors.likudBlue.withValues(alpha: 0.25),
            width: 0.5,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: InkWell(
            onTap: () => _tts.speak(fullText),
            borderRadius: BorderRadius.circular(24),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.headphones_rounded,
                    size: 20,
                    color: AppColors.likudBlue,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'tts_listen'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.likudBlue,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '· $durationLabel',
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: AppColors.likudBlue.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlayerBar() {
    final isPlaying = _state == TtsPlaybackState.playing;
    final sentenceText = _tts.totalSentences > 0
        ? '${_tts.currentSentenceIndex + 1}/${_tts.totalSentences}'
        : '';

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 4, 16, 8),
      child: LiquidGlassContainer(
        borderRadius: 20,
        blurSigma: 18,
        backgroundColor: context.colors.glassBg,
        backgroundOpacity: 0.82,
        border: Border.all(
          color: AppColors.likudBlue.withValues(alpha: 0.18),
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.likudBlue.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
        padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top row: icon + status + controls
            Row(
              children: [
                // Animated headphones icon
                _AnimatedHeadphones(isPlaying: isPlaying),
                const SizedBox(width: 10),

                // Status + sentence counter
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isPlaying ? 'tts_reading'.tr() : 'tts_paused'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.likudBlue,
                        ),
                      ),
                      if (sentenceText.isNotEmpty)
                        Text(
                          sentenceText,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            color: context.colors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                ),

                // Speed button
                Semantics(
                  button: true,
                  label: 'tts_speed'.tr(),
                  child: SizedBox(
                    width: 44,
                    height: 44,
                    child: InkWell(
                      onTap: () => _tts.cycleSpeed(),
                      borderRadius: BorderRadius.circular(12),
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.likudBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _speed.label,
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.likudBlue,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // Skip backward
                Semantics(
                  button: true,
                  label: 'tts_skip_back'.tr(),
                  child: SizedBox(
                    width: 36,
                    height: 44,
                    child: IconButton(
                      onPressed: () => _tts.skipBackward(),
                      icon: Icon(
                        Icons.skip_next_rounded,
                        color: context.colors.textSecondary,
                        size: 22,
                      ),
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ),

                // Play/Pause
                Semantics(
                  button: true,
                  label: isPlaying ? 'tts_pause'.tr() : 'tts_resume'.tr(),
                  child: SizedBox(
                    width: 48,
                    height: 48,
                    child: IconButton(
                      onPressed: () => _tts.togglePlayPause(),
                      icon: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: Icon(
                          isPlaying
                              ? Icons.pause_circle_filled_rounded
                              : Icons.play_circle_filled_rounded,
                          key: ValueKey(isPlaying),
                          color: AppColors.likudBlue,
                          size: 38,
                        ),
                      ),
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ),

                // Skip forward
                Semantics(
                  button: true,
                  label: 'tts_skip_forward'.tr(),
                  child: SizedBox(
                    width: 36,
                    height: 44,
                    child: IconButton(
                      onPressed: () => _tts.skipForward(),
                      icon: Icon(
                        Icons.skip_previous_rounded,
                        color: context.colors.textSecondary,
                        size: 22,
                      ),
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ),

                // Stop
                Semantics(
                  button: true,
                  label: 'tts_stop'.tr(),
                  child: SizedBox(
                    width: 36,
                    height: 44,
                    child: IconButton(
                      onPressed: () => _tts.stop(),
                      icon: Icon(
                        Icons.stop_circle_rounded,
                        color: context.colors.textTertiary,
                        size: 24,
                      ),
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Animated progress bar
            AnimatedBuilder(
              animation: _progressAnim,
              builder: (context, _) {
                return ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: _progressTween.value.clamp(0.0, 1.0),
                    minHeight: 5,
                    color: AppColors.likudBlue,
                    backgroundColor: AppColors.likudBlue.withValues(alpha: 0.1),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Subtle pulsing headphones icon while playing.
class _AnimatedHeadphones extends StatefulWidget {
  final bool isPlaying;
  const _AnimatedHeadphones({required this.isPlaying});

  @override
  State<_AnimatedHeadphones> createState() => _AnimatedHeadphonesState();
}

class _AnimatedHeadphonesState extends State<_AnimatedHeadphones>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _scale = Tween<double>(
      begin: 1.0,
      end: 1.15,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
    if (widget.isPlaying) _controller.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant _AnimatedHeadphones oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isPlaying && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.isPlaying && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
    // Respect reduce motion
    if (MediaQuery.of(context).disableAnimations && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    if (reduceMotion) {
      return Icon(
        Icons.headphones_rounded,
        size: 22,
        color: AppColors.likudBlue,
      );
    }
    return ScaleTransition(
      scale: _scale,
      child: Icon(
        Icons.headphones_rounded,
        size: 22,
        color: AppColors.likudBlue,
      ),
    );
  }
}
