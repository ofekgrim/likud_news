import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/compare_result.dart';
import '../../domain/usecases/get_candidate_comparison.dart';

part 'candidate_compare_event.dart';
part 'candidate_compare_state.dart';

/// Manages the state of the Candidate Compare screen.
///
/// Handles loading comparisons and swapping candidates in the comparison.
@injectable
class CandidateCompareBloc
    extends Bloc<CandidateCompareEvent, CandidateCompareState> {
  final GetCandidateComparison _getCandidateComparison;

  /// Current candidate IDs being compared.
  List<String> _currentIds = [];

  CandidateCompareBloc(this._getCandidateComparison)
      : super(const CandidateCompareInitial()) {
    on<LoadComparison>(_onLoadComparison);
    on<SwapCandidate>(_onSwapCandidate);
  }

  /// Loads a comparison for the given candidate IDs.
  Future<void> _onLoadComparison(
    LoadComparison event,
    Emitter<CandidateCompareState> emit,
  ) async {
    emit(const CandidateCompareLoading());
    _currentIds = List.from(event.ids);

    final result = await _getCandidateComparison(
      CandidateComparisonParams(ids: event.ids),
    );

    result.fold(
      (failure) => emit(CandidateCompareError(failure: failure)),
      (compareResult) => emit(CandidateCompareLoaded(
        result: compareResult,
        candidateIds: List.from(_currentIds),
      )),
    );
  }

  /// Swaps a candidate at the given index and reloads the comparison.
  Future<void> _onSwapCandidate(
    SwapCandidate event,
    Emitter<CandidateCompareState> emit,
  ) async {
    if (event.index < 0 || event.index >= _currentIds.length) return;

    // Don't swap if same candidate.
    if (_currentIds[event.index] == event.newCandidateId) return;

    emit(const CandidateCompareLoading());

    _currentIds[event.index] = event.newCandidateId;

    final result = await _getCandidateComparison(
      CandidateComparisonParams(ids: _currentIds),
    );

    result.fold(
      (failure) => emit(CandidateCompareError(failure: failure)),
      (compareResult) => emit(CandidateCompareLoaded(
        result: compareResult,
        candidateIds: List.from(_currentIds),
      )),
    );
  }
}
