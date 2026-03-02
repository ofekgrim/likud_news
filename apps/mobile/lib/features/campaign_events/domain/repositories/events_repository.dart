import 'package:dartz/dartz.dart';

import '../../../../core/errors/failures.dart';
import '../entities/campaign_event.dart';
import '../entities/event_rsvp.dart';

/// Abstract contract for the campaign events feature data operations.
///
/// Implemented by [EventsRepositoryImpl] in the data layer.
abstract class EventsRepository {
  /// Fetches a paginated list of campaign events.
  ///
  /// Supports optional filters: [district], [candidateId], [upcoming].
  /// [page] starts at 1.
  Future<Either<Failure, List<CampaignEvent>>> getEvents({
    required int page,
    String? district,
    String? candidateId,
    bool? upcoming,
  });

  /// Fetches a single campaign event by [id].
  Future<Either<Failure, CampaignEvent>> getEvent(String id);

  /// Submits or updates an RSVP for the event with [eventId].
  Future<Either<Failure, EventRsvp>> rsvpToEvent({
    required String eventId,
    required RsvpStatus status,
  });

  /// Fetches the current user's RSVP for the event with [eventId].
  ///
  /// Returns `null` wrapped in [Right] if the user has not RSVP'd.
  Future<Either<Failure, EventRsvp?>> getMyRsvp(String eventId);
}
