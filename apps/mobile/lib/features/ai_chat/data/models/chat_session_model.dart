import '../../domain/entities/chat_session.dart';
import 'chat_message_model.dart';

/// Data transfer object for [ChatSession].
///
/// Handles JSON serialization and conversion to the domain entity.
class ChatSessionModel {
  final String id;
  final List<ChatMessageModel> messages;
  final int messageCount;
  final DateTime createdAt;

  const ChatSessionModel({
    required this.id,
    required this.messages,
    required this.messageCount,
    required this.createdAt,
  });

  factory ChatSessionModel.fromJson(Map<String, dynamic> json) {
    final messagesList = (json['messages'] as List<dynamic>?)
            ?.map((m) =>
                ChatMessageModel.fromJson(m as Map<String, dynamic>))
            .toList() ??
        [];

    return ChatSessionModel(
      id: json['id'] as String? ?? '',
      messages: messagesList,
      messageCount: json['messageCount'] as int? ?? messagesList.length,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'messages': messages.map((m) => m.toJson()).toList(),
        'messageCount': messageCount,
        'createdAt': createdAt.toIso8601String(),
      };

  ChatSession toEntity() => ChatSession(
        id: id,
        messages: messages.map((m) => m.toEntity()).toList(),
        messageCount: messageCount,
        createdAt: createdAt,
      );
}
