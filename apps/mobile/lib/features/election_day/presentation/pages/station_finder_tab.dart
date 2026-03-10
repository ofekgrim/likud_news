import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/polling_station.dart';
import '../bloc/election_day_bloc.dart';
import '../widgets/station_card.dart';
import '../../../../core/utils/auth_guard.dart';

/// Station Finder tab — lists polling stations with district filter.
///
/// Shows a simple ListView of station cards. Each station card displays
/// name, address, accessibility icon, and opening hours. A district
/// filter chip row is shown at the top when districts are available.
class StationFinderTab extends StatelessWidget {
  final String? electionId;

  const StationFinderTab({super.key, this.electionId});

  void _showReportDialog(BuildContext context, PollingStation station) {
    if (!requireAuth(context)) return;
    int waitMinutes = 10;
    String? crowdLevel;
    final crowdLevels = ['low', 'medium', 'high'];

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (builderContext, setDialogState) {
            return Directionality(
              textDirection: TextDirection.rtl,
              child: AlertDialog(
                title: Text(
                  'election_day_report_wait'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      station.name,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'election_day_wait_minutes'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Slider(
                      value: waitMinutes.toDouble(),
                      min: 0,
                      max: 120,
                      divisions: 24,
                      label: '$waitMinutes',
                      activeColor: AppColors.likudBlue,
                      onChanged: (value) {
                        setDialogState(() {
                          waitMinutes = value.round();
                        });
                      },
                    ),
                    Center(
                      child: Text(
                        '$waitMinutes min',
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.likudBlue,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'election_day_crowd_level'.tr(),
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: crowdLevels.map((level) {
                        final isSelected = crowdLevel == level;
                        return ChoiceChip(
                          label: Text(
                            level,
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 12,
                              color: isSelected
                                  ? AppColors.white
                                  : AppColors.textPrimary,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppColors.likudBlue,
                          backgroundColor: AppColors.surfaceLight,
                          onSelected: (selected) {
                            setDialogState(() {
                              crowdLevel = selected ? level : null;
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: Text(
                      'cancel'.tr(),
                      style: const TextStyle(fontFamily: 'Heebo'),
                    ),
                  ),
                  FilledButton(
                    onPressed: () {
                      context.read<ElectionDayBloc>().add(
                            SubmitReport(
                              stationId: station.id,
                              waitMinutes: waitMinutes,
                              crowdLevel: crowdLevel,
                            ),
                          );
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('election_day_report_submitted'.tr()),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.likudBlue,
                    ),
                    child: Text(
                      'election_day_submit_report'.tr(),
                      style: const TextStyle(fontFamily: 'Heebo'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

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
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () => context.read<ElectionDayBloc>().add(
                        LoadStations(electionId: electionId),
                      ),
                  child: Text('try_again'.tr()),
                ),
              ],
            ),
          );
        }

        if (state is StationsLoaded) {
          return _buildStationsList(context, state);
        }

        // Initial or other state — prompt to load.
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.how_to_vote_outlined,
                size: 64,
                color: AppColors.textTertiary,
              ),
              const SizedBox(height: 12),
              Text(
                'election_day_search_stations'.tr(),
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

  Widget _buildStationsList(BuildContext context, StationsLoaded state) {
    if (state.filteredStations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.location_off_outlined,
              size: 48,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 12),
            Text(
              'election_day_no_stations'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // District filter chips.
        if (state.districts.isNotEmpty)
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsetsDirectional.only(
                start: 16,
                end: 16,
                top: 8,
                bottom: 4,
              ),
              children: [
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: FilterChip(
                    label: Text(
                      'all_districts'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        color: state.activeDistrict == null
                            ? AppColors.white
                            : AppColors.textPrimary,
                      ),
                    ),
                    selected: state.activeDistrict == null,
                    selectedColor: AppColors.likudBlue,
                    backgroundColor: AppColors.surfaceLight,
                    checkmarkColor: AppColors.white,
                    onSelected: (_) => context.read<ElectionDayBloc>().add(
                          const FilterByDistrict(),
                        ),
                  ),
                ),
                ...state.districts.map(
                  (district) => Padding(
                    padding: const EdgeInsetsDirectional.only(end: 8),
                    child: FilterChip(
                      label: Text(
                        district,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          color: state.activeDistrict == district
                              ? AppColors.white
                              : AppColors.textPrimary,
                        ),
                      ),
                      selected: state.activeDistrict == district,
                      selectedColor: AppColors.likudBlue,
                      backgroundColor: AppColors.surfaceLight,
                      checkmarkColor: AppColors.white,
                      onSelected: (_) =>
                          context.read<ElectionDayBloc>().add(
                                FilterByDistrict(district: district),
                              ),
                    ),
                  ),
                ),
              ],
            ),
          ),

        // Stations list.
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 8, bottom: 100),
            itemCount: state.filteredStations.length,
            itemBuilder: (context, index) {
              final station = state.filteredStations[index];
              return StationCard(
                station: station,
                onReportTap: () => _showReportDialog(context, station),
              );
            },
          ),
        ),
      ],
    );
  }
}
