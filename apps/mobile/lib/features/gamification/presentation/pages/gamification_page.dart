import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/leaderboard_entry.dart';
import '../../domain/entities/user_badge.dart';
import '../bloc/gamification_bloc.dart';
import '../widgets/milestone_timeline.dart';
import '../widgets/streak_counter.dart';
import '../widgets/streak_freeze_badge.dart';
import '../widgets/tier_badge.dart';

/// Gamification page displaying user points, badges, and the leaderboard.
///
/// Layout:
///   - Points card at the top (total points + rank badge)
///   - Badges grid (2 columns: earned highlighted, unearned greyed out)
///   - Leaderboard section with weekly/monthly/all-time tabs
class GamificationPage extends StatefulWidget {
  const GamificationPage({super.key});

  @override
  State<GamificationPage> createState() => _GamificationPageState();
}

class _GamificationPageState extends State<GamificationPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    context.read<GamificationBloc>().add(const LoadGamification());
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    final periods = [
      GamificationPeriod.weekly,
      GamificationPeriod.monthly,
      GamificationPeriod.allTime,
    ];
    context.read<GamificationBloc>().add(
      ChangePeriod(periods[_tabController.index]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'gamification_title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<GamificationBloc, GamificationState>(
        builder: (context, state) {
          if (state is GamificationLoading || state is GamificationInitial) {
            return _buildLoadingState();
          }

          if (state is GamificationError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context.read<GamificationBloc>().add(
                const LoadGamification(),
              ),
            );
          }

          if (state is GamificationLoaded) {
            return _buildLoadedState(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        // Points card shimmer
        Container(
          height: 100,
          decoration: BoxDecoration(
            color: context.colors.cardSurface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ShimmerLoading(width: 120, height: 24, borderRadius: 6),
                SizedBox(height: 12),
                ShimmerLoading(width: 80, height: 16, borderRadius: 4),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        // Badges shimmer
        const ShimmerLoading(width: 100, height: 18, borderRadius: 4),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.4,
          children: List.generate(
            4,
            (_) => Container(
              decoration: BoxDecoration(
                color: context.colors.cardSurface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: ShimmerLoading(width: 60, height: 60, borderRadius: 30),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        // Leaderboard shimmer
        const ShimmerLoading(width: 140, height: 18, borderRadius: 4),
        const SizedBox(height: 12),
        ...List.generate(
          5,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: context.colors.cardSurface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    ShimmerLoading(width: 24, height: 24, borderRadius: 4),
                    SizedBox(width: 10),
                    ShimmerLoading(width: 40, height: 40, borderRadius: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: ShimmerLoading(
                        width: 100,
                        height: 16,
                        borderRadius: 4,
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

  Widget _buildLoadedState(BuildContext context, GamificationLoaded state) {
    return RefreshIndicator(
      color: AppColors.likudBlue,
      onRefresh: () async {
        context.read<GamificationBloc>().add(const LoadGamification());
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        children: [
          _buildPointsCard(state),
          const SizedBox(height: 16),
          // Streak counter (full version)
          StreakCounter(streak: state.streak, tappable: false),
          const SizedBox(height: 12),
          // Freeze tokens
          StreakFreezeBadge(
            streak: state.streak,
            onUseFreeze: () {
              context.read<GamificationBloc>().add(const UseFreeze());
            },
          ),
          const SizedBox(height: 12),
          // Tier badge
          TierBadge(streak: state.streak, tierInfo: state.tierInfo),
          const SizedBox(height: 12),
          // Milestone timeline
          MilestoneTimeline(streak: state.streak),
          const SizedBox(height: 24),
          _buildBadgesSection(state),
          const SizedBox(height: 24),
          _buildLeaderboardSection(state),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Points Card
  // ---------------------------------------------------------------------------

  Widget _buildPointsCard(GamificationLoaded state) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.likudBlue, AppColors.likudDarkBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.likudBlue.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.stars_rounded, color: Colors.amber, size: 28),
              const SizedBox(width: 8),
              Text(
                'gamification_total_points'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white70,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            NumberFormat('#,###').format(state.totalPoints),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 36,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          if (state.rank > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${'gamification_your_rank'.tr()}: #${state.rank}',
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Badges Section
  // ---------------------------------------------------------------------------

  Widget _buildBadgesSection(GamificationLoaded state) {
    final earnedTypes = state.badges.map((b) => b.badgeType).toSet();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 4),
          child: Text(
            'gamification_badges'.tr(),
            // textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.3,
          children: BadgeType.values.map((type) {
            final isEarned = earnedTypes.contains(type);
            final earnedBadge = isEarned
                ? state.badges.firstWhere((b) => b.badgeType == type)
                : null;
            return _buildBadgeTile(type, isEarned, earnedBadge);
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildBadgeTile(
    BadgeType type,
    bool isEarned,
    UserBadge? earnedBadge,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: isEarned ? context.colors.cardSurface : context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: isEarned
            ? Border.all(color: AppColors.likudBlue, width: 1.5)
            : Border.all(color: context.colors.border, width: 1),
        boxShadow: isEarned
            ? [
                BoxShadow(
                  color: AppColors.likudBlue.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            type.icon,
            size: 32,
            color: isEarned ? AppColors.likudBlue : context.colors.textTertiary,
          ),
          const SizedBox(height: 6),
          Text(
            type.i18nKey.tr(),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isEarned ? context.colors.textPrimary : context.colors.textTertiary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            isEarned && earnedBadge != null
                ? DateFormat('dd/MM/yyyy').format(earnedBadge.earnedAt)
                : 'gamification_locked'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 10,
              fontWeight: FontWeight.w400,
              color: isEarned
                  ? context.colors.textSecondary
                  : context.colors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Leaderboard Section
  // ---------------------------------------------------------------------------

  Widget _buildLeaderboardSection(GamificationLoaded state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 4),
          child: Text(
            'gamification_leaderboard'.tr(),
            // textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Period tabs
        Container(
          decoration: BoxDecoration(
            color: context.colors.surfaceMedium,
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _tabController,
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            indicator: BoxDecoration(
              color: AppColors.likudBlue,
              borderRadius: BorderRadius.circular(12),
            ),
            labelColor: Colors.white,
            unselectedLabelColor: context.colors.textSecondary,
            labelStyle: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            unselectedLabelStyle: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
            tabs: [
              Tab(text: 'gamification_weekly'.tr()),
              Tab(text: 'gamification_monthly'.tr()),
              Tab(text: 'gamification_all_time'.tr()),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Leaderboard list
        if (state.leaderboard.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Center(
              child: Text(
                'gamification_no_points'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: context.colors.textSecondary,
                ),
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: state.leaderboard.length,
            separatorBuilder: (_, __) => const SizedBox(height: 6),
            itemBuilder: (context, index) {
              final entry = state.leaderboard[index];
              return _buildLeaderboardRow(entry);
            },
          ),
      ],
    );
  }

  Widget _buildLeaderboardRow(LeaderboardEntry entry) {
    // Top 3 get special colors for rank badge.
    Color rankColor;
    switch (entry.rank) {
      case 1:
        rankColor = const Color(0xFFFFD700); // Gold
        break;
      case 2:
        rankColor = const Color(0xFFC0C0C0); // Silver
        break;
      case 3:
        rankColor = const Color(0xFFCD7F32); // Bronze
        break;
      default:
        rankColor = context.colors.surfaceMedium;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      child: Row(
        // textDirection: TextDirection.rtl,
        children: [
          // Rank number
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: entry.rank <= 3
                  ? rankColor.withValues(alpha: 0.2)
                  : context.colors.surfaceVariant,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text(
              '#${entry.rank}',
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: entry.rank <= 3
                    ? rankColor == context.colors.surfaceMedium
                          ? context.colors.textPrimary
                          : rankColor
                    : context.colors.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Avatar
          CircleAvatar(
            radius: 20,
            backgroundColor: context.colors.likudAccentBg,
            backgroundImage: entry.avatarUrl != null
                ? NetworkImage(entry.avatarUrl!)
                : null,
            child: entry.avatarUrl == null
                ? Text(
                    entry.displayName.isNotEmpty
                        ? entry.displayName[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.likudBlue,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 10),
          // Name
          Expanded(
            child: Text(
              entry.displayName,
              // textDirection: TextDirection.ltr,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: context.colors.textPrimary,
              ),
            ),
          ),
          // Points
          Text(
            NumberFormat('#,###').format(entry.totalPoints),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.likudBlue,
            ),
          ),
        ],
      ),
    );
  }
}
