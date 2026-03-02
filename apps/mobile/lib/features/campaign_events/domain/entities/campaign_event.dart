import 'package:equatable/equatable.dart';

/// Immutable campaign event entity used throughout the domain and presentation layers.
class CampaignEvent extends Equatable {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? location;
  final String? city;
  final String? district;
  final double? latitude;
  final double? longitude;
  final DateTime startTime;
  final DateTime? endTime;
  final String? candidateName;
  final String? candidatePhotoUrl;
  final int rsvpCount;
  final bool isActive;

  const CampaignEvent({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.location,
    this.city,
    this.district,
    this.latitude,
    this.longitude,
    required this.startTime,
    this.endTime,
    this.candidateName,
    this.candidatePhotoUrl,
    this.rsvpCount = 0,
    this.isActive = true,
  });

  /// Whether the event is in the future.
  bool get isUpcoming => startTime.isAfter(DateTime.now());

  /// Whether the event has coordinates for map navigation.
  bool get hasCoordinates => latitude != null && longitude != null;

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        imageUrl,
        location,
        city,
        district,
        latitude,
        longitude,
        startTime,
        endTime,
        candidateName,
        candidatePhotoUrl,
        rsvpCount,
        isActive,
      ];
}
