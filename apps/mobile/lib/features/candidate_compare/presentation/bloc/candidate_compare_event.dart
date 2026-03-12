part of 'candidate_compare_bloc.dart';

/// Base class for all CandidateCompare BLoC events.
sealed class CandidateCompareEvent extends Equatable {
  const CandidateCompareEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading a comparison for the given candidate IDs.
final class LoadComparison extends CandidateCompareEvent {
  final List<String> ids;

  const LoadComparison({required this.ids});

  @override
  List<Object?> get props => [ids];
}

/// Swaps a candidate at the given index with a new candidate ID
/// and reloads the comparison.
final class SwapCandidate extends CandidateCompareEvent {
  final int index;
  final String newCandidateId;

  const SwapCandidate({
    required this.index,
    required this.newCandidateId,
  });

  @override
  List<Object?> get props => [index, newCandidateId];
}
