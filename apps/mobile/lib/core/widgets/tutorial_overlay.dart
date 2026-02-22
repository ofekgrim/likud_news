import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';

/// A semi-transparent overlay shown on first visit to guide users.
class TutorialOverlay extends StatefulWidget {
  final String titleKey;
  final String bodyKey;
  final VoidCallback onDismiss;
  final IconData icon;

  const TutorialOverlay({
    super.key,
    required this.titleKey,
    required this.bodyKey,
    required this.onDismiss,
    this.icon = Icons.auto_awesome,
  });

  @override
  State<TutorialOverlay> createState() => _TutorialOverlayState();
}

class _TutorialOverlayState extends State<TutorialOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _opacity = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _dismiss() {
    _controller.reverse().then((_) => widget.onDismiss());
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: GestureDetector(
        onTap: _dismiss,
        child: Container(
          color: Colors.black.withValues(alpha: 0.7),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.likudBlue.withValues(alpha: 0.2),
                    ),
                    child: Icon(
                      widget.icon,
                      size: 36,
                      color: AppColors.likudBlue,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    widget.titleKey.tr(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.bodyKey.tr(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                      color: Colors.white.withValues(alpha: 0.85),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _dismiss,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.likudBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                    child: Text(
                      'tutorial_got_it'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
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
}
