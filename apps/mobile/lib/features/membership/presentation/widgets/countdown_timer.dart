import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/membership_info.dart';

/// Circular countdown timer showing months since membership join.
///
/// Displays a 16-month countdown to voting eligibility.
/// If already eligible, shows a completed state with checkmark.
class CountdownTimer extends StatelessWidget {
  final MembershipInfo info;

  /// Total months required for eligibility.
  static const int _totalMonths = 16;

  const CountdownTimer({super.key, required this.info});

  @override
  Widget build(BuildContext context) {
    final monthsSinceJoin = info.monthsSinceJoin.clamp(0, _totalMonths);
    final isEligible = info.isEligible || monthsSinceJoin >= _totalMonths;
    final monthsRemaining =
        isEligible ? 0 : (_totalMonths - monthsSinceJoin).clamp(0, _totalMonths);
    final progress =
        isEligible ? 1.0 : (monthsSinceJoin / _totalMonths).clamp(0.0, 1.0);

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: context.colors.cardSurface,
      child: Padding(
        padding: const EdgeInsetsDirectional.all(20),
        child: Column(
          children: [
            // Header.
            Row(
              children: [
                const Icon(
                  Icons.timer_outlined,
                  color: AppColors.likudBlue,
                  size: 22,
                ),
                const SizedBox(width: 8),
                Text(
                  'membership_eligibility_countdown'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: context.colors.textPrimary,
                  ),
                  textDirection: TextDirection.rtl,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Circular progress indicator.
            SizedBox(
              width: 140,
              height: 140,
              child: CustomPaint(
                painter: _CircularProgressPainter(
                  progress: progress,
                  progressColor:
                      isEligible ? AppColors.success : AppColors.likudBlue,
                  trackColor: context.colors.border,
                  strokeWidth: 10,
                ),
                child: Center(
                  child: isEligible
                      ? Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.check_circle,
                              color: AppColors.success,
                              size: 36,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'eligible_to_vote'.tr(),
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                              ),
                              textDirection: TextDirection.rtl,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        )
                      : Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$monthsRemaining',
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
                                color: context.colors.textPrimary,
                              ),
                            ),
                            Text(
                              'months_remaining'.tr(),
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 11,
                                color: context.colors.textSecondary,
                              ),
                              textDirection: TextDirection.rtl,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Progress label.
            Text(
              isEligible
                  ? 'membership_eligibility_reached'.tr()
                  : 'membership_months_progress'.tr(
                      args: ['$monthsSinceJoin', '$_totalMonths'],
                    ),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: context.colors.textSecondary,
              ),
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Custom painter for a circular progress ring.
class _CircularProgressPainter extends CustomPainter {
  final double progress;
  final Color progressColor;
  final Color trackColor;
  final double strokeWidth;

  _CircularProgressPainter({
    required this.progress,
    required this.progressColor,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) - strokeWidth) / 2;

    // Track (background circle).
    final trackPaint = Paint()
      ..color = trackColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc.
    final progressPaint = Paint()
      ..color = progressColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2, // Start from top.
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_CircularProgressPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.trackColor != trackColor;
  }
}
