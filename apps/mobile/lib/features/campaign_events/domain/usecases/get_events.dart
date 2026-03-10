import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/campaign_event.dart';
import '../repositories/events_repository.dart';

/// Fetches a paginated list of campaign events with optional filters.
@injectable
class GetEvents implements UseCase<List<CampaignEvent>, GetEventsParams> {
  final EventsRepository repository;

  GetEvents(this.repository);

  @override
  Future<Either<Failure, List<CampaignEvent>>> call(GetEventsParams params) {
    return repository.getEvents(
      page: params.page,
      district: params.district,
      candidateId: params.candidateId,
      upcoming: params.upcoming,
    );
  }
}

/// Parameters for the [GetEvents] use case.
class GetEventsParams extends Equatable {
  final int page;
  final String? district;
  final String? candidateId;
  final bool? upcoming;

  const GetEventsParams({
    this.page = 1,
    this.district,
    this.candidateId,
    this.upcoming,
  });

  @override
  List<Object?> get props => [page, district, candidateId, upcoming];
}
