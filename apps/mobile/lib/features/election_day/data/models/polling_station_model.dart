import '../../domain/entities/polling_station.dart';

/// Data model for polling stations, handles JSON serialization.
///
/// Maps API responses to the domain [PollingStation] entity via [toEntity].
class PollingStationModel {
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

  const PollingStationModel({
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

  factory PollingStationModel.fromJson(Map<String, dynamic> json) {
    return PollingStationModel(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String? ?? '',
      city: json['city'] as String?,
      district: json['district'] as String?,
      latitude: json['latitude'] != null
          ? double.tryParse(json['latitude'].toString())
          : null,
      longitude: json['longitude'] != null
          ? double.tryParse(json['longitude'].toString())
          : null,
      capacity: json['capacity'] != null
          ? int.tryParse(json['capacity'].toString())
          : null,
      isAccessible: json['isAccessible'] as bool? ?? false,
      openingTime: json['openingTime'] as String?,
      closingTime: json['closingTime'] as String?,
      contactPhone: json['contactPhone'] as String?,
      notes: json['notes'] as String?,
      electionId: json['electionId'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      avgWaitMinutes: json['avgWaitMinutes'] != null
          ? int.tryParse(json['avgWaitMinutes'].toString())
          : null,
      crowdLevel: json['crowdLevel'] as String?,
      reportsCount: json['reportsCount'] != null
          ? int.tryParse(json['reportsCount'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'city': city,
      'district': district,
      'latitude': latitude,
      'longitude': longitude,
      'capacity': capacity,
      'isAccessible': isAccessible,
      'openingTime': openingTime,
      'closingTime': closingTime,
      'contactPhone': contactPhone,
      'notes': notes,
      'electionId': electionId,
      'isActive': isActive,
      'avgWaitMinutes': avgWaitMinutes,
      'crowdLevel': crowdLevel,
      'reportsCount': reportsCount,
    };
  }

  PollingStation toEntity() {
    return PollingStation(
      id: id,
      name: name,
      address: address,
      city: city,
      district: district,
      latitude: latitude,
      longitude: longitude,
      capacity: capacity,
      isAccessible: isAccessible,
      openingTime: openingTime,
      closingTime: closingTime,
      contactPhone: contactPhone,
      notes: notes,
      electionId: electionId,
      isActive: isActive,
      avgWaitMinutes: avgWaitMinutes,
      crowdLevel: crowdLevel,
      reportsCount: reportsCount,
    );
  }
}
