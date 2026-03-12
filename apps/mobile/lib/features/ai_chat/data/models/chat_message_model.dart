import '../../domain/entities/chat_message.dart';

/// Data transfer object for [ChatMessage].
///
/// Handles JSON serialization and conversion to the domain entity.
class ChatMessageModel {
  final String id;
  final String role;
  final String content;
  final DateTime timestamp;

  const ChatMessageModel({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] as String? ?? '',
      role: json['role'] as String? ?? 'assistant',
      content: json['content'] as String? ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
      };

  ChatMessage toEntity() => ChatMessage(
        id: id,
        role: role,
        content: content,
        timestamp: timestamp,
      );
}
