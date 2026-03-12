import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/tier_info.dart';
import '../bloc/gamification_bloc.dart';
import '../widgets/tier_gate_card.dart';
import '../widgets/tier_progress_bar.dart';

/// Full page showing tier progression details.
///
/// Displays:
/// - Current tier badge (large)
/// - Progress bar to next tier
/// - List of all tiers with XP thresholds
/// - Feature unlock status for each tier
class TierDetailPage extends StatefulWidget {
  const TierDetailPage({super.key});

  @override
  State<TierDetailPage> createState() => _TierDetailPageState();
}

class _TierDetailPageState extends State<TierDetailPage> {
  @override
  void initState() {
    super.initState();
    final bloc = context.read<GamificationBloc>();
    final currentState = bloc.state;
    // Load tier info if not already loaded
    if (currentState is! GamificationLoaded || currentState.tierInfo == null) {
      bloc.add(const LoadTierInfo());
    }
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'tier.title'.tr(),
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
            return _buildLoadingState(context);
          }

          if (state is GamificationError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<GamificationBloc>().add(const LoadTierInfo()),
            );
          }

          if (state is GamificationLoaded && state.tierInfo != null) {
            return _buildLoadedState(context, state.tierInfo!);
          }

          // If loaded but no tier info yet, show loading
          if (state is GamificationLoaded && state.tierInfo == null) {
            return _buildLoadingState(context);
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
        Container(
          height: 120,
          decoration: BoxDecoration(
            color: context.colors.cardSurface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(
            child: ShimmerLoading(width: 100, height: 100, borderRadius: 50),
          ),
        ),
        const SizedBox(height: 16),
        const ShimmerLoading(width: double.infinity, height: 80, borderRadius: 12),
        const SizedBox(height: 16),
        const ShimmerLoading(width: double.infinity, height: 200, borderRadius: 12),
        const SizedBox(height: 16),
        const ShimmerLoading(width: double.infinity, height: 160, borderRadius: 12),
      ],
    );
  }

  Widget _buildLoadedState(BuildContext context, TierInfo tierInfo) {
    return RefreshIndicator(
      color: AppColors.likudBlue,
      onRefresh: () async {
        context.read<GamificationBloc>().add(const LoadTierInfo());
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        children: [
          // Current tier badge (large)
          _buildCurrentTierHero(context, tierInfo),
          const SizedBox(height: 16),

          // Progress bar
          TierProgressBar(tierInfo: tierInfo),
          const SizedBox(height: 16),

          // All tiers with XP thresholds
          _buildAllTiersList(context, tierInfo),
          const SizedBox(height: 16),

          // Feature unlock status
          TierGateCard(tierInfo: tierInfo),
        ],
      ),
    );
  }

  Widget _buildCurrentTierHero(BuildContext context, TierInfo tierInfo) {
    final color = _getTierColor(tierInfo.currentTier);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withValues(alpha: 0.15),
            color.withValues(alpha: 0.05),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      child: Column(
        children: [
          // Tier icon
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.3),
                  color.withValues(alpha: 0.1),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              border: Border.all(
                color: color.withValues(alpha: 0.5),
                width: 2,
              ),
            ),
            child: Icon(
              _getTierIcon(tierInfo.currentTier),
              color: color,
              size: 36,
            ),
          ),
          const SizedBox(height: 12),
          // Tier name
          Text(
            tierInfo.tierName,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          // Current tier label
          Text(
            '${'tier.current'.tr()} - ${tierInfo.tierNameEn}',
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: context.colors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          // XP badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${tierInfo.totalXp} XP',
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAllTiersList(BuildContext context, TierInfo tierInfo) {
    final tiers = [
      _TierDef(1, 'tier.active'.tr(), 0),
      _TierDef(2, 'tier.leader'.tr(), 500),
      _TierDef(3, 'tier.ambassador'.tr(), 2000),
      _TierDef(4, 'tier.general'.tr(), 7500),
      _TierDef(5, 'tier.lion'.tr(), 25000),
    ];

    return Container(
      decoration: BoxDecoration(
        color: context.colors.cardSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.border, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: context.colors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.military_tech_rounded,
                color: AppColors.likudBlue,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'tier.title'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...tiers.map((t) => _buildTierRow(context, t, tierInfo)),
        ],
      ),
    );
  }

  Widget _buildTierRow(
    BuildContext context,
    _TierDef tierDef,
    TierInfo tierInfo,
  ) {
    final isCurrent = tierInfo.currentTier == tierDef.tier;
    final isReached = tierInfo.currentTier >= tierDef.tier;
    final color = _getTierColor(tierDef.tier);

    return Container(
      margin: const EdgeInsetsDirectional.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isCurrent
            ? color.withValues(alpha: 0.08)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: isCurrent
            ? Border.all(color: color.withValues(alpha: 0.3), width: 1.5)
            : null,
      ),
      child: Row(
        children: [
          // Tier icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isReached
                  ? color.withValues(alpha: 0.15)
                  : context.colors.surfaceVariant,
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getTierIcon(tierDef.tier),
              size: 18,
              color: isReached ? color : context.colors.textTertiary,
            ),
          ),
          const SizedBox(width: 12),
          // Tier name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tierDef.name,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                    color: isReached
                        ? context.colors.textPrimary
                        : context.colors.textTertiary,
                  ),
                ),
                Text(
                  '${tierDef.minXp} XP',
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: context.colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          // Status
          if (isCurrent)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'tier.current'.tr(),
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            )
          else if (isReached)
            Icon(
              Icons.check_circle_rounded,
              size: 20,
              color: AppColors.success,
            )
          else
            Icon(
              Icons.lock_outline_rounded,
              size: 20,
              color: context.colors.textTertiary,
            ),
        ],
      ),
    );
  }

  static Color _getTierColor(int tier) {
    switch (tier) {
      case 1:
        return AppColors.likudBlue;
      case 2:
        return const Color(0xFF16A34A);
      case 3:
        return const Color(0xFF7C3AED);
      case 4:
        return const Color(0xFFDC2626);
      case 5:
        return const Color(0xFFD97706);
      default:
        return AppColors.likudBlue;
    }
  }

  static IconData _getTierIcon(int tier) {
    switch (tier) {
      case 1:
        return Icons.person_rounded;
      case 2:
        return Icons.military_tech_rounded;
      case 3:
        return Icons.public_rounded;
      case 4:
        return Icons.shield_rounded;
      case 5:
        return Icons.emoji_events_rounded;
      default:
        return Icons.person_rounded;
    }
  }
}

class _TierDef {
  final int tier;
  final String name;
  final int minXp;

  const _TierDef(this.tier, this.name, this.minXp);
}
