import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/utils/auth_guard.dart';
import '../bloc/election_day_bloc.dart';
import '../widgets/branch_competition.dart';
import '../widgets/i_voted_card.dart';
import '../widgets/remind_friend_button.dart';
import '../widgets/voting_plan_card.dart';
import 'live_results_tab.dart';
import 'station_finder_tab.dart';
import 'turnout_tab.dart';

/// Election Day hub page with 3 tabs: Station Finder, Live Results, Turnout.
///
/// Uses [DefaultTabController] to manage tab state and delegates
/// content rendering to the individual tab widgets.
///
/// Includes an "I Voted" FAB during voting hours (7:00-19:00 Israel time),
/// voting plan card, remind-friend button, and branch competition section.
class ElectionDayPage extends StatefulWidget {
  /// The election ID to load data for. If null, the page shows a prompt.
  final String? electionId;

  const ElectionDayPage({super.key, this.electionId});

  @override
  State<ElectionDayPage> createState() => _ElectionDayPageState();
}

class _ElectionDayPageState extends State<ElectionDayPage> {
  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  void _loadInitialData() {
    if (widget.electionId != null) {
      context.read<ElectionDayBloc>().add(
            LoadStations(electionId: widget.electionId),
          );
      context.read<ElectionDayBloc>().add(
            SubscribeToLiveResults(electionId: widget.electionId!),
          );
      context.read<ElectionDayBloc>().add(
            LoadBranchTurnouts(electionId: widget.electionId!),
          );
    }
  }

  /// Whether the current time is within voting hours (7:00-19:00 Israel time).
  bool get _isVotingHours {
    // Israel is UTC+2 (IST) or UTC+3 (IDT). Use a fixed +2 offset as
    // a safe approximation; the FAB is cosmetic, not security-critical.
    final now = DateTime.now().toUtc().add(const Duration(hours: 2));
    return now.hour >= 7 && now.hour < 19;
  }

  void _showIVotedBottomSheet(BuildContext context) {
    if (!_isVotingHours) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('i_voted.outside_voting_hours'.tr()),
          backgroundColor: AppColors.likudBlue,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    if (!requireAuth(context)) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: AppColors.white,
      builder: (_) => BlocProvider.value(
        value: context.read<ElectionDayBloc>(),
        child: const _IVotedBottomSheet(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: BlocListener<ElectionDayBloc, ElectionDayState>(
          listener: (context, state) {
            if (state is VotingPlanSaved) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('voting_plan.saved'.tr()),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            } else if (state is IVotedBadgeClaimed) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('i_voted.points_earned'.tr()),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          },
          child: Scaffold(
            appBar: AppBar(
              title: Text(
                'election_day_title'.tr(),
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
              bottom: TabBar(
                labelColor: AppColors.likudBlue,
                unselectedLabelColor: AppColors.textSecondary,
                indicatorColor: AppColors.likudBlue,
                indicatorWeight: 3,
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
                onTap: (index) {
                  if (widget.electionId == null) return;
                  switch (index) {
                    case 0:
                      context.read<ElectionDayBloc>().add(
                            LoadStations(electionId: widget.electionId),
                          );
                      break;
                    case 1:
                      context.read<ElectionDayBloc>().add(
                            LoadResults(electionId: widget.electionId!),
                          );
                      break;
                    case 2:
                      context.read<ElectionDayBloc>().add(
                            LoadTurnout(electionId: widget.electionId!),
                          );
                      break;
                  }
                },
                tabs: [
                  Tab(text: 'election_day_stations'.tr()),
                  Tab(text: 'election_day_results'.tr()),
                  Tab(text: 'election_day_turnout'.tr()),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                _StationFinderWithExtras(electionId: widget.electionId),
                LiveResultsTab(electionId: widget.electionId),
                TurnoutTab(electionId: widget.electionId),
              ],
            ),
            floatingActionButton: FloatingActionButton.extended(
                onPressed: () => _showIVotedBottomSheet(context),
                backgroundColor: AppColors.likudBlue,
                foregroundColor: AppColors.white,
                icon: const Icon(Icons.how_to_vote),
                label: Text(
                  'i_voted.fab_label'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ),
        ),
      ),
    );
  }
}

/// Wraps [StationFinderTab] with voting plan, remind friend, and
/// branch competition widgets below the station list.
class _StationFinderWithExtras extends StatelessWidget {
  final String? electionId;

  const _StationFinderWithExtras({this.electionId});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Station finder takes remaining space.
        Expanded(
          child: CustomScrollView(
            slivers: [
              // Voting plan card.
              SliverToBoxAdapter(
                child: VotingPlanCard(
                  onSavePlan: (timeSlot) {
                    context.read<ElectionDayBloc>().add(
                          SaveVotingPlan(timeSlot: timeSlot),
                        );
                  },
                ),
              ),

              // Remind friend button.
              const SliverToBoxAdapter(
                child: RemindFriendButton(),
              ),

              // Branch competition.
              SliverToBoxAdapter(
                child: BlocBuilder<ElectionDayBloc, ElectionDayState>(
                  buildWhen: (prev, curr) => curr is BranchTurnoutsLoaded,
                  builder: (context, state) {
                    if (state is BranchTurnoutsLoaded) {
                      return BranchCompetition(branches: state.branches);
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),

              // Station finder content as a nested list.
              SliverFillRemaining(
                child: StationFinderTab(electionId: electionId),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Bottom sheet content for the "I Voted" flow.
class _IVotedBottomSheet extends StatelessWidget {
  const _IVotedBottomSheet();

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar.
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // I Voted card.
            IVotedCard(
              displayName: '',
              onShared: () {
                // Claim badge when the user shares.
                context
                    .read<ElectionDayBloc>()
                    .add(const ClaimIVotedBadge());
              },
            ),

            const SizedBox(height: 12),

            // Claim badge button.
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton.icon(
                onPressed: () {
                  context
                      .read<ElectionDayBloc>()
                      .add(const ClaimIVotedBadge());
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('i_voted.badge_earned'.tr()),
                      backgroundColor: AppColors.success,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                icon: const Icon(Icons.verified, size: 18),
                label: Text('i_voted.title'.tr()),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
