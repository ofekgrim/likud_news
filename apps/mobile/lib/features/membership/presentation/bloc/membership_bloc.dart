import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/membership_info.dart';
import '../../domain/entities/voting_eligibility.dart';
import '../../domain/usecases/check_voting_eligibility.dart';
import '../../domain/usecases/get_membership_info.dart';
import '../../domain/usecases/verify_membership.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Membership BLoC events.
sealed class MembershipEvent extends Equatable {
  const MembershipEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of the user's membership info.
final class LoadMembership extends MembershipEvent {
  const LoadMembership();
}

/// Submits a membership verification request.
final class SubmitVerification extends MembershipEvent {
  final String membershipId;
  final String fullName;

  const SubmitVerification({
    required this.membershipId,
    required this.fullName,
  });

  @override
  List<Object?> get props => [membershipId, fullName];
}

/// Checks the user's voting eligibility for upcoming elections.
final class CheckEligibility extends MembershipEvent {
  const CheckEligibility();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Membership BLoC states.
sealed class MembershipState extends Equatable {
  const MembershipState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class MembershipInitial extends MembershipState {
  const MembershipInitial();
}

/// Data is being fetched.
final class MembershipLoading extends MembershipState {
  const MembershipLoading();
}

/// Membership info and voting eligibility loaded successfully.
final class MembershipLoaded extends MembershipState {
  final MembershipInfo info;
  final VotingEligibility? eligibility;

  const MembershipLoaded({
    required this.info,
    this.eligibility,
  });

  @override
  List<Object?> get props => [info, eligibility];

  /// Creates a copy with updated fields.
  MembershipLoaded copyWith({
    MembershipInfo? info,
    VotingEligibility? eligibility,
  }) {
    return MembershipLoaded(
      info: info ?? this.info,
      eligibility: eligibility ?? this.eligibility,
    );
  }
}

/// Verification request was submitted successfully.
final class VerificationSubmitted extends MembershipState {
  final MembershipInfo info;

  const VerificationSubmitted({required this.info});

  @override
  List<Object?> get props => [info];
}

/// An error occurred while loading membership data.
final class MembershipError extends MembershipState {
  final String message;

  const MembershipError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Membership dashboard screen.
///
/// Handles loading membership info, submitting verification requests,
/// and checking voting eligibility.
@injectable
class MembershipBloc extends Bloc<MembershipEvent, MembershipState> {
  final GetMembershipInfo _getMembershipInfo;
  final VerifyMembership _verifyMembership;
  final CheckVotingEligibility _checkVotingEligibility;

  MembershipBloc(
    this._getMembershipInfo,
    this._verifyMembership,
    this._checkVotingEligibility,
  ) : super(const MembershipInitial()) {
    on<LoadMembership>(_onLoadMembership);
    on<SubmitVerification>(_onSubmitVerification);
    on<CheckEligibility>(_onCheckEligibility);
  }

  /// Loads the user's membership info and voting eligibility.
  Future<void> _onLoadMembership(
    LoadMembership event,
    Emitter<MembershipState> emit,
  ) async {
    emit(const MembershipLoading());

    final infoResult = await _getMembershipInfo(const NoParams());

    await infoResult.fold(
      (failure) async => emit(MembershipError(
        message: failure.message ?? 'Failed to load membership info',
      )),
      (info) async {
        // Also fetch voting eligibility after membership info loads.
        final eligibilityResult =
            await _checkVotingEligibility(const NoParams());

        eligibilityResult.fold(
          // If eligibility check fails, still show membership info.
          (_) => emit(MembershipLoaded(info: info)),
          (eligibility) => emit(MembershipLoaded(
            info: info,
            eligibility: eligibility,
          )),
        );
      },
    );
  }

  /// Submits a membership verification request.
  Future<void> _onSubmitVerification(
    SubmitVerification event,
    Emitter<MembershipState> emit,
  ) async {
    emit(const MembershipLoading());

    final result = await _verifyMembership(
      VerifyMembershipParams(
        membershipId: event.membershipId,
        fullName: event.fullName,
      ),
    );

    result.fold(
      (failure) => emit(MembershipError(
        message: failure.message ?? 'Failed to submit verification',
      )),
      (info) => emit(VerificationSubmitted(info: info)),
    );
  }

  /// Checks the user's voting eligibility.
  Future<void> _onCheckEligibility(
    CheckEligibility event,
    Emitter<MembershipState> emit,
  ) async {
    final currentState = state;
    if (currentState is! MembershipLoaded) return;

    final result = await _checkVotingEligibility(const NoParams());

    result.fold(
      (failure) {
        // Keep current state, do not overwrite membership info on error.
      },
      (eligibility) => emit(currentState.copyWith(eligibility: eligibility)),
    );
  }
}
