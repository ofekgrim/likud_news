import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/compare_result.dart';

/// Radar chart overlaying quiz positions by category for compared candidates.
///
/// Uses fl_chart's [RadarChart] to display each candidate's positions
/// as a colored polygon, with category labels around the perimeter.
class PositionRadarChart extends StatelessWidget {
  final CompareResult result;

  const PositionRadarChart({super.key, required this.result});

  static const List<Color> _candidateColors = [
    AppColors.likudBlue,
    Color(0xFFE65100),
  ];

  @override
  Widget build(BuildContext context) {
    final categories = result.positionComparison.keys.toList();

    if (categories.isEmpty || result.candidates.length < 2) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'compare_no_position_data'.tr(),
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              color: context.colors.textSecondary,
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title.
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 8),
          child: Text(
            'compare_positions'.tr(),
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        // Legend.
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
          child: Row(
            textDirection: TextDirection.rtl,
            children: [
              for (int i = 0; i < result.candidates.length; i++) ...[
                if (i > 0) const SizedBox(width: 16),
                _buildLegendItem(
                  context,
                  color: _candidateColors[i % _candidateColors.length],
                  label: result.candidates[i].fullName,
                ),
              ],
            ],
          ),
        ),
        // Chart.
        SizedBox(
          height: 280,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: RadarChart(
              RadarChartData(
                radarShape: RadarShape.polygon,
                radarBorderData: BorderSide(
                  color: context.colors.textTertiary.withValues(alpha: 0.3),
                  width: 1,
                ),
                gridBorderData: BorderSide(
                  color: context.colors.textTertiary.withValues(alpha: 0.15),
                  width: 1,
                ),
                tickCount: 4,
                ticksTextStyle: const TextStyle(
                  fontSize: 0,
                  color: Colors.transparent,
                ),
                tickBorderData: BorderSide(
                  color: context.colors.textTertiary.withValues(alpha: 0.1),
                  width: 1,
                ),
                titlePositionPercentageOffset: 0.2,
                titleTextStyle: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textSecondary,
                ),
                getTitle: (index, _) {
                  if (index >= 0 && index < categories.length) {
                    return RadarChartTitle(
                      text: categories[index],
                    );
                  }
                  return const RadarChartTitle(text: '');
                },
                dataSets: [
                  for (int i = 0; i < result.candidates.length; i++)
                    RadarDataSet(
                      fillColor: _candidateColors[i % _candidateColors.length]
                          .withValues(alpha: 0.15),
                      borderColor:
                          _candidateColors[i % _candidateColors.length],
                      borderWidth: 2,
                      entryRadius: 3,
                      dataEntries: categories.map((category) {
                        final scores =
                            result.positionComparison[category] ?? [];
                        final score =
                            i < scores.length ? scores[i] : 0.0;
                        return RadarEntry(value: score * 100);
                      }).toList(),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLegendItem(
    BuildContext context, {
    required Color color,
    required String label,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.3),
            border: Border.all(color: color, width: 2),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          textDirection: TextDirection.rtl,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: context.colors.textSecondary,
          ),
        ),
      ],
    );
  }
}
