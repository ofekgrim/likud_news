import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/election_result.dart';
import '../bloc/election_day_bloc.dart';

/// Live Results tab — shows candidate vote counts, percentages, and a pie chart.
///
/// Uses fl_chart PieChart for the top-level visualization.
/// Displays an "Official" badge when [ElectionResult.isOfficial] is true,
/// and a "LIVE" indicator when results are streamed via SSE.
class LiveResultsTab extends StatelessWidget {
  final String? electionId;

  const LiveResultsTab({super.key, this.electionId});

  /// Generates distinct colors for pie chart sections.
  static const List<Color> _chartColors = [
    AppColors.likudBlue,
    Color(0xFF16A34A),
    Color(0xFFF59E0B),
    Color(0xFFDC2626),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
    Color(0xFF06B6D4),
    Color(0xFFEA580C),
    Color(0xFF4F46E5),
    Color(0xFF059669),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ElectionDayBloc, ElectionDayState>(
      builder: (context, state) {
        if (state is ElectionDayLoading) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.likudBlue),
          );
        }

        if (state is ElectionDayError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 48,
                  color: AppColors.textTertiary,
                ),
                const SizedBox(height: 12),
                Text(
                  state.message,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (electionId != null) ...[
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: () => context.read<ElectionDayBloc>().add(
                          LoadResults(electionId: electionId!),
                        ),
                    child: Text('try_again'.tr()),
                  ),
                ],
              ],
            ),
          );
        }

        if (state is ResultsLoaded) {
          return _buildResultsContent(context, state);
        }

        // Initial state — prompt or loading hint.
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.bar_chart_outlined,
                size: 64,
                color: AppColors.textTertiary,
              ),
              const SizedBox(height: 12),
              Text(
                'election_day_no_results'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildResultsContent(BuildContext context, ResultsLoaded state) {
    if (state.results.isEmpty) {
      return Center(
        child: Text(
          'election_day_no_results'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      );
    }

    // Sort results by vote count descending.
    final sortedResults = List<ElectionResult>.from(state.results)
      ..sort((a, b) => b.voteCount.compareTo(a.voteCount));

    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with live indicator and total votes.
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 0),
            child: Row(
              children: [
                if (state.isLive) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.breakingRed,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: AppColors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'election_day_live'.tr(),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Text(
                    '${'election_day_total_votes'.tr()}: ${_formatNumber(state.totalVotes)}',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                if (state.lastUpdated != null)
                  Text(
                    _formatTime(state.lastUpdated!),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 11,
                      color: AppColors.textTertiary,
                    ),
                  ),
              ],
            ),
          ),

          // Pie chart.
          SizedBox(
            height: 220,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                  sections: _buildPieChartSections(sortedResults),
                ),
              ),
            ),
          ),

          // Results list.
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
            child: Text(
              'election_day_results'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),

          ...sortedResults.asMap().entries.map((entry) {
            final index = entry.key;
            final result = entry.value;
            final color =
                _chartColors[index % _chartColors.length];
            return _buildResultRow(result, color, index + 1);
          }),
        ],
      ),
    );
  }

  List<PieChartSectionData> _buildPieChartSections(
    List<ElectionResult> results,
  ) {
    // Show top 8 candidates in the chart, group the rest as "Other".
    final topResults = results.take(8).toList();
    final otherVotes = results.skip(8).fold<int>(0, (s, r) => s + r.voteCount);
    final totalVotes = results.fold<int>(0, (s, r) => s + r.voteCount);

    final sections = <PieChartSectionData>[];
    for (int i = 0; i < topResults.length; i++) {
      final result = topResults[i];
      final pct =
          totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0.0;
      sections.add(
        PieChartSectionData(
          value: result.voteCount.toDouble(),
          color: _chartColors[i % _chartColors.length],
          radius: 50,
          title: pct >= 5 ? '${pct.toStringAsFixed(1)}%' : '',
          titleStyle: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.white,
          ),
        ),
      );
    }

    if (otherVotes > 0) {
      sections.add(
        PieChartSectionData(
          value: otherVotes.toDouble(),
          color: AppColors.textTertiary,
          radius: 50,
          title: '',
        ),
      );
    }

    return sections;
  }

  Widget _buildResultRow(ElectionResult result, Color color, int rank) {
    return Container(
      margin: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          // Rank and color indicator.
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            alignment: Alignment.center,
            child: Text(
              '$rank',
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Candidate name and badges.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        result.candidateName,
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (result.isOfficial) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'election_day_official'.tr(),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${_formatNumber(result.voteCount)} ${'election_day_votes'.tr()}',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          // Percentage.
          if (result.percentage != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${result.percentage!.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatNumber(int n) {
    if (n >= 1000) {
      return '${(n / 1000).toStringAsFixed(1)}K';
    }
    return n.toString();
  }

  String _formatTime(DateTime dt) {
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
