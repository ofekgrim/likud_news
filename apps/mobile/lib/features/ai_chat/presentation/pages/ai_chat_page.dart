import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/chat_message.dart';
import '../bloc/ai_chat_bloc.dart';
import '../bloc/ai_chat_event.dart';
import '../bloc/ai_chat_state.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/chat_input_bar.dart';
import '../widgets/feedback_bar.dart';
import '../widgets/suggested_prompts.dart';

/// Full-screen AI chat page.
///
/// Displays a chat messages list with Likud branding, suggested prompts
/// when the session is empty, and a text input bar at the bottom.
class AiChatPage extends StatefulWidget {
  const AiChatPage({super.key});

  @override
  State<AiChatPage> createState() => _AiChatPageState();
}

class _AiChatPageState extends State<AiChatPage> {
  @override
  void initState() {
    super.initState();
    context.read<AiChatBloc>().add(const CreateSession());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'ai_chat.title'.tr(),
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: BlocBuilder<AiChatBloc, AiChatState>(
        builder: (context, state) {
          return switch (state) {
            AiChatInitial() || AiChatLoading() => const Center(
                child: CircularProgressIndicator(),
              ),
            AiChatError(:final message) => _ErrorView(
                message: message,
                onRetry: () =>
                    context.read<AiChatBloc>().add(const CreateSession()),
              ),
            AiChatActive(:final session, :final isSending) => Column(
                children: [
                  Expanded(
                    child: session.messages.isEmpty
                        ? _EmptySessionView(
                            onPromptTap: (prompt) => context
                                .read<AiChatBloc>()
                                .add(SendMessage(prompt)),
                          )
                        : _MessagesList(
                            messages: session.messages,
                            isSending: isSending,
                            onFeedback: (feedback) => context
                                .read<AiChatBloc>()
                                .add(ProvideFeedback(feedback)),
                          ),
                  ),
                  ChatInputBar(
                    isSending: isSending,
                    onSend: (text) =>
                        context.read<AiChatBloc>().add(SendMessage(text)),
                  ),
                ],
              ),
          };
        },
      ),
    );
  }
}

/// Shown when the session has no messages yet.
class _EmptySessionView extends StatelessWidget {
  final void Function(String prompt) onPromptTap;

  const _EmptySessionView({required this.onPromptTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.all(24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.smart_toy_outlined,
              size: 36,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'ai_chat.welcome'.tr(),
            textAlign: TextAlign.center,
            textDirection: TextDirection.rtl,
            style: theme.textTheme.bodyLarge?.copyWith(
              height: 1.5,
            ),
          ),
          const SizedBox(height: 32),
          SuggestedPrompts(onPromptTap: onPromptTap),
        ],
      ),
    );
  }
}

/// Scrollable list of chat messages (reversed so newest is at bottom).
class _MessagesList extends StatelessWidget {
  final List<ChatMessage> messages;
  final bool isSending;
  final void Function(String feedback) onFeedback;

  const _MessagesList({
    required this.messages,
    required this.isSending,
    required this.onFeedback,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      reverse: true,
      padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 8),
      itemCount: messages.length + (isSending ? 1 : 0),
      itemBuilder: (context, index) {
        // Typing indicator at position 0 (bottom of reversed list)
        if (isSending && index == 0) {
          return Padding(
            padding: const EdgeInsetsDirectional.only(bottom: 12),
            child: _TypingIndicator(),
          );
        }

        final messageIndex =
            isSending ? messages.length - index : messages.length - 1 - index;

        if (messageIndex < 0 || messageIndex >= messages.length) {
          return const SizedBox.shrink();
        }

        final message = messages[messageIndex];
        final isAssistant = message.role == 'assistant';
        final isLastAssistant = isAssistant &&
            (messageIndex == messages.length - 1 ||
                messages[messageIndex + 1].role != 'assistant');

        return Padding(
          padding: const EdgeInsetsDirectional.only(bottom: 12),
          child: Column(
            crossAxisAlignment: message.role == 'user'
                ? CrossAxisAlignment.end
                : CrossAxisAlignment.start,
            children: [
              ChatBubble(message: message),
              if (isLastAssistant && !isSending)
                FeedbackBar(onFeedback: onFeedback),
            ],
          ),
        );
      },
    );
  }
}

/// Animated typing indicator shown while assistant is generating a reply.
class _TypingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: Container(
        padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'ai_chat.typing'.tr(),
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark
                    ? const Color(0xFF9E9E9E)
                    : const Color(0xFF6B7A8D),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Error view with retry button.
class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsetsDirectional.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text('ai_chat.retry'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}
