import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../domain/entities/match_result.dart';

/// Radar chart showing category-level alignment for the top candidate match.
///
/// Uses fl_chart's [RadarChart] to display the user's match breakdown
/// across policy categories as a filled polygon.
class CategoryRadarChart extends StatelessWidget {
  final MatchResult result;

  const CategoryRadarChart({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final categories = result.categoryBreakdown.keys.toList();

    if (categories.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 8),
          child: Text(
            'matcher_category_breakdown'.tr(),
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        SizedBox(
          height: 260,
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
                      text: _categoryDisplayName(categories[index]),
                    );
                  }
                  return const RadarChartTitle(text: '');
                },
                dataSets: [
                  RadarDataSet(
                    fillColor: AppColors.likudBlue.withValues(alpha: 0.15),
                    borderColor: AppColors.likudBlue,
                    borderWidth: 2,
                    entryRadius: 4,
                    dataEntries: categories.map((category) {
                      final score = result.categoryBreakdown[category] ?? 0.0;
                      return RadarEntry(value: score);
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

  String _categoryDisplayName(String key) {
    switch (key) {
      case 'security':
        return 'matcher_category_security'.tr();
      case 'economy':
        return 'matcher_category_economy'.tr();
      case 'judiciary':
        return 'matcher_category_judiciary'.tr();
      case 'housing':
        return 'matcher_category_housing'.tr();
      case 'social':
        return 'matcher_category_social'.tr();
      case 'foreign':
        return 'matcher_category_foreign'.tr();
      default:
        return key;
    }
  }
}
