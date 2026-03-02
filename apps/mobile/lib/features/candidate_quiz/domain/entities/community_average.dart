import 'package:equatable/equatable.dart';

/// Represents the community-wide average match percentage for a single candidate.
///
/// Computed by aggregating all users' quiz responses for a given election.
class CommunityAverage extends Equatable {
  final String candidateId;
  final String candidateName;
  final int averageMatchPercentage;
  final int totalResponses;

  const CommunityAverage({
    required this.candidateId,
    required this.candidateName,
    required this.averageMatchPercentage,
    required this.totalResponses,
  });

  @override
  List<Object?> get props => [
        candidateId,
        candidateName,
        averageMatchPercentage,
        totalResponses,
      ];
}
