import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/member.dart';
import '../../domain/entities/member_detail.dart';
import '../../domain/usecases/get_member_detail.dart';
import '../../domain/usecases/get_members.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Members BLoC events.
sealed class MembersEvent extends Equatable {
  const MembersEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of all members.
final class LoadMembers extends MembersEvent {
  const LoadMembers();
}

/// Triggers loading of a single member's detail.
final class LoadMemberDetail extends MembersEvent {
  final String id;

  const LoadMemberDetail({required this.id});

  @override
  List<Object?> get props => [id];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Members BLoC states.
sealed class MembersState extends Equatable {
  const MembersState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class MembersInitial extends MembersState {
  const MembersInitial();
}

/// Data is being fetched.
final class MembersLoading extends MembersState {
  const MembersLoading();
}

/// All members loaded successfully.
final class MembersLoaded extends MembersState {
  final List<Member> members;

  const MembersLoaded({required this.members});

  @override
  List<Object?> get props => [members];
}

/// A single member's detail loaded successfully.
final class MemberDetailLoaded extends MembersState {
  final MemberDetail memberDetail;

  const MemberDetailLoaded({required this.memberDetail});

  @override
  List<Object?> get props => [memberDetail];
}

/// An error occurred while loading members data.
final class MembersError extends MembersState {
  final String message;

  const MembersError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Members screens.
///
/// Handles loading the members directory and individual member detail.
@injectable
class MembersBloc extends Bloc<MembersEvent, MembersState> {
  final GetMembers _getMembers;
  final GetMemberDetail _getMemberDetail;

  MembersBloc(
    this._getMembers,
    this._getMemberDetail,
  ) : super(const MembersInitial()) {
    on<LoadMembers>(_onLoadMembers);
    on<LoadMemberDetail>(_onLoadMemberDetail);
  }

  /// Loads all members.
  Future<void> _onLoadMembers(
    LoadMembers event,
    Emitter<MembersState> emit,
  ) async {
    emit(const MembersLoading());

    final result = await _getMembers(const NoParams());

    result.fold(
      (failure) => emit(MembersError(
        message: failure.message ?? 'Failed to load members',
      )),
      (members) => emit(MembersLoaded(members: members)),
    );
  }

  /// Loads a single member's full detail with related articles.
  Future<void> _onLoadMemberDetail(
    LoadMemberDetail event,
    Emitter<MembersState> emit,
  ) async {
    emit(const MembersLoading());

    final result = await _getMemberDetail(
      MemberDetailParams(id: event.id),
    );

    result.fold(
      (failure) => emit(MembersError(
        message: failure.message ?? 'Failed to load member details',
      )),
      (memberDetail) => emit(MemberDetailLoaded(memberDetail: memberDetail)),
    );
  }
}
