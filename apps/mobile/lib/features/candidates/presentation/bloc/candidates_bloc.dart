import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/network/sse_client.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/candidate.dart';
import '../../domain/entities/election.dart';
import '../../domain/entities/endorsement.dart';
import '../../domain/usecases/endorse_candidate.dart';
import '../../domain/usecases/get_candidates_by_election.dart';
import '../../domain/usecases/get_candidate_detail.dart';
import '../../domain/usecases/get_elections.dart';
import '../../domain/usecases/get_my_endorsement.dart';
import '../../domain/usecases/remove_endorsement.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Candidates BLoC events.
sealed class CandidatesEvent extends Equatable {
  const CandidatesEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of all elections.
final class LoadElections extends CandidatesEvent {
  const LoadElections();
}

/// Triggers loading of candidates for a given election.
final class LoadCandidates extends CandidatesEvent {
  final String electionId;

  const LoadCandidates({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Triggers loading of a single candidate's detail by slug.
final class LoadCandidateDetail extends CandidatesEvent {
  final String slug;

  const LoadCandidateDetail({required this.slug});

  @override
  List<Object?> get props => [slug];
}

/// Endorses a candidate in a given election.
final class EndorseCandidateEvent extends CandidatesEvent {
  final String candidateId;
  final String electionId;

  const EndorseCandidateEvent({
    required this.candidateId,
    required this.electionId,
  });

  @override
  List<Object?> get props => [candidateId, electionId];
}

/// Removes the current user's endorsement for a given election.
final class RemoveEndorsementEvent extends CandidatesEvent {
  final String electionId;

  const RemoveEndorsementEvent({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Loads the current user's endorsement for a given election.
final class LoadMyEndorsement extends CandidatesEvent {
  final String electionId;

  const LoadMyEndorsement({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Filters candidates locally by district.
final class FilterByDistrict extends CandidatesEvent {
  final String? district;

  const FilterByDistrict({this.district});

  @override
  List<Object?> get props => [district];
}

/// Subscribes to SSE primaries stream for real-time endorsement count updates.
final class SubscribeToEndorsementUpdates extends CandidatesEvent {
  const SubscribeToEndorsementUpdates();
}

/// Internal event: SSE delivered an endorsement count update.
final class _SseEndorsementUpdated extends CandidatesEvent {
  final Map<String, int> endorsementCounts;

  const _SseEndorsementUpdated(this.endorsementCounts);

  @override
  List<Object?> get props => [endorsementCounts];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Candidates BLoC states.
sealed class CandidatesState extends Equatable {
  const CandidatesState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class CandidatesInitial extends CandidatesState {
  const CandidatesInitial();
}

/// Data is being fetched.
final class CandidatesLoading extends CandidatesState {
  const CandidatesLoading();
}

/// All elections loaded successfully.
final class ElectionsLoaded extends CandidatesState {
  final List<Election> elections;

  const ElectionsLoaded({required this.elections});

  @override
  List<Object?> get props => [elections];
}

/// Candidates loaded successfully for a given election.
final class CandidatesLoaded extends CandidatesState {
  final List<Candidate> candidates;
  final String? selectedDistrict;
  final List<Candidate> filteredCandidates;

  const CandidatesLoaded({
    required this.candidates,
    this.selectedDistrict,
    required this.filteredCandidates,
  });

  @override
  List<Object?> get props => [candidates, selectedDistrict, filteredCandidates];
}

/// A single candidate's detail loaded successfully.
final class CandidateDetailLoaded extends CandidatesState {
  final Candidate candidate;
  final Endorsement? endorsement;

  const CandidateDetailLoaded({
    required this.candidate,
    this.endorsement,
  });

  @override
  List<Object?> get props => [candidate, endorsement];
}

/// An error occurred while loading candidates data.
final class CandidatesError extends CandidatesState {
  final String message;

  const CandidatesError({required this.message});

  @override
  List<Object?> get props => [message];
}

/// An endorsement was updated (created or removed).
final class EndorsementUpdated extends CandidatesState {
  final Endorsement? endorsement;
  final String? candidateId;

  const EndorsementUpdated({this.endorsement, this.candidateId});

  @override
  List<Object?> get props => [endorsement, candidateId];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Candidates screens.
///
/// Handles loading elections, candidates, candidate detail, and endorsements.
@injectable
class CandidatesBloc extends Bloc<CandidatesEvent, CandidatesState> {
  final GetElections _getElections;
  final GetCandidatesByElection _getCandidatesByElection;
  final GetCandidateDetail _getCandidateDetail;
  final EndorseCandidate _endorseCandidate;
  final RemoveEndorsement _removeEndorsement;
  final GetMyEndorsement _getMyEndorsement;
  final SseClient _sseClient;

  StreamSubscription<SseEvent>? _sseSubscription;

  /// Cached candidates list for local district filtering.
  List<Candidate> _allCandidates = [];

  CandidatesBloc(
    this._getElections,
    this._getCandidatesByElection,
    this._getCandidateDetail,
    this._endorseCandidate,
    this._removeEndorsement,
    this._getMyEndorsement,
    this._sseClient,
  ) : super(const CandidatesInitial()) {
    on<LoadElections>(_onLoadElections);
    on<LoadCandidates>(_onLoadCandidates);
    on<LoadCandidateDetail>(_onLoadCandidateDetail);
    on<EndorseCandidateEvent>(_onEndorseCandidate);
    on<RemoveEndorsementEvent>(_onRemoveEndorsement);
    on<LoadMyEndorsement>(_onLoadMyEndorsement);
    on<FilterByDistrict>(_onFilterByDistrict);
    on<SubscribeToEndorsementUpdates>(_onSubscribeToEndorsementUpdates);
    on<_SseEndorsementUpdated>(_onSseEndorsementUpdated);
  }

  /// Loads all elections.
  Future<void> _onLoadElections(
    LoadElections event,
    Emitter<CandidatesState> emit,
  ) async {
    emit(const CandidatesLoading());

    final result = await _getElections(const NoParams());

    result.fold(
      (failure) => emit(CandidatesError(
        message: failure.message ?? 'Failed to load elections',
      )),
      (elections) => emit(ElectionsLoaded(elections: elections)),
    );
  }

  /// Loads candidates for a given election.
  Future<void> _onLoadCandidates(
    LoadCandidates event,
    Emitter<CandidatesState> emit,
  ) async {
    emit(const CandidatesLoading());

    final result = await _getCandidatesByElection(
      CandidatesByElectionParams(electionId: event.electionId),
    );

    result.fold(
      (failure) => emit(CandidatesError(
        message: failure.message ?? 'Failed to load candidates',
      )),
      (candidates) {
        _allCandidates = candidates;
        emit(CandidatesLoaded(
          candidates: candidates,
          filteredCandidates: candidates,
        ));
      },
    );
  }

  /// Loads a single candidate's detail by slug.
  Future<void> _onLoadCandidateDetail(
    LoadCandidateDetail event,
    Emitter<CandidatesState> emit,
  ) async {
    emit(const CandidatesLoading());

    final result = await _getCandidateDetail(
      CandidateDetailParams(slug: event.slug),
    );

    result.fold(
      (failure) => emit(CandidatesError(
        message: failure.message ?? 'Failed to load candidate details',
      )),
      (candidate) => emit(CandidateDetailLoaded(candidate: candidate)),
    );
  }

  /// Endorses a candidate.
  Future<void> _onEndorseCandidate(
    EndorseCandidateEvent event,
    Emitter<CandidatesState> emit,
  ) async {
    final result = await _endorseCandidate(
      EndorseCandidateParams(
        candidateId: event.candidateId,
        electionId: event.electionId,
      ),
    );

    result.fold(
      (failure) => emit(CandidatesError(
        message: failure.message ?? 'Failed to endorse candidate',
      )),
      (endorsement) => emit(EndorsementUpdated(
        endorsement: endorsement,
        candidateId: event.candidateId,
      )),
    );
  }

  /// Removes an endorsement.
  Future<void> _onRemoveEndorsement(
    RemoveEndorsementEvent event,
    Emitter<CandidatesState> emit,
  ) async {
    final result = await _removeEndorsement(
      RemoveEndorsementParams(electionId: event.electionId),
    );

    result.fold(
      (failure) => emit(CandidatesError(
        message: failure.message ?? 'Failed to remove endorsement',
      )),
      (_) => emit(const EndorsementUpdated()),
    );
  }

  /// Loads the current user's endorsement for a given election.
  Future<void> _onLoadMyEndorsement(
    LoadMyEndorsement event,
    Emitter<CandidatesState> emit,
  ) async {
    final result = await _getMyEndorsement(
      GetMyEndorsementParams(electionId: event.electionId),
    );

    result.fold(
      (failure) {
        // Silently handle — no endorsement is not an error.
      },
      (endorsement) {
        if (state is CandidateDetailLoaded) {
          final currentState = state as CandidateDetailLoaded;
          emit(CandidateDetailLoaded(
            candidate: currentState.candidate,
            endorsement: endorsement,
          ));
        } else {
          emit(EndorsementUpdated(
            endorsement: endorsement,
            candidateId: endorsement?.candidateId,
          ));
        }
      },
    );
  }

  /// Filters candidates locally by district.
  void _onFilterByDistrict(
    FilterByDistrict event,
    Emitter<CandidatesState> emit,
  ) {
    final district = event.district;
    final filtered = district == null || district.isEmpty
        ? _allCandidates
        : _allCandidates
            .where((c) => c.district == district)
            .toList();

    emit(CandidatesLoaded(
      candidates: _allCandidates,
      selectedDistrict: district,
      filteredCandidates: filtered,
    ));
  }

  /// Subscribes to the SSE primaries stream for endorsement count updates.
  void _onSubscribeToEndorsementUpdates(
    SubscribeToEndorsementUpdates event,
    Emitter<CandidatesState> emit,
  ) {
    _sseSubscription?.cancel();
    _sseSubscription = _sseClient.primariesStream().listen((sseEvent) {
      if (sseEvent.event == 'primaries') {
        try {
          final json = sseEvent.json;
          final innerEvent = json['event'] as String?;
          if (innerEvent != 'endorsement_update') return;

          final List<dynamic> candidates =
              json['candidates'] as List<dynamic>? ?? [];
          final counts = <String, int>{};
          for (final item in candidates) {
            final map = item as Map<String, dynamic>;
            final candidateId = map['candidateId'] as String;
            final count = int.tryParse(map['count'].toString()) ?? 0;
            counts[candidateId] = count;
          }

          if (counts.isNotEmpty) {
            add(_SseEndorsementUpdated(counts));
          }
        } catch (_) {
          // Silently ignore malformed SSE data.
        }
      }
    });
  }

  /// Handles SSE endorsement count update by patching the cached candidates.
  void _onSseEndorsementUpdated(
    _SseEndorsementUpdated event,
    Emitter<CandidatesState> emit,
  ) {
    if (_allCandidates.isEmpty) return;

    // Update endorsement counts in the cached list.
    _allCandidates = _allCandidates.map((c) {
      final newCount = event.endorsementCounts[c.id];
      if (newCount != null && newCount != c.endorsementCount) {
        return Candidate(
          id: c.id,
          electionId: c.electionId,
          fullName: c.fullName,
          slug: c.slug,
          district: c.district,
          position: c.position,
          photoUrl: c.photoUrl,
          coverImageUrl: c.coverImageUrl,
          bio: c.bio,
          bioBlocks: c.bioBlocks,
          quizPositions: c.quizPositions,
          socialLinks: c.socialLinks,
          phone: c.phone,
          email: c.email,
          website: c.website,
          endorsementCount: newCount,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          createdAt: c.createdAt,
        );
      }
      return c;
    }).toList();

    final currentState = state;
    if (currentState is CandidatesLoaded) {
      final district = currentState.selectedDistrict;
      final filtered = district == null || district.isEmpty
          ? _allCandidates
          : _allCandidates
              .where((c) => c.district == district)
              .toList();

      emit(CandidatesLoaded(
        candidates: _allCandidates,
        selectedDistrict: district,
        filteredCandidates: filtered,
      ));
    }
  }

  @override
  Future<void> close() {
    _sseSubscription?.cancel();
    return super.close();
  }
}
