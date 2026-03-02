import 'package:equatable/equatable.dart';

/// RSVP status for a campaign event.
enum RsvpStatus {
  interested,
  going,
  notGoing;

  /// Converts the enum to its API string representation.
  String toApiValue() {
    switch (this) {
      case RsvpStatus.interested:
        return 'interested';
      case RsvpStatus.going:
        return 'going';
      case RsvpStatus.notGoing:
        return 'not_going';
    }
  }

  /// Parses an API string into the corresponding [RsvpStatus].
  static RsvpStatus fromApiValue(String value) {
    switch (value) {
      case 'interested':
        return RsvpStatus.interested;
      case 'going':
        return RsvpStatus.going;
      case 'not_going':
        return RsvpStatus.notGoing;
      default:
        return RsvpStatus.interested;
    }
  }
}

/// Immutable RSVP entity representing a user's response to a campaign event.
class EventRsvp extends Equatable {
  final String id;
  final String eventId;
  final RsvpStatus status;
  final DateTime createdAt;

  const EventRsvp({
    required this.id,
    required this.eventId,
    required this.status,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, eventId, status, createdAt];
}
