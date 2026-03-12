import 'package:equatable/equatable.dart';

/// Immutable entity representing a single candidate's live result
/// in the leaderboard view.
///
/// [deltaRank] indicates rank change since previous update:
/// positive = moved up, negative = moved down, 0 = unchanged.
class CandidateResult extends Equatable {
  final String candidateId;
  final String name;
  final String? imageUrl;
  final int voteCount;
  final double percentage;
  final int rank;
  final int deltaRank;

  const CandidateResult({
    required this.candidateId,
    required this.name,
    this.imageUrl,
    required this.voteCount,
    required this.percentage,
    required this.rank,
    this.deltaRank = 0,
  });

  CandidateResult copyWith({
    String? candidateId,
    String? name,
    String? imageUrl,
    int? voteCount,
    double? percentage,
    int? rank,
    int? deltaRank,
  }) {
    return CandidateResult(
      candidateId: candidateId ?? this.candidateId,
      name: name ?? this.name,
      imageUrl: imageUrl ?? this.imageUrl,
      voteCount: voteCount ?? this.voteCount,
      percentage: percentage ?? this.percentage,
      rank: rank ?? this.rank,
      deltaRank: deltaRank ?? this.deltaRank,
    );
  }

  @override
  List<Object?> get props => [
        candidateId,
        name,
        imageUrl,
        voteCount,
        percentage,
        rank,
        deltaRank,
      ];
}
