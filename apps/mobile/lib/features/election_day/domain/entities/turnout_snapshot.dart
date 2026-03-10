import 'package:equatable/equatable.dart';

/// Immutable turnout snapshot entity used throughout the domain and presentation layers.
///
/// Represents a point-in-time snapshot of voter turnout for a given election
/// and optionally a specific district.
class TurnoutSnapshot extends Equatable {
  final String id;
  final String electionId;
  final String? district;
  final int eligibleVoters;
  final int actualVoters;
  final double percentage;
  final DateTime snapshotAt;

  const TurnoutSnapshot({
    required this.id,
    required this.electionId,
    this.district,
    required this.eligibleVoters,
    required this.actualVoters,
    required this.percentage,
    required this.snapshotAt,
  });

  @override
  List<Object?> get props => [
        id,
        electionId,
        district,
        eligibleVoters,
        actualVoters,
        percentage,
        snapshotAt,
      ];
}
