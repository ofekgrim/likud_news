import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Animated pulsing red dot indicating a live connection.
///
/// Used next to the "דסק החדשות" header to signal that
/// real-time SSE updates are active.
class LiveIndicator extends StatefulWidget {
  /// Diameter of the dot.
  final double size;

  /// Whether the indicator should actively pulse.
  /// When false, the dot is displayed at reduced opacity without animation.
  final bool isLive;

  const LiveIndicator({
    super.key,
    this.size = 10,
    this.isLive = true,
  });

  @override
  State<LiveIndicator> createState() => _LiveIndicatorState();
}

class _LiveIndicatorState extends State<LiveIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _animation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.isLive) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant LiveIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isLive && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.isLive && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.breakingRed.withValues(
              alpha: widget.isLive ? _animation.value : 0.3,
            ),
            boxShadow: widget.isLive
                ? [
                    BoxShadow(
                      color: AppColors.breakingRed
                          .withValues(alpha: _animation.value * 0.4),
                      blurRadius: widget.size * 0.8,
                      spreadRadius: widget.size * 0.2,
                    ),
                  ]
                : null,
          ),
        );
      },
    );
  }
}
