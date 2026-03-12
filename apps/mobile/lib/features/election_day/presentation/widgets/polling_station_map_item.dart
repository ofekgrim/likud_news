import 'package:equatable/equatable.dart';

/// Lightweight model for map markers representing polling stations.
///
/// Contains only the fields needed to render a station on the map
/// and its detail card.
class PollingStationMapItem extends Equatable {
  final String id;
  final String name;
  final String address;
  final double lat;
  final double lng;
  final int avgWaitMinutes;
  final String crowdLevel;
  final int reportsCount;

  const PollingStationMapItem({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
    this.avgWaitMinutes = 0,
    this.crowdLevel = 'low',
    this.reportsCount = 0,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        address,
        lat,
        lng,
        avgWaitMinutes,
        crowdLevel,
        reportsCount,
      ];
}
