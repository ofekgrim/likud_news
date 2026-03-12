import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/get_branch_leaderboard.dart';
import '../../domain/usecases/get_national_leaderboard.dart';
import 'branch_leaderboard_event.dart';
import 'branch_leaderboard_state.dart';

/// Manages the state of the Branch Leaderboard screen.
///
/// Loads branch leaderboard data with period filtering.
/// Supports switching between current, previous, and all-time views.
@injectable
class BranchLeaderboardBloc
    extends Bloc<BranchLeaderboardEvent, BranchLeaderboardState> {
  final GetBranchLeaderboard _getBranchLeaderboard;
  final GetNationalLeaderboard _getNationalLeaderboard;

  BranchLeaderboardBloc(
    this._getBranchLeaderboard,
    this._getNationalLeaderboard,
  ) : super(const BranchLeaderboardInitial()) {
    on<LoadBranchLeaderboard>(_onLoadBranchLeaderboard);
    on<LoadNationalLeaderboard>(_onLoadNationalLeaderboard);
    on<ChangePeriod>(_onChangePeriod);
  }

  /// Loads the branch leaderboard for the given period.
  Future<void> _onLoadBranchLeaderboard(
    LoadBranchLeaderboard event,
    Emitter<BranchLeaderboardState> emit,
  ) async {
    emit(const BranchLeaderboardLoading());

    final period = event.period ?? 'current';
    final result = await _getBranchLeaderboard(
      BranchLeaderboardParams(period: period),
    );

    result.fold(
      (failure) => emit(BranchLeaderboardError(
        message: failure.message ?? 'Error loading leaderboard',
      )),
      (leaderboard) => emit(BranchLeaderboardLoaded(
        leaderboard: leaderboard,
        currentPeriod: period,
      )),
    );
  }

  /// Loads the national leaderboard.
  Future<void> _onLoadNationalLeaderboard(
    LoadNationalLeaderboard event,
    Emitter<BranchLeaderboardState> emit,
  ) async {
    emit(const BranchLeaderboardLoading());

    final result = await _getNationalLeaderboard(const NoParams());

    result.fold(
      (failure) => emit(BranchLeaderboardError(
        message: failure.message ?? 'Error loading leaderboard',
      )),
      (leaderboard) => emit(BranchLeaderboardLoaded(
        leaderboard: leaderboard,
        currentPeriod: 'national',
      )),
    );
  }

  /// Changes the selected period and reloads the leaderboard.
  Future<void> _onChangePeriod(
    ChangePeriod event,
    Emitter<BranchLeaderboardState> emit,
  ) async {
    final currentState = state;
    if (currentState is BranchLeaderboardLoaded) {
      emit(currentState.copyWith(currentPeriod: event.period));
    }

    final result = await _getBranchLeaderboard(
      BranchLeaderboardParams(period: event.period),
    );

    result.fold(
      (failure) {
        // Keep existing data on failure.
      },
      (leaderboard) {
        final updatedState = state;
        if (updatedState is BranchLeaderboardLoaded) {
          emit(updatedState.copyWith(
            leaderboard: leaderboard,
            currentPeriod: event.period,
          ));
        } else {
          emit(BranchLeaderboardLoaded(
            leaderboard: leaderboard,
            currentPeriod: event.period,
          ));
        }
      },
    );
  }
}
