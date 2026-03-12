import 'package:equatable/equatable.dart';

/// Base class for all AI chat events.
sealed class AiChatEvent extends Equatable {
  const AiChatEvent();

  @override
  List<Object?> get props => [];
}

/// Creates a new chat session.
class CreateSession extends AiChatEvent {
  const CreateSession();
}

/// Sends a user message in the active session.
class SendMessage extends AiChatEvent {
  final String text;

  const SendMessage(this.text);

  @override
  List<Object?> get props => [text];
}

/// Loads an existing session by ID.
class LoadSession extends AiChatEvent {
  final String sessionId;

  const LoadSession(this.sessionId);

  @override
  List<Object?> get props => [sessionId];
}

/// Submits feedback (thumbs up/down) for the current session.
class ProvideFeedback extends AiChatEvent {
  final String feedback;

  const ProvideFeedback(this.feedback);

  @override
  List<Object?> get props => [feedback];
}
