import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

/// Text input bar for the chat screen.
///
/// Includes a text field with Hebrew RTL support, a microphone icon
/// placeholder, and a send button that is disabled while sending.
class ChatInputBar extends StatefulWidget {
  final void Function(String text) onSend;
  final bool isSending;

  const ChatInputBar({
    super.key,
    required this.onSend,
    this.isSending = false,
  });

  @override
  State<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends State<ChatInputBar> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _isMultiLine = false;

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isEmpty || widget.isSending) return;
    widget.onSend(text);
    _controller.clear();
    setState(() => _isMultiLine = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(8, 8, 8, 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Microphone placeholder
            IconButton(
              onPressed: () {
                // Placeholder for future voice input
              },
              icon: Icon(
                Icons.mic_none,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
              tooltip: 'Voice input',
            ),
            // Text field
            Expanded(
              child: Container(
                constraints: BoxConstraints(
                  maxHeight: _isMultiLine ? 120 : 48,
                ),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  textDirection: TextDirection.rtl,
                  maxLines: _isMultiLine ? 5 : 1,
                  minLines: 1,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _handleSend(),
                  onChanged: (text) {
                    if (text.contains('\n') && !_isMultiLine) {
                      setState(() => _isMultiLine = true);
                    }
                  },
                  decoration: InputDecoration(
                    hintText: 'ai_chat.placeholder'.tr(),
                    hintTextDirection: TextDirection.rtl,
                    border: InputBorder.none,
                    contentPadding:
                        const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 12),
                    suffixIcon: _isMultiLine
                        ? IconButton(
                            onPressed: () =>
                                setState(() => _isMultiLine = !_isMultiLine),
                            icon: Icon(
                              _isMultiLine
                                  ? Icons.unfold_less
                                  : Icons.unfold_more,
                              size: 20,
                              color: theme.colorScheme.onSurface
                                  .withValues(alpha: 0.5),
                            ),
                          )
                        : null,
                  ),
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ),
            const SizedBox(width: 4),
            // Send button
            Material(
              color: widget.isSending || _controller.text.trim().isEmpty
                  ? theme.colorScheme.primary.withValues(alpha: 0.4)
                  : theme.colorScheme.primary,
              shape: const CircleBorder(),
              child: InkWell(
                onTap: widget.isSending ? null : _handleSend,
                customBorder: const CircleBorder(),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: widget.isSending
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: theme.colorScheme.onPrimary,
                          ),
                        )
                      : Icon(
                          Icons.send,
                          size: 20,
                          color: theme.colorScheme.onPrimary,
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
