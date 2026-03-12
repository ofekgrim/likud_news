import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../bloc/live_results_bloc.dart';
import '../widgets/knesset_list_assembly.dart';
import '../widgets/results_leaderboard.dart';
import '../widgets/results_toggle_header.dart';
import '../widgets/turnout_gauge.dart';

/// Full-screen page for live election results, knesset list assembly,
/// and turnout gauge.
///
/// Shows a toggle header to switch between Rankings and List Assembly views.
/// Connects to WebSocket for real-time updates via [LiveResultsBloc],
/// with automatic SSE fallback.
class LiveResultsPage extends StatefulWidget {
  final String electionId;

  const LiveResultsPage({super.key, required this.electionId});

  @override
  State<LiveResultsPage> createState() => _LiveResultsPageState();
}

class _LiveResultsPageState extends State<LiveResultsPage> {
  ResultsTab _currentTab = ResultsTab.rankings;

  @override
  void initState() {
    super.initState();
    context.read<LiveResultsBloc>().add(
          ConnectToResults(electionId: widget.electionId),
        );
  }

  @override
  void dispose() {
    // Disconnect handled by BLoC close.
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            'results.title'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          centerTitle: true,
          backgroundColor: AppColors.white,
          elevation: 0,
          actions: [
            // Connection status indicator.
            BlocBuilder<LiveResultsBloc, LiveResultsState>(
              buildWhen: (prev, curr) {
                if (prev is LiveResultsLoaded && curr is LiveResultsLoaded) {
                  return prev.connectionStatus != curr.connectionStatus;
                }
                return true;
              },
              builder: (context, state) {
                return Padding(
                  padding: const EdgeInsetsDirectional.only(end: 16),
                  child: _ConnectionIndicator(
                    status: state is LiveResultsLoaded
                        ? state.connectionStatus
                        : LiveConnectionStatus.disconnected,
                  ),
                );
              },
            ),
          ],
        ),
        body: BlocBuilder<LiveResultsBloc, LiveResultsState>(
          builder: (context, state) {
            if (state is LiveResultsLoading) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.likudBlue),
              );
            }

            if (state is LiveResultsError) {
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
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () =>
                          context.read<LiveResultsBloc>().add(
                                ConnectToResults(
                                    electionId: widget.electionId),
                              ),
                      child: Text('try_again'.tr()),
                    ),
                  ],
                ),
              );
            }

            if (state is LiveResultsLoaded) {
              return _buildContent(context, state);
            }

            // Initial state.
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
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, LiveResultsLoaded state) {
    return Column(
      children: [
        // Toggle header.
        ResultsToggleHeader(
          currentTab: _currentTab,
          onTabChanged: (tab) {
            setState(() {
              _currentTab = tab;
            });
          },
        ),

        // Tab content.
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _currentTab == ResultsTab.rankings
                ? _buildRankingsTab(state)
                : _buildListAssemblyTab(state),
          ),
        ),
      ],
    );
  }

  Widget _buildRankingsTab(LiveResultsLoaded state) {
    return SingleChildScrollView(
      key: const ValueKey('rankings-tab'),
      padding: const EdgeInsets.only(bottom: 100),
      child: Column(
        children: [
          // Turnout gauge.
          if (state.turnoutData != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: TurnoutGauge(
                turnoutPercentage: state.turnoutData!.turnoutPercentage,
                totalVoters: state.turnoutData!.totalVoters,
                totalEligible: state.turnoutData!.totalEligible,
              ),
            ),

          // Leaderboard.
          ResultsLeaderboard(results: state.candidateResults),
        ],
      ),
    );
  }

  Widget _buildListAssemblyTab(LiveResultsLoaded state) {
    return SingleChildScrollView(
      key: const ValueKey('list-assembly-tab'),
      padding: const EdgeInsets.only(bottom: 100),
      child: KnessetListAssembly(slots: state.knessetSlots),
    );
  }
}

/// Small dot indicator showing connection status.
class _ConnectionIndicator extends StatelessWidget {
  final LiveConnectionStatus status;

  const _ConnectionIndicator({required this.status});

  @override
  Widget build(BuildContext context) {
    final Color dotColor;
    final String label;

    switch (status) {
      case LiveConnectionStatus.connected:
        dotColor = AppColors.success;
        label = 'results.connected'.tr();
        break;
      case LiveConnectionStatus.reconnecting:
        dotColor = AppColors.warning;
        label = 'results.reconnecting'.tr();
        break;
      case LiveConnectionStatus.disconnected:
        dotColor = AppColors.breakingRed;
        label = 'results.disconnected'.tr();
        break;
    }

    return Tooltip(
      message: label,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 10,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
