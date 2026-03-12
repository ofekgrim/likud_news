import 'package:equatable/equatable.dart';

/// Immutable entity representing the result of comparing two or more candidates.
///
/// Contains the full candidate data for each compared candidate and
/// a matrix of position comparisons across quiz categories.
class CompareResult extends Equatable {
  /// The candidates being compared, with all their details.
  final List<ComparedCandidate> candidates;

  /// Position comparison matrix: category name -> list of scores (one per candidate).
  /// Order matches [candidates] order.
  final Map<String, List<double>> positionComparison;

  const CompareResult({
    required this.candidates,
    this.positionComparison = const {},
  });

  @override
  List<Object?> get props => [candidates, positionComparison];
}

/// A candidate with the subset of fields relevant for comparison.
class ComparedCandidate extends Equatable {
  final String id;
  final String fullName;
  final String? photoUrl;
  final String? position;
  final String? district;
  final int endorsementCount;
  final String? bio;
  final Map<String, double> quizPositions;

  const ComparedCandidate({
    required this.id,
    required this.fullName,
    this.photoUrl,
    this.position,
    this.district,
    this.endorsementCount = 0,
    this.bio,
    this.quizPositions = const {},
  });

  @override
  List<Object?> get props => [
        id,
        fullName,
        photoUrl,
        position,
        district,
        endorsementCount,
        bio,
        quizPositions,
      ];
}
