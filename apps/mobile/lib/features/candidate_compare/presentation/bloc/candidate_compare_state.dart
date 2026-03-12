part of 'candidate_compare_bloc.dart';

/// Base class for all CandidateCompare BLoC states.
sealed class CandidateCompareState extends Equatable {
  const CandidateCompareState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any comparison has been requested.
final class CandidateCompareInitial extends CandidateCompareState {
  const CandidateCompareInitial();
}

/// Comparison data is being fetched.
final class CandidateCompareLoading extends CandidateCompareState {
  const CandidateCompareLoading();
}

/// Comparison loaded successfully.
final class CandidateCompareLoaded extends CandidateCompareState {
  final CompareResult result;
  final List<String> candidateIds;

  const CandidateCompareLoaded({
    required this.result,
    required this.candidateIds,
  });

  @override
  List<Object?> get props => [result, candidateIds];
}

/// An error occurred while loading the comparison.
final class CandidateCompareError extends CandidateCompareState {
  final Failure failure;

  const CandidateCompareError({required this.failure});

  @override
  List<Object?> get props => [failure];
}
