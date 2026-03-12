import 'package:equatable/equatable.dart';

import '../../domain/entities/chat_session.dart';

/// Base class for all AI chat states.
sealed class AiChatState extends Equatable {
  const AiChatState();

  @override
  List<Object?> get props => [];
}

/// Initial state — no session yet.
class AiChatInitial extends AiChatState {
  const AiChatInitial();
}

/// Session is being created or loaded.
class AiChatLoading extends AiChatState {
  const AiChatLoading();
}

/// Active chat session with messages.
class AiChatActive extends AiChatState {
  final ChatSession session;
  final bool isSending;

  const AiChatActive({
    required this.session,
    this.isSending = false,
  });

  AiChatActive copyWith({
    ChatSession? session,
    bool? isSending,
  }) {
    return AiChatActive(
      session: session ?? this.session,
      isSending: isSending ?? this.isSending,
    );
  }

  @override
  List<Object?> get props => [session, isSending];
}

/// An error occurred.
class AiChatError extends AiChatState {
  final String message;

  const AiChatError({required this.message});

  @override
  List<Object?> get props => [message];
}
