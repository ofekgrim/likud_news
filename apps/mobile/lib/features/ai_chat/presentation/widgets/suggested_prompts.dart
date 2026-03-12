import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Displays a row of suggested prompt chips for starting a conversation.
///
/// On chip tap, the [onPromptTap] callback is invoked with the prompt text.
class SuggestedPrompts extends StatelessWidget {
  final void Function(String prompt) onPromptTap;

  const SuggestedPrompts({super.key, required this.onPromptTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final prompts = [
      'ai_chat.suggested_history'.tr(),
      'ai_chat.suggested_candidates'.tr(),
      'ai_chat.suggested_voting'.tr(),
      'ai_chat.suggested_security'.tr(),
    ];

    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: prompts.map((prompt) {
          return ActionChip(
            label: Text(
              prompt,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
            backgroundColor: theme.brightness == Brightness.dark
                ? const Color(0xFF1A3A5C)
                : const Color(0xFFE0F2FE),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: theme.colorScheme.primary.withValues(alpha: 0.3),
              ),
            ),
            onPressed: () => onPromptTap(prompt),
          );
        }).toList(),
      ),
    );
  }
}
