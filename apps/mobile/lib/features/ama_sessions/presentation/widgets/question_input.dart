import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// Text input widget for submitting questions to an AMA session.
///
/// Includes a text field with placeholder, character count indicator,
/// min 10 chars validation, and a submit button.
class QuestionInput extends StatefulWidget {
  final ValueChanged<String> onSubmit;
  final bool isSubmitting;

  const QuestionInput({
    super.key,
    required this.onSubmit,
    this.isSubmitting = false,
  });

  @override
  State<QuestionInput> createState() => _QuestionInputState();
}

class _QuestionInputState extends State<QuestionInput> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  static const int _minChars = 10;

  bool get _isValid => _controller.text.trim().length >= _minChars;

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    if (!_isValid || widget.isSubmitting) return;
    final text = _controller.text.trim();
    widget.onSubmit(text);
    _controller.clear();
    _focusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
      decoration: BoxDecoration(
        color: context.colors.surface,
        border: Border(
          top: BorderSide(color: context.colors.border),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Text field
                Expanded(
                  child: TextFormField(
                    controller: _controller,
                    focusNode: _focusNode,
                    maxLines: 3,
                    minLines: 1,
                    textDirection: TextDirection.rtl,
                    decoration: InputDecoration(
                      hintText: 'ama.ask_question'.tr(),
                      hintStyle: TextStyle(
                        color:
                            context.colors.textSecondary.withValues(alpha: 0.6),
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: context.colors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: AppColors.likudBlue,
                          width: 1.5,
                        ),
                      ),
                      contentPadding:
                          const EdgeInsetsDirectional.fromSTEB(12, 10, 12, 10),
                      filled: true,
                      fillColor: context.colors.surfaceVariant,
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),

                const SizedBox(width: 8),

                // Submit button
                SizedBox(
                  height: 44,
                  child: ElevatedButton(
                    onPressed: _isValid && !widget.isSubmitting
                        ? _handleSubmit
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.likudBlue,
                      foregroundColor: AppColors.white,
                      disabledBackgroundColor: context.colors.border,
                      disabledForegroundColor: context.colors.textSecondary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                      padding: const EdgeInsetsDirectional.fromSTEB(
                          12, 0, 12, 0),
                    ),
                    child: widget.isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.white,
                            ),
                          )
                        : Text(
                            'ama.submit'.tr(),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 4),

            // Character count & validation hint
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 4),
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  final charCount = _controller.text.trim().length;
                  final showHint = charCount > 0 && charCount < _minChars;

                  return Row(
                    children: [
                      if (showHint)
                        Text(
                          'ama.min_chars'.tr(),
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.warning,
                          ),
                        ),
                      const Spacer(),
                      if (charCount > 0)
                        Text(
                          '$charCount',
                          style: TextStyle(
                            fontSize: 11,
                            color: charCount >= _minChars
                                ? context.colors.textSecondary
                                : AppColors.warning,
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
