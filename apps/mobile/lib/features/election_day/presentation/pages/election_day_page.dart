import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../bloc/election_day_bloc.dart';
import 'live_results_tab.dart';
import 'station_finder_tab.dart';
import 'turnout_tab.dart';

/// Election Day hub page with 3 tabs: Station Finder, Live Results, Turnout.
///
/// Uses [DefaultTabController] to manage tab state and delegates
/// content rendering to the individual tab widgets.
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Directionality(
        textDirection: TextDirection.rtl,
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
              StationFinderTab(electionId: widget.electionId),
              LiveResultsTab(electionId: widget.electionId),
              TurnoutTab(electionId: widget.electionId),
            ],
          ),
        ),
      ),
    );
  }
}
