part of 'ama_sessions_bloc.dart';

/// Base class for all AMA Sessions BLoC events.
sealed class AmaSessionsEvent extends Equatable {
  const AmaSessionsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of all AMA sessions.
final class LoadSessions extends AmaSessionsEvent {
  const LoadSessions();
}

/// Triggers loading of upcoming AMA sessions.
final class LoadUpcoming extends AmaSessionsEvent {
  const LoadUpcoming();
}

/// Triggers loading of a single AMA session and its questions.
final class LoadSessionDetail extends AmaSessionsEvent {
  final String sessionId;

  const LoadSessionDetail(this.sessionId);

  @override
  List<Object?> get props => [sessionId];
}

/// Submits a new question to a session.
final class SubmitQuestion extends AmaSessionsEvent {
  final String sessionId;
  final String text;

  const SubmitQuestion({required this.sessionId, required this.text});

  @override
  List<Object?> get props => [sessionId, text];
}

/// Upvotes a question.
final class UpvoteQuestion extends AmaSessionsEvent {
  final String questionId;

  const UpvoteQuestion(this.questionId);

  @override
  List<Object?> get props => [questionId];
}

/// Internal event: a new question arrived via WebSocket.
final class QuestionReceived extends AmaSessionsEvent {
  final AmaQuestion question;

  const QuestionReceived(this.question);

  @override
  List<Object?> get props => [question];
}
