import '../../domain/entities/campaign_event.dart';

/// Data model for campaign events, handles JSON serialization.
///
/// Maps API responses to the domain [CampaignEvent] entity via [toEntity].
/// Flattens nested `candidate` object into `candidateName` and `candidatePhotoUrl`.
class CampaignEventModel {
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

  const CampaignEventModel({
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

  factory CampaignEventModel.fromJson(Map<String, dynamic> json) {
    // Flatten the nested candidate relation.
    final candidate = json['candidate'] as Map<String, dynamic>?;

    return CampaignEventModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      location: json['location'] as String?,
      city: json['city'] as String?,
      district: json['district'] as String?,
      latitude: json['latitude'] != null
          ? double.tryParse(json['latitude'].toString())
          : null,
      longitude: json['longitude'] != null
          ? double.tryParse(json['longitude'].toString())
          : null,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: json['endTime'] != null
          ? DateTime.tryParse(json['endTime'] as String)
          : null,
      candidateName: candidate?['fullName'] as String? ??
          json['candidateName'] as String?,
      candidatePhotoUrl: candidate?['photoUrl'] as String? ??
          json['candidatePhotoUrl'] as String?,
      rsvpCount: json['rsvpCount'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'imageUrl': imageUrl,
      'location': location,
      'city': city,
      'district': district,
      'latitude': latitude,
      'longitude': longitude,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'candidateName': candidateName,
      'candidatePhotoUrl': candidatePhotoUrl,
      'rsvpCount': rsvpCount,
      'isActive': isActive,
    };
  }

  CampaignEvent toEntity() {
    return CampaignEvent(
      id: id,
      title: title,
      description: description,
      imageUrl: imageUrl,
      location: location,
      city: city,
      district: district,
      latitude: latitude,
      longitude: longitude,
      startTime: startTime,
      endTime: endTime,
      candidateName: candidateName,
      candidatePhotoUrl: candidatePhotoUrl,
      rsvpCount: rsvpCount,
      isActive: isActive,
    );
  }
}
