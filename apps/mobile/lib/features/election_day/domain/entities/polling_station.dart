import 'package:equatable/equatable.dart';

/// Immutable polling station entity used throughout the domain and presentation layers.
class PollingStation extends Equatable {
  final String id;
  final String name;
  final String address;
  final String? city;
  final String? district;
  final double? latitude;
  final double? longitude;
  final int? capacity;
  final bool isAccessible;
  final String? openingTime;
  final String? closingTime;
  final String? contactPhone;
  final String? notes;
  final String? electionId;
  final bool isActive;
  final int? avgWaitMinutes;
  final String? crowdLevel;
  final int? reportsCount;

  const PollingStation({
    required this.id,
    required this.name,
    required this.address,
    this.city,
    this.district,
    this.latitude,
    this.longitude,
    this.capacity,
    this.isAccessible = false,
    this.openingTime,
    this.closingTime,
    this.contactPhone,
    this.notes,
    this.electionId,
    this.isActive = true,
    this.avgWaitMinutes,
    this.crowdLevel,
    this.reportsCount,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        address,
        city,
        district,
        latitude,
        longitude,
        capacity,
        isAccessible,
        openingTime,
        closingTime,
        contactPhone,
        notes,
        electionId,
        isActive,
        avgWaitMinutes,
        crowdLevel,
        reportsCount,
      ];
}
