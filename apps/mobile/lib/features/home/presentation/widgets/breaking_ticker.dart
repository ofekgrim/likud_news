import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/ticker_item.dart';

/// Marquee-style breaking news ticker.
///
/// Displays a red bar with scrolling text items.
/// Tapping an item triggers [onItemTap] with the ticker item.
class BreakingTicker extends StatefulWidget {
  final List<TickerItem> items;
  final ValueChanged<TickerItem>? onItemTap;

  const BreakingTicker({
    super.key,
    required this.items,
    this.onItemTap,
  });

  @override
  State<BreakingTicker> createState() => _BreakingTickerState();
}

class _BreakingTickerState extends State<BreakingTicker>
    with SingleTickerProviderStateMixin {
  late final ScrollController _scrollController;
  late final AnimationController _animationController;

  /// Combined text of all ticker items separated by a bullet.
  String get _tickerText {
    return widget.items.map((item) => item.text).join('  \u2022  ');
  }

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(
        seconds: _tickerText.length ~/ 3, // Roughly 3 chars per second.
      ),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) => _startScrolling());
  }

  void _startScrolling() {
    if (!_scrollController.hasClients) return;
    final maxExtent = _scrollController.position.maxScrollExtent;
    if (maxExtent <= 0) return;

    _animationController.duration = Duration(
      seconds: (maxExtent / 40).ceil(), // ~40 px per second.
    );

    _animationController.addListener(() {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(
          _animationController.value *
              _scrollController.position.maxScrollExtent,
        );
      }
    });

    _animationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _scrollController.jumpTo(0);
        _animationController
          ..reset()
          ..forward();
      }
    });

    _animationController.forward();
  }

  @override
  void didUpdateWidget(covariant BreakingTicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.items != widget.items) {
      _animationController.stop();
      _scrollController.jumpTo(0);
      WidgetsBinding.instance.addPostFrameCallback((_) => _startScrolling());
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 36,
      color: AppColors.breakingRed,
      child: Row(
        children: [
          // "Breaking" badge.
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.black.withValues(alpha: 0.2),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.bolt, color: AppColors.white, size: 16),
                SizedBox(width: 4),
                Text(
                  'מבזק',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    color: AppColors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          // Scrolling text area.
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    for (int i = 0; i < widget.items.length; i++) ...[
                      GestureDetector(
                        onTap: () => widget.onItemTap?.call(widget.items[i]),
                        child: Text(
                          widget.items[i].text,
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            color: AppColors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      if (i < widget.items.length - 1)
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            '\u2022',
                            style: TextStyle(
                              color: AppColors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                    ],
                    // Extra space so text scrolls fully off-screen.
                    const SizedBox(width: 120),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
