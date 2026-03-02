import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/network/sse_client.dart';
import '../../domain/entities/election_result.dart';
import '../../domain/entities/polling_station.dart';
import '../../domain/entities/station_report.dart';
import '../../domain/entities/turnout_snapshot.dart';
import '../../domain/repositories/election_day_repository.dart';
import '../../domain/usecases/get_election_results.dart';
import '../../domain/usecases/get_polling_stations.dart';
import '../../domain/usecases/get_turnout_snapshots.dart';
import '../../domain/usecases/submit_station_report.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Election Day BLoC events.
sealed class ElectionDayEvent extends Equatable {
  const ElectionDayEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of polling stations.
final class LoadStations extends ElectionDayEvent {
  final String? electionId;
  final String? district;
  final String? city;

  const LoadStations({this.electionId, this.district, this.city});

  @override
  List<Object?> get props => [electionId, district, city];
}

/// Triggers loading of election results.
final class LoadResults extends ElectionDayEvent {
  final String electionId;

  const LoadResults({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Triggers loading of turnout snapshots.
final class LoadTurnout extends ElectionDayEvent {
  final String electionId;

  const LoadTurnout({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Submits a wait-time report for a polling station.
final class SubmitReport extends ElectionDayEvent {
  final String stationId;
  final int waitMinutes;
  final String? crowdLevel;
  final String? note;

  const SubmitReport({
    required this.stationId,
    required this.waitMinutes,
    this.crowdLevel,
    this.note,
  });

  @override
  List<Object?> get props => [stationId, waitMinutes, crowdLevel, note];
}

/// Filters the loaded stations by district.
final class FilterByDistrict extends ElectionDayEvent {
  final String? district;

  const FilterByDistrict({this.district});

  @override
  List<Object?> get props => [district];
}

/// Subscribes to live results SSE stream.
final class SubscribeToLiveResults extends ElectionDayEvent {
  final String electionId;

  const SubscribeToLiveResults({required this.electionId});

  @override
  List<Object?> get props => [electionId];
}

/// Internal event: SSE delivered a results update.
final class _SseResultsUpdated extends ElectionDayEvent {
  final List<ElectionResult> results;

  const _SseResultsUpdated(this.results);

  @override
  List<Object?> get props => [results];
}

/// Internal event: SSE delivered a turnout update.
final class _SseTurnoutUpdated extends ElectionDayEvent {
  final List<TurnoutSnapshot> snapshots;

  const _SseTurnoutUpdated(this.snapshots);

  @override
  List<Object?> get props => [snapshots];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Election Day BLoC states.
sealed class ElectionDayState extends Equatable {
  const ElectionDayState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class ElectionDayInitial extends ElectionDayState {
  const ElectionDayInitial();
}

/// Data is being fetched for the first time.
final class ElectionDayLoading extends ElectionDayState {
  const ElectionDayLoading();
}

/// Polling stations loaded successfully.
final class StationsLoaded extends ElectionDayState {
  final List<PollingStation> stations;
  final List<PollingStation> filteredStations;
  final String? activeDistrict;
  final List<String> districts;

  const StationsLoaded({
    required this.stations,
    required this.filteredStations,
    this.activeDistrict,
    this.districts = const [],
  });

  StationsLoaded copyWith({
    List<PollingStation>? stations,
    List<PollingStation>? filteredStations,
    String? activeDistrict,
    List<String>? districts,
  }) {
    return StationsLoaded(
      stations: stations ?? this.stations,
      filteredStations: filteredStations ?? this.filteredStations,
      activeDistrict: activeDistrict,
      districts: districts ?? this.districts,
    );
  }

  @override
  List<Object?> get props => [
        stations,
        filteredStations,
        activeDistrict,
        districts,
      ];
}

/// Election results loaded successfully.
final class ResultsLoaded extends ElectionDayState {
  final List<ElectionResult> results;
  final int totalVotes;
  final bool isLive;
  final DateTime? lastUpdated;

  const ResultsLoaded({
    required this.results,
    this.totalVotes = 0,
    this.isLive = false,
    this.lastUpdated,
  });

  ResultsLoaded copyWith({
    List<ElectionResult>? results,
    int? totalVotes,
    bool? isLive,
    DateTime? lastUpdated,
  }) {
    return ResultsLoaded(
      results: results ?? this.results,
      totalVotes: totalVotes ?? this.totalVotes,
      isLive: isLive ?? this.isLive,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  @override
  List<Object?> get props => [results, totalVotes, isLive, lastUpdated];
}

/// Turnout snapshots loaded successfully.
final class TurnoutLoaded extends ElectionDayState {
  final List<TurnoutSnapshot> snapshots;
  final List<TurnoutSnapshot> timeline;
  final double overallPercentage;
  final int totalEligible;
  final int totalVoted;

  const TurnoutLoaded({
    required this.snapshots,
    this.timeline = const [],
    this.overallPercentage = 0.0,
    this.totalEligible = 0,
    this.totalVoted = 0,
  });

  TurnoutLoaded copyWith({
    List<TurnoutSnapshot>? snapshots,
    List<TurnoutSnapshot>? timeline,
    double? overallPercentage,
    int? totalEligible,
    int? totalVoted,
  }) {
    return TurnoutLoaded(
      snapshots: snapshots ?? this.snapshots,
      timeline: timeline ?? this.timeline,
      overallPercentage: overallPercentage ?? this.overallPercentage,
      totalEligible: totalEligible ?? this.totalEligible,
      totalVoted: totalVoted ?? this.totalVoted,
    );
  }

  @override
  List<Object?> get props => [
        snapshots,
        timeline,
        overallPercentage,
        totalEligible,
        totalVoted,
      ];
}

/// A report was submitted successfully.
final class ReportSubmitted extends ElectionDayState {
  final StationReport report;

  const ReportSubmitted({required this.report});

  @override
  List<Object?> get props => [report];
}

/// An error occurred while loading election day data.
final class ElectionDayError extends ElectionDayState {
  final String message;

  const ElectionDayError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Election Day feature.
///
/// Supports three tabs: Station Finder, Live Results, and Turnout.
/// Subscribes to SSE for real-time result and turnout updates.
@injectable
class ElectionDayBloc extends Bloc<ElectionDayEvent, ElectionDayState> {
  final GetPollingStations _getPollingStations;
  final GetElectionResults _getElectionResults;
  final GetTurnoutSnapshots _getTurnoutSnapshots;
  final SubmitStationReport _submitStationReport;
  final ElectionDayRepository _repository;
  final SseClient _sseClient;

  StreamSubscription<SseEvent>? _sseSubscription;

  ElectionDayBloc(
    this._getPollingStations,
    this._getElectionResults,
    this._getTurnoutSnapshots,
    this._submitStationReport,
    this._repository,
    this._sseClient,
  ) : super(const ElectionDayInitial()) {
    on<LoadStations>(_onLoadStations);
    on<LoadResults>(_onLoadResults);
    on<LoadTurnout>(_onLoadTurnout);
    on<SubmitReport>(_onSubmitReport);
    on<FilterByDistrict>(_onFilterByDistrict);
    on<SubscribeToLiveResults>(_onSubscribeToLiveResults);
    on<_SseResultsUpdated>(_onSseResultsUpdated);
    on<_SseTurnoutUpdated>(_onSseTurnoutUpdated);
  }

  /// Cached resolved election ID so we don't re-resolve on every tab switch.
  String? _resolvedElectionId;

  /// Resolves 'active' to a real UUID, or returns the ID as-is.
  Future<String?> _resolveElectionId(String? electionId) async {
    if (electionId == null) return null;
    if (electionId != 'active') return electionId;
    if (_resolvedElectionId != null) return _resolvedElectionId;

    final result = await _repository.resolveActiveElectionId();
    return result.fold(
      (_) => null,
      (id) {
        _resolvedElectionId = id;
        return id;
      },
    );
  }

  /// Loads polling stations.
  Future<void> _onLoadStations(
    LoadStations event,
    Emitter<ElectionDayState> emit,
  ) async {
    emit(const ElectionDayLoading());

    final resolvedId = await _resolveElectionId(event.electionId);

    final result = await _getPollingStations(
      PollingStationsParams(
        electionId: resolvedId,
        district: event.district,
        city: event.city,
      ),
    );

    result.fold(
      (failure) => emit(ElectionDayError(
        message: failure.message ?? 'error_generic'.tr(),
      )),
      (stations) {
        // Extract unique districts for the filter.
        final districts = stations
            .where((s) => s.district != null && s.district!.isNotEmpty)
            .map((s) => s.district!)
            .toSet()
            .toList()
          ..sort();

        emit(StationsLoaded(
          stations: stations,
          filteredStations: stations,
          districts: districts,
        ));
      },
    );
  }

  /// Loads election results.
  Future<void> _onLoadResults(
    LoadResults event,
    Emitter<ElectionDayState> emit,
  ) async {
    emit(const ElectionDayLoading());

    final resolvedId = await _resolveElectionId(event.electionId);
    if (resolvedId == null) {
      emit(ElectionDayError(message: 'error_generic'.tr()));
      return;
    }

    final result = await _getElectionResults(
      ElectionResultsParams(electionId: resolvedId),
    );

    result.fold(
      (failure) => emit(ElectionDayError(
        message: failure.message ?? 'error_generic'.tr(),
      )),
      (results) {
        final totalVotes =
            results.fold<int>(0, (sum, r) => sum + r.voteCount);
        emit(ResultsLoaded(
          results: results,
          totalVotes: totalVotes,
          lastUpdated: DateTime.now(),
        ));
      },
    );
  }

  /// Loads turnout snapshots and timeline.
  Future<void> _onLoadTurnout(
    LoadTurnout event,
    Emitter<ElectionDayState> emit,
  ) async {
    emit(const ElectionDayLoading());

    final resolvedId = await _resolveElectionId(event.electionId);
    if (resolvedId == null) {
      emit(ElectionDayError(message: 'error_generic'.tr()));
      return;
    }

    final snapshotsResult = await _getTurnoutSnapshots(
      TurnoutSnapshotsParams(electionId: resolvedId),
    );

    await snapshotsResult.fold(
      (failure) async => emit(ElectionDayError(
        message: failure.message ?? 'error_generic'.tr(),
      )),
      (snapshots) async {
        // Calculate overall totals.
        int totalEligible = 0;
        int totalVoted = 0;
        for (final snap in snapshots) {
          totalEligible += snap.eligibleVoters;
          totalVoted += snap.actualVoters;
        }
        final overallPercentage =
            totalEligible > 0 ? (totalVoted / totalEligible) * 100 : 0.0;

        // Also fetch the timeline for the chart.
        final timelineResult = await _repository.getTurnoutTimeline(
          resolvedId,
        );

        final timeline = timelineResult.fold(
          (_) => <TurnoutSnapshot>[],
          (data) => data,
        );

        emit(TurnoutLoaded(
          snapshots: snapshots,
          timeline: timeline,
          overallPercentage: overallPercentage,
          totalEligible: totalEligible,
          totalVoted: totalVoted,
        ));
      },
    );
  }

  /// Submits a wait-time report for a polling station.
  Future<void> _onSubmitReport(
    SubmitReport event,
    Emitter<ElectionDayState> emit,
  ) async {
    emit(const ElectionDayLoading());

    final result = await _submitStationReport(
      StationReportParams(
        stationId: event.stationId,
        waitMinutes: event.waitMinutes,
        crowdLevel: event.crowdLevel,
        note: event.note,
      ),
    );

    result.fold(
      (failure) => emit(ElectionDayError(
        message: failure.message ?? 'error_generic'.tr(),
      )),
      (report) {
        emit(ReportSubmitted(report: report));
        // Restore previous state after a brief display of success.
        // The UI can handle the transition.
      },
    );
  }

  /// Filters the loaded stations by district.
  void _onFilterByDistrict(
    FilterByDistrict event,
    Emitter<ElectionDayState> emit,
  ) {
    final currentState = state;
    if (currentState is! StationsLoaded) return;

    if (event.district == null || event.district!.isEmpty) {
      emit(currentState.copyWith(
        filteredStations: currentState.stations,
        activeDistrict: null,
      ));
    } else {
      final filtered = currentState.stations
          .where((s) => s.district == event.district)
          .toList();
      emit(StationsLoaded(
        stations: currentState.stations,
        filteredStations: filtered,
        activeDistrict: event.district,
        districts: currentState.districts,
      ));
    }
  }

  /// Subscribes to the SSE primaries stream for live updates.
  void _onSubscribeToLiveResults(
    SubscribeToLiveResults event,
    Emitter<ElectionDayState> emit,
  ) {
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
          final results = items.map((item) {
            final map = item as Map<String, dynamic>;
            final candidate = map['candidate'] as Map<String, dynamic>?;
            return ElectionResult(
              id: map['id'] as String,
              electionId: map['electionId'] as String,
              candidateId: map['candidateId'] as String,
              candidateName: candidate != null
                  ? (candidate['fullName'] as String? ?? '')
                  : (map['candidateName'] as String? ?? ''),
              candidatePhotoUrl: candidate != null
                  ? candidate['photoUrl'] as String?
                  : map['candidatePhotoUrl'] as String?,
              stationId: map['stationId'] as String?,
              voteCount: map['voteCount'] != null
                  ? int.tryParse(map['voteCount'].toString()) ?? 0
                  : 0,
              percentage: map['percentage'] != null
                  ? double.tryParse(map['percentage'].toString())
                  : null,
              isOfficial: map['isOfficial'] as bool? ?? false,
              publishedAt: map['publishedAt'] != null
                  ? DateTime.tryParse(map['publishedAt'] as String)
                  : null,
            );
          }).toList();
          add(_SseResultsUpdated(results));
        } catch (_) {
          // Silently ignore malformed SSE data.
        }
      } else if (sseEvent.event == 'turnout_update') {
        try {
          final json = sseEvent.json;
          final List<dynamic> items;
          if (json.containsKey('data')) {
            items = json['data'] as List<dynamic>;
          } else if (json.containsKey('snapshots')) {
            items = json['snapshots'] as List<dynamic>;
          } else {
            return;
          }
          final snapshots = items.map((item) {
            final map = item as Map<String, dynamic>;
            return TurnoutSnapshot(
              id: map['id'] as String,
              electionId: map['electionId'] as String,
              district: map['district'] as String?,
              eligibleVoters: map['eligibleVoters'] != null
                  ? int.tryParse(map['eligibleVoters'].toString()) ?? 0
                  : 0,
              actualVoters: map['actualVoters'] != null
                  ? int.tryParse(map['actualVoters'].toString()) ?? 0
                  : 0,
              percentage: map['percentage'] != null
                  ? double.tryParse(map['percentage'].toString()) ?? 0.0
                  : 0.0,
              snapshotAt: map['snapshotAt'] != null
                  ? DateTime.parse(map['snapshotAt'] as String)
                  : DateTime.now(),
            );
          }).toList();
          add(_SseTurnoutUpdated(snapshots));
        } catch (_) {
          // Silently ignore malformed SSE data.
        }
      }
    });
  }

  /// Handles SSE results update.
  void _onSseResultsUpdated(
    _SseResultsUpdated event,
    Emitter<ElectionDayState> emit,
  ) {
    final totalVotes =
        event.results.fold<int>(0, (sum, r) => sum + r.voteCount);
    emit(ResultsLoaded(
      results: event.results,
      totalVotes: totalVotes,
      isLive: true,
      lastUpdated: DateTime.now(),
    ));
  }

  /// Handles SSE turnout update.
  void _onSseTurnoutUpdated(
    _SseTurnoutUpdated event,
    Emitter<ElectionDayState> emit,
  ) {
    int totalEligible = 0;
    int totalVoted = 0;
    for (final snap in event.snapshots) {
      totalEligible += snap.eligibleVoters;
      totalVoted += snap.actualVoters;
    }
    final overallPercentage =
        totalEligible > 0 ? (totalVoted / totalEligible) * 100 : 0.0;

    final currentState = state;
    final timeline =
        currentState is TurnoutLoaded ? currentState.timeline : <TurnoutSnapshot>[];

    emit(TurnoutLoaded(
      snapshots: event.snapshots,
      timeline: timeline,
      overallPercentage: overallPercentage,
      totalEligible: totalEligible,
      totalVoted: totalVoted,
    ));
  }

  @override
  Future<void> close() {
    _sseSubscription?.cancel();
    return super.close();
  }
}
