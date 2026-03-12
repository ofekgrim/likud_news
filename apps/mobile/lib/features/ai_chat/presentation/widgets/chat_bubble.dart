import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../domain/entities/chat_message.dart';

/// A single chat message bubble.
///
/// User bubbles: Likud blue, aligned to the end (RTL: left).
/// Assistant bubbles: grey background, aligned to the start (RTL: right).
class ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const ChatBubble({super.key, required this.message});

  bool get _isUser => message.role == 'user';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isRtl = Directionality.of(context) == TextDirection.rtl;

    final bubbleColor = _isUser
        ? const Color(0xFF0099DB)
        : theme.brightness == Brightness.dark
            ? const Color(0xFF2C2C2C)
            : const Color(0xFFF1F5F9);

    final textColor = _isUser
        ? Colors.white
        : theme.brightness == Brightness.dark
            ? const Color(0xFFE0E0E0)
            : const Color(0xFF1E293B);

    final timestampColor = _isUser
        ? Colors.white.withValues(alpha: 0.7)
        : theme.brightness == Brightness.dark
            ? const Color(0xFF9E9E9E)
            : const Color(0xFF6B7A8D);

    final alignment =
        _isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;

    // Border radius differs based on sender and RTL
    final borderRadius = BorderRadius.only(
      topLeft: const Radius.circular(16),
      topRight: const Radius.circular(16),
      bottomLeft: _isUser
          ? const Radius.circular(16)
          : isRtl
              ? const Radius.circular(16)
              : const Radius.circular(4),
      bottomRight: _isUser
          ? isRtl
              ? const Radius.circular(4)
              : const Radius.circular(16)
          : const Radius.circular(16),
    );

    return Column(
      crossAxisAlignment: alignment,
      children: [
        Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          padding: const EdgeInsetsDirectional.symmetric(
            horizontal: 14,
            vertical: 10,
          ),
          decoration: BoxDecoration(
            color: bubbleColor,
            borderRadius: borderRadius,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                message.content,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: textColor,
                  height: 1.4,
                ),
                textDirection: TextDirection.rtl,
              ),
              const SizedBox(height: 4),
              Text(
                DateFormat('HH:mm', context.locale.languageCode)
                    .format(message.timestamp),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: timestampColor,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
