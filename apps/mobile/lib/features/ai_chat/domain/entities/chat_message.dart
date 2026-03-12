import 'package:equatable/equatable.dart';

/// Immutable business object representing a single chat message.
class ChatMessage extends Equatable {
  final String id;
  final String role; // 'user' | 'assistant' | 'system'
  final String content;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [id, role, content, timestamp];
}
