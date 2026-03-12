import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/candidate_compare_bloc.dart';
import '../widgets/compare_table.dart';
import '../widgets/position_radar_chart.dart';

/// Candidate comparison page.
///
/// Displays a side-by-side scrollable comparison with sticky headers,
/// plus a radar chart overlay for quiz positions.
class CandidateComparePage extends StatefulWidget {
  final List<String> candidateIds;

  const CandidateComparePage({super.key, required this.candidateIds});

  @override
  State<CandidateComparePage> createState() => _CandidateComparePageState();
}

class _CandidateComparePageState extends State<CandidateComparePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<CandidateCompareBloc>().add(
      LoadComparison(ids: widget.candidateIds),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text(
            'compare_candidates'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
          bottom: TabBar(
            controller: _tabController,
            labelColor: AppColors.likudBlue,
            unselectedLabelColor: context.colors.textSecondary,
            indicatorColor: AppColors.likudBlue,
            labelStyle: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            unselectedLabelStyle: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
            tabs: [
              Tab(text: 'compare_details'.tr()),
              Tab(text: 'compare_positions'.tr()),
            ],
          ),
        ),
        body: BlocBuilder<CandidateCompareBloc, CandidateCompareState>(
          builder: (context, state) {
            if (state is CandidateCompareLoading) {
              return _buildLoadingState(context);
            }

            if (state is CandidateCompareError) {
              return ErrorView(
                message: state.failure.message ?? 'compare_error'.tr(),
                onRetry: () {
                  context.read<CandidateCompareBloc>().add(
                    LoadComparison(ids: widget.candidateIds),
                  );
                },
              );
            }

            if (state is CandidateCompareLoaded) {
              return TabBarView(
                controller: _tabController,
                children: [
                  CompareTable(result: state.result),
                  PositionRadarChart(result: state.result),
                ],
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Header shimmer.
          Row(
            textDirection: TextDirection.rtl,
            children: [
              Expanded(
                child: Column(
                  children: const [
                    ShimmerLoading(width: 64, height: 64, borderRadius: 32),
                    SizedBox(height: 8),
                    ShimmerLoading(width: 80, height: 16, borderRadius: 4),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  children: const [
                    ShimmerLoading(width: 64, height: 64, borderRadius: 32),
                    SizedBox(height: 8),
                    ShimmerLoading(width: 80, height: 16, borderRadius: 4),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Row shimmers.
          for (int i = 0; i < 5; i++) ...[
            const ShimmerLoading(
              width: double.infinity,
              height: 60,
              borderRadius: 8,
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}
