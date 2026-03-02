import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/campaign_event.dart';
import '../repositories/events_repository.dart';

/// Fetches the full detail for a single campaign event.
@injectable
class GetEventDetail
    implements UseCase<CampaignEvent, GetEventDetailParams> {
  final EventsRepository repository;

  GetEventDetail(this.repository);

  @override
  Future<Either<Failure, CampaignEvent>> call(GetEventDetailParams params) {
    return repository.getEvent(params.id);
  }
}

/// Parameters for the [GetEventDetail] use case.
class GetEventDetailParams extends Equatable {
  final String id;

  const GetEventDetailParams({required this.id});

  @override
  List<Object?> get props => [id];
}
