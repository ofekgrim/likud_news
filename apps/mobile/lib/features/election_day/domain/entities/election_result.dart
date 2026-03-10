import 'package:equatable/equatable.dart';

/// Immutable election result entity used throughout the domain and presentation layers.
///
/// Candidate details are flattened from the backend relation for simplicity.
class ElectionResult extends Equatable {
  final String id;
  final String electionId;
  final String candidateId;
  final String candidateName;
  final String? candidatePhotoUrl;
  final String? stationId;
  final int voteCount;
  final double? percentage;
  final bool isOfficial;
  final DateTime? publishedAt;

  const ElectionResult({
    required this.id,
    required this.electionId,
    required this.candidateId,
    required this.candidateName,
    this.candidatePhotoUrl,
    this.stationId,
    this.voteCount = 0,
    this.percentage,
    this.isOfficial = false,
    this.publishedAt,
  });

  @override
  List<Object?> get props => [
        id,
        electionId,
        candidateId,
        candidateName,
        candidatePhotoUrl,
        stationId,
        voteCount,
        percentage,
        isOfficial,
        publishedAt,
      ];
}
