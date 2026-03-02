import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

/// Circular percentage indicator showing a candidate's match percentage.
///
/// Uses fl_chart's [PieChart] to render the circle. The percentage text
/// is displayed centered inside the chart.
///
/// Color coding:
/// - >70%: green
/// - 40-70%: yellow/amber
/// - <40%: red
class MatchPercentageCircle extends StatelessWidget {
  final int percentage;
  final double size;

  const MatchPercentageCircle({
    super.key,
    required this.percentage,
    this.size = 72,
  });

  @override
  Widget build(BuildContext context) {
    final color = _getColorForPercentage(percentage);
    final normalizedPercentage = percentage.clamp(0, 100);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          PieChart(
            PieChartData(
              startDegreeOffset: -90,
              sectionsSpace: 0,
              centerSpaceRadius: size * 0.35,
              sections: [
                PieChartSectionData(
                  value: normalizedPercentage.toDouble(),
                  color: color,
                  radius: size * 0.12,
                  showTitle: false,
                ),
                PieChartSectionData(
                  value: (100 - normalizedPercentage).toDouble(),
                  color: AppColors.surfaceMedium,
                  radius: size * 0.12,
                  showTitle: false,
                ),
              ],
            ),
          ),
          Text(
            '$percentage%',
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: size * 0.22,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getColorForPercentage(int percentage) {
    if (percentage > 70) return AppColors.success;
    if (percentage >= 40) return AppColors.warning;
    return AppColors.breakingRed;
  }
}
