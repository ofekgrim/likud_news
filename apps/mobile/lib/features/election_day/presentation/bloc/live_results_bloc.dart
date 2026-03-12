import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/network/sse_client.dart';
import '../../../../core/services/app_logger.dart';
import '../../data/datasources/election_day_ws_datasource.dart';
import '../../data/models/candidate_result_model.dart';
import '../../data/models/knesset_slot_model.dart';
import '../../data/models/turnout_data_model.dart';
import '../../domain/entities/candidate_result.dart';
import '../../domain/entities/knesset_slot.dart';
import '../../domain/entities/turnout_data.dart';
import '../../domain/repositories/election_day_repository.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Live Results BLoC events.
sealed class LiveResultsEvent extends Equatable {
  const LiveResultsEvent();

  @override
  List<Object?> get props => [];
}

/// Connect to WebSocket for real-time results.
final class ConnectToResults extends LiveResultsEvent {
  final String electionId;

  const ConnectToResults({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Disconnect from the WebSocket/SSE connection.
final class DisconnectFromResults extends LiveResultsEvent {
  const DisconnectFromResults();
}

/// Internal event: results received from WebSocket or SSE.
final class _ResultsReceived extends LiveResultsEvent {
  final List<CandidateResult> results;

  const _ResultsReceived(this.results);

  @override
  List<Object?> get props => [results];
}

/// Internal event: turnout data received.
final class _TurnoutReceived extends LiveResultsEvent {
  final TurnoutData turnout;

  const _TurnoutReceived(this.turnout);

  @override
  List<Object?> get props => [turnout];
}

/// Internal event: knesset list slots received.
final class _ListSlotsReceived extends LiveResultsEvent {
  final List<KnessetSlot> slots;

  const _ListSlotsReceived(this.slots);

  @override
  List<Object?> get props => [slots];
}

/// Internal event: connection status changed.
final class _ConnectionStatusChanged extends LiveResultsEvent {
  final WsConnectionStatus status;

  const _ConnectionStatusChanged(this.status);

  @override
  List<Object?> get props => [status];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Connection status exposed to the UI.
enum LiveConnectionStatus {
  connected,
  reconnecting,
  disconnected,
}

/// Base class for all Live Results BLoC states.
sealed class LiveResultsState extends Equatable {
  const LiveResultsState();

  @override
  List<Object?> get props => [];
}

/// Initial state before connection.
final class LiveResultsInitial extends LiveResultsState {
  const LiveResultsInitial();
}

/// Loading initial data.
final class LiveResultsLoading extends LiveResultsState {
  const LiveResultsLoading();
}

/// Live data loaded and streaming.
final class LiveResultsLoaded extends LiveResultsState {
  final List<CandidateResult> candidateResults;
  final TurnoutData? turnoutData;
  final List<KnessetSlot> knessetSlots;
  final LiveConnectionStatus connectionStatus;

  const LiveResultsLoaded({
    this.candidateResults = const [],
    this.turnoutData,
    this.knessetSlots = const [],
    this.connectionStatus = LiveConnectionStatus.disconnected,
  });

  LiveResultsLoaded copyWith({
    List<CandidateResult>? candidateResults,
    TurnoutData? turnoutData,
    List<KnessetSlot>? knessetSlots,
    LiveConnectionStatus? connectionStatus,
  }) {
    return LiveResultsLoaded(
      candidateResults: candidateResults ?? this.candidateResults,
      turnoutData: turnoutData ?? this.turnoutData,
      knessetSlots: knessetSlots ?? this.knessetSlots,
      connectionStatus: connectionStatus ?? this.connectionStatus,
    );
  }

  @override
  List<Object?> get props => [
        candidateResults,
        turnoutData,
        knessetSlots,
        connectionStatus,
      ];
}

/// Error state.
final class LiveResultsError extends LiveResultsState {
  final String message;

  const LiveResultsError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages real-time election results via WebSocket (with SSE fallback).
///
/// Uses [ElectionDayWsDataSource] for WebSocket connection and falls back
/// to [SseClient] if WebSocket fails 3 times.
@injectable
class LiveResultsBloc extends Bloc<LiveResultsEvent, LiveResultsState> {
  final ElectionDayWsDataSource _wsDataSource;
  final SseClient _sseClient;
  final ElectionDayRepository _repository;

  StreamSubscription<List<CandidateResult>>? _resultsSubscription;
  StreamSubscription<TurnoutData>? _turnoutSubscription;
  StreamSubscription<List<KnessetSlot>>? _listSubscription;
  StreamSubscription<WsConnectionStatus>? _statusSubscription;
  StreamSubscription<SseEvent>? _sseSubscription;

  String? _electionId;

  LiveResultsBloc(
    this._wsDataSource,
    this._sseClient,
    this._repository,
  ) : super(const LiveResultsInitial()) {
    on<ConnectToResults>(_onConnect);
    on<DisconnectFromResults>(_onDisconnect);
    on<_ResultsReceived>(_onResultsReceived);
    on<_TurnoutReceived>(_onTurnoutReceived);
    on<_ListSlotsReceived>(_onListSlotsReceived);
    on<_ConnectionStatusChanged>(_onConnectionStatusChanged);
  }

  Future<void> _onConnect(
    ConnectToResults event,
    Emitter<LiveResultsState> emit,
  ) async {
    emit(const LiveResultsLoading());
    _electionId = event.electionId;

    // Load initial data from HTTP.
    await _loadInitialData(emit);

    // Connect to WebSocket.
    await _wsDataSource.connect(event.electionId);

    // Listen to WS streams.
    _resultsSubscription?.cancel();
    _resultsSubscription = _wsDataSource.resultsStream.listen((results) {
      add(_ResultsReceived(results));
    });

    _turnoutSubscription?.cancel();
    _turnoutSubscription = _wsDataSource.turnoutStream.listen((turnout) {
      add(_TurnoutReceived(turnout));
    });

    _listSubscription?.cancel();
    _listSubscription = _wsDataSource.listUpdateStream.listen((slots) {
      add(_ListSlotsReceived(slots));
    });

    _statusSubscription?.cancel();
    _statusSubscription =
        _wsDataSource.connectionStatusStream.listen((status) {
      add(_ConnectionStatusChanged(status));

      // If WS fell back to SSE, start listening to SSE.
      if (_wsDataSource.isSseFallback && _sseSubscription == null) {
        _startSseFallback();
      }
    });
  }

  Future<void> _loadInitialData(Emitter<LiveResultsState> emit) async {
    if (_electionId == null) return;

    // Fetch initial results from HTTP API.
    final resultsResult = await _repository.getElectionResults(_electionId!);
    final turnoutResult = await _repository.getTurnoutSnapshots(_electionId!);

    final candidateResults = resultsResult.fold(
      (_) => <CandidateResult>[],
      (results) {
        // Convert ElectionResult to CandidateResult with rank.
        final sorted = List.of(results)
          ..sort((a, b) => b.voteCount.compareTo(a.voteCount));
        final totalVotes = sorted.fold<int>(0, (sum, r) => sum + r.voteCount);

        return sorted.asMap().entries.map((entry) {
          final r = entry.value;
          return CandidateResult(
            candidateId: r.candidateId,
            name: r.candidateName,
            imageUrl: r.candidatePhotoUrl,
            voteCount: r.voteCount,
            percentage:
                totalVotes > 0 ? (r.voteCount / totalVotes) * 100 : 0.0,
            rank: entry.key + 1,
          );
        }).toList();
      },
    );

    final turnoutData = turnoutResult.fold(
      (_) => null,
      (snapshots) {
        if (snapshots.isEmpty) return null;
        int totalEligible = 0;
        int totalVoted = 0;
        for (final snap in snapshots) {
          totalEligible += snap.eligibleVoters;
          totalVoted += snap.actualVoters;
        }
        final pct =
            totalEligible > 0 ? (totalVoted / totalEligible) * 100 : 0.0;
        return TurnoutData(
          totalEligible: totalEligible,
          totalVoters: totalVoted,
          turnoutPercentage: pct,
          lastUpdated: DateTime.now(),
        );
      },
    );

    emit(LiveResultsLoaded(
      candidateResults: candidateResults,
      turnoutData: turnoutData,
      connectionStatus: LiveConnectionStatus.reconnecting,
    ));
  }

  void _startSseFallback() {
    AppLogger.info('LiveResultsBloc: Starting SSE fallback');
    _sseSubscription?.cancel();
    _sseSubscription = _sseClient.primariesStream().listen((sseEvent) {
      if (sseEvent.event == 'results_update') {
        try {
          final json = sseEvent.json;
          final List<dynamic> items;
          if (json.containsKey('data')) {
            items = json['data'] as List<dynamic>;
          } else if (json.containsKey('results')) {
            items = json['results'] as List<dynamic>;
          } else {
            return;
          }
          final results = items
              .map((item) => CandidateResultModel.fromJson(
                    item as Map<String, dynamic>,
                  ).toEntity())
              .toList();
          add(_ResultsReceived(results));
        } catch (_) {
          // Silently ignore malformed SSE data.
        }
      } else if (sseEvent.event == 'turnout_update') {
        try {
          final json = sseEvent.json;
          final Map<String, dynamic> data;
          if (json.containsKey('data') &&
              json['data'] is Map<String, dynamic>) {
            data = json['data'] as Map<String, dynamic>;
          } else {
            data = json;
          }
          final turnout = TurnoutDataModel.fromJson(data).toEntity();
          add(_TurnoutReceived(turnout));
        } catch (_) {
          // Silently ignore malformed SSE data.
        }
      } else if (sseEvent.event == 'list_update') {
        try {
          final json = sseEvent.json;
          final List<dynamic> items;
          if (json.containsKey('data')) {
            items = json['data'] as List<dynamic>;
          } else if (json.containsKey('slots')) {
            items = json['slots'] as List<dynamic>;
          } else {
            return;
          }
          final slots = items
              .map((item) => KnessetSlotModel.fromJson(
                    item as Map<String, dynamic>,
                  ).toEntity())
              .toList();
          add(_ListSlotsReceived(slots));
        } catch (_) {
          // Silently ignore malformed SSE data.
        }
      }
    });

    // Mark as connected via SSE.
    add(const _ConnectionStatusChanged(WsConnectionStatus.connected));
  }

  Future<void> _onDisconnect(
    DisconnectFromResults event,
    Emitter<LiveResultsState> emit,
  ) async {
    await _cancelAllSubscriptions();
    await _wsDataSource.disconnect();

    final currentState = state;
    if (currentState is LiveResultsLoaded) {
      emit(currentState.copyWith(
        connectionStatus: LiveConnectionStatus.disconnected,
      ));
    }
  }

  void _onResultsReceived(
    _ResultsReceived event,
    Emitter<LiveResultsState> emit,
  ) {
    final currentState = state;
    if (currentState is LiveResultsLoaded) {
      // Compute delta ranks by comparing with previous results.
      final previousMap = <String, int>{};
      for (final r in currentState.candidateResults) {
        previousMap[r.candidateId] = r.rank;
      }

      final updatedResults = event.results.map((r) {
        final previousRank = previousMap[r.candidateId];
        final delta = previousRank != null ? previousRank - r.rank : 0;
        return r.copyWith(deltaRank: delta);
      }).toList();

      emit(currentState.copyWith(candidateResults: updatedResults));
    } else {
      emit(LiveResultsLoaded(
        candidateResults: event.results,
        connectionStatus: LiveConnectionStatus.connected,
      ));
    }
  }

  void _onTurnoutReceived(
    _TurnoutReceived event,
    Emitter<LiveResultsState> emit,
  ) {
    final currentState = state;
    if (currentState is LiveResultsLoaded) {
      emit(currentState.copyWith(turnoutData: event.turnout));
    } else {
      emit(LiveResultsLoaded(
        turnoutData: event.turnout,
        connectionStatus: LiveConnectionStatus.connected,
      ));
    }
  }

  void _onListSlotsReceived(
    _ListSlotsReceived event,
    Emitter<LiveResultsState> emit,
  ) {
    final currentState = state;
    if (currentState is LiveResultsLoaded) {
      emit(currentState.copyWith(knessetSlots: event.slots));
    } else {
      emit(LiveResultsLoaded(
        knessetSlots: event.slots,
        connectionStatus: LiveConnectionStatus.connected,
      ));
    }
  }

  void _onConnectionStatusChanged(
    _ConnectionStatusChanged event,
    Emitter<LiveResultsState> emit,
  ) {
    final uiStatus = switch (event.status) {
      WsConnectionStatus.connected => LiveConnectionStatus.connected,
      WsConnectionStatus.reconnecting => LiveConnectionStatus.reconnecting,
      WsConnectionStatus.disconnected => LiveConnectionStatus.disconnected,
    };

    final currentState = state;
    if (currentState is LiveResultsLoaded) {
      emit(currentState.copyWith(connectionStatus: uiStatus));
    } else {
      emit(LiveResultsLoaded(connectionStatus: uiStatus));
    }
  }

  Future<void> _cancelAllSubscriptions() async {
    await _resultsSubscription?.cancel();
    _resultsSubscription = null;
    await _turnoutSubscription?.cancel();
    _turnoutSubscription = null;
    await _listSubscription?.cancel();
    _listSubscription = null;
    await _statusSubscription?.cancel();
    _statusSubscription = null;
    await _sseSubscription?.cancel();
    _sseSubscription = null;
  }

  @override
  Future<void> close() async {
    await _cancelAllSubscriptions();
    await _wsDataSource.disconnect();
    return super.close();
  }
}
