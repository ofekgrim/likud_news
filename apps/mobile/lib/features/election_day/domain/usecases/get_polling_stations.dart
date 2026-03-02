import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/polling_station.dart';
import '../repositories/election_day_repository.dart';

/// Fetches a list of polling stations with optional filters.
@injectable
class GetPollingStations
    implements UseCase<List<PollingStation>, PollingStationsParams> {
  final ElectionDayRepository repository;

  GetPollingStations(this.repository);

  @override
  Future<Either<Failure, List<PollingStation>>> call(
    PollingStationsParams params,
  ) {
    return repository.getPollingStations(
      electionId: params.electionId,
      district: params.district,
      city: params.city,
      page: params.page,
    );
  }
}

/// Parameters for the [GetPollingStations] use case.
class PollingStationsParams extends Equatable {
  final String? electionId;
  final String? district;
  final String? city;
  final int page;

  const PollingStationsParams({
    this.electionId,
    this.district,
    this.city,
    this.page = 1,
  });

  @override
  List<Object?> get props => [electionId, district, city, page];
}
