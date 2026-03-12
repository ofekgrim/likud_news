import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/ama_sessions_bloc.dart';
import '../widgets/ama_session_card.dart';

/// Displays all AMA sessions grouped into three tabs:
/// Live (מיידי), Upcoming (קרובים), and Archived (ארכיון).
class AmaSessionsListPage extends StatefulWidget {
  const AmaSessionsListPage({super.key});

  @override
  State<AmaSessionsListPage> createState() => _AmaSessionsListPageState();
}

class _AmaSessionsListPageState extends State<AmaSessionsListPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    context.read<AmaSessionsBloc>().add(const LoadSessions());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'ama.sessions_title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.likudBlue,
          labelColor: AppColors.likudBlue,
          unselectedLabelColor: context.colors.textSecondary,
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
            Tab(text: 'ama.tab_live'.tr()),
            Tab(text: 'ama.tab_upcoming'.tr()),
            Tab(text: 'ama.tab_archived'.tr()),
          ],
        ),
      ),
      body: BlocBuilder<AmaSessionsBloc, AmaSessionsState>(
        builder: (context, state) {
          if (state is AmaLoading || state is AmaInitial) {
            return _buildLoadingState();
          }

          if (state is AmaError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<AmaSessionsBloc>().add(const LoadSessions()),
            );
          }

          if (state is AmaSessionsLoaded) {
            return TabBarView(
              controller: _tabController,
              children: [
                _buildSessionList(
                  context,
                  state.liveSessions,
                  'ama.no_live_sessions'.tr(),
                ),
                _buildSessionList(
                  context,
                  state.upcomingSessions,
                  'ama.no_upcoming_sessions'.tr(),
                ),
                _buildSessionList(
                  context,
                  state.sessions.where((s) => s.isEnded).toList(),
                  'ama.no_archived_sessions'.tr(),
                ),
              ],
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildSessionList(
    BuildContext context,
    List sessions,
    String emptyMessage,
  ) {
    if (sessions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsetsDirectional.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.forum_outlined,
                size: 64,
                color: context.colors.textTertiary,
              ),
              const SizedBox(height: 16),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 15,
                  color: context.colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.likudBlue,
      onRefresh: () async {
        context.read<AmaSessionsBloc>().add(const LoadSessions());
      },
      child: ListView.separated(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 100),
        itemCount: sessions.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final session = sessions[index];
          return AmaSessionCard(
            session: session,
            onTap: () => context.go('/ama/${session.id}'),
          );
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.separated(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 100),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) => Container(
        height: 160,
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.colors.border),
        ),
        padding: const EdgeInsetsDirectional.all(16),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ShimmerLoading(width: 80, height: 24, borderRadius: 8),
            SizedBox(height: 12),
            ShimmerLoading(width: double.infinity, height: 20, borderRadius: 4),
            SizedBox(height: 8),
            ShimmerLoading(width: 140, height: 16, borderRadius: 4),
            SizedBox(height: 8),
            ShimmerLoading(width: double.infinity, height: 14, borderRadius: 4),
            Spacer(),
            ShimmerLoading(width: 200, height: 14, borderRadius: 4),
          ],
        ),
      ),
    );
  }
}
