import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/event_rsvp.dart';
import '../repositories/events_repository.dart';

/// Fetches the current user's RSVP for a specific campaign event.
@injectable
class GetMyRsvp implements UseCase<EventRsvp?, GetMyRsvpParams> {
  final EventsRepository repository;

  GetMyRsvp(this.repository);

  @override
  Future<Either<Failure, EventRsvp?>> call(GetMyRsvpParams params) {
    return repository.getMyRsvp(params.eventId);
  }
}

/// Parameters for the [GetMyRsvp] use case.
class GetMyRsvpParams extends Equatable {
  final String eventId;

  const GetMyRsvpParams({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}
