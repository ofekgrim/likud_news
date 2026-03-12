import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/polling_station.dart';
import '../bloc/election_day_bloc.dart';
import '../widgets/polling_station_map_item.dart';
import '../widgets/station_detail_card.dart';
import '../widgets/station_map.dart';

/// Full-screen map page showing all polling stations.
///
/// Uses [ElectionDayBloc] to load stations, converts them to
/// [PollingStationMapItem] instances for the map widget, and shows
/// a [StationDetailCard] bottom sheet when a marker is tapped.
/// A FAB lets the user center the map on their current location.
class StationMapPage extends StatefulWidget {
  /// Optional election ID filter.
  final String? electionId;

  const StationMapPage({super.key, this.electionId});

  @override
  State<StationMapPage> createState() => _StationMapPageState();
}

class _StationMapPageState extends State<StationMapPage> {
  LatLng? _userLocation;
  final GlobalKey<_StationMapBodyState> _mapBodyKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    context.read<ElectionDayBloc>().add(
          LoadStations(electionId: widget.electionId),
        );
  }

  Future<void> _centerOnUser() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('station_map.location_unavailable'.tr()),
                backgroundColor: AppColors.warning,
              ),
            );
          }
          return;
        }
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 10),
        ),
      );

      if (mounted) {
        setState(() {
          _userLocation = LatLng(position.latitude, position.longitude);
        });
        // Trigger map re-center after state update.
        _mapBodyKey.currentState?._centerOnUser();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('station_map.location_unavailable'.tr()),
            backgroundColor: AppColors.warning,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            'station_map.title'.tr(),
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
          surfaceTintColor: Colors.transparent,
          iconTheme: const IconThemeData(color: AppColors.textPrimary),
        ),
        body: BlocConsumer<ElectionDayBloc, ElectionDayState>(
          listener: (context, state) {
            if (state is ReportSubmitted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('station_map.report_success'.tr()),
                  backgroundColor: AppColors.success,
                ),
              );
              // Reload stations to get updated wait times.
              context.read<ElectionDayBloc>().add(
                    LoadStations(electionId: widget.electionId),
                  );
            }
          },
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
                            LoadStations(electionId: widget.electionId),
                          ),
                      child: Text('try_again'.tr()),
                    ),
                  ],
                ),
              );
            }

            if (state is StationsLoaded) {
              return _StationMapBody(
                key: _mapBodyKey,
                stations: state.stations,
                userLocation: _userLocation,
              );
            }

            // Initial / other states.
            return const Center(
              child: CircularProgressIndicator(color: AppColors.likudBlue),
            );
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _centerOnUser,
          backgroundColor: AppColors.likudBlue,
          tooltip: 'station_map.center_on_me'.tr(),
          child: const Icon(Icons.my_location, color: AppColors.white),
        ),
      ),
    );
  }
}

/// The map body with station markers and bottom-sheet detail card.
class _StationMapBody extends StatefulWidget {
  final List<PollingStation> stations;
  final LatLng? userLocation;

  const _StationMapBody({
    super.key,
    required this.stations,
    this.userLocation,
  });

  @override
  State<_StationMapBody> createState() => _StationMapBodyState();
}

class _StationMapBodyState extends State<_StationMapBody> {
  final GlobalKey<StationMapState> _stationMapKey = GlobalKey();

  List<PollingStationMapItem> _toMapItems(List<PollingStation> stations) {
    return stations
        .where((s) => s.latitude != null && s.longitude != null)
        .map(
          (s) => PollingStationMapItem(
            id: s.id,
            name: s.name,
            address: s.address,
            lat: s.latitude!,
            lng: s.longitude!,
            avgWaitMinutes: s.avgWaitMinutes ?? 0,
            crowdLevel: s.crowdLevel ?? 'low',
            reportsCount: s.reportsCount ?? 0,
          ),
        )
        .toList();
  }

  void _onStationTap(String stationId) {
    final items = _toMapItems(widget.stations);
    final station = items.where((s) => s.id == stationId).firstOrNull;
    if (station == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StationDetailCard(
        station: station,
        onReport: (stationId, minutes) {
          context.read<ElectionDayBloc>().add(
                SubmitReport(
                  stationId: stationId,
                  waitMinutes: minutes,
                  crowdLevel: _crowdLevelFromMinutes(minutes),
                ),
              );
        },
      ),
    );
  }

  void _centerOnUser() {
    _stationMapKey.currentState?.centerOnUser();
  }

  String _crowdLevelFromMinutes(int minutes) {
    if (minutes <= 10) return 'low';
    if (minutes <= 25) return 'medium';
    return 'high';
  }

  @override
  Widget build(BuildContext context) {
    final mapItems = _toMapItems(widget.stations);

    return Stack(
      children: [
        StationMap(
          key: _stationMapKey,
          stations: mapItems,
          userLocation: widget.userLocation,
          onStationTap: _onStationTap,
        ),
        // Station count badge
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 12, 6),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1A000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.how_to_vote_outlined,
                  size: 16,
                  color: AppColors.likudBlue,
                ),
                const SizedBox(width: 6),
                Text(
                  '${mapItems.length}',
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.likudBlue,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
