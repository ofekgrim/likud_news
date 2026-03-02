import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/turnout_snapshot.dart';
import '../repositories/election_day_repository.dart';

/// Fetches turnout snapshots for a specific election.
@injectable
class GetTurnoutSnapshots
    implements UseCase<List<TurnoutSnapshot>, TurnoutSnapshotsParams> {
  final ElectionDayRepository repository;

  GetTurnoutSnapshots(this.repository);

  @override
  Future<Either<Failure, List<TurnoutSnapshot>>> call(
    TurnoutSnapshotsParams params,
  ) {
    return repository.getTurnoutSnapshots(params.electionId);
  }
}

/// Parameters for the [GetTurnoutSnapshots] use case.
class TurnoutSnapshotsParams extends Equatable {
  final String electionId;

  const TurnoutSnapshotsParams({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}
