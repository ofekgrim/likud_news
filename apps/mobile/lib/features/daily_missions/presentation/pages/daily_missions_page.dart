import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/di.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/daily_missions_bloc.dart';
import '../bloc/daily_missions_event.dart';
import '../bloc/daily_missions_state.dart';
import '../widgets/mission_card.dart';
import '../widgets/missions_bonus_card.dart';

/// Full page displaying today's daily missions.
///
/// Layout:
///   - AppBar with "Daily Missions" title
///   - Date header showing today's date in Hebrew
///   - List of mission cards
///   - Bonus card at bottom
///   - Pull-to-refresh support
class DailyMissionsPage extends StatelessWidget {
  const DailyMissionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<DailyMissionsBloc>()
        ..add(const LoadTodayMissions()),
      child: const _DailyMissionsView(),
    );
  }
}

class _DailyMissionsView extends StatelessWidget {
  const _DailyMissionsView();

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'missions.title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<DailyMissionsBloc, DailyMissionsState>(
        builder: (context, state) {
          if (state is DailyMissionsLoading ||
              state is DailyMissionsInitial) {
            return _buildLoadingState(context);
          }

          if (state is DailyMissionsError) {
            return ErrorView(
              message: state.message,
              onRetry: () => context
                  .read<DailyMissionsBloc>()
                  .add(const LoadTodayMissions()),
            );
          }

          if (state is DailyMissionsLoaded) {
            return _buildLoadedState(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 100),
      children: [
        // Date header shimmer
        const ShimmerLoading(width: 160, height: 18, borderRadius: 4),
        const SizedBox(height: 20),
        // Mission cards shimmer
        ...List.generate(
          3,
          (_) => Padding(
            padding: const EdgeInsetsDirectional.only(bottom: 12),
            child: ShimmerLoading(height: 80, borderRadius: 14),
          ),
        ),
        const SizedBox(height: 16),
        // Bonus card shimmer
        const ShimmerLoading(height: 100, borderRadius: 14),
      ],
    );
  }

  Widget _buildLoadedState(
    BuildContext context,
    DailyMissionsLoaded state,
  ) {
    final summary = state.summary;

    return RefreshIndicator(
      color: AppColors.likudBlue,
      onRefresh: () async {
        HapticFeedback.mediumImpact();
        context
            .read<DailyMissionsBloc>()
            .add(const LoadTodayMissions());
      },
      child: ListView(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 100),
        children: [
          // Date header
          _buildDateHeader(context, summary.date),
          const SizedBox(height: 16),
          // Mission cards
          ...summary.missions.map(
            (mission) => Padding(
              padding: const EdgeInsetsDirectional.only(bottom: 12),
              child: MissionCard(mission: mission),
            ),
          ),
          const SizedBox(height: 8),
          // Bonus card
          MissionsBonusCard(summary: summary),
        ],
      ),
    );
  }

  Widget _buildDateHeader(BuildContext context, DateTime date) {
    final isHebrew = context.locale.languageCode == 'he';
    final dayName = _hebrewDayName(date.weekday, isHebrew);
    final dateStr = DateFormat('dd/MM/yyyy').format(date);

    return Row(
      children: [
        Icon(
          Icons.calendar_today_outlined,
          size: 18,
          color: AppColors.likudBlue,
        ),
        const SizedBox(width: 8),
        Text(
          '${'missions.today'.tr()} - $dayName, $dateStr',
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: context.colors.textSecondary,
          ),
        ),
      ],
    );
  }

  String _hebrewDayName(int weekday, bool isHebrew) {
    if (isHebrew) {
      final days = {
        DateTime.sunday: 'day_sunday'.tr(),
        DateTime.monday: 'day_monday'.tr(),
        DateTime.tuesday: 'day_tuesday'.tr(),
        DateTime.wednesday: 'day_wednesday'.tr(),
        DateTime.thursday: 'day_thursday'.tr(),
        DateTime.friday: 'day_friday'.tr(),
        DateTime.saturday: 'day_saturday'.tr(),
      };
      return days[weekday] ?? '';
    }
    final days = {
      DateTime.sunday: 'day_sunday'.tr(),
      DateTime.monday: 'day_monday'.tr(),
      DateTime.tuesday: 'day_tuesday'.tr(),
      DateTime.wednesday: 'day_wednesday'.tr(),
      DateTime.thursday: 'day_thursday'.tr(),
      DateTime.friday: 'day_friday'.tr(),
      DateTime.saturday: 'day_saturday'.tr(),
    };
    return days[weekday] ?? '';
  }
}
