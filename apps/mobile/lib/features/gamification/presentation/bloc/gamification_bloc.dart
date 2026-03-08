import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/leaderboard_entry.dart';
import '../../domain/entities/user_badge.dart';
import '../../domain/entities/user_streak.dart';
import '../../domain/repositories/gamification_repository.dart';
import '../../domain/usecases/get_leaderboard.dart';
import '../../domain/usecases/get_user_badges.dart';
import '../../domain/usecases/get_user_points.dart';

// ---------------------------------------------------------------------------
// Period enum
// ---------------------------------------------------------------------------

/// Time period for leaderboard and rank filtering.
enum GamificationPeriod { weekly, monthly, allTime }

/// Extension to convert [GamificationPeriod] to API query string.
extension GamificationPeriodApi on GamificationPeriod {
  String get apiValue {
    switch (this) {
      case GamificationPeriod.weekly:
        return 'weekly';
      case GamificationPeriod.monthly:
        return 'monthly';
      case GamificationPeriod.allTime:
        return 'all_time';
    }
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Gamification BLoC events.
sealed class GamificationEvent extends Equatable {
  const GamificationEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of user points, badges, rank, and leaderboard.
final class LoadGamification extends GamificationEvent {
  const LoadGamification();
}

/// Loads the authenticated user's points.
final class LoadMyPoints extends GamificationEvent {
  const LoadMyPoints();
}

/// Loads the authenticated user's badges.
final class LoadMyBadges extends GamificationEvent {
  const LoadMyBadges();
}

/// Loads the authenticated user's rank for the selected period.
final class LoadMyRank extends GamificationEvent {
  const LoadMyRank();
}

/// Loads the public leaderboard for the selected period.
final class LoadLeaderboard extends GamificationEvent {
  const LoadLeaderboard();
}

/// Changes the time period filter and reloads data.
final class ChangePeriod extends GamificationEvent {
  final GamificationPeriod period;

  const ChangePeriod(this.period);

  @override
  List<Object?> get props => [period];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Gamification BLoC states.
sealed class GamificationState extends Equatable {
  const GamificationState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class GamificationInitial extends GamificationState {
  const GamificationInitial();
}

/// Data is being fetched for the first time.
final class GamificationLoading extends GamificationState {
  const GamificationLoading();
}

/// Data loaded successfully.
final class GamificationLoaded extends GamificationState {
  final int totalPoints;
  final List<UserBadge> badges;
  final int rank;
  final List<LeaderboardEntry> leaderboard;
  final GamificationPeriod selectedPeriod;
  final UserStreak streak;

  const GamificationLoaded({
    this.totalPoints = 0,
    this.badges = const [],
    this.rank = 0,
    this.leaderboard = const [],
    this.selectedPeriod = GamificationPeriod.weekly,
    this.streak = const UserStreak(),
  });

  /// Creates a copy with optional overrides.
  GamificationLoaded copyWith({
    int? totalPoints,
    List<UserBadge>? badges,
    int? rank,
    List<LeaderboardEntry>? leaderboard,
    GamificationPeriod? selectedPeriod,
    UserStreak? streak,
  }) {
    return GamificationLoaded(
      totalPoints: totalPoints ?? this.totalPoints,
      badges: badges ?? this.badges,
      rank: rank ?? this.rank,
      leaderboard: leaderboard ?? this.leaderboard,
      selectedPeriod: selectedPeriod ?? this.selectedPeriod,
      streak: streak ?? this.streak,
    );
  }

  @override
  List<Object?> get props => [
        totalPoints,
        badges,
        rank,
        leaderboard,
        selectedPeriod,
        streak,
      ];
}

/// An error occurred while loading gamification data.
final class GamificationError extends GamificationState {
  final String message;

  const GamificationError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Gamification screen.
///
/// Loads user points, badges, rank, and the public leaderboard.
/// Supports switching between weekly, monthly, and all-time views.
@injectable
class GamificationBloc extends Bloc<GamificationEvent, GamificationState> {
  final GetUserPoints _getUserPoints;
  final GetUserBadges _getUserBadges;
  final GetLeaderboard _getLeaderboard;
  final GamificationRepository _repository;

  GamificationBloc(
    this._getUserPoints,
    this._getUserBadges,
    this._getLeaderboard,
    this._repository,
  ) : super(const GamificationInitial()) {
    on<LoadGamification>(_onLoadGamification);
    on<LoadMyPoints>(_onLoadMyPoints);
    on<LoadMyBadges>(_onLoadMyBadges);
    on<LoadLeaderboard>(_onLoadLeaderboard);
    on<ChangePeriod>(_onChangePeriod);
  }

  /// Loads all gamification data at once.
  Future<void> _onLoadGamification(
    LoadGamification event,
    Emitter<GamificationState> emit,
  ) async {
    emit(const GamificationLoading());

    const period = GamificationPeriod.weekly;

    // Fetch points
    int totalPoints = 0;
    final pointsResult = await _getUserPoints(const NoParams());
    pointsResult.fold(
      (_) {},
      (points) => totalPoints = points,
    );

    // Fetch badges
    List<UserBadge> badges = [];
    final badgesResult = await _getUserBadges(const NoParams());
    badgesResult.fold(
      (_) {},
      (b) => badges = b,
    );

    // Fetch leaderboard
    List<LeaderboardEntry> leaderboard = [];
    final leaderboardResult = await _getLeaderboard(
      LeaderboardParams(period: period.apiValue),
    );
    leaderboardResult.fold(
      (_) {},
      (entries) => leaderboard = entries,
    );

    // Fetch streak
    UserStreak streak = const UserStreak();
    final streakResult = await _repository.getStreak();
    streakResult.fold(
      (_) {},
      (s) => streak = s,
    );

    emit(GamificationLoaded(
      totalPoints: totalPoints,
      badges: badges,
      rank: 0,
      leaderboard: leaderboard,
      selectedPeriod: period,
      streak: streak,
    ));
  }

  /// Loads only the user's points.
  Future<void> _onLoadMyPoints(
    LoadMyPoints event,
    Emitter<GamificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is! GamificationLoaded) {
      emit(const GamificationLoading());
    }

    final result = await _getUserPoints(const NoParams());

    result.fold(
      (failure) {
        if (currentState is GamificationLoaded) {
          // Keep existing data on failure.
          return;
        }
        emit(GamificationError(
          message: failure.message ?? 'gamification_error_loading'.tr(),
        ));
      },
      (points) {
        if (currentState is GamificationLoaded) {
          emit(currentState.copyWith(totalPoints: points));
        } else {
          emit(GamificationLoaded(totalPoints: points));
        }
      },
    );
  }

  /// Loads only the user's badges.
  Future<void> _onLoadMyBadges(
    LoadMyBadges event,
    Emitter<GamificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is! GamificationLoaded) {
      emit(const GamificationLoading());
    }

    final result = await _getUserBadges(const NoParams());

    result.fold(
      (failure) {
        if (currentState is GamificationLoaded) {
          return;
        }
        emit(GamificationError(
          message: failure.message ?? 'gamification_error_loading'.tr(),
        ));
      },
      (badges) {
        if (currentState is GamificationLoaded) {
          emit(currentState.copyWith(badges: badges));
        } else {
          emit(GamificationLoaded(badges: badges));
        }
      },
    );
  }

  /// Loads the public leaderboard.
  Future<void> _onLoadLeaderboard(
    LoadLeaderboard event,
    Emitter<GamificationState> emit,
  ) async {
    final currentState = state;
    final period = currentState is GamificationLoaded
        ? currentState.selectedPeriod
        : GamificationPeriod.weekly;

    final result = await _getLeaderboard(
      LeaderboardParams(period: period.apiValue),
    );

    result.fold(
      (failure) {
        if (currentState is GamificationLoaded) {
          return;
        }
        emit(GamificationError(
          message: failure.message ?? 'gamification_error_loading'.tr(),
        ));
      },
      (entries) {
        if (currentState is GamificationLoaded) {
          emit(currentState.copyWith(leaderboard: entries));
        } else {
          emit(GamificationLoaded(
            leaderboard: entries,
            selectedPeriod: period,
          ));
        }
      },
    );
  }

  /// Changes the selected time period and reloads the leaderboard.
  Future<void> _onChangePeriod(
    ChangePeriod event,
    Emitter<GamificationState> emit,
  ) async {
    final currentState = state;
    if (currentState is GamificationLoaded) {
      emit(currentState.copyWith(selectedPeriod: event.period));
    }

    // Reload leaderboard with new period
    final result = await _getLeaderboard(
      LeaderboardParams(period: event.period.apiValue),
    );

    result.fold(
      (failure) {
        // Keep existing data on failure.
      },
      (entries) {
        final updatedState = state;
        if (updatedState is GamificationLoaded) {
          emit(updatedState.copyWith(leaderboard: entries));
        }
      },
    );
  }
}
