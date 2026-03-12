import 'package:equatable/equatable.dart';

import 'chat_message.dart';

/// Immutable business object representing a chat session.
class ChatSession extends Equatable {
  final String id;
  final List<ChatMessage> messages;
  final int messageCount;
  final DateTime createdAt;

  const ChatSession({
    required this.id,
    required this.messages,
    required this.messageCount,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, messages, messageCount, createdAt];
}
