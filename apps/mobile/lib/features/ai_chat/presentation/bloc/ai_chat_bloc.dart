import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/chat_session.dart';
import '../../domain/repositories/ai_chat_repository.dart';
import '../../domain/usecases/create_chat_session.dart';
import '../../domain/usecases/send_chat_message.dart';
import 'ai_chat_event.dart';
import 'ai_chat_state.dart';

/// Manages the state for the AI Chat screen.
///
/// On [CreateSession]: creates a new chat session via use case.
/// On [SendMessage]: sends a message and appends both user and assistant
///   messages to the session.
/// On [LoadSession]: loads an existing session by ID.
/// On [ProvideFeedback]: submits feedback for the current session.
@injectable
class AiChatBloc extends Bloc<AiChatEvent, AiChatState> {
  final CreateChatSession _createChatSession;
  final SendChatMessage _sendChatMessage;
  final AiChatRepository _repository;

  AiChatBloc(
    this._createChatSession,
    this._sendChatMessage,
    this._repository,
  ) : super(const AiChatInitial()) {
    on<CreateSession>(_onCreateSession);
    on<SendMessage>(_onSendMessage);
    on<LoadSession>(_onLoadSession);
    on<ProvideFeedback>(_onProvideFeedback);
  }

  Future<void> _onCreateSession(
    CreateSession event,
    Emitter<AiChatState> emit,
  ) async {
    emit(const AiChatLoading());

    final result = await _createChatSession(const NoParams());

    result.fold(
      (failure) => emit(AiChatError(
        message: failure.message ?? 'ai_chat.error'.tr(),
      )),
      (session) => emit(AiChatActive(session: session)),
    );
  }

  Future<void> _onSendMessage(
    SendMessage event,
    Emitter<AiChatState> emit,
  ) async {
    final currentState = state;
    if (currentState is! AiChatActive) return;

    // Add user message locally and set isSending
    final userMessage = ChatMessage(
      id: 'user_${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: event.text,
      timestamp: DateTime.now(),
    );

    final updatedMessages = [
      ...currentState.session.messages,
      userMessage,
    ];

    final updatedSession = ChatSession(
      id: currentState.session.id,
      messages: updatedMessages,
      messageCount: updatedMessages.length,
      createdAt: currentState.session.createdAt,
    );

    emit(AiChatActive(session: updatedSession, isSending: true));

    // Send to backend
    final result = await _sendChatMessage(SendChatMessageParams(
      sessionId: currentState.session.id,
      message: event.text,
    ));

    result.fold(
      (failure) {
        // Remove the user message on failure and show error
        emit(AiChatActive(
          session: currentState.session,
          isSending: false,
        ));
        emit(AiChatError(
          message: failure.message ?? 'ai_chat.error'.tr(),
        ));
        // Restore active state so user can retry
        emit(AiChatActive(
          session: currentState.session,
          isSending: false,
        ));
      },
      (assistantMessage) {
        final messagesWithReply = [
          ...updatedMessages,
          assistantMessage,
        ];

        final sessionWithReply = ChatSession(
          id: currentState.session.id,
          messages: messagesWithReply,
          messageCount: messagesWithReply.length,
          createdAt: currentState.session.createdAt,
        );

        emit(AiChatActive(session: sessionWithReply, isSending: false));
      },
    );
  }

  Future<void> _onLoadSession(
    LoadSession event,
    Emitter<AiChatState> emit,
  ) async {
    emit(const AiChatLoading());

    final result = await _repository.getSession(event.sessionId);

    result.fold(
      (failure) => emit(AiChatError(
        message: failure.message ?? 'ai_chat.error'.tr(),
      )),
      (session) => emit(AiChatActive(session: session)),
    );
  }

  Future<void> _onProvideFeedback(
    ProvideFeedback event,
    Emitter<AiChatState> emit,
  ) async {
    final currentState = state;
    if (currentState is! AiChatActive) return;

    await _repository.provideFeedback(
      currentState.session.id,
      event.feedback,
    );
  }
}
