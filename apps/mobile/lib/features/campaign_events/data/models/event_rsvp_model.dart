import '../../domain/entities/event_rsvp.dart';

/// Data model for event RSVPs, handles JSON serialization.
///
/// Maps API responses to the domain [EventRsvp] entity via [toEntity].
class EventRsvpModel {
  final String id;
  final String eventId;
  final String statusValue;
  final DateTime createdAt;

  const EventRsvpModel({
    required this.id,
    required this.eventId,
    required this.statusValue,
    required this.createdAt,
  });

  factory EventRsvpModel.fromJson(Map<String, dynamic> json) {
    return EventRsvpModel(
      id: json['id'] as String,
      eventId: json['eventId'] as String,
      statusValue: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventId': eventId,
      'status': statusValue,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  EventRsvp toEntity() {
    return EventRsvp(
      id: id,
      eventId: eventId,
      status: RsvpStatus.fromApiValue(statusValue),
      createdAt: createdAt,
    );
  }
}
