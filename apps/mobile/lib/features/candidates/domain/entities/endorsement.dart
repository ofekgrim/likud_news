import 'package:equatable/equatable.dart';

/// Immutable endorsement entity representing a user's endorsement of a candidate.
class Endorsement extends Equatable {
  final String id;
  final String userId;
  final String candidateId;
  final String electionId;
  final DateTime? createdAt;

  const Endorsement({
    required this.id,
    required this.userId,
    required this.candidateId,
    required this.electionId,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        candidateId,
        electionId,
        createdAt,
      ];
}
