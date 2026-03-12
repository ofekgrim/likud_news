part of 'ama_sessions_bloc.dart';

/// Base class for all AMA Sessions BLoC states.
sealed class AmaSessionsState extends Equatable {
  const AmaSessionsState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class AmaInitial extends AmaSessionsState {
  const AmaInitial();
}

/// Data is being fetched for the first time.
final class AmaLoading extends AmaSessionsState {
  const AmaLoading();
}

/// Sessions list loaded successfully.
final class AmaSessionsLoaded extends AmaSessionsState {
  /// All AMA sessions.
  final List<AmaSession> sessions;

  /// Upcoming AMA sessions.
  final List<AmaSession> upcomingSessions;

  const AmaSessionsLoaded({
    required this.sessions,
    this.upcomingSessions = const [],
  });

  /// Returns live sessions from the sessions list.
  List<AmaSession> get liveSessions =>
      sessions.where((s) => s.isLive).toList();

  /// Returns scheduled sessions from the sessions list.
  List<AmaSession> get scheduledSessions =>
      sessions.where((s) => s.isScheduled).toList();

  AmaSessionsLoaded copyWith({
    List<AmaSession>? sessions,
    List<AmaSession>? upcomingSessions,
  }) {
    return AmaSessionsLoaded(
      sessions: sessions ?? this.sessions,
      upcomingSessions: upcomingSessions ?? this.upcomingSessions,
    );
  }

  @override
  List<Object?> get props => [sessions, upcomingSessions];
}

/// A single session's detail with its questions loaded.
final class AmaSessionDetailLoaded extends AmaSessionsState {
  final AmaSession session;
  final List<AmaQuestion> questions;
  final bool isSubmitting;

  const AmaSessionDetailLoaded({
    required this.session,
    required this.questions,
    this.isSubmitting = false,
  });

  /// Returns pinned questions.
  List<AmaQuestion> get pinnedQuestions =>
      questions.where((q) => q.isPinned).toList();

  /// Returns non-pinned questions sorted by upvote count (highest first).
  List<AmaQuestion> get sortedQuestions {
    final nonPinned = questions.where((q) => !q.isPinned).toList();
    nonPinned.sort((a, b) => b.upvoteCount.compareTo(a.upvoteCount));
    return nonPinned;
  }

  AmaSessionDetailLoaded copyWith({
    AmaSession? session,
    List<AmaQuestion>? questions,
    bool? isSubmitting,
  }) {
    return AmaSessionDetailLoaded(
      session: session ?? this.session,
      questions: questions ?? this.questions,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }

  @override
  List<Object?> get props => [session, questions, isSubmitting];
}

/// An error occurred.
final class AmaError extends AmaSessionsState {
  final String message;

  const AmaError({required this.message});

  @override
  List<Object?> get props => [message];
}
