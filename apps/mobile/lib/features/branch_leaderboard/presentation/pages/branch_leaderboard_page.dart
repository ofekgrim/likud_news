import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/branch_weekly_score.dart';
import '../bloc/branch_leaderboard_bloc.dart';
import '../bloc/branch_leaderboard_event.dart';
import '../bloc/branch_leaderboard_state.dart';
import '../widgets/branch_rank_card.dart';
import '../widgets/my_branch_banner.dart';
import '../widgets/period_selector.dart';

/// Full page for the branch-vs-branch leaderboard.
///
/// Layout:
///   - AppBar with title
///   - MyBranchBanner at top (if user has a branch)
///   - PeriodSelector for time period filtering
///   - Scrollable list of BranchRankCards
///   - Pull-to-refresh
class BranchLeaderboardPage extends StatefulWidget {
  const BranchLeaderboardPage({super.key});

  @override
  State<BranchLeaderboardPage> createState() => _BranchLeaderboardPageState();
}

class _BranchLeaderboardPageState extends State<BranchLeaderboardPage> {
  @override
  void initState() {
    super.initState();
    context.read<BranchLeaderboardBloc>().add(
      const LoadBranchLeaderboard(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'leaderboard.title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<BranchLeaderboardBloc, BranchLeaderboardState>(
        builder: (context, state) {
          if (state is BranchLeaderboardLoading ||
              state is BranchLeaderboardInitial) {
            return _buildLoadingState(context);
          }

          if (state is BranchLeaderboardError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context.read<BranchLeaderboardBloc>().add(
                const LoadBranchLeaderboard(),
              ),
            );
          }

          if (state is BranchLeaderboardLoaded) {
            return _buildLoadedState(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        // Banner shimmer
        Container(
          height: 110,
          decoration: BoxDecoration(
            color: context.colors.cardSurface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ShimmerLoading(width: 80, height: 14, borderRadius: 4),
                SizedBox(height: 8),
                ShimmerLoading(width: 160, height: 20, borderRadius: 6),
                SizedBox(height: 12),
                ShimmerLoading(width: 200, height: 16, borderRadius: 4),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Period selector shimmer
        const Row(
          children: [
            ShimmerLoading(width: 80, height: 36, borderRadius: 18),
            SizedBox(width: 8),
            ShimmerLoading(width: 90, height: 36, borderRadius: 18),
            SizedBox(width: 8),
            ShimmerLoading(width: 80, height: 36, borderRadius: 18),
          ],
        ),
        const SizedBox(height: 16),
        // List shimmer
        ...List.generate(
          6,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              height: 80,
              decoration: BoxDecoration(
                color: context.colors.cardSurface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    ShimmerLoading(width: 36, height: 24, borderRadius: 6),
                    SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ShimmerLoading(
                            width: 120,
                            height: 14,
                            borderRadius: 4,
                          ),
                          SizedBox(height: 6),
                          ShimmerLoading(
                            width: 80,
                            height: 10,
                            borderRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    ShimmerLoading(width: 50, height: 16, borderRadius: 4),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadedState(
    BuildContext context,
    BranchLeaderboardLoaded state,
  ) {
    final leaderboard = state.leaderboard;
    final scores = leaderboard.scores;
    final myBranchId = leaderboard.myBranchId;
    final topScore =
        scores.isNotEmpty ? scores.first.totalScore : 0;

    // Find user's branch score for banner
    BranchWeeklyScore? myBranchScore;
    if (myBranchId != null) {
      myBranchScore = scores
          .where((s) => s.branchId == myBranchId)
          .firstOrNull;
    }

    return RefreshIndicator(
      color: AppColors.likudBlue,
      onRefresh: () async {
        context.read<BranchLeaderboardBloc>().add(
          LoadBranchLeaderboard(period: state.currentPeriod),
        );
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        children: [
          // My branch banner
          if (myBranchScore != null) ...[
            MyBranchBanner(
              branchName: myBranchScore.branchName,
              rank: myBranchScore.rank,
              totalBranches: scores.length,
              score: myBranchScore.totalScore,
            ),
            const SizedBox(height: 16),
          ],

          // Period selector
          PeriodSelector(
            selectedPeriod: state.currentPeriod,
            onPeriodChanged: (period) {
              context.read<BranchLeaderboardBloc>().add(
                ChangePeriod(period),
              );
            },
          ),
          const SizedBox(height: 16),

          // Leaderboard list
          if (scores.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.leaderboard_outlined,
                      size: 56,
                      color: context.colors.textTertiary,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'leaderboard.empty'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        color: context.colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: scores.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final score = scores[index];
                final isMyBranch =
                    myBranchId != null && score.branchId == myBranchId;
                return BranchRankCard(
                  score: score,
                  isMyBranch: isMyBranch,
                  position: index + 1,
                  topScore: topScore,
                );
              },
            ),
        ],
      ),
    );
  }
}
