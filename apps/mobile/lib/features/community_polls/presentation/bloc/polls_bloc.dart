import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/community_poll.dart';
import '../../domain/usecases/get_my_vote.dart';
import '../../domain/usecases/get_polls.dart';
import '../../domain/usecases/vote_on_poll.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Polls BLoC events.
sealed class PollsEvent extends Equatable {
  const PollsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of all community polls.
final class LoadPolls extends PollsEvent {
  const LoadPolls();
}

/// Triggers loading of a single poll's details.
final class LoadPollDetail extends PollsEvent {
  final String pollId;

  const LoadPollDetail({required this.pollId});

  @override
  List<Object?> get props => [pollId];
}

/// Submits a vote on a poll with optimistic UI update.
final class VoteOnPollEvent extends PollsEvent {
  final String pollId;
  final int optionIndex;

  const VoteOnPollEvent({
    required this.pollId,
    required this.optionIndex,
  });

  @override
  List<Object?> get props => [pollId, optionIndex];
}

/// Loads the current user's vote for a specific poll.
final class LoadMyVote extends PollsEvent {
  final String pollId;

  const LoadMyVote({required this.pollId});

  @override
  List<Object?> get props => [pollId];
}

/// Internal event emitted after loading votes for all polls.
final class _MyVotesLoaded extends PollsEvent {
  final Map<String, int?> myVotes;

  const _MyVotesLoaded({required this.myVotes});

  @override
  List<Object?> get props => [myVotes];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Polls BLoC states.
sealed class PollsState extends Equatable {
  const PollsState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class PollsInitial extends PollsState {
  const PollsInitial();
}

/// Data is being fetched for the first time.
final class PollsLoading extends PollsState {
  const PollsLoading();
}

/// Polls loaded successfully.
final class PollsLoaded extends PollsState {
  /// The list of community polls.
  final List<CommunityPoll> polls;

  /// Map of pollId -> optionIndex for the current user's votes.
  /// A null value means the user hasn't voted on that poll yet.
  final Map<String, int?> myVotes;

  /// ID of a poll currently being voted on (for loading indicator).
  final String? votingPollId;

  /// Success message to show temporarily.
  final String? successMessage;

  const PollsLoaded({
    required this.polls,
    this.myVotes = const {},
    this.votingPollId,
    this.successMessage,
  });

  /// Returns the sorted polls list with pinned polls first.
  List<CommunityPoll> get sortedPolls {
    final pinned = polls.where((p) => p.isPinned).toList();
    final regular = polls.where((p) => !p.isPinned).toList();
    return [...pinned, ...regular];
  }

  /// Whether the user has voted on a specific poll.
  bool hasVoted(String pollId) => myVotes.containsKey(pollId);

  /// Gets the user's voted option index for a poll, or null.
  int? votedOptionIndex(String pollId) => myVotes[pollId];

  PollsLoaded copyWith({
    List<CommunityPoll>? polls,
    Map<String, int?>? myVotes,
    String? votingPollId,
    String? successMessage,
    bool clearVotingPollId = false,
    bool clearSuccessMessage = false,
  }) {
    return PollsLoaded(
      polls: polls ?? this.polls,
      myVotes: myVotes ?? this.myVotes,
      votingPollId: clearVotingPollId ? null : (votingPollId ?? this.votingPollId),
      successMessage: clearSuccessMessage ? null : (successMessage ?? this.successMessage),
    );
  }

  @override
  List<Object?> get props => [polls, myVotes, votingPollId, successMessage];
}

/// An error occurred while loading polls.
final class PollsError extends PollsState {
  final String message;

  const PollsError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the Community Polls feature.
///
/// Supports loading polls, voting with optimistic UI, and
/// tracking the user's votes across polls.
@injectable
class PollsBloc extends Bloc<PollsEvent, PollsState> {
  final GetPolls _getPolls;
  final VoteOnPoll _voteOnPoll;
  final GetMyVote _getMyVote;

  PollsBloc(
    this._getPolls,
    this._voteOnPoll,
    this._getMyVote,
  ) : super(const PollsInitial()) {
    on<LoadPolls>(_onLoadPolls);
    on<LoadPollDetail>(_onLoadPollDetail);
    on<VoteOnPollEvent>(_onVoteOnPoll);
    on<LoadMyVote>(_onLoadMyVote);
    on<_MyVotesLoaded>(_onMyVotesLoaded);
  }

  /// Loads all community polls and then fetches user votes for each.
  Future<void> _onLoadPolls(
    LoadPolls event,
    Emitter<PollsState> emit,
  ) async {
    emit(const PollsLoading());

    final result = await _getPolls(const NoParams());

    await result.fold(
      (failure) async => emit(PollsError(
        message: failure.message ?? 'polls_error_loading'.tr(),
      )),
      (polls) async {
        emit(PollsLoaded(polls: polls));

        // Load user votes for all polls in parallel
        final Map<String, int?> myVotes = {};
        final futures = polls.map((poll) async {
          final voteResult = await _getMyVote(poll.id);
          voteResult.fold(
            (_) {
              // Silently ignore vote fetch errors
            },
            (vote) {
              if (vote != null) {
                myVotes[poll.id] = vote.optionIndex;
              }
            },
          );
        });
        await Future.wait(futures);

        // Emit votes via internal event
        add(_MyVotesLoaded(myVotes: myVotes));
      },
    );
  }

  /// Handles the internal event when user votes are loaded.
  void _onMyVotesLoaded(
    _MyVotesLoaded event,
    Emitter<PollsState> emit,
  ) {
    final currentState = state;
    if (currentState is PollsLoaded) {
      emit(currentState.copyWith(myVotes: event.myVotes));
    }
  }

  /// Loads a single poll's detail (currently just refreshes the poll data).
  Future<void> _onLoadPollDetail(
    LoadPollDetail event,
    Emitter<PollsState> emit,
  ) async {
    // If we already have polls loaded, just reload all
    add(const LoadPolls());
  }

  /// Submits a vote with optimistic UI.
  ///
  /// Immediately updates the poll's vote counts and the user's vote map,
  /// then fires the API call. On failure, reverts to the previous state.
  Future<void> _onVoteOnPoll(
    VoteOnPollEvent event,
    Emitter<PollsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! PollsLoaded) return;

    // Already voted on this poll
    if (currentState.hasVoted(event.pollId)) return;

    // Optimistic update: apply vote immediately
    final updatedPolls = currentState.polls.map((poll) {
      if (poll.id == event.pollId) {
        return poll.withVote(event.optionIndex);
      }
      return poll;
    }).toList();

    final updatedVotes = Map<String, int?>.from(currentState.myVotes);
    updatedVotes[event.pollId] = event.optionIndex;

    emit(currentState.copyWith(
      polls: updatedPolls,
      myVotes: updatedVotes,
      votingPollId: event.pollId,
    ));

    // Fire API call
    final result = await _voteOnPoll(VoteOnPollParams(
      pollId: event.pollId,
      optionIndex: event.optionIndex,
    ));

    result.fold(
      (failure) {
        // Revert optimistic update on failure — emit pre-vote state
        emit(PollsLoaded(
          polls: currentState.polls,
          myVotes: currentState.myVotes,
          successMessage: failure.message ?? 'polls_error_voting'.tr(),
        ));
      },
      (_) {
        // Success — keep optimistic update, clear loading indicator
        final successState = state;
        if (successState is PollsLoaded) {
          emit(successState.copyWith(
            successMessage: 'polls_vote_success'.tr(),
            clearVotingPollId: true,
          ));
        }
      },
    );
  }

  /// Loads the current user's vote for a specific poll.
  Future<void> _onLoadMyVote(
    LoadMyVote event,
    Emitter<PollsState> emit,
  ) async {
    final currentState = state;
    if (currentState is! PollsLoaded) return;

    final result = await _getMyVote(event.pollId);

    result.fold(
      (_) {
        // Silently ignore
      },
      (vote) {
        if (vote != null) {
          final updatedVotes = Map<String, int?>.from(currentState.myVotes);
          updatedVotes[event.pollId] = vote.optionIndex;
          emit(currentState.copyWith(myVotes: updatedVotes));
        }
      },
    );
  }
}
