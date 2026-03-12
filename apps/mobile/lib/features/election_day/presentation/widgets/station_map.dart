import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import 'polling_station_map_item.dart';
import 'traffic_light_indicator.dart';

/// Full-screen Google Map displaying polling station markers.
///
/// Markers are color-coded using a traffic-light scheme based on
/// each station's average wait time. Tapping a marker triggers
/// the [onStationTap] callback with the station's ID.
class StationMap extends StatefulWidget {
  /// List of stations to show on the map.
  final List<PollingStationMapItem> stations;

  /// User's current location (optional). When provided, a blue dot
  /// is shown and the camera centers on this position.
  final LatLng? userLocation;

  /// Called when a station marker is tapped.
  final void Function(String stationId) onStationTap;

  const StationMap({
    super.key,
    required this.stations,
    this.userLocation,
    required this.onStationTap,
  });

  @override
  State<StationMap> createState() => StationMapState();
}

/// Public state so parent widgets can call [centerOnUser] via a GlobalKey.
class StationMapState extends State<StationMap> {
  final Completer<GoogleMapController> _controller = Completer();

  /// Default initial camera: center of Israel.
  static const _israelCenter = LatLng(31.5, 34.8);
  static const _defaultZoom = 7.0;

  Set<Marker> _buildMarkers() {
    return widget.stations.map((station) {
      final hue = TrafficLightIndicator.markerHueForWait(
        station.avgWaitMinutes,
      );
      return Marker(
        markerId: MarkerId(station.id),
        position: LatLng(station.lat, station.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(hue),
        infoWindow: InfoWindow(
          title: station.name,
          snippet: station.address,
        ),
        onTap: () => widget.onStationTap(station.id),
      );
    }).toSet();
  }

  CameraPosition _initialCamera() {
    if (widget.userLocation != null) {
      return CameraPosition(
        target: widget.userLocation!,
        zoom: 13.0,
      );
    }
    return const CameraPosition(
      target: _israelCenter,
      zoom: _defaultZoom,
    );
  }

  /// Animates the camera to the user's location.
  Future<void> centerOnUser() async {
    if (widget.userLocation == null) return;
    final controller = await _controller.future;
    await controller.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: widget.userLocation!,
          zoom: 14.0,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GoogleMap(
      initialCameraPosition: _initialCamera(),
      markers: _buildMarkers(),
      myLocationEnabled: widget.userLocation != null,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      compassEnabled: true,
      onMapCreated: (controller) {
        if (!_controller.isCompleted) {
          _controller.complete(controller);
        }
      },
    );
  }
}
