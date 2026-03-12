import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Feedback row with thumbs up/down icons shown after assistant messages.
///
/// On tap, invokes [onFeedback] with 'positive' or 'negative'.
class FeedbackBar extends StatefulWidget {
  final void Function(String feedback) onFeedback;

  const FeedbackBar({super.key, required this.onFeedback});

  @override
  State<FeedbackBar> createState() => _FeedbackBarState();
}

class _FeedbackBarState extends State<FeedbackBar> {
  String? _selectedFeedback;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_selectedFeedback != null) {
      return Padding(
        padding: const EdgeInsetsDirectional.only(start: 8, top: 4),
        child: Text(
          'ai_chat.feedback_thanks'.tr(),
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.primary,
            fontSize: 11,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsetsDirectional.only(start: 8, top: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _FeedbackButton(
            icon: Icons.thumb_up_outlined,
            onTap: () {
              setState(() => _selectedFeedback = 'positive');
              widget.onFeedback('positive');
            },
          ),
          const SizedBox(width: 8),
          _FeedbackButton(
            icon: Icons.thumb_down_outlined,
            onTap: () {
              setState(() => _selectedFeedback = 'negative');
              widget.onFeedback('negative');
            },
          ),
        ],
      ),
    );
  }
}

class _FeedbackButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _FeedbackButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(
          icon,
          size: 16,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
