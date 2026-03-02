import 'package:easy_localization/easy_localization.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/campaign_event.dart';
import '../../domain/entities/event_rsvp.dart';
import '../../domain/usecases/get_event_detail.dart';
import '../../domain/usecases/get_events.dart';
import '../../domain/usecases/get_my_rsvp.dart';
import '../../domain/usecases/rsvp_to_event.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Events BLoC events.
sealed class EventsEvent extends Equatable {
  const EventsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers initial loading of the events list.
final class LoadEvents extends EventsEvent {
  const LoadEvents();
}

/// Loads the next page of events (infinite scroll).
final class LoadMoreEvents extends EventsEvent {
  const LoadMoreEvents();
}

/// Loads the full detail of a single event.
final class LoadEventDetail extends EventsEvent {
  final String id;

  const LoadEventDetail({required this.id});

  @override
  List<Object?> get props => [id];
}

/// Submits or updates an RSVP for a campaign event.
final class RsvpToEventAction extends EventsEvent {
  final String eventId;
  final RsvpStatus status;

  const RsvpToEventAction({required this.eventId, required this.status});

  @override
  List<Object?> get props => [eventId, status];
}

/// Fetches the current user's RSVP for a specific event.
final class LoadMyRsvp extends EventsEvent {
  final String eventId;

  const LoadMyRsvp({required this.eventId});

  @override
  List<Object?> get props => [eventId];
}

/// Applies a district filter to the events list.
final class FilterEvents extends EventsEvent {
  final String? district;
  final bool? upcoming;

  const FilterEvents({this.district, this.upcoming});

  @override
  List<Object?> get props => [district, upcoming];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Events BLoC states.
sealed class EventsState extends Equatable {
  const EventsState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class EventsInitial extends EventsState {
  const EventsInitial();
}

/// Data is being fetched for the first time.
final class EventsLoading extends EventsState {
  const EventsLoading();
}

/// Events list loaded successfully.
final class EventsLoaded extends EventsState {
  final List<CampaignEvent> events;
  final bool hasMore;
  final int currentPage;
  final String? activeDistrict;
  final bool? activeUpcoming;

  const EventsLoaded({
    this.events = const [],
    this.hasMore = true,
    this.currentPage = 1,
    this.activeDistrict,
    this.activeUpcoming,
  });

  EventsLoaded copyWith({
    List<CampaignEvent>? events,
    bool? hasMore,
    int? currentPage,
    String? activeDistrict,
    bool? activeUpcoming,
  }) {
    return EventsLoaded(
      events: events ?? this.events,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      activeDistrict: activeDistrict ?? this.activeDistrict,
      activeUpcoming: activeUpcoming ?? this.activeUpcoming,
    );
  }

  @override
  List<Object?> get props =>
      [events, hasMore, currentPage, activeDistrict, activeUpcoming];
}

/// A single event detail loaded successfully.
final class EventDetailLoaded extends EventsState {
  final CampaignEvent event;
  final EventRsvp? myRsvp;

  const EventDetailLoaded({required this.event, this.myRsvp});

  EventDetailLoaded copyWith({
    CampaignEvent? event,
    EventRsvp? myRsvp,
  }) {
    return EventDetailLoaded(
      event: event ?? this.event,
      myRsvp: myRsvp ?? this.myRsvp,
    );
  }

  @override
  List<Object?> get props => [event, myRsvp];
}

/// RSVP was updated successfully.
final class RsvpUpdated extends EventsState {
  final EventRsvp rsvp;
  final String message;

  const RsvpUpdated({required this.rsvp, required this.message});

  @override
  List<Object?> get props => [rsvp, message];
}

/// An error occurred while loading events data.
final class EventsError extends EventsState {
  final String message;

  const EventsError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Campaign Events feature.
///
/// Supports paginated loading, district/time filtering, event detail
/// view, and RSVP functionality.
@injectable
class EventsBloc extends Bloc<EventsEvent, EventsState> {
  final GetEvents _getEvents;
  final GetEventDetail _getEventDetail;
  final RsvpToEvent _rsvpToEvent;
  final GetMyRsvp _getMyRsvp;

  /// Number of events per page.
  static const int _pageSize = 20;

  EventsBloc(
    this._getEvents,
    this._getEventDetail,
    this._rsvpToEvent,
    this._getMyRsvp,
  ) : super(const EventsInitial()) {
    on<LoadEvents>(_onLoadEvents);
    on<LoadMoreEvents>(_onLoadMoreEvents);
    on<LoadEventDetail>(_onLoadEventDetail);
    on<RsvpToEventAction>(_onRsvpToEvent);
    on<LoadMyRsvp>(_onLoadMyRsvp);
    on<FilterEvents>(_onFilterEvents);
  }

  /// Active filter state preserved across navigations.
  String? _activeDistrict;
  bool? _activeUpcoming;

  /// Loads the first page of events.
  Future<void> _onLoadEvents(
    LoadEvents event,
    Emitter<EventsState> emit,
  ) async {
    emit(const EventsLoading());

    final result = await _getEvents(
      GetEventsParams(
        page: 1,
        district: _activeDistrict,
        upcoming: _activeUpcoming,
      ),
    );

    result.fold(
      (failure) => emit(EventsError(
        message: failure.message ?? 'events_error_loading'.tr(),
      )),
      (events) => emit(EventsLoaded(
        events: events,
        hasMore: events.length >= _pageSize,
        currentPage: 1,
        activeDistrict: _activeDistrict,
        activeUpcoming: _activeUpcoming,
      )),
    );
  }

  /// Loads the next page of events and appends to the existing list.
  Future<void> _onLoadMoreEvents(
    LoadMoreEvents event,
    Emitter<EventsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! EventsLoaded || !currentState.hasMore) return;

    final nextPage = currentState.currentPage + 1;
    final result = await _getEvents(
      GetEventsParams(
        page: nextPage,
        district: _activeDistrict,
        upcoming: _activeUpcoming,
      ),
    );

    result.fold(
      (failure) {
        emit(currentState.copyWith(hasMore: false));
      },
      (newEvents) {
        emit(currentState.copyWith(
          events: [...currentState.events, ...newEvents],
          currentPage: nextPage,
          hasMore: newEvents.length >= _pageSize,
        ));
      },
    );
  }

  /// Loads the full detail for a single event.
  Future<void> _onLoadEventDetail(
    LoadEventDetail event,
    Emitter<EventsState> emit,
  ) async {
    emit(const EventsLoading());

    final result = await _getEventDetail(
      GetEventDetailParams(id: event.id),
    );

    result.fold(
      (failure) => emit(EventsError(
        message: failure.message ?? 'events_error_loading'.tr(),
      )),
      (campaignEvent) => emit(EventDetailLoaded(event: campaignEvent)),
    );
  }

  /// Submits or updates an RSVP.
  Future<void> _onRsvpToEvent(
    RsvpToEventAction event,
    Emitter<EventsState> emit,
  ) async {
    final result = await _rsvpToEvent(
      RsvpToEventParams(eventId: event.eventId, status: event.status),
    );

    result.fold(
      (failure) {
        if (failure is UnauthorizedFailure) {
          emit(EventsError(message: 'events_login_to_rsvp'.tr()));
        } else {
          emit(EventsError(
            message: failure.message ?? 'events_error_loading'.tr(),
          ));
        }
      },
      (rsvp) {
        emit(RsvpUpdated(
          rsvp: rsvp,
          message: 'events_rsvp_success'.tr(),
        ));
      },
    );
  }

  /// Loads the current user's RSVP for a specific event.
  Future<void> _onLoadMyRsvp(
    LoadMyRsvp event,
    Emitter<EventsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! EventDetailLoaded) return;

    final result = await _getMyRsvp(
      GetMyRsvpParams(eventId: event.eventId),
    );

    result.fold(
      (_) {
        // Silently ignore — no RSVP or error loading it.
      },
      (rsvp) {
        emit(currentState.copyWith(myRsvp: rsvp));
      },
    );
  }

  /// Applies a filter and reloads events.
  Future<void> _onFilterEvents(
    FilterEvents event,
    Emitter<EventsState> emit,
  ) async {
    _activeDistrict = event.district;
    _activeUpcoming = event.upcoming;

    emit(const EventsLoading());

    final result = await _getEvents(
      GetEventsParams(
        page: 1,
        district: _activeDistrict,
        upcoming: _activeUpcoming,
      ),
    );

    result.fold(
      (failure) => emit(EventsError(
        message: failure.message ?? 'events_error_loading'.tr(),
      )),
      (events) => emit(EventsLoaded(
        events: events,
        hasMore: events.length >= _pageSize,
        currentPage: 1,
        activeDistrict: _activeDistrict,
        activeUpcoming: _activeUpcoming,
      )),
    );
  }
}
