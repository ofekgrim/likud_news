import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/turnout_snapshot.dart';
import '../bloc/election_day_bloc.dart';

/// Turnout tab — shows an animated gauge, timeline chart, and district breakdown.
///
/// Uses fl_chart LineChart for the timeline visualization
/// and a custom-painted gauge for the overall turnout percentage.
class TurnoutTab extends StatelessWidget {
  final String? electionId;

  const TurnoutTab({super.key, this.electionId});

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
                          LoadTurnout(electionId: electionId!),
                        ),
                    child: Text('try_again'.tr()),
                  ),
                ],
              ],
            ),
          );
        }

        if (state is TurnoutLoaded) {
          return _buildTurnoutContent(context, state);
        }

        // Initial state.
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.pie_chart_outline,
                size: 64,
                color: AppColors.textTertiary,
              ),
              const SizedBox(height: 12),
              Text(
                'election_day_turnout'.tr(),
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

  Widget _buildTurnoutContent(BuildContext context, TurnoutLoaded state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Turnout gauge.
          Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: _TurnoutGauge(
                percentage: state.overallPercentage,
                totalEligible: state.totalEligible,
                totalVoted: state.totalVoted,
              ),
            ),
          ),

          // Summary stats.
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: _StatCard(
                    label: 'election_day_eligible'.tr(),
                    value: _formatNumber(state.totalEligible),
                    icon: Icons.people_outline,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'election_day_voted'.tr(),
                    value: _formatNumber(state.totalVoted),
                    icon: Icons.how_to_vote_outlined,
                  ),
                ),
              ],
            ),
          ),

          // Timeline chart.
          if (state.timeline.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
              child: Text(
                'election_day_turnout_percentage'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            SizedBox(
              height: 200,
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
                child: _buildTimelineChart(state.timeline),
              ),
            ),
          ],

          // District breakdown.
          if (state.snapshots.any((s) =>
              s.district != null && s.district!.isNotEmpty)) ...[
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 8),
              child: Text(
                'election_day_district_breakdown'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            ...state.snapshots
                .where(
                    (s) => s.district != null && s.district!.isNotEmpty)
                .map((snapshot) => _buildDistrictRow(snapshot)),
          ],
        ],
      ),
    );
  }

  Widget _buildTimelineChart(List<TurnoutSnapshot> timeline) {
    // Sort by snapshot time.
    final sorted = List<TurnoutSnapshot>.from(timeline)
      ..sort((a, b) => a.snapshotAt.compareTo(b.snapshotAt));

    if (sorted.isEmpty) return const SizedBox.shrink();

    final spots = sorted.asMap().entries.map((entry) {
      return FlSpot(
        entry.key.toDouble(),
        entry.value.percentage,
      );
    }).toList();

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 20,
          getDrawingHorizontalLine: (value) => FlLine(
            color: AppColors.border,
            strokeWidth: 0.5,
          ),
        ),
        titlesData: FlTitlesData(
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              interval: 20,
              getTitlesWidget: (value, meta) {
                return Text(
                  '${value.toInt()}%',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 10,
                    color: AppColors.textTertiary,
                  ),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 24,
              interval: math.max((sorted.length / 6).ceilToDouble(), 1),
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= sorted.length) {
                  return const SizedBox.shrink();
                }
                final dt = sorted[idx].snapshotAt;
                final hour = dt.hour.toString().padLeft(2, '0');
                final minute = dt.minute.toString().padLeft(2, '0');
                return Text(
                  '$hour:$minute',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 10,
                    color: AppColors.textTertiary,
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        minY: 0,
        maxY: 100,
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: AppColors.likudBlue,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: AppColors.likudBlue.withValues(alpha: 0.1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDistrictRow(TurnoutSnapshot snapshot) {
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
          // District name.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  snapshot.district!,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatNumber(snapshot.actualVoters)} / ${_formatNumber(snapshot.eligibleVoters)}',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          // Progress bar and percentage.
          SizedBox(
            width: 120,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${snapshot.percentage.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.likudBlue,
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: snapshot.percentage / 100,
                    backgroundColor: AppColors.surfaceMedium,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.likudBlue,
                    ),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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

// ---------------------------------------------------------------------------
// Turnout Gauge Widget
// ---------------------------------------------------------------------------

/// An animated circular gauge showing turnout percentage.
class _TurnoutGauge extends StatelessWidget {
  final double percentage;
  final int totalEligible;
  final int totalVoted;

  const _TurnoutGauge({
    required this.percentage,
    required this.totalEligible,
    required this.totalVoted,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180,
      height: 180,
      child: TweenAnimationBuilder<double>(
        tween: Tween<double>(begin: 0, end: percentage),
        duration: const Duration(milliseconds: 1200),
        curve: Curves.easeOutCubic,
        builder: (context, value, child) {
          return CustomPaint(
            painter: _GaugePainter(
              percentage: value,
              backgroundColor: AppColors.surfaceMedium,
              foregroundColor: AppColors.likudBlue,
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${value.toStringAsFixed(1)}%',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: AppColors.likudBlue,
                    ),
                  ),
                  Text(
                    'election_day_turnout_percentage'.tr(),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Custom painter for the circular gauge arc.
class _GaugePainter extends CustomPainter {
  final double percentage;
  final Color backgroundColor;
  final Color foregroundColor;

  _GaugePainter({
    required this.percentage,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 8;

    // Background arc (full circle).
    final bgPaint = Paint()
      ..color = backgroundColor
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Foreground arc (progress).
    final fgPaint = Paint()
      ..color = foregroundColor
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final sweepAngle = (percentage / 100) * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2, // Start from top.
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(_GaugePainter oldDelegate) {
    return oldDelegate.percentage != percentage;
  }
}

// ---------------------------------------------------------------------------
// Stat Card Widget
// ---------------------------------------------------------------------------

/// A small card showing a labeled stat value with an icon.
class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.likudBlue, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
