import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/event_rsvp.dart';
import '../repositories/events_repository.dart';

/// Submits or updates an RSVP for a campaign event.
@injectable
class RsvpToEvent implements UseCase<EventRsvp, RsvpToEventParams> {
  final EventsRepository repository;

  RsvpToEvent(this.repository);

  @override
  Future<Either<Failure, EventRsvp>> call(RsvpToEventParams params) {
    return repository.rsvpToEvent(
      eventId: params.eventId,
      status: params.status,
    );
  }
}

/// Parameters for the [RsvpToEvent] use case.
class RsvpToEventParams extends Equatable {
  final String eventId;
  final RsvpStatus status;

  const RsvpToEventParams({
    required this.eventId,
    required this.status,
  });

  @override
  List<Object?> get props => [eventId, status];
}
