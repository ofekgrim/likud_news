import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Circular donut gauge showing voter turnout percentage.
///
/// Uses fl_chart PieChart in donut mode with a center label.
/// Animates value changes using [TweenAnimationBuilder].
class TurnoutGauge extends StatelessWidget {
  final double turnoutPercentage;
  final int totalVoters;
  final int totalEligible;

  const TurnoutGauge({
    super.key,
    required this.turnoutPercentage,
    required this.totalVoters,
    required this.totalEligible,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Donut chart with center text.
        SizedBox(
          width: 180,
          height: 180,
          child: TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0, end: turnoutPercentage),
            duration: const Duration(milliseconds: 1200),
            curve: Curves.easeOutCubic,
            builder: (context, animatedValue, child) {
              final filledPct = animatedValue.clamp(0.0, 100.0);
              final emptyPct = 100.0 - filledPct;

              return Stack(
                alignment: Alignment.center,
                children: [
                  PieChart(
                    PieChartData(
                      sectionsSpace: 0,
                      centerSpaceRadius: 55,
                      startDegreeOffset: -90,
                      sections: [
                        PieChartSectionData(
                          value: filledPct,
                          color: AppColors.likudBlue,
                          radius: 18,
                          showTitle: false,
                        ),
                        if (emptyPct > 0)
                          PieChartSectionData(
                            value: emptyPct,
                            color: AppColors.surfaceMedium,
                            radius: 18,
                            showTitle: false,
                          ),
                      ],
                    ),
                  ),
                  // Center label.
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${animatedValue.toStringAsFixed(1)}%',
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          color: AppColors.likudBlue,
                        ),
                      ),
                      Text(
                        'results.voted'.tr(),
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),

        const SizedBox(height: 12),

        // Voter counts below the donut.
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _formatNumber(totalVoters),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              ' / ${_formatNumber(totalEligible)} ',
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            Text(
              'results.of_eligible'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 12,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _formatNumber(int n) {
    if (n >= 1000000) {
      return '${(n / 1000000).toStringAsFixed(1)}M';
    }
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(1)}K';
    }
    return n.toString();
  }
}
